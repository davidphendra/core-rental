import { describe, expect, it } from "vitest";

import { cheapestRentableTotal } from "@/shared/domain/aiDesignSchema";
import { formatIdr } from "@/shared/domain/pricing";

import catalogJson from "../../../../shared/data/products.json";

import { runAiDesign } from "../workflows/designer";
import type { LlmAdapter, LlmRunRequest, LlmRunResult } from "../agents/chat-agent";

const catalog = catalogJson as unknown as readonly import("@/shared/types/product").Product[];

const chair = catalog.find((p) => p.skuNo.startsWith("CHA"))!;
const desk = catalog.find((p) => p.skuNo.startsWith("DSK"))!;
const mon1 = catalog.find((p) => p.skuNo.startsWith("MON"))!;
const mon2 = catalog.find((p) => p.skuNo.startsWith("MON") && p.skuNo !== mon1.skuNo)!;
const coffee = catalog.find((p) => p.skuNo.startsWith("CFE"))!;
const beanbag = catalog.find((p) => p.skuNo.startsWith("BBG"))!;
const lamp = catalog.find((p) => p.skuNo.startsWith("LMP"))!;
const plant = catalog.find((p) => p.skuNo.startsWith("PLT"))!;

const fullTotal = [chair, desk, mon1, mon2, coffee, beanbag, lamp, plant].reduce(
  (sum, p) => sum + p.pricePerMonth,
  0,
);

const FULL = {
  chairSku: chair.skuNo,
  deskSku: desk.skuNo,
  monitorSkus: [mon1.skuNo, mon2.skuNo],
  coffeeSku: coffee.skuNo,
  beanbagSku: beanbag.skuNo,
  lampSku: lamp.skuNo,
  plantSku: plant.skuNo,
  totalPerMonth: fullTotal,
  note: "gaming-ready",
};

/** Scripted fake LLM: returns queued results and records the requests. */
const mockLlm = (script: LlmRunResult[]): LlmAdapter & { calls: LlmRunRequest[] } => {
  const calls: LlmRunRequest[] = [];
  const queue = [...script];
  return {
    calls,
    async run(request) {
      calls.push(request);
      return queue.shift() ?? { kind: "llm_error", message: "no more scripted results" };
    },
  };
};

describe("runAiDesign", () => {
  it("returns the validated design on the happy path", async () => {
    const llm = mockLlm([{ kind: "design", design: FULL }]);
    const outcome = await runAiDesign({ prompt: "gaming workspace", catalog, llm });
    expect(outcome.kind).toBe("design");
    if (outcome.kind === "design") expect(outcome.design.totalPerMonth).toBe(fullTotal);
    expect(llm.calls).toHaveLength(1);
  });

  it("accepts partial designs with empty slots", async () => {
    const llm = mockLlm([{ kind: "design", design: { deskSku: desk.skuNo, lampSku: lamp.skuNo } }]);
    const outcome = await runAiDesign({ prompt: "just a desk and lamp", catalog, llm });
    expect(outcome.kind).toBe("design");
    if (outcome.kind === "design") {
      expect(outcome.design.chairSku).toBeNull();
      expect(outcome.design.totalPerMonth).toBe(desk.pricePerMonth + lamp.pricePerMonth);
    }
  });

  it("retries once on invalid output, then fails cleanly", async () => {
    const bogus = { ...FULL, chairSku: "CHAABCDEFGHI" };
    const llm = mockLlm([
      { kind: "design", design: bogus },
      { kind: "design", design: bogus },
    ]);
    const outcome = await runAiDesign({ prompt: "anything", catalog, llm });
    expect(outcome.kind).toBe("error");
    if (outcome.kind === "error") expect(outcome.reason).toBe("invalid_output");
    expect(llm.calls).toHaveLength(2);
  });

  it("succeeds when the retry fixes the invalid output", async () => {
    const bogus = { ...FULL, chairSku: "CHAABCDEFGHI" };
    const llm = mockLlm([
      { kind: "design", design: bogus },
      { kind: "design", design: FULL },
    ]);
    const outcome = await runAiDesign({ prompt: "anything", catalog, llm });
    expect(outcome.kind).toBe("design");
    expect(llm.calls[1]?.feedback).toBeDefined();
  });

  it("refuses honestly when the budget cannot fit, even after a retry", async () => {
    const budget = 500_000; // below the cheapest rentable setup
    const llm = mockLlm([
      { kind: "design", design: FULL },
      { kind: "design", design: FULL },
    ]);
    const outcome = await runAiDesign({ prompt: "gaming setup", catalog, budget, llm });
    expect(outcome.kind).toBe("refusal");
    if (outcome.kind === "refusal") {
      expect(outcome.cheapestTotal).toBe(cheapestRentableTotal(catalog));
      expect(outcome.message).toContain(formatIdr(outcome.cheapestTotal));
    }
    expect(llm.calls).toHaveLength(2);
    expect(llm.calls[0]?.budget).toBe(budget);
  });

  it("succeeds when the budget retry picks a cheaper design", async () => {
    const budget = chair.pricePerMonth + desk.pricePerMonth; // only chair+desk fits
    const llm = mockLlm([
      { kind: "design", design: FULL },
      { kind: "design", design: { chairSku: chair.skuNo, deskSku: desk.skuNo } },
    ]);
    const outcome = await runAiDesign({ prompt: "cheap setup", catalog, budget, llm });
    expect(outcome.kind).toBe("design");
    if (outcome.kind === "design") expect(outcome.design.totalPerMonth).toBe(budget);
    expect(llm.calls[1]?.feedback).toContain("budget");
  });

  it("surfaces provider errors without retrying", async () => {
    const llm = mockLlm([{ kind: "llm_error", message: "model unreachable" }]);
    const outcome = await runAiDesign({ prompt: "anything", catalog, llm });
    expect(outcome.kind).toBe("error");
    if (outcome.kind === "error") expect(outcome.reason).toBe("provider_error");
    expect(llm.calls).toHaveLength(1);
  });
});

describe("runAiDesign rejection (off-topic gate)", () => {
  it("passes through an off-topic rejection without retrying", async () => {
    const llm = mockLlm([{ kind: "rejection", message: "query not about workspace building" }]);
    const outcome = await runAiDesign({ prompt: "what's the weather in Bali?", catalog, llm });
    expect(outcome.kind).toBe("rejection");
    if (outcome.kind === "rejection") expect(outcome.message).toContain("workspace building");
    expect(llm.calls).toHaveLength(1); // rejection is definitive — no retry
  });
});

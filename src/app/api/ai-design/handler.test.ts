import { describe, expect, it, vi } from "vitest";

import catalog from "../../../shared/data/products.json";

import type { LlmAdapter, LlmRunResult } from "./agents/chat-agent";
import { AiDisabledError } from "./models/model-config";
import { createAiDesignHandler } from "./handler";

const chair = catalog.find((p) => p.skuNo.startsWith("CHA"))!;
const desk = catalog.find((p) => p.skuNo.startsWith("DSK"))!;
const mon1 = catalog.find((p) => p.skuNo.startsWith("MON"))!;
const coffee = catalog.find((p) => p.skuNo.startsWith("CFE"))!;

const FULL = {
  chairSku: chair.skuNo,
  deskSku: desk.skuNo,
  monitorSkus: [mon1.skuNo],
  coffeeSku: coffee.skuNo,
};

const mockLlm = (script: LlmRunResult[]): LlmAdapter => {
  const queue = [...script];
  return { run: async () => queue.shift() ?? { kind: "llm_error", message: "exhausted" } };
};

const post = (prompt: string, llm: LlmAdapter) =>
  createAiDesignHandler({ llm, allowRequest: () => true })(
    new Request("http://localhost/api/ai-design", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt }),
    }),
  );

describe("POST /api/ai-design", () => {
  it("returns 200 with the validated design", async () => {
    const res = await post("gaming workspace", mockLlm([{ kind: "design", design: FULL }]));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.design.deskSku).toBe(desk.skuNo);
    expect(body.design.totalPerMonth).toBeGreaterThan(0);
  });

  it("returns a refusal payload for impossible budgets (200)", async () => {
    const res = await post(
      "max 1 juta",
      mockLlm([
        { kind: "design", design: FULL },
        { kind: "design", design: FULL },
      ]),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.refusal.message).toContain("cheapest");
    expect(body.refusal.cheapestTotal).toBeGreaterThan(0);
  });

  it("rejects an empty prompt with 400", async () => {
    const res = await post("   ", mockLlm([]));
    expect(res.status).toBe(400);
  });

  it("rejects a prompt over 500 chars with 400", async () => {
    const res = await post("x".repeat(501), mockLlm([]));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("prompt_too_long");
  });

  it("rejects non-JSON bodies with 400", async () => {
    const res = await createAiDesignHandler({ llm: mockLlm([]), allowRequest: () => true })(
      new Request("http://localhost/api/ai-design", { method: "POST", body: "not-json" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limited", async () => {
    const res = await createAiDesignHandler({ llm: mockLlm([]), allowRequest: () => false })(
      new Request("http://localhost/api/ai-design", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: "hello" }),
      }),
    );
    expect(res.status).toBe(429);
  });

  it("returns 503 when the AI provider is disabled", async () => {
    const res = await createAiDesignHandler({
      createModel: () => {
        throw new AiDisabledError("not configured");
      },
      allowRequest: () => true,
    })(
      new Request("http://localhost/api/ai-design", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: "hello" }),
      }),
    );
    expect(res.status).toBe(503);
  });

  it("returns 500 on provider failure", async () => {
    const res = await post("anything", mockLlm([{ kind: "llm_error", message: "down" }]));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("provider_error");
  });

  it("returns 422 when the model cannot produce a valid design", async () => {
    const bogus = { ...FULL, chairSku: "CHAABCDEFGHI" };
    const res = await post(
      "anything",
      mockLlm([
        { kind: "design", design: bogus },
        { kind: "design", design: bogus },
      ]),
    );
    expect(res.status).toBe(422);
    expect((await res.json()).error).toBe("invalid_output");
  });

  it("emits ai.request with facts only — never the prompt (e10s03-4)", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      const res = await post(
        "secret prompt text here",
        mockLlm([{ kind: "design", design: FULL }]),
      );
      expect(res.status).toBe(200);
      const lines = infoSpy.mock.calls.map((c) => String(c[0]));
      const requestLine = lines.find((l) => l.includes('"event":"ai.request"'));
      expect(requestLine).toBeDefined();
      expect(requestLine).toContain('"model":"mock"');
      expect(requestLine).toContain('"ok":true');
      expect(requestLine).not.toContain("secret prompt text");
    } finally {
      infoSpy.mockRestore();
    }
  });

  it("marks ai.request ok:false on provider failure", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      await post("anything", mockLlm([{ kind: "llm_error", message: "down" }]));
      const lines = infoSpy.mock.calls.map((c) => String(c[0]));
      const requestLine = lines.find((l) => l.includes('"event":"ai.request"'));
      expect(requestLine).toContain('"ok":false');
    } finally {
      infoSpy.mockRestore();
    }
  });
});

describe("POST /api/ai-design off-topic rejection", () => {
  it("returns 200 with the standardized rejection payload", async () => {
    const res = await post(
      "what's the weather?",
      mockLlm([{ kind: "rejection", message: "query not about workspace building" }]),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).rejection.message).toBe("query not about workspace building");
  });
});

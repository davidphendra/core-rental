import { afterEach, describe, expect, it, vi } from "vitest";

import { logDeliverySubmitted, logger } from "./logger";

function capture(fn: () => void): string {
  const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);
  fn();
  return spy.mock.calls[0]?.[0] as string;
}

describe("logger (decisions O1–O4)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits JSON lines with level, event, and ts", () => {
    const line = capture(() => logger.info("rent.clicked", { items: 3 }));
    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed.level).toBe("info");
    expect(parsed.event).toBe("rent.clicked");
    expect(parsed.items).toBe(3);
    expect(typeof parsed.ts).toBe("string");
  });

  it("routes levels to the matching console sink", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => undefined);

    logger.error("error.boundary", { message: "boom" });
    logger.warn("storage.degraded", {});
    logger.debug("cart.updated", { items: 1 });

    expect(errorSpy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(debugSpy).toHaveBeenCalledOnce();
  });

  it("strips PII keys before emission (O3, threat model M2)", () => {
    const line = capture(() => logger.info("rent.clicked", { address: "Villa Lotus, Canggu" }));
    expect(line).not.toContain("Villa Lotus");
    expect(line).not.toContain("address");
  });

  it("logDeliverySubmitted accepts only hasAddress/addressLength", () => {
    const line = capture(() => logDeliverySubmitted(true, 24));
    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed.hasAddress).toBe(true);
    expect(parsed.addressLength).toBe(24);
    expect(parsed.event).toBe("delivery.submitted");
  });
});

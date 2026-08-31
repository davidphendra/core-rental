import { beforeEach, describe, expect, it, vi } from "vitest";

import { rateLimitAllowed, resetRateLimits } from "./safety";

describe("rateLimitAllowed", () => {
  beforeEach(() => resetRateLimits());

  it("allows up to 10 requests per IP within the window", () => {
    for (let i = 0; i < 10; i++) {
      expect(rateLimitAllowed("203.0.113.5")).toBe(true);
    }
    expect(rateLimitAllowed("203.0.113.5")).toBe(false);
  });

  it("treats different IPs independently", () => {
    for (let i = 0; i < 12; i++) rateLimitAllowed("203.0.113.1");
    expect(rateLimitAllowed("203.0.113.2")).toBe(true);
    expect(rateLimitAllowed("203.0.113.1")).toBe(false);
  });

  it("recovers after the window elapses", () => {
    for (let i = 0; i < 11; i++) rateLimitAllowed("203.0.113.9");
    expect(rateLimitAllowed("203.0.113.9")).toBe(false);
    // Simulate 11 minutes passing by moving the recorded timestamps back.
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now + 11 * 60 * 1000);
    expect(rateLimitAllowed("203.0.113.9")).toBe(true);
  });
});

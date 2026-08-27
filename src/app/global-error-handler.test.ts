import { afterEach, describe, expect, it, vi } from "vitest";

import { initGlobalErrorListeners } from "./global-error-handler";

describe("initGlobalErrorListeners (E4)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("attaches unhandledrejection and error listeners", () => {
    const addSpy = vi.spyOn(window, "addEventListener");

    initGlobalErrorListeners();

    expect(addSpy).toHaveBeenCalledWith("unhandledrejection", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("error", expect.any(Function));
  });

  it("logs window errors as structured events", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    initGlobalErrorListeners();
    window.dispatchEvent(new ErrorEvent("error", { message: "boom" }));

    const line = errorSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed.event).toBe("unhandlederror");
    expect(parsed.message).toBe("boom");
  });

  it("logs unhandled rejections as structured events", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    initGlobalErrorListeners();
    // jsdom does not implement PromiseRejectionEvent — dispatch a plain Event
    // carrying the reason property the handler reads.
    const event = new Event("unhandledrejection");
    Object.defineProperty(event, "reason", { value: new Error("async boom") });
    window.dispatchEvent(event);

    const line = errorSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed.event).toBe("unhandledrejection");
    expect(parsed.message).toBe("async boom");
  });
});

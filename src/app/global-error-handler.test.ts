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

  it("logs window errors to the console", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    initGlobalErrorListeners();
    const err = new Error("boom");
    window.dispatchEvent(new ErrorEvent("error", { message: "boom", error: err }));

    expect(errorSpy).toHaveBeenCalledWith("[error]", err);
  });
});

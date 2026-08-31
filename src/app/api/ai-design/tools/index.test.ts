import { describe, expect, it } from "vitest";

import { resolveToolOutcome } from "./index";

describe("resolveToolOutcome", () => {
  it("resolves a rejectQuery call to a rejection", () => {
    const r = resolveToolOutcome([{ toolName: "rejectQuery", args: {} }]);
    expect(r.kind).toBe("rejection");
  });

  it("resolves a finalizeDesign call to a design (v7: args)", () => {
    const r = resolveToolOutcome([{ toolName: "finalizeDesign", args: { deskSku: "X" } }]);
    expect(r.kind).toBe("design");
    if (r.kind === "design") expect(r.design).toEqual({ deskSku: "X" });
  });

  it("resolves a finalizeDesign call to a design (v7: input — real ToolResult shape)", () => {
    const r = resolveToolOutcome([
      { toolName: "finalizeDesign", input: { deskSku: "X", totalPerMonth: 5 } },
    ]);
    expect(r.kind).toBe("design");
    if (r.kind === "design") expect(r.design).toEqual({ deskSku: "X", totalPerMonth: 5 });
  });

  it("prefers rejectQuery when both terminal tools were called", () => {
    const r = resolveToolOutcome([
      { toolName: "searchCatalog", args: {} },
      { toolName: "rejectQuery", args: {} },
      { toolName: "finalizeDesign", args: { deskSku: "X" } },
    ]);
    expect(r.kind).toBe("rejection");
  });

  it("returns none when no terminal tool was called", () => {
    const r = resolveToolOutcome([{ toolName: "searchCatalog", args: {} }]);
    expect(r.kind).toBe("none");
  });

  it("returns none for an empty tool list", () => {
    expect(resolveToolOutcome([]).kind).toBe("none");
  });
});

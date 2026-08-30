import { describe, expect, it } from "vitest";

import { AiDisabledError, createAiModel, toClassicToolFormat } from "./provider";

describe("createAiModel", () => {
  it("throws AiDisabledError when no model is configured", () => {
    expect(() => createAiModel({})).toThrow(AiDisabledError);
    expect(() => createAiModel({ OPENAI_API_KEY: "sk-test" })).toThrow(AiDisabledError); // no AI_MODEL
  });

  it("throws AiDisabledError without a key when no base URL is set", () => {
    expect(() => createAiModel({ AI_MODEL: "gpt-4.1-mini" })).toThrow(AiDisabledError);
  });

  it("builds a model for an OpenAI-compatible base URL (LM Studio) without a real key", () => {
    const model = createAiModel({
      AI_MODEL: "gpt-oss-20b",
      AI_BASE_URL: "http://localhost:1234/v1",
    });
    expect(typeof model).toBe("object");
    expect(model).toBeTruthy();
  });

  it("builds a model from an OpenAI API key", () => {
    const model = createAiModel({ AI_MODEL: "gpt-4.1-mini", OPENAI_API_KEY: "sk-test" });
    expect(model).toBeTruthy();
  });
});

describe("toClassicToolFormat (llama.cpp wire compat)", () => {
  it("wraps flat v7 tools into the classic nested function format", () => {
    const flat = [
      { type: "function", name: "searchCatalog", description: "s", parameters: { type: "object" } },
    ];
    expect(toClassicToolFormat(flat)).toEqual([
      {
        type: "function",
        function: { name: "searchCatalog", description: "s", parameters: { type: "object" } },
      },
    ]);
  });

  it("leaves already-classic tools unchanged", () => {
    const classic = [
      {
        type: "function",
        function: { name: "t", description: "d", parameters: { type: "object" } },
      },
    ];
    expect(toClassicToolFormat(classic)).toEqual(classic);
  });

  it("passes through non-array input untouched", () => {
    expect(toClassicToolFormat(undefined)).toBeUndefined();
    expect(toClassicToolFormat("nope")).toBe("nope");
  });
});

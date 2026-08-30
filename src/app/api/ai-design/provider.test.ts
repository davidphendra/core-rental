import { describe, expect, it } from "vitest";

import { AiDisabledError, createAiModel } from "./provider";

describe("createAiModel", () => {
  it("throws AiDisabledError when no model is configured", () => {
    expect(() => createAiModel({})).toThrow(AiDisabledError);
    expect(() => createAiModel({ OPENAI_API_KEY: "sk-test" })).toThrow(AiDisabledError); // no AI_MODEL
  });

  it("throws AiDisabledError without a key when no base URL is set", () => {
    expect(() => createAiModel({ AI_MODEL: "gpt-4.1-mini" })).toThrow(AiDisabledError);
  });

  it("builds a model for an OpenAI-compatible base URL (LM Studio) without a real key", () => {
    const model = createAiModel({ AI_MODEL: "gpt-oss-20b", AI_BASE_URL: "http://localhost:1234/v1" });
    expect(typeof model).toBe("object");
    expect(model).toBeTruthy();
  });

  it("builds a model from an OpenAI API key", () => {
    const model = createAiModel({ AI_MODEL: "gpt-4.1-mini", OPENAI_API_KEY: "sk-test" });
    expect(model).toBeTruthy();
  });
});

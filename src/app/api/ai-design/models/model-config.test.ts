import { describe, expect, it } from "vitest";

import {
  AiDisabledError,
  createAiModel,
  resolveProvider,
  toClassicToolFormat,
} from "./model-config";

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

  it("builds a model from an Anthropic API key (AI_PROVIDER=anthropic)", () => {
    const model = createAiModel({
      AI_MODEL: "claude-sonnet-4-0",
      ANTHROPIC_API_KEY: "sk-ant-test",
      AI_PROVIDER: "anthropic",
    });
    expect(model).toBeTruthy();
  });

  it("infers anthropic from ANTHROPIC_API_KEY when AI_PROVIDER is unset", () => {
    expect(resolveProvider({ ANTHROPIC_API_KEY: "sk-ant-test", AI_MODEL: "claude" })).toBe(
      "anthropic",
    );
    const model = createAiModel({ AI_MODEL: "claude-sonnet-4-0", ANTHROPIC_API_KEY: "sk-ant" });
    expect(model).toBeTruthy();
  });

  it("throws AiDisabledError for an unknown AI_PROVIDER value", () => {
    expect(() => createAiModel({ AI_MODEL: "x", AI_PROVIDER: "gemini" })).toThrow(AiDisabledError);
    expect(() => resolveProvider({ AI_PROVIDER: "gemini" })).toThrow(AiDisabledError);
  });

  it("throws AiDisabledError for AI_PROVIDER=anthropic without a key", () => {
    expect(() => createAiModel({ AI_MODEL: "claude", AI_PROVIDER: "anthropic" })).toThrow(
      AiDisabledError,
    );
  });

  it("throws AiDisabledError for AI_PROVIDER=openai-compatible without AI_BASE_URL", () => {
    expect(() =>
      createAiModel({ AI_MODEL: "gpt-oss-20b", AI_PROVIDER: "openai-compatible" }),
    ).toThrow(AiDisabledError);
  });

  it("accepts OPENAI_API_KEY as the key for an OpenRouter-style base URL", () => {
    // OpenRouter keys are OpenAI-format; the compatible branch falls back to
    // OPENAI_API_KEY when AI_API_KEY is absent (not the "lm-studio" placeholder).
    const model = createAiModel({
      AI_MODEL: "openai/gpt-4o-mini",
      AI_BASE_URL: "https://openrouter.ai/api/v1",
      OPENAI_API_KEY: "sk-or-test",
    });
    expect(model).toBeTruthy();
  });

  it("prefers AI_BASE_URL over a key for inference (backward compatible)", () => {
    expect(
      resolveProvider({ AI_BASE_URL: "http://localhost:8080/v1", ANTHROPIC_API_KEY: "sk-ant" }),
    ).toBe("openai-compatible");
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

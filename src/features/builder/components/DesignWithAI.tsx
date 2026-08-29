"use client";

import { useEffect, useRef, useState } from "react";

import { capKeyForProduct } from "@/shared/domain/setupRules";
import { validateDesign, type AiDesign } from "@/shared/domain/aiDesignSchema";
import { formatIdr } from "@/shared/domain/pricing";
import { logger } from "@/shared/observability/logger";
import { useBuilderStore } from "@/shared/state/BuilderStore";
import { Button } from "@/shared/ui/Button";
import type { Product } from "@/shared/types/product";

/**
 * e10s02: "Design with AI" panel on the builder page. Free-text prompt →
 * /api/ai-design (non-streaming v1) with a 60s timeout + cancel → preview card
 * (items/total/note) → Apply replaces the current setup via the existing
 * reducers (reset + re-select), with a confirm when the cart is non-empty.
 * Defense in depth: the design is re-validated against the catalog before any
 * dispatch (S4). Never emits the prompt (PII-safe, decision 8).
 */

const STEPS = [
  "Interpreting your request…",
  "Searching the catalog…",
  "Checking the budget…",
  "Finalizing your design…",
];

const MAX_PROMPT = 500;

interface DesignWithAIProps {
  catalog: readonly Product[];
}

type PanelStatus = "idle" | "loading" | "result" | "refusal" | "error";

type ExclusiveSlot = "coffeeSku" | "beanbagSku" | "lampSku" | "plantSku";

const EXCLUSIVE_SLOTS: Array<[ExclusiveSlot, string]> = [
  ["coffeeSku", "Coffee"],
  ["beanbagSku", "Bean Bag"],
  ["lampSku", "Lamp"],
  ["plantSku", "Plant"],
];

/** Render rows for the preview: chair/desk/monitors then the exclusive slots. */
function slotItems(d: AiDesign, catalog: readonly Product[]): Array<{ label: string; name: string | null }> {
  const bySku = new Map(catalog.map((p) => [p.skuNo, p.name]));
  const items: Array<{ label: string; name: string | null }> = [
    { label: "Chair", name: d.chairSku ? (bySku.get(d.chairSku) ?? d.chairSku) : null },
    { label: "Desk", name: d.deskSku ? (bySku.get(d.deskSku) ?? d.deskSku) : null },
  ];
  d.monitorSkus.forEach((sku, i) => items.push({ label: `Monitor ${i + 1}`, name: bySku.get(sku) ?? sku }));
  for (const [slot, label] of EXCLUSIVE_SLOTS) {
    const sku = d[slot];
    if (sku) items.push({ label, name: bySku.get(sku) ?? sku });
  }
  return items;
}

interface RefusalInfo {
  message: string;
}

export function DesignWithAI({ catalog }: DesignWithAIProps) {
  const { state, dispatch } = useBuilderStore();
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<PanelStatus>("idle");
  const [design, setDesign] = useState<AiDesign | null>(null);
  const [refusal, setRefusal] = useState<RefusalInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [confirming, setConfirming] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const cartIsEmpty =
    state.chairId === null &&
    state.deskId === null &&
    Object.keys(state.quantities).length === 0 &&
    state.monitorSlots.length === 0;

  const generate = async () => {
    const text = prompt.trim();
    if (!text || status === "loading") return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setStep(0);
    setDesign(null);
    setRefusal(null);
    setError(null);
    setConfirming(false);

    const stepTimer = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 800);
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const res = await fetch("/api/ai-design", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: text }),
        signal: controller.signal,
      });
      const body = (await res.json().catch(() => null)) as
        | { design?: AiDesign; refusal?: RefusalInfo; error?: string }
        | null;

      if (res.ok && body?.design) {
        setDesign(body.design);
        setStatus("result");
      } else if (res.ok && body?.refusal) {
        setRefusal(body.refusal);
        setStatus("refusal");
      } else if (res.status === 429) {
        setError("Too many requests — wait a moment and try again.");
        setStatus("error");
      } else if (res.status === 503) {
        setError("AI design isn't configured on this deployment yet.");
        setStatus("error");
      } else if (res.status === 422) {
        setError("The AI couldn't build a valid design from that request — try rewording it.");
        setStatus("error");
      } else if (res.status === 500) {
        setError("The AI is unavailable right now — try again shortly.");
        setStatus("error");
      } else {
        setError("Something went wrong — please try again.");
        setStatus("error");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus("idle"); // cancelled (button or timeout)
      } else {
        setError("Network error — check your connection and try again.");
        setStatus("error");
      }
    } finally {
      clearInterval(stepTimer);
      clearTimeout(timeout);
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    setStatus("idle");
  };

  const productBySku = (sku: string): Product | undefined => catalog.find((p) => p.skuNo === sku);

  const applyDesign = () => {
    if (!design) return;
    if (!cartIsEmpty && !confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);

    // Defense in depth: re-validate against the live catalog before touching state.
    const validation = validateDesign(design, catalog);
    if (!validation.ok) {
      setError("The AI design no longer matches the catalog — please regenerate.");
      setStatus("error");
      return;
    }
    const d = validation.design;

    dispatch({ type: "reset" });
    const chair = d.chairSku ? productBySku(d.chairSku) : undefined;
    const desk = d.deskSku ? productBySku(d.deskSku) : undefined;
    if (chair) dispatch({ type: "selectChair", product: chair });
    if (desk) dispatch({ type: "selectDesk", product: desk });
    for (const sku of d.monitorSkus) {
      const monitor = productBySku(sku);
      if (monitor) dispatch({ type: "selectMonitor", product: monitor });
    }
    const exclusive: Array<[ExclusiveSlot, CapKey]> = [
      ["coffeeSku", "coffee"],
      ["beanbagSku", "beanbag"],
      ["lampSku", "lamp"],
      ["plantSku", "plant"],
    ];
    for (const [slot, cap] of exclusive) {
      const sku = d[slot];
      if (!sku) continue;
      const product = productBySku(sku);
      if (!product) continue;
      const clearSkus = catalog.filter((p) => capKeyForProduct(p) === cap).map((p) => p.skuNo);
      dispatch({ type: "replaceExclusiveAccessory", target: product, clearSkus });
    }

    logger.info("ai.design_applied", {
      chairSku: d.chairSku,
      deskSku: d.deskSku,
      monitorCount: d.monitorSkus.length,
      total: d.totalPerMonth,
    });

    setPrompt("");
    setDesign(null);
    setStatus("idle");
  };

  const previewItems = design ? slotItems(design, catalog) : [];

  return (
    <section
      aria-label="Design with AI"
      className="mb-8 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4"
    >
      <h2 className="text-headline-md font-headline-md text-primary font-extrabold">Design with AI</h2>
      <p className="text-label-md font-label-md text-on-surface-variant mt-1">
        Describe your workspace — e.g. “fancy gaming workspace, max Rp 30 juta”.
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="ai-prompt" className="sr-only">
          Describe your workspace
        </label>
        <input
          id="ai-prompt"
          ref={inputRef}
          type="text"
          value={prompt}
          maxLength={MAX_PROMPT}
          disabled={status === "loading"}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) void generate();
          }}
          placeholder="e.g. gaming setup under 30 juta with 2 monitors"
          className="focus-visible:outline-primary text-body-md bg-surface-container-highest w-full rounded-xl px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
        />
        {status === "loading" ? (
          <Button variant="secondary" onClick={cancel}>
            Cancel
          </Button>
        ) : (
          <Button onClick={() => void generate()} disabled={!prompt.trim()}>
            Generate
          </Button>
        )}
      </div>

      <div aria-live="polite" className="mt-3">
        {status === "loading" && (
          <ol className="text-label-sm font-label-sm list-inside list-decimal text-on-surface-variant">
            {STEPS.map((s, i) => (
              <li key={s} className={i <= step ? "" : "opacity-40"}>
                {s}
              </li>
            ))}
          </ol>
        )}

        {status === "result" && design && (
          <div className="border-t border-outline-variant pt-3">
            <ul className="text-body-sm font-body-sm divide-y divide-outline-variant">
              {previewItems.map(({ label, name }) => (
                <li key={label} className="flex justify-between gap-2 py-1">
                  <span className="text-on-surface-variant">{label}</span>
                  <span className="text-on-surface text-right">{name ? name : "—"}</span>
                </li>
              ))}
              <li className="flex justify-between gap-2 py-1 font-bold">
                <span>Monthly total</span>
                <span>{formatIdr(design.totalPerMonth)}</span>
              </li>
            </ul>
            {design.note && (
              <p className="text-body-sm font-body-sm text-on-surface-variant mt-2 italic">{design.note}</p>
            )}
            {confirming ? (
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Confirm replacing your setup">
                <p className="text-label-sm font-label-sm w-full text-on-surface-variant">
                  Replace your current setup with this design?
                </p>
                <Button onClick={applyDesign}>Replace setup</Button>
                <Button variant="secondary" onClick={() => setConfirming(false)}>
                  Keep current
                </Button>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={applyDesign}>Apply this design</Button>
                <Button variant="secondary" onClick={() => void generate()}>
                  Regenerate
                </Button>
              </div>
            )}
          </div>
        )}

        {status === "refusal" && refusal && (
          <div className="border-t border-outline-variant pt-3">
            <p className="text-body-sm font-body-sm text-on-surface-variant">{refusal.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void generate()}>
                Regenerate
              </Button>
            </div>
          </div>
        )}

        {status === "error" && error && (
          <div className="border-t border-outline-variant pt-3">
            <p className="text-body-sm font-body-sm text-on-surface-variant">{error}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void generate()}>
                Try again
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

type CapKey = "coffee" | "beanbag" | "lamp" | "plant";

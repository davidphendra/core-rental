"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/shared/ui/Button";

/** The phrase a user must type to confirm the demo rental (C2 gate). */
export const DEMO_PHRASE = "this is a demo";

/** Trimmed, case-insensitive match (grilled decision). */
export function matchesDemoPhrase(value: string): boolean {
  return value.trim().toLowerCase() === DEMO_PHRASE;
}

interface DemoVerifyModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Demo-verification gate on "Rent This Setup": a dismissable dialog that asks
 * the user to type "this is a demo". OK is disabled until the trimmed,
 * case-insensitive phrase matches; a validation error appears after the first
 * blur, then updates live. Esc / overlay click / Cancel close without side
 * effects (a11y #24 dialog pattern).
 */
export function DemoVerifyModal({ onConfirm, onClose }: DemoVerifyModalProps) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const matched = matchesDemoPhrase(value);
  const showError = touched && !matched;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (matched) {
      onConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={onClose}
    >
      <div className="bg-on-surface/40 absolute inset-0" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-title"
        onClick={(event) => event.stopPropagation()}
        className="bg-surface relative w-full max-w-md rounded-2xl p-6 shadow-lg"
      >
        <h2 id="demo-title" className="text-headline-md font-headline-md text-on-surface">
          Confirm this is a demo
        </h2>
        <p className="text-body-md text-on-surface-variant mt-2">
          This is a demo build — no real rental and no payment. To confirm your order, type{" "}
          <strong className="text-on-surface">&quot;this is a demo&quot;</strong>.
        </p>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2">
          <label htmlFor="demo-phrase" className="text-label-md font-label-md text-on-surface">
            Confirmation phrase
          </label>
          <input
            ref={inputRef}
            id="demo-phrase"
            type="text"
            value={value}
            placeholder="this is a demo"
            aria-invalid={showError}
            aria-describedby={showError ? "demo-error" : undefined}
            onBlur={() => setTouched(true)}
            onChange={(event) => setValue(event.target.value)}
            className="border-outline-variant bg-surface-container-low text-body-md font-body-md text-on-surface focus:border-primary focus:ring-primary w-full rounded-lg border px-4 py-3 outline-none transition-colors focus:ring-1"
          />
          {showError ? (
            <p id="demo-error" className="text-label-sm font-label-sm text-error">
              That doesn&apos;t match. Type &quot;this is a demo&quot; to confirm.
            </p>
          ) : null}
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={!matched}>
              OK
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

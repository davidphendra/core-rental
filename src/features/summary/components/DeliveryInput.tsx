"use client";

import { useState } from "react";

import { DELIVERY_MAX_LENGTH, validateDeliveryLocation } from "@/shared/domain/validateSetupState";

interface DeliveryInputProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Delivery Location textarea (decision C4, G3). Two lines, true multi-line
 * (newlines preserved; echoed on the confirmation with line breaks). Rules:
 * trim + non-empty + ≤ 200 chars, inline error, aria-invalid/aria-describedby
 * (a11y #24). Validation shared via validateDeliveryLocation (single source).
 */
export function DeliveryInput({ value, onChange }: DeliveryInputProps) {
  const [touched, setTouched] = useState(false);

  const trimmed = value.trim();
  const tooLong = trimmed.length > DELIVERY_MAX_LENGTH;
  const invalid = trimmed.length === 0 || tooLong;
  const showError = touched && invalid;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="delivery-location" className="text-label-md font-label-md text-on-surface">
        Delivery Location
      </label>
      <textarea
        id="delivery-location"
        rows={2}
        value={value}
        placeholder="e.g., Villa Lotus, Canggu..."
        aria-invalid={invalid}
        aria-describedby={showError ? "delivery-error" : undefined}
        onBlur={() => setTouched(true)}
        onChange={(event) => onChange(event.target.value)}
        className="border-outline-variant bg-surface-container-low text-body-md font-body-md text-on-surface focus:border-primary focus:ring-primary w-full resize-none rounded-lg border px-4 py-3 outline-none transition-colors focus:ring-1"
      />
      {showError ? (
        <p id="delivery-error" className="text-label-sm font-label-sm text-error">
          {tooLong
            ? `Delivery location must be ${DELIVERY_MAX_LENGTH} characters or fewer.`
            : "Please enter a delivery location."}
        </p>
      ) : null}
    </div>
  );
}

/** Whether the current input satisfies G3 (used to gate the Rent button). */
export function isDeliveryValid(value: string): boolean {
  return validateDeliveryLocation(value) !== null;
}

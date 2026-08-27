# Threat Model — e05 (Builder Feature)

> build-epic Step 0 · scope-based threat modeling from the e05 epic capsule.
> The builder is a UI layer over already-hardened layers: the reducer (G2) and
> the catalog (validated). Its threat surface is correspondingly small.

## Surface area (e05 scope)

| Surface             | Files                                              | Notes                                                      |
| ------------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| Canvas interactions | `features/builder/components/BuilderCanvas.tsx`    | Slot clicks, keyboard handlers (Enter/Space/arrows)        |
| Selection panel     | `features/builder/components/SelectionPanel.tsx`   | Tabs, cards, steppers                                      |
| Quantity steppers   | `features/builder/components/QuantityStepper.tsx`  | UI-level cap enforcement (N3)                              |
| Sticky total bar    | `features/builder/components/StickySummaryBar.tsx` | Display-only (pricing)                                     |
| Wiring              | `features/builder/page.tsx`, e05s03                | useProducts + useBuilderStore + CartProvider; D1 defaults  |
| Image display       | slot/card `<img>`                                  | Catalog URLs (allowlisted) + placeholders + fallback (#31) |

## Findings

### B1 — UI-level cap bypass — LOW — CWE-20 (adjacent)

- **Description:** If the canvas/stepper UI fails to disable at cap, a user could dispatch over-cap adds.
- **Exploit scenario:** Spam-clicking an add button that never disables → repeated `addAccessory` dispatches.
- **Mitigation (planned):** **Defense in depth** — the reducer itself rejects over-cap actions as quiet no-ops (G2, already tested in e03s02). The UI disable is cosmetic enforcement (N3); even a full bypass cannot produce invalid state. E2E N3 asserts the visible disabled state.
- **Task mapping:** e05s01-2, e05s02-2.

### B2 — Keyboard handler robustness — LOW (a11y, not security)

- **Description:** Keyboard handlers (tab/Enter/Space/arrows) could trap focus or fire unintended actions.
- **Exploit scenario:** A user tabbing through the canvas triggers an unwanted add.
- **Mitigation (planned):** Handlers gate on event target + key codes; focus-visible only, no automatic focus stealing; a11y tests (e05s01-3) cover the interaction contract.
- **Task mapping:** e05s01-3.

### B3 — Rendering extremes — LOW

- **Description:** Unbounded quantities could degrade layout.
- **Exploit scenario:** N/A — quantities are capped by setupRules (plants ≤ 4, monitors ≤ 3, etc., #22).
- **Mitigation (planned):** Caps bound all rendering; no unbounded state exists. Accepted by construction.
- **Task mapping:** e05s02-2.

### B4 — Image URL injection — LOW (inherited)

- **Description:** Slot images come from the catalog; a tampered src could load an arbitrary host.
- **Exploit scenario:** Tampered catalog entry with a malicious image URL.
- **Mitigation (planned):** Catalog is committed + contract-guarded (e02); image hosts allowlisted (e01, #13); `onError` fallback caps broken loads (N7). No user input reaches image src.
- **Task mapping:** e05s01-2, e06s01-3.

## Risk summary

| ID  | Finding                           | Severity | CWE    |
| --- | --------------------------------- | -------- | ------ |
| B1  | UI cap bypass (reducer mitigates) | LOW      | CWE-20 |
| B2  | Keyboard handler robustness       | LOW      | —      |
| B3  | Rendering extremes (caps bound)   | LOW      | —      |
| B4  | Image URL injection (inherited)   | LOW      | —      |

**Epic-level risk: LOW** — no HIGH/CRITICAL; no WSJF boost. All findings are design-mitigated (G2 reducer, committed catalog, caps, allowlist) or verified by tests/E2E (N3, N7).

## Verification & gates

- E2E N3 (cap disabled state) + N5 (exclusivity) + N7 (image fallback) at e08
- a11y keyboard tests (e05s01-3)
- Security diff-scan at verify-work Phase 5

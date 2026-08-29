# Threat Model — e09 (SKU System & Monitor Slots)

> build-epic Step 0 · scope-based threat modeling from the e09 epic capsule.
> e09 is a hardening + UX refactor over already-hardened layers (G2 reducer,
> ADR 0004 trust boundary, committed catalog). No new network surface, no auth,
> no backend changes — the threat surface is the same trust boundaries with
> new shapes (skuNo keys, monitorSlots).

## Surface area (e09 scope)

| Surface             | Files                                                                                   | Notes                                                                     |
| ------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Catalog contract    | `shared/types/product.ts`, `shared/data/products.ts`                                    | skuNo format/code/uniqueness validation (`isProduct`/`isValidCatalog`)    |
| Cap derivation      | `shared/domain/setupRules.ts`                                                           | `capKeyForProduct` reads the 3-char SKU prefix; QUANTITY_CAPS unchanged   |
| Validation boundary | `shared/domain/validateSetupState.ts`                                                   | `monitorSlots` shape + skuNo-keyed cart; old carts rejected → D1 defaults |
| Cart reducer        | `shared/state/BuilderStore.tsx`                                                         | `selectMonitor`/`removeMonitorSlot` semantics; G2 quiet no-ops            |
| Persistence         | `shared/state/useLocalStorage.ts`                                                       | STORAGE_KEY bump — old-format carts dropped at hydration                  |
| Builder UI          | `features/builder/components/BuilderCanvas.tsx`, `CanvasSlot.tsx`, `SelectionPanel.tsx` | 3 monitor slots, Select buttons, chair/desk hint buttons                  |
| Summary             | `features/summary/*`                                                                    | Line items derived from `monitorSlots` (grouped by skuNo)                 |

## Findings

### S1 — Malformed skuNo in the catalog — LOW — CWE-20

- **Description:** A catalog entry with a bad skuNo (wrong length, unknown code, duplicate) could bypass caps or corrupt cart keys.
- **Exploit scenario:** A tampered commit introduces `skuNo: "ABC"` or duplicates an existing sku → cap derivation misroutes or cart keys collide.
- **Mitigation (planned):** `isProduct`/`isValidCatalog` validate the 12-char `[A-Z]{3}[A-Z0-9]{9}` format, a known code prefix, and catalog-wide uniqueness; invalid committed catalog → `getCatalog` returns `[]` and the API route 500s (E2 path, unchanged). Generator dedupes deterministically.
- **Task mapping:** e09s01-1, e09s01-2.

### S2 — Corrupt monitorSlots in localStorage — LOW — CWE-20 (trust boundary)

- **Description:** Wrong-shape `monitorSlots` (not 3 entries, invalid skuNos, or >3 monitors) stored in localStorage could bypass the 3-monitor cap or render invalid state.
- **Exploit scenario:** A crafted localStorage payload with `monitorSlots: ["MONxxx", ...4 more]` or unknown ids.
- **Mitigation (planned):** `validateSetupState` strictly validates exactly 3 entries, each `null` or a catalog monitor skuNo; any violation → null → D1 defaults. The reducer never produces an invalid shape (G2). Old-format carts (old ids) fail validation by design → clean reset.
- **Task mapping:** e09s02-1, e09s02-2.

### S3 — selectMonitor semantics bypass — LOW — CWE-20 (adjacent)

- **Description:** UI or scripted dispatches could attempt >3 monitors or duplicate placements.
- **Exploit scenario:** Repeated `selectMonitor` dispatches past 3 slots.
- **Mitigation (planned):** **Defense in depth** — the reducer enforces fill-first-empty / replace-most-recent / no-op-if-placed; the total monitor count can never exceed 3 by construction. UI buttons are cosmetic.
- **Task mapping:** e09s02-1, e09s02-5.

### S4 — SKU hash collision — LOW

- **Description:** Deterministic 9-char hashes could collide, breaking uniqueness.
- **Exploit scenario:** N/A — the generator is committed, not attacker-reachable. A collision would be caught by the uniqueness validation at build time.
- **Mitigation (planned):** Generator resolves collisions deterministically; `isValidCatalog` fails on duplicates. Accepted by construction.
- **Task mapping:** e09s01-1.

### S5 — Old-cart silent reset — LOW (UX, not security)

- **Description:** Returning users with pre-change carts lose their setup (chair/desk/accessories) after the storage-key bump.
- **Exploit scenario:** N/A.
- **Mitigation (planned):** Designed migration boundary (grilled decision) — validation rejects old ids → D1 defaults; no crash, no invalid state. Demo-verify already clears carts on rent.
- **Task mapping:** e09s01-4.

## Risk summary

| ID  | Finding                               | Severity | CWE    |
| --- | ------------------------------------- | -------- | ------ |
| S1  | Malformed skuNo in catalog            | LOW      | CWE-20 |
| S2  | Corrupt monitorSlots (trust boundary) | LOW      | CWE-20 |
| S3  | selectMonitor semantics bypass        | LOW      | CWE-20 |
| S4  | SKU hash collision                    | LOW      | —      |
| S5  | Old-cart silent reset (UX)            | LOW      | —      |

**Epic-level risk: LOW** — no HIGH/CRITICAL → **no WSJF boost**. All findings are design-mitigated (G2 reducer, strict validation, committed generator, allowlisted images unchanged) or verified by unit tests (`validateSetupState`, `BuilderStore`, `catalog`) and E2E.

## Verification & gates

- Unit: `catalog.test.ts` (sku format/uniqueness), `validateSetupState.test.ts` (monitorSlots shape + old-cart rejection), `BuilderStore.test.tsx` (reducer semantics)
- E2E: builder + summary specs (combos, replace, no-op, ×)
- Security diff-scan at verify-work Phase 5 (must report no new HIGH findings)
- `security:` fields on e09 tasks: S1/S2/S3 → `low`; S4/S5 → `none`

# Threat Model — e06 (Store Feature)

> build-epic Step 0 · scope-based threat modeling from the e06 epic capsule.
> Store = catalog display + cart actions + partner modal, all over hardened
> layers (validated catalog, G2 reducer, PII-free logger).

## Surface area (e06 scope)

| Surface             | Files                                               | Notes                                                    |
| ------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| Store grid + filter | `features/store/components/StoreGrid.tsx`           | Catalog display; client-side category filter tabs (#33)  |
| Add to Setup        | `StoreCard` action                                  | Dispatches cart actions (reducer validates, G2)          |
| Image fallback      | `ProductCard` onError                               | N7 path (shared, already tested)                         |
| Partner modal       | `features/store/components/PartnerRequestModal.tsx` | Motorcycle request; mock confirmation in place (#20, C2) |
| Partner logging     | modal → logger                                      | `partner.requested` (O2)                                 |

## Findings

### S1 — Add-to-setup cap bypass — LOW — CWE-20 (adjacent)

- **Description:** The store's Add action must respect per-category caps like the builder.
- **Exploit scenario:** Spam-clicking Add past the cap.
- **Mitigation (planned):** Same defense in depth as the builder — reducer rejects over-cap as a quiet no-op (G2, tested e03s02); UI disables at cap. E2E N3 asserts the disabled state (e08).
- **Task mapping:** e06s01-2.

### S2 — Partner modal state isolation — LOW

- **Description:** The partner flow must never touch the cart or summary.
- **Exploit scenario:** A bug in the modal dispatches a cart action for the partner item.
- **Mitigation (planned):** Structural exclusion — `setupRules.isCartEligible` rejects `partner` (tested e03s01); the modal performs no dispatch at all (local state + logger only). E2E N6 asserts absence from cart/summary (e08).
- **Task mapping:** e06s02-1/2.

### S3 — Image fallback integrity — LOW (inherited)

- **Description:** Broken product images must degrade to the local fallback.
- **Mitigation (planned):** `ProductCard` onError → `/fallback/product.svg` (N7, tested e03s03). No user-controlled src.
- **Task mapping:** e06s01-3.

### S4 — partner.requested logging — LOW (inherited)

- **Description:** The modal logs the partner request event.
- **Mitigation (planned):** PII-free logger (O3); event carries no user data (O2 taxonomy).
- **Task mapping:** e06s02-1.

## Risk summary

| ID  | Finding                                     | Severity | CWE    |
| --- | ------------------------------------------- | -------- | ------ |
| S1  | Add-to-setup cap bypass (reducer mitigates) | LOW      | CWE-20 |
| S2  | Partner modal state isolation (structural)  | LOW      | —      |
| S3  | Image fallback (inherited)                  | LOW      | —      |
| S4  | partner.requested logging (inherited)       | LOW      | —      |

**Epic-level risk: LOW** — no HIGH/CRITICAL; no WSJF boost. All mitigations are inherited from e02/e03 or structural by design.

## Verification & gates

- E2E N3 (cap across surfaces) + N6 (partner exclusion) + N7 (image fallback) at e08
- Unit tests: modal open/close/esc/exclusion (e06s02), grid add + caps (e06s01)
- Security diff-scan at verify-work Phase 5

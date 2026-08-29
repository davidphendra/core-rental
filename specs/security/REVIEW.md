# Security Review — e09s01 (SKU system)

> verify-work Phase 5 scan of the e09s01 diff (merge-base vs HEAD).

## Scope scanned

- scripts/sku.ts, generate-catalog.ts, curated-hero.ts (deterministic sku generation)
- src/shared/types/product.ts, data/products.ts (validation strengthening)
- src/shared/domain/{setupRules,validateSetupState}.ts (sku-prefix caps, trust boundary)
- src/shared/state/{BuilderStore,useLocalStorage}.tsx (sku keys, storage v2)
- 65 .id -> .skuNo renames (src + e2e)

## Findings

| ID  | Finding                               | Severity | Verdict                                                               |
| --- | ------------------------------------- | -------- | --------------------------------------------------------------------- |
| S1  | Malformed skuNo in catalog            | LOW      | Implemented: format/code/uniqueness guard in isProduct/isValidCatalog |
| S2  | Corrupt monitorSlots (trust boundary) | LOW      | Pending e09s02 (validateSetupState extension lands with monitorSlots) |
| S3  | selectMonitor semantics bypass        | LOW      | Pending e09s02 (G2 reducer semantics)                                 |
| S4  | SKU hash collision                    | LOW      | Implemented: generator throws on collision; uniqueness gate           |
| S5  | Old-cart silent reset                 | LOW      | Implemented: storage v2; v1 carts -> D1 defaults, no crash            |

## Path/injection audit

- Only path op in diff: join(publicDir, image.replace(/^\/placeholders\//, "")) — the remainder is a
  slugified name (category-{slug}.svg) built from trusted committed templates; no traversal possible.
- No eval/innerHTML/dangerouslySetInnerHTML/localStorage writes introduced.
- SVG placeholder escaping (XML-safe name) unchanged and still tested.

## Verdict

No HIGH findings (confidence >= 8). Diff strengthens the trust boundary. Blocking gate: PASS.

# ADR 0002 — Feature-based vertical slices + shared layers

- **Status:** Accepted (decision #15)
- **Context:** Four designed pages (home/builder/store/summary) share UI primitives, domain logic (IDR pricing, caps), cart state, and catalog access. The team requested repositories/services/hooks separation AND feature-based organization ("one class per file" interpreted as one unit per file).
- **Decision:** `src/features/{home,builder,store,summary}` vertical slices with public `index.ts` barrels; `src/shared/{data,domain,state,hooks,ui,types,config,observability}` for cross-cutting concerns. Cross-feature imports only via barrels (enforced by lint rules). One component/hook/module per file; tsconfig strict inherited by all files. No interface/DI ceremony (single implementations).
- **Consequences:** Business logic is unit-testable without React (shared/domain). The JSON→API swap is isolated in `shared/data`. The cross-feature cart lives in `shared/state` (it is the app's cart, touched by builder/store/summary). Slight extra structure vs flat colocation; boundaries enforced by lint.

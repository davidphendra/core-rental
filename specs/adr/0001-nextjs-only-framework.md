# ADR 0001 — Next.js-only (React) framework

- **Status:** Accepted (decision #1)
- **Context:** The required stack listed both Angular and Next.js. Official docs establish Next.js as React-based (nextjs.org/docs) and Angular as a self-contained framework (angular.dev) — they cannot coexist in one app. TanStack Query's Angular adapter is experimental ("breaking changes in minor AND patch releases", tanstack.com/query docs); ngx-translate is Angular-only.
- **Decision:** Build on **Next.js 16 (React, App Router)** only. Drop Angular. Replace ngx-translate with `next-intl`-style i18n later (deferred); keep TanStack Query (stable on React). Vercel is the deploy target (zero-config, no package).
- **Consequences:** Two "required" stack items (Angular, ngx-translate) are dropped by necessity. TanStack Query becomes production-stable. Vercel + Next.js is the smoothest deploy pairing. The interactive builder maps naturally to React component state.

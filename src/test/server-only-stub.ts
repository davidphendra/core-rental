// Vitest stub for the `server-only` package: it throws outside a bundler's
// server-component context, so unit tests (plain node/jsdom) import this
// no-op instead. The real Next build still applies the genuine guard.
export {};

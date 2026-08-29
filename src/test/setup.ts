import { vi } from "vitest";

import "@testing-library/jest-dom/vitest";

// Neutralize the Vercel analytics sink in tests — track() is asserted directly
// in logger.test.ts; every other suite runs with a no-op (no console.warn noise).
vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));

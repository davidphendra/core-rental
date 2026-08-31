/**
 * e10: output guardrail — server-side design validation facade. The schema +
 * validator live client-safe in shared/domain (the builder panel re-validates
 * applied designs with the same rules — defense in depth); this facade is the
 * server's entry point so the workflow imports validation through the guardrail
 * layer, never from shared/domain directly.
 */
export {
  MAX_DESIGN_TOTAL,
  cheapestRentableTotal,
  validateDesign,
  type AiDesign,
  type DesignValidation,
} from "@/shared/domain/aiDesignSchema";

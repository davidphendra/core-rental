const STEPS = [
  {
    icon: "design_services",
    title: "1. Design",
    body: "Use our builder to mix and match ergonomic chairs, desks, and tropical accessories.",
  },
  {
    // C6: step-2 copy rewritten — no phantom duration selector; honest to #7.
    icon: "shopping_cart_checkout",
    title: "2. Rent",
    body: "Pick your setup and rent it month-to-month. No long-term commitment.",
  },
  {
    icon: "self_improvement",
    title: "3. Work",
    body: "We deliver and assemble directly to your villa. You just focus on deep work.",
  },
] as const;

/** How-it-Works (mockup) — three steps with the C6-rewritten step 2. */
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-surface-container-low px-margin-mobile py-section-gap md:px-margin-desktop"
    >
      <div className="max-w-container-max mx-auto">
        <div className="mb-16 text-center">
          <h2 className="text-headline-lg font-headline-lg text-on-surface">How it Works</h2>
          <p className="text-body-lg text-on-surface-variant mx-auto mt-2 max-w-2xl">
            From concept to comfort in three simple steps.
          </p>
        </div>
        <div className="gap-gutter relative grid grid-cols-1 md:grid-cols-3">
          <div
            aria-hidden="true"
            className="border-outline-variant absolute left-[15%] right-[15%] top-[50px] hidden h-[2px] border-t-2 border-dashed md:block"
          />
          {STEPS.map(({ icon, title, body }) => (
            <div key={title} className="relative z-10 flex flex-col items-center text-center">
              <span className="border-surface-variant bg-surface shadow-ambient mb-6 flex h-24 w-24 items-center justify-center rounded-full border transition-transform duration-300 hover:-translate-y-2">
                <span
                  className="material-symbols-outlined text-primary text-[40px]"
                  aria-hidden="true"
                >
                  {icon}
                </span>
              </span>
              <h3 className="text-headline-md font-headline-md text-on-surface">{title}</h3>
              <p className="text-body-md text-on-surface-variant mt-2 max-w-xs">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

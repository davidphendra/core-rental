import { getCatalog } from "@/shared/data/catalog.server";
import { BottomNav } from "@/shared/ui/BottomNav";
import { SiteHeader } from "@/shared/ui/SiteHeader";

import { Hero, HowItWorks } from "@/features/home";

/**
 * Home page — a server component (decision #25): the catalog is read
 * server-side via getCatalog(); no client fetch needed on the marketing page.
 */
export default function HomePage() {
  const catalog = getCatalog();

  return (
    <div className="bg-background text-on-background">
      <SiteHeader />
      <main>
        <Hero catalog={catalog} />
        <HowItWorks />
      </main>
      <BottomNav />
    </div>
  );
}

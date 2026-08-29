import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { codeForCapKey, codeForCategory, computeSku } from "./sku";
import type { CapKey } from "../src/shared/domain/setupRules";
import { HERO_PRODUCTS } from "./curated-hero";
import type { Product, ProductCategory } from "../src/shared/types/product";

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------------------
// Deterministic catalog templates (decision #30 tiered counts, #21 round IDR
// prices, #19 unified catalog). Fixed arrays — no randomness — so regeneration
// is byte-identical (decision #32).
// ---------------------------------------------------------------------------

interface Template {
  names: string[];
  priceMin: number;
  priceStep: number;
  description: (name: string) => string;
}

const CHAIR_TEMPLATE: Template = {
  names: [
    "Seminyak Lounge",
    "Nusa Dua Executive",
    "Sanur Mesh",
    "Kuta Flex",
    "Ubud Recline",
    "Jimbaran High-Back",
    "Amed Gaming",
    "Bingin Draft",
  ],
  priceMin: 400_000,
  priceStep: 50_000,
  description: (name) => `${name}: ergonomic support for deep-work sessions.`,
};

const DESK_TEMPLATE: Template = {
  names: [
    "Seminyak Standing",
    "Ubud Solid Teak",
    "Canggu Bamboo",
    "Kerobokan Sit-Stand",
    "Pererenan Minimal",
    "Berawa Corner",
    "Denpasar Heavy-Duty",
    "Uluwatu Compact",
    "Sanur Writing",
    "Jimbaran Executive",
  ],
  priceMin: 600_000,
  priceStep: 100_000,
  description: (name) => `${name}: a sturdy, island-tested work surface.`,
};

const MONITOR_TEMPLATE: Template = {
  names: [
    'Batu Bolong 27" 4K',
    'Berawa 24" QHD',
    'Seminyak 32" UHD',
    'Canggu Portable 15.6"',
    'Ubud 34" Ultrawide',
    'Pererenan 27" 144Hz',
    'Kuta 22" FHD',
    'Nusa Dua 27" Touch',
  ],
  priceMin: 300_000,
  priceStep: 25_000,
  description: (name) => `${name}: crisp pixels for code and creative work.`,
};

const LAMP_TEMPLATE: Template = {
  names: [
    "Canggu Desk Lamp",
    "Ubud Warm Glow",
    "Seminyak Architect",
    "Berawa LED Bar",
    "Pererenan Clip Light",
    "Jimbaran Floor Lamp",
  ],
  priceMin: 100_000,
  priceStep: 20_000,
  description: (name) => `${name}: soft, adjustable light for late sessions.`,
};

const PLANT_TEMPLATE: Template = {
  names: [
    "Snake Plant",
    "Palm Areca",
    "Rubber Tree",
    "ZZ Plant",
    "Bamboo Stalk",
    "Fiddle Leaf Fig",
    "Peace Lily",
  ],
  priceMin: 100_000,
  priceStep: 20_000,
  description: (name) => `${name}: living greenery that survives (almost) anything.`,
};

const COFFEE_TEMPLATE: Template = {
  names: [
    "Pour-Over Kit",
    "Moka Pot Set",
    "Cold Brew Tower",
    "Barista Bundle",
    "Seminyak Cold Drip",
    "Ubud French Press",
    "Canggu Siphon",
    "Kerobokan Drip Bar",
    "Berawa Espresso Duo",
  ],
  priceMin: 400_000,
  priceStep: 50_000,
  description: (name) => `${name}: keep the caffeine pipeline flowing.`,
};

const BEANBAG_TEMPLATE: Template = {
  names: [
    "Pouf Ottoman",
    "Hammock Seat",
    "Floor Cushion Set",
    "Zero-Gravity Lounger",
    "Seminyak Floor Seat",
    "Ubud Cushion Lounge",
    "Canggu Bean Pod",
    "Pererenan Lounger",
    "Berawa Sofa Sack",
  ],
  priceMin: 250_000,
  priceStep: 25_000,
  description: (name) => `${name}: the relax-zone essential.`,
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildFromTemplate(
  category: "chair" | "desk",
  template: Template,
  heroSkus: Set<string>,
): Product[] {
  const code = codeForCategory(category);
  if (code === null) throw new Error(`no sku code for ${category}`);
  return template.names.map((name, i) => {
    const skuNo = computeSku(code, name);
    return {
      skuNo,
      name,
      category,
      pricePerMonth: template.priceMin + i * template.priceStep,
      description: template.description(name),
      image: heroSkus.has(skuNo) ? "" : `/placeholders/${category}-${slugify(name)}.svg`,
    };
  });
}

const ACCESSORY_SUBTYPES: { name: CapKey; template: Template }[] = [
  { name: "monitor", template: MONITOR_TEMPLATE },
  { name: "lamp", template: LAMP_TEMPLATE },
  { name: "plant", template: PLANT_TEMPLATE },
  { name: "coffee", template: COFFEE_TEMPLATE },
  { name: "beanbag", template: BEANBAG_TEMPLATE },
];

function buildAccessories(heroSkus: Set<string>): Product[] {
  const products: Product[] = [];
  for (const { name, template } of ACCESSORY_SUBTYPES) {
    for (const [i, itemName] of template.names.entries()) {
      const skuNo = computeSku(codeForCapKey(name), itemName);
      products.push({
        skuNo,
        name: itemName,
        category: "accessory",
        pricePerMonth: template.priceMin + i * template.priceStep,
        description: template.description(itemName),
        image: heroSkus.has(skuNo) ? "" : `/placeholders/accessory-${slugify(itemName)}.svg`,
      });
    }
  }
  return products;
}

/**
 * Deterministically builds the full unified catalog: hero overlay (mockup-exact,
 * wins by skuNo) + generated products (decisions #19, #30, #31, #32; e09 skus).
 */
export function buildCatalog(): Product[] {
  const hero = [...HERO_PRODUCTS];
  const heroSkus = new Set(hero.map((p) => p.skuNo));

  const generated: Product[] = [
    ...buildFromTemplate("chair", CHAIR_TEMPLATE, heroSkus),
    ...buildFromTemplate("desk", DESK_TEMPLATE, heroSkus),
    ...buildAccessories(heroSkus),
  ];

  // Hero wins by skuNo; everything else from the generated set.
  const bySku = new Map<string, Product>();
  for (const p of generated) bySku.set(p.skuNo, p);
  for (const p of hero) bySku.set(p.skuNo, p);

  if (bySku.size !== generated.length + hero.length) {
    throw new Error("sku collision in generated catalog — computeSku must be unique per name");
  }

  const CATEGORY_ORDER: Record<ProductCategory, number> = {
    chair: 0,
    desk: 1,
    accessory: 2,
    extra: 3,
    partner: 4,
  };

  return [...bySku.values()].sort(
    (a, b) =>
      CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] || a.skuNo.localeCompare(b.skuNo),
  );
}

// ---------------------------------------------------------------------------
// SVG placeholder tiles (decision #31) — on-brand, deterministic, alt-safe text.
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<ProductCategory, string> = {
  chair: "#006767",
  desk: "#376757",
  accessory: "#bb580d",
  extra: "#974400",
  partner: "#2e3132",
};

function formatIdr(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function placeholderSvg(product: Product): string {
  const color = CATEGORY_COLORS[product.category];
  const price = formatIdr(product.pricePerMonth);
  const safeName = product.name
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" rx="16" fill="#f3f4f5"/>
  <rect x="24" y="24" width="352" height="160" rx="12" fill="${color}" opacity="0.18"/>
  <circle cx="200" cy="104" r="40" fill="${color}"/>
  <text x="200" y="120" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#ffffff">${product.category}</text>
  <text x="200" y="208" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="600" fill="#191c1d">${safeName}</text>
  <text x="200" y="238" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#3d4949">${price}/mo</text>
</svg>
`;
}

// ---------------------------------------------------------------------------
// CLI — writes products.json + placeholder tiles (pnpm generate:catalog).
// ---------------------------------------------------------------------------

function main(): void {
  const catalog = buildCatalog();
  const dataDir = join(PROJECT_ROOT, "src", "shared", "data");
  const publicDir = join(PROJECT_ROOT, "public", "placeholders");

  mkdirSync(dataDir, { recursive: true });
  mkdirSync(publicDir, { recursive: true });

  writeFileSync(join(dataDir, "products.json"), JSON.stringify(catalog, null, 2) + "\n");

  for (const product of catalog) {
    if (!product.image.startsWith("/placeholders/")) continue;
    // Filenames derive from the image path (name slug) — decoupled from the sku.
    const file = join(publicDir, product.image.replace(/^\/placeholders\//, ""));
    writeFileSync(file, placeholderSvg(product));
  }

  const counts = catalog.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`catalog: ${catalog.length} products`, counts);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}

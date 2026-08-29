export const PRODUCT_CATEGORIES = ["chair", "desk", "accessory", "extra", "partner"] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** e09 contract: 12-char sku — 3-letter code + 9 alnum chars, uppercase. */
export const SKU_PATTERN = /^[A-Z]{3}[A-Z0-9]{9}$/;

export interface Product {
  /** 12-char alphanumeric system identifier (e09): code + deterministic hash. */
  skuNo: string;
  name: string;
  category: ProductCategory;
  /** Monthly price in IDR (flat monthly, decision #7). */
  pricePerMonth: number;
  description: string;
  image: string;
  badge?: "popular";
}

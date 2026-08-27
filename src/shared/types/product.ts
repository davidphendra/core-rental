export const PRODUCT_CATEGORIES = ["chair", "desk", "accessory", "extra", "partner"] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  /** Monthly price in IDR (flat monthly, decision #7). */
  pricePerMonth: number;
  description: string;
  image: string;
  badge?: "popular";
}

import type { Product } from "../src/shared/types/product";

/**
 * The 7 hero products — mockup-exact data (names, IDR prices, Google image URLs).
 * These override generated entries with the same ID (decision #31, ADR 0003).
 * Prices are fresh round IDR market rates preserving the mockups' ordering
 * (decision #21): espresso > chair > plant.
 */
export const HERO_PRODUCTS: Product[] = [
  {
    id: "chair-uluwatu-chair",
    name: "Uluwatu Chair",
    category: "chair",
    pricePerMonth: 450_000,
    description: "Light gray mesh ergonomic chair. Clean, modern, island-cafe approved.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBBwHPiawlGW3969dKW5o0XTGnhWLB7SwZJ1dya2tRUgjUU4aJ57EsoC07NsBbECvVj-A89woj0Z4N4KP6MsUv6P_tniwCxhkludiVF1furDdZHeHwnPAj6ThoyWccd5LnFpPNYQH-ECtHmwM9bZDxSJ0KRfTOEiCKql5T_MUOfhh7MvV2neUNSSqUjZTPBbdHNldnhg5bJNETbvOcBADObdhNzdVWWPkDGp7Y60N8A28SLf_WwO-rMZg",
  },
  {
    id: "chair-canggu-task",
    name: "Canggu Task",
    category: "chair",
    pricePerMonth: 600_000,
    description:
      "Premium black ergonomic task chair with headrest. Built for long coding sessions.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAL1X4LeQqM58AEA417piC29Bo082Rq3vt0dnBCgetkEQSr4AFtNRdji1Bl4FLNnQnxKDBURZyQor1m9EYvlQ7rPNw2bV67NV9y6ngGjh5bVUmAvT3u-Y3KVSq2AWoCd1lJ9N6BK8_eRWI5oaRweuNqMNP_6zFF0Eraf3cv1pc5YcQo6W9yfZbBXqucJ58Rt3-_6yjsuV6BxHc4NQHuM2AAdI7WumWlCcaK-dc2wKUwUX4j4NoAnO2JGA",
    badge: "popular",
  },
  {
    id: "accessory-monstera",
    name: "Monstera Plant",
    category: "accessory",
    pricePerMonth: 200_000,
    description: "Breathe fresh island air into your setup. Low maintenance, high vibes.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBNM8NClz_4yWCUaLWIxUl0VPsSwgzpS59SzMt0oeaXq5pGtVdSkC_qDItbd-HAgqnVyUtLH-m5VqKPqRAtEPISuAm251n7PkVt1ryhwJ4Dj0EJ6poWJpX0frBBEqDW0sliyEsIJFl8ceIC7iFvn10G_cBFqr5urj_3NK1nKDh6C89ACSPSxxwk26WN_eqbSgCqurzJo5NuHocB4Gi30a1MnfutsimRiply4I4hnqATq-QtK8lgaJzBuQ",
    badge: "popular",
  },
  {
    id: "accessory-espresso-machine",
    name: "Espresso Machine",
    category: "accessory",
    pricePerMonth: 750_000,
    description: "Premium bean-to-cup machine. Keep your energy up for those long coding sessions.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuATDymSt-AcHwZo3PpW0B2MasVp31eN2xETL6HE47QwVmUWSdXfr-qebhbti1geNj2S4aMEcJMq27UHmxy529UDQVfz-wvP1qG47iXhoRJ6JE94YTqOytJXeiNu-RpHVidaOks0Rqec_ZG3bxs_cCkz1LHDRGPAbPPeM5S-gX5Pn2iRmP6ALD028fqVXigofgft6xjAXAJH1dkI1xqBho3iv1Yh5a72Xhq1BLbi-2Nrx9Miaguq30crjA",
  },
  {
    id: "accessory-bean-bag-lounge",
    name: "Bean Bag Lounge",
    category: "accessory",
    pricePerMonth: 350_000,
    description: "Perfect for brainstorming or a quick creative break away from the desk.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDTzT4Tf58tkbo6X7I2a_aF5XrHlXm7pV5GAMydtstbloGCCC5_LoXb0tmuXW4wxWFYp-K9r_DSFRd1FhGZfwlTIYs9u_Sjj1mFpCjduawANJZfqSIyG6At13g6nueBMlme0wHSmw-E-EfohvvNKC2bxhS5hjAytlxV74b3eU4-sS57APj0jGatARBLneuXhfgqykyMcCtzQkWzlSZRG8qSUB5-oQ8bepiLtS2v0uGGLiAqRSWf3aYV7A",
  },
  {
    id: "partner-motorcycle-rental",
    name: "Motorcycle Rental",
    category: "partner",
    pricePerMonth: 1_500_000,
    description:
      "Your ticket to weekend adventures and quick cafe runs. Partner service — request only, not part of the setup total.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDzjIAuaxcV_rRiMy00v8cwn-pxzwpyvjnmspN6m-JdZcjS4wpchbvEIbu9AhU39Gt0UuXmBbvCpLuwHABEixWRrchkthbGrCJB24fDyTEWNO0IdIO8a458vmSwuNoPEOKru9qYVF5mS_42N6YoQne_hhILyTszOmFM0nOtv5cfe95PI5QEetoQOcIfGXGFsEOXDkiQvwFNXUU3hc6FrwfatsrwiMwp6vDzWNYXOcIcHvCQhvz66bCvsA",
  },
];

import { img } from "./home-content";

/**
 * Catalogue shapes, and the small static catalogue used to seed a fresh
 * database.
 *
 * The storefront reads from Postgres via `app/server/catalog.ts` — this module
 * no longer answers queries. It used to: an in-memory `queryCatalog()` filtered
 * and sorted a JavaScript array, and `app/server/catalog.ts` fed it *every
 * published product* on every request to keep using it. That was invisible at
 * fourteen products and cost 1.7 seconds and 6.4 MB per request at three
 * thousand, so filtering, sorting, paging and facet counting all moved into SQL
 * and the array-based query functions were deleted rather than left as a trap.
 *
 * What stays here: the types both sides share, and `catalog` itself, which
 * `prisma/seed.ts` writes into a new database.
 */

/** A full product, as the detail page needs it. */
export interface CatalogProduct {
  id: string;
  /** Slug of the subcategory this product sits under, when it has one. */
  subcategoryId?: string;
  title: string;
  brand: string;
  categoryId: string;
  price: number;
  originalPrice: number;
  totalStock: number;
  rating: number;
  numReviews: number;
  description: string;
  /** Long-form details in the light markup RichText.tsx renders. Absent on
   *  the static showcase items, which predate the field. */
  richDescription?: string;
  aboutFeatures: string[];
  idealFor: string[];
  /** Available colour options. `hex` is the swatch colour picked in admin;
   *  each carries its own gallery, falling back to the main product `images`
   *  when `images` for that colour is empty. */
  colors?: { name: string; hex: string; images: string[] }[];
  specifications: { label: string; value: string }[];
  images: string[];
  /** Absent on the seeded rows; populated for products with uploaded video. */
  videos?: string[];
}

const p = (
  id: string,
  title: string,
  brand: string,
  categoryId: string,
  price: number,
  originalPrice: number,
  totalStock: number,
  rating: number,
  numReviews: number,
  photos: string[],
  description: string,
  aboutFeatures: string[],
  idealFor: string[],
  specifications: { label: string; value: string }[],
): CatalogProduct => ({
  id,
  title,
  brand,
  categoryId,
  price,
  originalPrice,
  totalStock,
  rating,
  numReviews,
  description,
  aboutFeatures,
  idealFor,
  specifications,
  images: photos.map((photo) => img(photo, 1000)),
});

export const catalog: CatalogProduct[] = [
  p("raptor-x4wd", "Raptor X4WD", "WOW Racing", "rc-cars", 2399, 2999, 24, 4.6, 128,
    ["photo-1630029546304-981fdadbb842", "photo-1759646850688-7b2d18f0a248", "photo-1758964087156-0eac97044f84"],
    "A 1:10 scale four-wheel-drive monster truck built for rough ground. Independent suspension, oil-filled shocks and a brushed 390 motor that keeps pulling where smaller trucks bog down.",
    ["1:10 Scale 4WD Monster Truck", "2.4GHz Remote Control", "High Speed & All Terrain", "Rechargeable Battery (Included)", "Durable Shock Absorbers"],
    ["Ages 8+", "Outdoor", "Beginners"],
    [{ label: "Remote", value: "2.4GHz" }, { label: "Top Speed", value: "60+ km/h" }, { label: "Drive", value: "4WD" }, { label: "Battery", value: "Rechargeable" }, { label: "Scale", value: "1:10" }, { label: "Run Time", value: "25 min" }]),

  p("drift-king", "Drift King", "WOW Racing", "rc-cars", 2199, 2299, 21, 4.5, 88,
    ["photo-1508896694512-1eade558679c", "photo-1758964087156-0eac97044f84"],
    "A rear-wheel-drive drift car on low-grip tyres. Built to slide predictably rather than grip, which makes it the easiest way into controlled drifting.",
    ["Rear-wheel drive drift chassis", "Slick drift tyres included", "Proportional steering", "LED headlights"],
    ["Ages 10+", "Indoor", "Smooth floors"],
    [{ label: "Remote", value: "2.4GHz" }, { label: "Top Speed", value: "35 km/h" }, { label: "Drive", value: "RWD" }, { label: "Battery", value: "7.4V Li-ion" }]),

  p("speed-storm", "Speed Storm", "Thunder", "rc-cars", 1799, 2299, 15, 4.3, 61,
    ["photo-1630029546304-981fdadbb842"],
    "A short-course buggy for gravel and grass. Sealed electronics mean a wet lawn is not the end of the afternoon.",
    ["Splash-resistant electronics", "Oil-filled shocks", "Removable body shell"],
    ["Ages 8+", "Outdoor"],
    [{ label: "Remote", value: "2.4GHz" }, { label: "Top Speed", value: "28 km/h" }, { label: "Drive", value: "2WD" }, { label: "Battery", value: "Rechargeable" }]),

  p("sky-hawk", "Sky Hawk", "AeroWOW", "toy-drones", 1699, 1999, 18, 4.5, 96,
    ["photo-1532989029401-439615f3d4b4", "photo-1527977966376-1c8408f9f108", "photo-1517430939066-41484532ce67"],
    "A beginner quadcopter with altitude hold, so it parks itself in the air while you learn the sticks. Headless mode removes the hardest part of early flying.",
    ["Altitude hold", "Headless mode", "One-key take-off and landing", "3 speed modes", "Spare propellers included"],
    ["Ages 10+", "Indoor & outdoor", "First drone"],
    [{ label: "Remote", value: "2.4GHz" }, { label: "Flight Time", value: "12 min" }, { label: "Range", value: "80 m" }, { label: "Battery", value: "3.7V 800mAh" }]),

  p("sky-warrior", "Sky Warrior", "AeroWOW", "toy-drones", 1049, 1499, 27, 4.4, 52,
    ["photo-1571753197835-877a43b7e352"],
    "A gyro-stabilised helicopter that shrugs off the knocks a first flight involves. Flexible rotors and a light frame.",
    ["3.5 channel control", "Gyro stabilised", "Crash-resistant rotors"],
    ["Ages 8+", "Indoor"],
    [{ label: "Remote", value: "2.4GHz" }, { label: "Flight Time", value: "8 min" }, { label: "Channels", value: "3.5" }, { label: "Battery", value: "Built-in" }]),

  p("city-police-station", "City Police Station", "BrickWorks", "building-sets", 1499, 1999, 32, 4.5, 74,
    ["photo-1760907218311-b27752b874e1", "photo-1681415886376-15d24afd70cb"],
    "A 620-piece station with an opening cell block, patrol car and four figures. Compatible with standard bricks.",
    ["620 pieces", "4 minifigures included", "Opening cell doors", "Compatible with standard bricks"],
    ["Ages 6+", "Indoor", "Collaborative play"],
    [{ label: "Pieces", value: "620" }, { label: "Figures", value: "4" }, { label: "Age", value: "6+" }, { label: "Build Time", value: "~2 hrs" }]),

  p("brick-city-street", "Brick City Street", "BrickWorks", "building-sets", 2799, 3299, 12, 4.7, 41,
    ["photo-1681415886376-15d24afd70cb", "photo-1760907218311-b27752b874e1"],
    "A modular street scene that clips onto other city sets. Two shopfronts, a tram stop and street furniture.",
    ["1,120 pieces", "Modular baseplates", "6 minifigures included"],
    ["Ages 9+", "Display", "Collectors"],
    [{ label: "Pieces", value: "1120" }, { label: "Figures", value: "6" }, { label: "Age", value: "9+" }, { label: "Modular", value: "Yes" }]),

  p("speed-boat", "Speed Boat", "WOW Marine", "hobby-models", 1799, 2299, 15, 4.4, 61,
    ["photo-1508109261185-dd0146900a71"],
    "A self-righting hull that flips itself upright after a roll, and a water-cooled motor that will run all afternoon on calm water.",
    ["Self-righting hull", "Water-cooled motor", "Low-battery alarm"],
    ["Ages 12+", "Ponds & pools"],
    [{ label: "Remote", value: "2.4GHz" }, { label: "Top Speed", value: "25 km/h" }, { label: "Run Time", value: "15 min" }, { label: "Hull", value: "Self-righting" }]),

  p("galleon-model", "Heritage Galleon", "Craftline", "hobby-models", 3499, 3999, 8, 4.8, 33,
    ["photo-1466188635785-8b5f35009981"],
    "A plank-on-frame wooden galleon kit with laser-cut ribs, brass fittings and rigging thread. A long winter project rather than a weekend one.",
    ["Laser-cut wooden parts", "Brass fittings", "Rigging thread and cleats", "Illustrated 60-page manual"],
    ["Ages 14+", "Display", "Experienced modellers"],
    [{ label: "Scale", value: "1:100" }, { label: "Length", value: "540 mm" }, { label: "Material", value: "Basswood" }, { label: "Skill", value: "Advanced" }]),

  p("chess-heirloom", "Heirloom Chess Set", "Grandmaster", "toys-games", 2299, 2799, 19, 4.7, 57,
    ["photo-1695480542225-bc22cac128d0"],
    "Weighted pieces on a folding walnut and maple board. Felted bases, and the box stores the full set.",
    ["Weighted pieces", "Folding walnut board", "Felted piece bases", "Storage inside the board"],
    ["Ages 6+", "Family", "Gifting"],
    [{ label: "Board", value: "45 cm" }, { label: "King Height", value: "95 mm" }, { label: "Material", value: "Walnut & maple" }, { label: "Weighted", value: "Yes" }]),

  p("spider-figure", "Web Slinger Figure", "HeroLine", "action-figures", 899, 1199, 40, 4.3, 112,
    ["photo-1529335764857-3f1164d1cb24"],
    "A 30cm articulated figure with 22 points of movement and two swappable hand sets.",
    ["22 points of articulation", "Two interchangeable hand sets", "Display stand included"],
    ["Ages 6+", "Display", "Play"],
    [{ label: "Height", value: "30 cm" }, { label: "Articulation", value: "22 points" }, { label: "Stand", value: "Included" }]),

  p("match-football", "Match Football", "WOW Sport", "sports-outdoors", 699, 899, 55, 4.2, 84,
    ["photo-1575361204480-aadea25e6e68"],
    "A size 5 machine-stitched match ball with a butyl bladder that holds pressure between games.",
    ["Size 5 match ball", "Machine-stitched panels", "Butyl bladder holds air"],
    ["Ages 8+", "Outdoor", "Team play"],
    [{ label: "Size", value: "5" }, { label: "Panels", value: "32" }, { label: "Bladder", value: "Butyl" }]),

  p("teddy-classic", "Classic Teddy", "Cuddle Co", "soft-toys", 799, 999, 48, 4.9, 203,
    ["photo-1530325553241-4f6e7690cf36"],
    "A 40cm jointed bear in dense plush, machine washable, with safety-locked eyes.",
    ["40cm jointed bear", "Machine washable", "Safety-locked eyes", "Hypoallergenic filling"],
    ["All ages", "Gifting", "Nursery"],
    [{ label: "Height", value: "40 cm" }, { label: "Material", value: "Plush" }, { label: "Washable", value: "Yes" }]),

  p("mini-rally", "Mini Rally", "Thunder", "rc-cars", 1499, 1799, 30, 4.4, 63,
    ["photo-1508896694512-1eade558679c"],
    "A 1:24 rally car small enough for a hallway and quick enough to be worth it.",
    ["1:24 scale", "Full proportional control", "USB charging"],
    ["Ages 6+", "Indoor"],
    [{ label: "Remote", value: "2.4GHz" }, { label: "Scale", value: "1:24" }, { label: "Top Speed", value: "18 km/h" }, { label: "Charging", value: "USB-C" }]),
];

/* ------------------------------------------------------------------ */
/* Query API — implemented in SQL by app/server/catalog.ts             */
/* ------------------------------------------------------------------ */

/**
 * What a grid tile actually renders.
 *
 * Deliberately much smaller than `CatalogProduct`: a listing of 24 tiles has no
 * use for descriptions, specifications, videos or every image, and selecting
 * them anyway is most of what made the old listing query expensive.
 */
export interface CatalogCard {
  id: string;
  title: string;
  brand: string;
  categoryId: string;
  subcategoryId?: string;
  price: number;
  originalPrice: number;
  totalStock: number;
  rating: number;
  numReviews: number;
  /** At most one — the tile only shows the first. */
  images: string[];
}

export type SortKey = "newest" | "price_asc" | "price_desc";

export interface CatalogQuery {
  category?: string;
  subcategory?: string;
  /** Free-text search across title, brand and department. */
  q?: string;
  brands?: string[];
  availability?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: SortKey;
  page?: number;
  limit?: number;
  /**
   * Facet counts are only read when a listing is (re)built, never when
   * infinite scroll appends a page — computing them on every batch would
   * roughly double the cost of scrolling for nothing.
   */
  withFacets?: boolean;
}

export interface Facet {
  label: string;
  count: number;
}

export interface CatalogFacets {
  brands: Facet[];
  availabilities: Facet[];
  categories: Facet[];
  priceMin: number;
  priceMax: number;
}

export interface CatalogResult {
  products: CatalogCard[];
  total: number;
  hasMore: boolean;
  facets: CatalogFacets;
}

/** The two availability buckets, named once so filter and facet agree. */
export const IN_STOCK = "In Stock";
export const OUT_OF_STOCK = "Out of Stock";

export const EMPTY_FACETS: CatalogFacets = {
  brands: [],
  availabilities: [],
  categories: [],
  priceMin: 0,
  priceMax: 0,
};

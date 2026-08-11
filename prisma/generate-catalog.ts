/**
 * Generates a realistic supplier-style CSV for load testing.
 *
 *   npx tsx prisma/generate-catalog.ts 3000 --out catalog-3000.csv
 *
 * The point isn't the data — it's that the site has to be measured at the size
 * it will actually run at. Fourteen seeded products hide every problem that
 * three thousand exposes, so this writes a file in the same messy shape a real
 * export arrives in (quoted fields with commas, pipe-separated image lists,
 * `₹1,299.00` prices, mixed-case category names) and feeds it through the same
 * importer an operator would use. Nothing here is a private seeding path.
 *
 * Deterministic: the same count always produces the same file, so a
 * before/after timing comparison is measuring the code, not the data.
 */

import { writeFileSync } from "node:fs";

/* Mulberry32 — small, fast, and seeded, so runs are reproducible. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = rng(20260806);
const pick = <T,>(items: readonly T[]): T => items[Math.floor(random() * items.length)];
const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));

/** Real Unsplash ids already whitelisted in next.config.ts, so images render. */
const PHOTOS = [
  "photo-1630029546304-981fdadbb842",
  "photo-1759646850688-7b2d18f0a248",
  "photo-1758964087156-0eac97044f84",
  "photo-1508896694512-1eade558679c",
  "photo-1532989029401-439615f3d4b4",
  "photo-1527977966376-1c8408f9f108",
  "photo-1517430939066-41484532ce67",
  "photo-1571753197835-877a43b7e352",
  "photo-1760907218311-b27752b874e1",
  "photo-1681415886376-15d24afd70cb",
  "photo-1508109261185-dd0146900a71",
  "photo-1466188635785-8b5f35009981",
  "photo-1695480542225-bc22cac128d0",
  "photo-1529335764857-3f1164d1cb24",
  "photo-1575361204480-aadea25e6e68",
  "photo-1530325553241-4f6e7690cf36",
] as const;

const img = (id: string, w = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=${w}`;

interface Dept {
  category: string;
  subcategories: readonly string[];
  brands: readonly string[];
  nouns: readonly string[];
  specs: readonly (readonly [string, readonly string[]])[];
  idealFor: readonly string[];
}

const DEPARTMENTS: readonly Dept[] = [
  {
    category: "RC Cars & Vehicles",
    subcategories: ["Monster Trucks", "Drift Cars", "Buggies", "Rock Crawlers", "Rally Cars"],
    brands: ["WOW Racing", "Thunder", "Torque Labs", "Redline RC", "Apex Motors"],
    nouns: ["Raptor", "Drift King", "Speed Storm", "Mud Runner", "Trailblazer", "Nitro Fang", "Rally Ace", "Boulder Climber", "Track Demon", "Dust Devil"],
    specs: [
      ["Remote", ["2.4GHz", "2.4GHz Pro", "5.8GHz"]],
      ["Top Speed", ["18 km/h", "28 km/h", "35 km/h", "45 km/h", "60+ km/h"]],
      ["Drive", ["2WD", "4WD", "RWD"]],
      ["Scale", ["1:24", "1:16", "1:12", "1:10"]],
      ["Run Time", ["12 min", "18 min", "25 min", "35 min"]],
    ],
    idealFor: ["Ages 6+", "Ages 8+", "Ages 10+", "Outdoor", "Indoor", "Beginners"],
  },
  {
    category: "Toy Drones & Helicopters",
    subcategories: ["Beginner Drones", "Camera Drones", "Helicopters", "Racing Drones"],
    brands: ["AeroWOW", "SkyLine", "Volt Air", "Falcon Tech"],
    nouns: ["Sky Hawk", "Sky Warrior", "Cloud Chaser", "Night Owl", "Storm Wing", "Horizon", "Air Scout", "Vertex"],
    specs: [
      ["Remote", ["2.4GHz", "App + Remote"]],
      ["Flight Time", ["7 min", "12 min", "18 min", "25 min"]],
      ["Range", ["50 m", "80 m", "150 m", "300 m"]],
      ["Camera", ["None", "720p", "1080p", "4K"]],
    ],
    idealFor: ["Ages 8+", "Ages 10+", "Ages 14+", "First drone", "Outdoor"],
  },
  {
    category: "Building Sets & Blocks",
    subcategories: ["City Sets", "Space Sets", "Vehicles", "Architecture", "Starter Bricks"],
    brands: ["BrickWorks", "Constructa", "BlockCraft", "Cube Co"],
    nouns: ["City Police Station", "Brick City Street", "Space Command", "Harbour Crane", "Fire Depot", "Mountain Lodge", "Grand Station", "Rescue Base"],
    specs: [
      ["Pieces", ["120", "340", "620", "1120", "2400"]],
      ["Figures", ["2", "4", "6", "8"]],
      ["Age", ["4+", "6+", "9+", "12+"]],
      ["Build Time", ["~40 min", "~2 hrs", "~5 hrs"]],
    ],
    idealFor: ["Ages 6+", "Ages 9+", "Indoor", "Collaborative play", "Display"],
  },
  {
    category: "Hobby & Scale Models",
    subcategories: ["Ship Models", "Aircraft Models", "Boats", "Diecast"],
    brands: ["Craftline", "WOW Marine", "Heritage Models", "Precision Kits"],
    nouns: ["Speed Boat", "Heritage Galleon", "Clipper Endeavour", "Spitfire Mk IX", "Ocean Racer", "Tall Ship", "Sopwith Camel"],
    specs: [
      ["Scale", ["1:200", "1:100", "1:72", "1:48"]],
      ["Length", ["220 mm", "380 mm", "540 mm", "720 mm"]],
      ["Material", ["Basswood", "ABS", "Die-cast metal"]],
      ["Skill", ["Beginner", "Intermediate", "Advanced"]],
    ],
    idealFor: ["Ages 12+", "Ages 14+", "Display", "Experienced modellers"],
  },
  {
    category: "Action Figures & Playsets",
    subcategories: ["Superheroes", "Fantasy", "Playsets", "Collector Figures"],
    brands: ["HeroLine", "MythForge", "Legend Toys", "Icon Collectibles"],
    nouns: ["Web Slinger", "Iron Guard", "Shadow Blade", "Storm Bringer", "Dragon Knight", "Star Ranger", "Frost Sentinel"],
    specs: [
      ["Height", ["15 cm", "20 cm", "30 cm", "45 cm"]],
      ["Articulation", ["12 points", "18 points", "22 points", "30 points"]],
      ["Stand", ["Included", "Not included"]],
    ],
    idealFor: ["Ages 6+", "Ages 12+", "Display", "Play", "Collectors"],
  },
  {
    category: "Toys & Games",
    subcategories: ["Board Games", "Puzzles", "Card Games", "Strategy"],
    brands: ["Grandmaster", "TableTop Co", "Puzzle House", "Mind Games"],
    nouns: ["Heirloom Chess Set", "Empire Builder", "Word Vault", "Cascade", "Trade Routes", "Riddle Box", "Tower Fall"],
    specs: [
      ["Players", ["1-2", "2-4", "2-6", "3-8"]],
      ["Play Time", ["15 min", "30 min", "60 min", "90 min"]],
      ["Age", ["6+", "8+", "12+"]],
    ],
    idealFor: ["All ages", "Family", "Gifting", "Ages 8+"],
  },
  {
    category: "Sports & Outdoors",
    subcategories: ["Football", "Cricket", "Cycling", "Outdoor Play", "Racquet Sports"],
    brands: ["WOW Sport", "FieldPro", "Summit Gear", "Active Line"],
    nouns: ["Match Football", "Pro Cricket Bat", "Trail Scooter", "Garden Goal", "Tournament Racquet", "Flying Disc", "Skipping Pro"],
    specs: [
      ["Size", ["3", "4", "5", "Standard"]],
      ["Material", ["Rubber", "PU Leather", "Composite", "Aluminium"]],
      ["Weight", ["180 g", "410 g", "1.1 kg"]],
    ],
    idealFor: ["Ages 8+", "Outdoor", "Team play", "Training"],
  },
  {
    category: "Soft Toys & Plush",
    subcategories: ["Teddy Bears", "Animals", "Character Plush", "Giant Plush"],
    brands: ["Cuddle Co", "Snuggle Lane", "Plush Works", "Little Friends"],
    nouns: ["Classic Teddy", "Cloud Bunny", "Ollie Elephant", "Patch Puppy", "Luna Cat", "Mango Monkey", "Pip Penguin"],
    specs: [
      ["Height", ["20 cm", "30 cm", "40 cm", "70 cm"]],
      ["Material", ["Plush", "Organic cotton", "Recycled fibre"]],
      ["Washable", ["Yes", "Surface wash only"]],
    ],
    idealFor: ["All ages", "Gifting", "Nursery", "Ages 3+"],
  },
];

const EDITIONS = ["", "Pro", "XL", "Mini", "Deluxe", "Sport", "Elite", "Classic", "V2", "Turbo", "Limited", "Signature"];
const COLOURS = ["", "Red", "Blue", "Black", "Green", "Silver", "Orange", "Yellow", "Purple", "White"];

const FEATURES = [
  "Rechargeable battery included",
  "Durable impact-resistant shell",
  "Assembled and tested before dispatch",
  "Spare parts available",
  "Certified non-toxic materials",
  "1-year manufacturer warranty",
  "Easy for beginners, deep enough for enthusiasts",
  "Gift-ready packaging",
  "Low-battery indicator",
  "Storage case included",
];

/** Quotes a CSV field only when it needs it, the way real exporters do. */
function csvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function buildRow(index: number) {
  const dept = pick(DEPARTMENTS);
  const noun = pick(dept.nouns);
  const edition = pick(EDITIONS);
  const colour = pick(COLOURS);
  const title = [noun, edition, colour].filter(Boolean).join(" ");

  const price = between(4, 160) * 25 + 99;
  // Most products carry a discount; some sit at full price.
  const originalPrice = random() < 0.75 ? Math.round(price * (1 + between(8, 45) / 100)) : price;
  const stock = random() < 0.12 ? 0 : between(1, 90);

  const specs = dept.specs
    .map(([label, values]) => `${label}: ${pick(values)}`)
    .join(" | ");

  const images = Array.from({ length: between(1, 3) }, () => img(pick(PHOTOS))).join(" | ");

  const features = Array.from(new Set(Array.from({ length: between(3, 5) }, () => pick(FEATURES)))).join(" | ");
  const idealFor = Array.from(new Set(Array.from({ length: between(1, 3) }, () => pick(dept.idealFor)))).join(" | ");

  return {
    // A supplier's own SKU, deliberately not a clean slug — the importer has to
    // cope with turning this into one.
    SKU: `WOW-${String(index + 1).padStart(5, "0")}`,
    "Product Name": title,
    Vendor: pick(dept.brands),
    Category: dept.category,
    Subcategory: pick(dept.subcategories),
    // Formatted the way a finance team exports it: currency symbol, grouping.
    Price: `₹${price.toLocaleString("en-IN")}.00`,
    MRP: `₹${originalPrice.toLocaleString("en-IN")}.00`,
    Quantity: String(stock),
    // Contains commas, so it must survive quoting.
    Description: `${title} from ${dept.category.toLowerCase()}. Built to hold up to real use, not just the first afternoon — checked, packed and dispatched from Thuraiyur, with support if anything goes wrong.`,
    "Key Features": features,
    "Ideal For": idealFor,
    Specifications: specs,
    "Image URLs": images,
    Rating: (3 + random() * 2).toFixed(1),
    Reviews: String(between(0, 400)),
    Status: random() < 0.97 ? "Active" : "Draft",
    Featured: random() < 0.02 ? "Yes" : "No",
    Deal: random() < 0.05 ? "Yes" : "No",
  };
}

function main() {
  const argv = process.argv.slice(2);
  const count = Number(argv.find((a) => /^\d+$/.test(a))) || 3000;
  const outAt = argv.indexOf("--out");
  const out = outAt !== -1 ? argv[outAt + 1] : `catalog-${count}.csv`;

  const rows = Array.from({ length: count }, (_, i) => buildRow(i));
  const headers = Object.keys(rows[0]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => csvField(String(row[h as keyof typeof row]))).join(",")),
  ].join("\n");

  writeFileSync(out, csv, "utf8");

  const bytes = Buffer.byteLength(csv, "utf8");
  console.log(`Wrote ${count} products to ${out} (${(bytes / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`\nNext:\n  npx tsx prisma/import-products.ts ${out} --dry-run\n  npx tsx prisma/import-products.ts ${out}`);
}

main();

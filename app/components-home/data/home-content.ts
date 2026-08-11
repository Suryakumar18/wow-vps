/**
 * Single source of truth for every string and image on the approved homepage.
 *
 * IMAGES: all placeholders are Unsplash URLs built through `img()`. To swap in
 * final artwork later, replace the `src` value only — nothing else references
 * these URLs, and every consumer sizes the image itself.
 */

/** Builds an optimised Unsplash delivery URL. Replace freely with any absolute URL. */
export const img = (id: string, w = 800, h?: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=${w}${h ? `&h=${h}` : ""}`;

/* ------------------------------------------------------------------ */
/* Announcement bar                                                     */
/* ------------------------------------------------------------------ */

export const announcement = {
  left: [
    { icon: "zap", label: "Fuel Your Passion." },
    { icon: "gamepad", label: "Play. Build. Explore." },
  ],
  center: [
    { icon: "truck", label: "Pan India Shipping" },
    { icon: "return", label: "Easy Returns" },
    { icon: "verified", label: "Genuine Products" },
  ],
  help: { label: "Need Help?", phone: "+91 91500 12245", href: "tel:+919150012245" },
} as const;

/* ------------------------------------------------------------------ */
/* Brand                                                                */
/* ------------------------------------------------------------------ */

export const brand = {
  name: "WOWLIFESTYLE",
  location: "THURAIUR",
  tagline: "Toys for Every Dream",
  searchPlaceholder: "Search for RC cars, toy drones, models, games, building sets...",
} as const;

/* ------------------------------------------------------------------ */
/* Primary navigation + mega menu                                       */
/* ------------------------------------------------------------------ */

export interface NavItem {
  label: string;
  href: string;
  /** Presence of `menu` renders a caret and opens the mega menu on hover/focus. */
  menu?: { title: string; links: { label: string; href: string }[] }[];
  /** Optional promo tile shown on the right edge of the mega menu. */
  feature?: { title: string; subtitle: string; src: string; alt: string; href: string };
}

export const navItems: NavItem[] = [
  {
    label: "RC Cars",
    href: "/category/rc-cars",
    menu: [
      {
        title: "By Type",
        links: [
          { label: "Monster Trucks", href: "/" },
          { label: "Drift Cars", href: "/" },
          { label: "Buggies", href: "/" },
          { label: "Rock Crawlers", href: "/" },
          { label: "Touring Cars", href: "/" },
        ],
      },
      {
        title: "By Scale",
        links: [
          { label: "1:8 Scale", href: "/" },
          { label: "1:10 Scale", href: "/" },
          { label: "1:16 Scale", href: "/" },
          { label: "1:24 Scale", href: "/" },
        ],
      },
      {
        title: "Spares & Upgrades",
        links: [
          { label: "Batteries & Chargers", href: "/" },
          { label: "Motors & ESC", href: "/" },
          { label: "Tyres & Wheels", href: "/" },
          { label: "Body Shells", href: "/" },
        ],
      },
    ],
    feature: {
      title: "Built for Speed",
      subtitle: "Hobby-grade RC from ₹1,799",
      src: img("photo-1759646850688-7b2d18f0a248", 480),
      alt: "Off-road remote control truck racing through dust",
      href: "/category/rc-cars",
    },
  },
  {
    label: "Toy Drones",
    href: "/category/toy-drones",
    menu: [
      {
        title: "By Skill Level",
        links: [
          { label: "Beginner Drones", href: "/" },
          { label: "Intermediate", href: "/" },
          { label: "Pro & FPV", href: "/" },
        ],
      },
      {
        title: "Features",
        links: [
          { label: "Camera Drones", href: "/" },
          { label: "Mini & Pocket", href: "/" },
          { label: "Stunt Drones", href: "/" },
          { label: "Helicopters", href: "/" },
        ],
      },
      {
        title: "Accessories",
        links: [
          { label: "Propellers", href: "/" },
          { label: "Batteries", href: "/" },
          { label: "Carry Cases", href: "/" },
        ],
      },
    ],
    feature: {
      title: "Fun Takes Flight",
      subtitle: "Easy to fly. Fun to master.",
      src: img("photo-1517430939066-41484532ce67", 480),
      alt: "Quadcopter drone hovering against a blue sky",
      href: "/category/toy-drones",
    },
  },
  {
    label: "Toys & Games",
    href: "/category/toys-games",
    menu: [
      {
        title: "Board Games",
        links: [
          { label: "Chess & Strategy", href: "/" },
          { label: "Family Games", href: "/" },
          { label: "Card Games", href: "/" },
        ],
      },
      {
        title: "Puzzles",
        links: [
          { label: "Jigsaw Puzzles", href: "/" },
          { label: "3D Puzzles", href: "/" },
          { label: "Brain Teasers", href: "/" },
        ],
      },
      {
        title: "Outdoor Play",
        links: [
          { label: "Ride-Ons", href: "/" },
          { label: "Water Toys", href: "/" },
          { label: "Garden Games", href: "/" },
        ],
      },
    ],
    feature: {
      title: "Game Nights, Sorted",
      subtitle: "Classics the whole family loves",
      src: img("photo-1695480542225-bc22cac128d0", 480),
      alt: "Wooden chess board with carved chess pieces",
      href: "/category/toys-games",
    },
  },
  {
    label: "Hobby & Models",
    href: "/category/hobby-models",
    menu: [
      {
        title: "Scale Models",
        links: [
          { label: "Ship Models", href: "/" },
          { label: "Aircraft Kits", href: "/" },
          { label: "Diecast Cars", href: "/" },
          { label: "Military Models", href: "/" },
        ],
      },
      {
        title: "Model Making",
        links: [
          { label: "Paints & Brushes", href: "/" },
          { label: "Tools & Cutters", href: "/" },
          { label: "Glues & Fillers", href: "/" },
        ],
      },
      {
        title: "Collectibles",
        links: [
          { label: "Limited Editions", href: "/" },
          { label: "Display Cases", href: "/" },
        ],
      },
    ],
    feature: {
      title: "For the Detail Obsessed",
      subtitle: "Museum-grade scale models",
      src: img("photo-1466188635785-8b5f35009981", 480),
      alt: "Detailed wooden galleon scale model",
      href: "/category/hobby-models",
    },
  },
  { label: "Building Sets", href: "/category/building-sets" },
  { label: "Action Figures", href: "/category/action-figures" },
  { label: "Sports & Outdoors", href: "/category/sports-outdoors" },
  { label: "Learning & Education", href: "/category/all" },
  { label: "Soft Toys", href: "/category/soft-toys" },
];

/** Contents of the gold "All Categories" flyout in the nav bar. */
export const allCategories = [
  { label: "RC Cars & Vehicles", href: "/category/rc-cars", icon: "car" },
  { label: "Toy Drones & Helicopters", href: "/category/toy-drones", icon: "plane" },
  { label: "Toys & Games", href: "/category/toys-games", icon: "dice" },
  { label: "Building Sets & Blocks", href: "/category/building-sets", icon: "blocks" },
  { label: "Hobby & Scale Models", href: "/category/hobby-models", icon: "ship" },
  { label: "Action Figures & Playsets", href: "/category/action-figures", icon: "bot" },
  { label: "Sports & Outdoors", href: "/category/sports-outdoors", icon: "trophy" },
  { label: "Learning & Education", href: "/category/all", icon: "graduation" },
  { label: "Soft Toys & Plush", href: "/category/soft-toys", icon: "heart" },
] as const;

/* ------------------------------------------------------------------ */
/* Hero banner                                                          */
/* ------------------------------------------------------------------ */

export interface HeroSlide {
  eyebrow: string;
  titleLines: [string, string];
  description: string;
  ctaLabel: string;
  ctaHref: string;
  script: [string, string, string];
  src: string;
  alt: string;
}

export const heroSlides: HeroSlide[] = [
  {
    eyebrow: "More Than Just Toys",
    titleLines: ["Fuel Your Passion.", "Live the WOW Life."],
    description: "The ultimate destination for hobby-grade RC, toy drones, models, games and more.",
    ctaLabel: "Explore All Products",
    ctaHref: "/category/all",
    script: ["Play", "Build", "Explore"],
    src: img("photo-1758964087156-0eac97044f84", 1400),
    alt: "Orange and black remote control drift car on a polished surface",
  },
  {
    eyebrow: "Take Off Today",
    titleLines: ["Fun Takes Flight.", "Master the Skies."],
    description: "Beginner-friendly toy drones and pro-grade quadcopters, ready to fly out of the box.",
    ctaLabel: "Explore Drones",
    ctaHref: "/category/toy-drones",
    script: ["Fly", "Film", "Soar"],
    src: img("photo-1527977966376-1c8408f9f108", 1400),
    alt: "Grey and black quadcopter drone in flight",
  },
  {
    eyebrow: "Brick by Brick",
    titleLines: ["Build Something", "Worth Showing Off."],
    description: "Thousands of pieces, endless builds — building sets for every age and ambition.",
    ctaLabel: "Explore Building Sets",
    ctaHref: "/category/building-sets",
    script: ["Snap", "Stack", "Show"],
    src: img("photo-1681415886376-15d24afd70cb", 1400),
    alt: "Detailed building block city street scene",
  },
  {
    eyebrow: "Collector Grade",
    titleLines: ["Details That", "Deserve a Shelf."],
    description: "Hand-finished scale models and collectibles for the seriously obsessed.",
    ctaLabel: "Explore Models",
    ctaHref: "/category/hobby-models",
    script: ["Craft", "Detail", "Display"],
    src: img("photo-1466188635785-8b5f35009981", 1400),
    alt: "Wooden galleon scale model on a workbench",
  },
];

/** The four micro trust badges sitting under the hero paragraph. */
export const heroTrust = [
  { icon: "shield", label: "Premium Quality" },
  { icon: "grid", label: "Wide Selection" },
  { icon: "truck", label: "Fast Delivery" },
  { icon: "users", label: "Trusted by Enthusiasts" },
] as const;

/* ------------------------------------------------------------------ */
/* Shop by category                                                     */
/* ------------------------------------------------------------------ */

export interface Category {
  id: string;
  /** Rendered on two lines exactly as in the approved desktop design. */
  titleLines: [string, string];
  /** Single-line label used by the mobile circular tiles. */
  shortTitle: string;
  href: string;
  src: string;
  alt: string;
}

export const categories: Category[] = [
  {
    id: "rc-cars",
    shortTitle: "RC Cars",
    titleLines: ["RC Cars", "& Vehicles"],
    href: "/category/rc-cars",
    src: img("photo-1630029546304-981fdadbb842", 420),
    alt: "Off-road remote control truck on grass",
  },
  {
    id: "toy-drones",
    shortTitle: "Toy Drones",
    titleLines: ["Toy Drones", "& Helicopters"],
    href: "/category/toy-drones",
    src: img("photo-1527977966376-1c8408f9f108", 420),
    alt: "Black quadcopter drone",
  },
  {
    id: "toys-games",
    shortTitle: "Toys & Games",
    titleLines: ["Toys &", "Games"],
    href: "/category/toys-games",
    src: img("photo-1695480542225-bc22cac128d0", 420),
    alt: "Wooden chess set mid game",
  },
  {
    id: "building-sets",
    shortTitle: "Building Sets",
    titleLines: ["Building Sets", "& Blocks"],
    href: "/category/building-sets",
    src: img("photo-1681415886376-15d24afd70cb", 420),
    alt: "Building block model of a city street",
  },
  {
    id: "hobby-models",
    shortTitle: "Hobby Models",
    titleLines: ["Hobby &", "Scale Models"],
    href: "/category/hobby-models",
    src: img("photo-1466188635785-8b5f35009981", 420),
    alt: "Galleon ship scale model",
  },
  {
    id: "action-figures",
    shortTitle: "Action Figures",
    titleLines: ["Action Figures", "& Playsets"],
    href: "/category/action-figures",
    src: img("photo-1529335764857-3f1164d1cb24", 420),
    alt: "Superhero action figure",
  },
  {
    id: "sports-outdoors",
    shortTitle: "Sports",
    titleLines: ["Sports &", "Outdoors"],
    href: "/category/sports-outdoors",
    src: img("photo-1575361204480-aadea25e6e68", 420),
    alt: "Football resting on a grass field",
  },
  {
    id: "soft-toys",
    shortTitle: "Soft Toys",
    titleLines: ["Soft Toys", "& Plush"],
    href: "/category/soft-toys",
    src: img("photo-1530325553241-4f6e7690cf36", 420),
    alt: "Brown teddy bear plush toy",
  },
];

/* ------------------------------------------------------------------ */
/* Promotional banners                                                  */
/* ------------------------------------------------------------------ */

export const promoBanners = [
  {
    id: "rc-cars",
    shortTitle: "RC Cars",
    tone: "dark" as const,
    eyebrow: "RC Cars",
    titleLines: ["Built for Speed.", "Made for Thrill."],
    description: "High-performance RC cars for true enthusiasts.",
    ctaLabel: "Explore RC Cars",
    ctaHref: "/category/rc-cars",
    src: img("photo-1759646850688-7b2d18f0a248", 900),
    alt: "Remote control truck kicking up dust off-road",
  },
  {
    id: "toy-drones",
    shortTitle: "Toy Drones",
    tone: "light" as const,
    eyebrow: "Toy Drones",
    titleLines: ["Fun Takes Flight."],
    description: "Easy to fly. Fun to master.\nPerfect for all ages.",
    ctaLabel: "Explore Drones",
    ctaHref: "/category/toy-drones",
    src: img("photo-1517430939066-41484532ce67", 700),
    alt: "Drone hovering in a clear blue sky",
  },
];

/* ------------------------------------------------------------------ */
/* Popular picks (product cards)                                        */
/* ------------------------------------------------------------------ */

export interface Product {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  mrp: number;
  /** Badge percentage as approved. Omit to derive it from `price` vs `mrp`. */
  discount?: number;
  /** Omitted for catalog items with no reviews yet — the stars are then hidden. */
  rating?: number;
  reviews?: number;
  stock: number;
  href: string;
  src: string;
  alt: string;
}

export const popularPicks: Product[] = [
  {
    id: "raptor-x4wd",
    title: "Raptor X4WD",
    subtitle: "RC Monster Truck",
    price: 2399,
    mrp: 2999,
    discount: 20,
    rating: 4.5,
    reviews: 128,
    stock: 24,
    href: "/product/raptor-x4wd",
    src: img("photo-1630029546304-981fdadbb842", 520),
    alt: "Raptor X4WD remote control monster truck",
  },
  {
    id: "sky-hawk",
    title: "Sky Hawk",
    subtitle: "Toy Drone",
    price: 1699,
    mrp: 1999,
    discount: 18,
    rating: 4.5,
    reviews: 96,
    stock: 18,
    href: "/product/sky-hawk",
    src: img("photo-1532989029401-439615f3d4b4", 520),
    alt: "Sky Hawk toy drone in flight",
  },
  {
    id: "city-police-station",
    title: "City Police Station",
    subtitle: "Building Blocks Set",
    price: 1499,
    mrp: 1999,
    discount: 18,
    rating: 4.5,
    reviews: 74,
    stock: 32,
    href: "/product/city-police-station",
    src: img("photo-1760907218311-b27752b874e1", 520),
    alt: "City police station building blocks set",
  },
  {
    id: "speed-boat",
    title: "Speed Boat",
    subtitle: "RC Boat",
    price: 1799,
    mrp: 2299,
    discount: 20,
    rating: 4.5,
    reviews: 61,
    stock: 15,
    href: "/product/speed-boat",
    src: img("photo-1508109261185-dd0146900a71", 520),
    alt: "White remote control speed boat",
  },
  {
    id: "drift-king",
    title: "Drift King",
    subtitle: "RC Sports Car",
    price: 2199,
    mrp: 2299,
    discount: 22,
    rating: 4.5,
    reviews: 83,
    stock: 21,
    href: "/product/drift-king",
    src: img("photo-1508896694512-1eade558679c", 520),
    alt: "Red Drift King RC sports car",
  },
  {
    id: "sky-warrior",
    title: "Sky Warrior",
    subtitle: "Toy Helicopter",
    price: 1049,
    mrp: 1499,
    discount: 18,
    rating: 4.5,
    reviews: 52,
    stock: 27,
    href: "/product/sky-warrior",
    src: img("photo-1571753197835-877a43b7e352", 520),
    alt: "Sky Warrior toy helicopter",
  },
];

/* ------------------------------------------------------------------ */
/* Why WOWLifestyle (trust strip)                                       */
/* ------------------------------------------------------------------ */

export const trustFeatures = [
  { icon: "shield", title: "100% Genuine Products", subtitle: "Original & trusted" },
  { icon: "lock", title: "Secure Payments", subtitle: "Multiple safe options" },
  { icon: "truck", title: "Pan India Delivery", subtitle: "Fast & reliable" },
  { icon: "return", title: "7 Days Easy Returns", subtitle: "Hassle free" },
  { icon: "headset", title: "Dedicated Support", subtitle: "We are here to help" },
] as const;

/* ------------------------------------------------------------------ */
/* Lifestyle banners                                                    */
/* ------------------------------------------------------------------ */

export const lifestyleBanners = [
  {
    id: "hobbyists",
    tone: "dark" as const,
    title: "For Hobbyists",
    description: "Turn your passion\ninto an experience.",
    ctaLabel: "Build Your Collection",
    ctaHref: "/category/hobby-models",
    src: img("photo-1772547989062-5fa8672edba6", 700),
    alt: "Shelves of collectible model cars",
  },
  {
    id: "families",
    tone: "cream" as const,
    title: "For Families",
    description: "Create memories\nthat last.",
    ctaLabel: "Fun for All Ages",
    ctaHref: "/category/toys-games",
    src: img("photo-1758687126231-f9db9bf7b0b2", 700),
    alt: "Father and son building with blocks together",
  },
  {
    id: "gifting",
    tone: "dark" as const,
    title: "For Gifting",
    description: "Perfect gifts for\nbirthdays & special moments.",
    ctaLabel: "Find the Perfect Gift",
    ctaHref: "/category/all",
    src: img("photo-1647221598398-934ed5cb0e4f", 700),
    alt: "Wrapped gift boxes with ribbons",
  },
];

/* ------------------------------------------------------------------ */
/* Newsletter                                                           */
/* ------------------------------------------------------------------ */

export const newsletter = {
  title: "Join WOW Club",
  description: "Get exclusive deals, early access, new arrivals\nand special offers!",
  placeholder: "Enter your email address",
  ctaLabel: "Join Now",
  asideLines: ["Play More.", "Save More."],
} as const;

/* ------------------------------------------------------------------ */
/* Footer                                                               */
/* ------------------------------------------------------------------ */

export const footer = {
  about:
    "Your one-stop destination for RC cars, toy drones, hobby models, games, building sets and more. Play. Build. Explore.",
  columns: [
    {
      title: "Quick Links",
      links: [
        { label: "About Us", href: "/" },
        { label: "Track Order", href: "/" },
        { label: "Shipping Policy", href: "/" },
        { label: "Returns & Refunds", href: "/" },
        { label: "FAQ", href: "/" },
      ],
    },
    {
      title: "Customer Support",
      links: [
        { label: "Help Center", href: "/" },
        { label: "Contact Us", href: "/" },
        { label: "Size Guide", href: "/" },
        { label: "Safety Information", href: "/" },
        { label: "Request a Product", href: "/" },
      ],
    },
  ],
  follow: {
    title: "Follow Us",
    description: "Stay connected for new arrivals, tips & offers.",
    socials: [
      { name: "Facebook", href: "https://facebook.com", icon: "facebook", className: "bg-[#1877F2]" },
      {
        name: "Instagram",
        href: "https://instagram.com",
        icon: "instagram",
        className: "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
      },
      { name: "YouTube", href: "https://youtube.com", icon: "youtube", className: "bg-[#FF0000]" },
      { name: "WhatsApp", href: "https://wa.me/919150012245", icon: "whatsapp", className: "bg-[#25D366]" },
    ],
  },
  payments: {
    title: "We Accept",
    methods: ["VISA", "Mastercard", "UPI", "Paytm", "GPay", "PhonePe"],
  },
  legal: "© 2024 WOWLifestyle Thuraiur. All rights reserved.",
  meta: ["Play. Build. Explore.", "#WOWLifestyle"],
} as const;

/* ------------------------------------------------------------------ */
/* Product detail                                                       */
/* ------------------------------------------------------------------ */

/** Promotional codes surfaced on the product page. Edit freely. */
export const productOffers = [
  {
    code: "WOW10",
    description: "Get 10% Instant Discount on Min. Order ₹1499",
  },
] as const;

/** Reassurance strip under the sticky buy bar. */
export const productAssurances = [
  { icon: "shield", label: "100% Genuine Products" },
  { icon: "return", label: "7 Days Easy Returns" },
  { icon: "truck", label: "Fast & Safe Delivery" },
] as const;

/* ------------------------------------------------------------------ */
/* Authentication                                                       */
/* ------------------------------------------------------------------ */

/** Promise list on the dark panel beside the login form. */
export const authAside = {
  headline: ["Fuel Your", "Passion.", "Live the WOW", "Life."],
  points: [
    { icon: "shield", label: "Premium Quality" },
    { icon: "grid", label: "Wide Selection" },
    { icon: "truck", label: "Fast Delivery" },
  ],
  src: img("photo-1758964087156-0eac97044f84", 900),
  alt: "Orange and black remote control drift car on a polished surface",
} as const;

/* ------------------------------------------------------------------ */
/* Cart & checkout                                                      */
/* ------------------------------------------------------------------ */

/** Saved delivery addresses. Replace with the customer's real address book. */
export const savedAddresses = [
  {
    id: "home",
    label: "Home",
    line: "123, Green Street, Anna Nagar, Chennai - 600040, Tamil Nadu",
    phone: "+91 91500 12245",
  },
  {
    id: "work",
    label: "Work",
    line: "Unit 4, Tidel Park, Taramani, Chennai - 600113, Tamil Nadu",
    phone: "+91 91500 12245",
  },
] as const;

/** Coupons the showcase cart will accept. */
export const coupons = [
  { code: "WOW10", percentOff: 10, minOrder: 1499 },
] as const;

/** Flat surcharge added on top of per-product shipping when the shopper picks
 *  Express — product shipping is set per row in the admin panel now. */
export const EXPRESS_SURCHARGE = 50;

export const deliveryMethods = [
  {
    id: "standard",
    label: "Standard Delivery",
    eta: "5–7 business days",
  },
  {
    id: "express",
    label: "Express Delivery",
    eta: "1–2 business days",
  },
] as const;

export const paymentMethods = [
  { id: "upi", label: "UPI", icon: "smartphone" },
  { id: "card", label: "Credit / Debit Card", icon: "creditCard" },
  { id: "netbanking", label: "Net Banking", icon: "bank" },
] as const;

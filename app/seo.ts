/**
 * One source of truth for how the store describes itself.
 *
 * Titles, descriptions, keywords, the social card and the structured data
 * Google reads all come from here, so the brand name and the shop's address
 * cannot drift apart between the layout, the category pages and the product
 * pages the way "WOW Lifestyle Thuriur" did.
 */

export const BRAND = "WOW Lifestyle";

/**
 * The spellings customers actually type. Search engines treat these as
 * distinct queries, and `alternateName` in the structured data is what tells
 * them the variants are the same shop.
 */
export const BRAND_ALIASES = [
  "Wowlifestyle",
  "WOW Life Style",
  "Wowlife Style",
  "WOW Lifestyle Texvalley",
  "Wowlifestyle Texvalley",
  "WOW Lifestyle Erode",
];

export const TELEPHONE = "+919677710045";
/** Shown to Google as the price band; ₹₹ = mid-market. */
export const PRICE_RANGE = "₹₹";

/**
 * The shops, each published as its own local business, hanging off the one
 * Organization below so search engines read them as one company.
 *
 * Thuraiyur was removed on the owner's instruction (2026-08-13) along with
 * every other mention, in favour of positioning the site nationally. Adding a
 * branch back is just another entry here — its LocalBusiness entity, address
 * and "areaServed" city all derive from this list.
 */
export const BRANCHES = [
  {
    id: "texvalley",
    /** Texvalley is the mall the shop trades from. */
    venue: "Texvalley",
    locality: "Erode",
    region: "Tamil Nadu",
    country: "IN",
  },
] as const;

/** What the shop sells, in the words shoppers search for. */
export const CATEGORIES_SOLD = [
  "Hobby-grade RC cars",
  "RC jeeps and monster trucks",
  "RC bikes",
  "Toy drones and helicopters",
  "Diecast and scale models",
  "Building sets and blocks",
  "Action figures and playsets",
  "Soft toys",
  "Toys for kids and adults",
];

/**
 * The shop's own positioning line, used straight after the brand name.
 *
 * It reads nationally rather than naming a town: the store ships all over
 * India, and a title that led with one branch framed it as a local shop.
 */
export const TAGLINE = "India's Online Store for RC Cars, Toys & Gadgets";

export const TITLE_DEFAULT = `${BRAND} — ${TAGLINE}`;
export const TITLE_TEMPLATE = `%s | ${BRAND}`;

export const DESCRIPTION =
  "WOW Lifestyle — India's online store for hobby-grade RC cars, toys, drones, " +
  "bikes, jeeps, diecast models and gadgets for kids and adults. Shop online " +
  "with fast delivery across India, or visit us at Texvalley, Erode.";

export const DESCRIPTION_SHORT =
  "India's online store for RC cars, toys, drones and gadgets. " +
  "WOW Lifestyle — delivered across India.";

/**
 * Google ignores the keywords meta tag, so this earns its place only through
 * the other engines that still read it — the ranking work is done by the
 * titles, headings, descriptions and structured data above and below.
 */
export const KEYWORDS = [
  // Brand, every way it gets typed
  "wowlifestyle",
  "wow lifestyle",
  "wowlife style",
  "wow life style",
  "wowlifestyle online",
  "WOW Lifestyle toys",
  // Brand + place
  "wowlifestyle texvalley",
  "wow lifestyle texvalley",
  "wowlifestyle erode",
  "wow lifestyle erode",
  "texvalley erode toys",
  "texvalley toy shop",
  "texvalley mall shopping",
  // Place + intent
  "toy shop in Erode",
  "toy store Erode",
  "toys Erode Tamil Nadu",
  "toy shop near me Erode",
  "best toy shop Tamil Nadu",
  "online toy store India",
  "toy shop Coimbatore Salem Tiruppur",
  // Product intent
  "hobby grade RC cars India",
  "remote control cars Erode",
  "RC cars online India",
  "toy drones India",
  "drone shop Erode",
  "RC bikes India",
  "RC jeep monster truck",
  "diecast model cars India",
  "kids toys online India",
  "adult collectible toys India",
  "birthday gift toys Erode",
];

/** The company both branches belong to. */
export function organizationJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#org`,
    name: BRAND,
    alternateName: BRAND_ALIASES,
    url: siteUrl,
    logo: `${siteUrl}/icon-512.png`,
    image: `${siteUrl}/og-image.jpg`,
    description: DESCRIPTION,
    telephone: TELEPHONE,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: TELEPHONE,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["Tamil", "English"],
    },
    // India first: the store sells nationwide and only happens to have a
    // physical counter in Erode.
    areaServed: [
      { "@type": "Country", name: "India" },
      { "@type": "State", name: "Tamil Nadu" },
      { "@type": "City", name: "Erode" },
    ],
    subOrganization: BRANCHES.map((b) => ({ "@id": `${siteUrl}/#store-${b.id}` })),
  };
}

/**
 * One `ToyStore` per branch. `ToyStore` is a Schema.org subtype of
 * LocalBusiness, which is what makes an address, phone and opening hours
 * eligible to appear in a local result rather than just a plain blue link.
 */
export function storesJsonLd(siteUrl: string) {
  return BRANCHES.map((branch) => ({
    "@context": "https://schema.org",
    "@type": "ToyStore",
    "@id": `${siteUrl}/#store-${branch.id}`,
    name: branch.venue ? `${BRAND} — ${branch.venue}, ${branch.locality}` : `${BRAND} — ${branch.locality}`,
    alternateName: BRAND_ALIASES,
    url: siteUrl,
    logo: `${siteUrl}/icon-512.png`,
    image: `${siteUrl}/og-image.jpg`,
    description: DESCRIPTION,
    priceRange: PRICE_RANGE,
    currenciesAccepted: "INR",
    telephone: TELEPHONE,
    parentOrganization: { "@id": `${siteUrl}/#org` },
    address: {
      "@type": "PostalAddress",
      // Omitted rather than invented for a branch whose street is unknown.
      ...(branch.venue ? { streetAddress: branch.venue } : {}),
      addressLocality: branch.locality,
      addressRegion: branch.region,
      addressCountry: branch.country,
    },
    areaServed: [
      { "@type": "City", name: branch.locality },
      { "@type": "State", name: "Tamil Nadu" },
      { "@type": "Country", name: "India" },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${BRAND} toys and hobby range`,
      itemListElement: CATEGORIES_SOLD.map((name) => ({
        "@type": "OfferCatalog",
        name,
      })),
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "20:00",
      },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "10:00", closes: "18:00" },
    ],
  }));
}

/**
 * Declares the site and its search endpoint. This is what lets Google render
 * a search box under the result for a brand query.
 */
export function websiteJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: BRAND,
    alternateName: BRAND_ALIASES,
    url: siteUrl,
    publisher: { "@id": `${siteUrl}/#org` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/category/all?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

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

export const BUSINESS = {
  /** Texvalley is the mall the shop trades from. */
  venue: "Texvalley",
  locality: "Erode",
  region: "Tamil Nadu",
  country: "IN",
  telephone: "+919677710045",
  /** Shown to Google as the price band; ₹₹ = mid-market. */
  priceRange: "₹₹",
} as const;

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

export const TITLE_DEFAULT = `${BRAND} — Toys, RC Cars & Drones | Texvalley, Erode`;
export const TITLE_TEMPLATE = `%s | ${BRAND}`;

export const DESCRIPTION =
  "Hobby-grade RC cars, drones, bikes, jeeps and toys for kids and adults at " +
  "WOW Lifestyle, Texvalley, Erode. Shop online with fast delivery across " +
  "Tamil Nadu and all over India.";

export const DESCRIPTION_SHORT =
  "Toys, hobby-grade RC cars, drones and bikes for kids and adults. " +
  "WOW Lifestyle — Texvalley, Erode, Tamil Nadu. Delivered across India.";

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
  // The site previously listed Thuraiyur as the shop's town. Kept as search
  // terms so that history isn't thrown away while Texvalley leads.
  "wowlifestyle Thuraiyur",
  "toy shop Thuraiyur",
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

/**
 * The shop itself. `ToyStore` is a Schema.org subtype of LocalBusiness, which
 * is what makes the address, phone and opening hours eligible to appear in a
 * local search result rather than just a plain blue link.
 */
export function storeJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ToyStore",
    "@id": `${siteUrl}/#store`,
    name: BRAND,
    alternateName: BRAND_ALIASES,
    url: siteUrl,
    logo: `${siteUrl}/icon-512.png`,
    image: `${siteUrl}/og-image.jpg`,
    description: DESCRIPTION,
    priceRange: BUSINESS.priceRange,
    currenciesAccepted: "INR",
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.venue,
      addressLocality: BUSINESS.locality,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.country,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: BUSINESS.telephone,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["Tamil", "English"],
    },
    areaServed: [
      { "@type": "City", name: "Erode" },
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
  };
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
    publisher: { "@id": `${siteUrl}/#store` },
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

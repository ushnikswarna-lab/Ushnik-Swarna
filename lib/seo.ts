import type { Metadata } from "next";

export const SITE_NAME = "P2tEcostay Resort";
export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://p2tecostay.com";

const DEFAULT_DESCRIPTION =
  "P2tEcostay Resort is a premium eco-friendly resort offering luxurious stays, curated experiences, and seamless online bookings. Escape to nature.";

/** Build full Schema.org LodgingBusiness/Hotel structured data for rich results and local SEO. */
export function getLodgingBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Resort",
    "@id": `${BASE_URL}/#lodging`,
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/logo.png`,
    },
    image: [
      `${BASE_URL}/logo.png`,
      `${BASE_URL}/assets/img/swimming-pool.jpg`,
    ].filter(Boolean),
    telephone: process.env.NEXT_PUBLIC_CONTACT_PHONE || undefined,
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@p2tecostay.com",
    priceRange: "₹₹ - ₹₹₹",
    address: {
      "@type": "PostalAddress",
      addressCountry: "IN",
      addressRegion: process.env.NEXT_PUBLIC_RESORT_STATE || "",
      addressLocality: process.env.NEXT_PUBLIC_RESORT_CITY || "",
      streetAddress: process.env.NEXT_PUBLIC_RESORT_ADDRESS || "",
    },
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Swimming Pool", value: true },
      { "@type": "LocationFeatureSpecification", name: "Spa", value: true },
      { "@type": "LocationFeatureSpecification", name: "Restaurant", value: true },
      { "@type": "LocationFeatureSpecification", name: "WiFi", value: true },
      { "@type": "LocationFeatureSpecification", name: "Parking", value: true },
      { "@type": "LocationFeatureSpecification", name: "Eco-friendly", value: true },
    ],
    sameAs: [
      "https://www.instagram.com/p2tecostay/",
    ].filter(Boolean),
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "00:00",
      closes: "23:59",
    },
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/bookings`,
        actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"],
      },
      result: { "@type": "Reservation" },
    },
  };
  return schema;
}

export interface PageSeoOptions {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}

/** Generate metadata for a page (title, description, OG, Twitter, canonical). */
export function createSeoMetadata(options: PageSeoOptions): Metadata {
  const { title, description = DEFAULT_DESCRIPTION, path = "", image, noIndex } = options;
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const imageUrl = image?.startsWith("http") ? image : `${BASE_URL}${image || "/logo.png"}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      title: fullTitle,
      description,
      siteName: SITE_NAME,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
    ...(noIndex && {
      robots: { index: false, follow: true },
    }),
  };
}

/** Page-specific meta descriptions for better SEO. Key: path (e.g. "/about"). */
export const PAGE_DESCRIPTIONS: Record<string, string> = {
  "/": "P2tEcostay Resort – escape to nature. Eco-friendly accommodation, amenities, and packages. Book your stay online.",
  "/about": "Learn about P2tEcostay Resort: our story, values, team, and commitment to sustainable eco-tourism.",
  "/accommodations": "Explore rooms, cottages, and villas at P2tEcostay. View amenities, photos, and rates for your perfect stay.",
  "/amenities": "Resort facilities: pool, spa, dining, fitness, and more. Discover what awaits you at P2tEcostay.",
  "/packages": "Special offers and packages: honeymoon, family, weekend getaways. Curated experiences at P2tEcostay.",
  "/gallery": "Photo gallery of P2tEcostay Resort – accommodations, amenities, events, and surrounding nature.",
  "/contact": "Contact P2tEcostay Resort. Get in touch for reservations, inquiries, and group bookings.",
  "/bookings": "Book your stay at P2tEcostay Resort. Check availability and reserve online.",
  "/events": "Upcoming events and activities at P2tEcostay. Seasonal celebrations and experiences.",
  "/visit": "How to get to P2tEcostay, best time to visit, nearby attractions, and travel tips.",
  "/help": "Help and support: FAQs, booking information, and how to get in touch with P2tEcostay.",
  "/faq": "Frequently asked questions about bookings, stay, amenities, and policies at P2tEcostay Resort.",
  "/news": "Resort updates, local events, and travel tips from P2tEcostay.",
  "/privacy-policy": "Privacy policy and data handling at P2tEcostay Resort.",
  "/terms": "Terms and conditions for using P2tEcostay Resort website and services.",
  "/code-of-conduct": "Code of conduct for guests and visitors at P2tEcostay Resort.",
  "/site-map": "Site map – full list of pages on the P2tEcostay Resort website.",
  "/track-booking": "Track your P2tEcostay booking by reference number.",
};

export function getPageDescription(path: string): string {
  const normalized = path.replace(/\/$/, "") || "/";
  return PAGE_DESCRIPTIONS[normalized] ?? DEFAULT_DESCRIPTION;
}

export { DEFAULT_DESCRIPTION };

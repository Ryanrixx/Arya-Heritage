/**
 * Central brand configuration.
 *
 * This is intentionally the ONLY place brand name, contact details, and
 * commerce constants (shipping thresholds, currency) are defined. Every
 * component/page should import from here rather than hardcoding strings, so
 * rebranding or adjusting business rules is a one-file change.
 *
 * NOTE ON THE NAME: "Arya Heritage" is a placeholder identity chosen to
 * fit the brand brief (premium, Jupiter/Saturn-coded, not already a
 * dominant Ayurveda/D2C wellness brand at the time this was written). It has
 * NOT been through a formal trademark or domain-availability search — do
 * that before launch. Changing it only requires editing this file; nothing
 * else in the codebase hardcodes the name.
 */

export const brand = {
  name: "Arya Heritage",
  legalName: "Arya Heritage Wellness Pvt. Ltd.",
  tagline: "Ancient Rituals, Modern Luxury",
  description:
    "Premium Ayurvedic soaps, attars, shilajit and herbal wellness — traditional ingredients, sourced honestly and formulated for modern daily rituals.",

  // Used for canonical URLs, the webhook's notes field, etc.
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",

  contact: {
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "care@saffronandstone.example",
    // E.164 without the leading "+", e.g. "919812345678" — required format for wa.me links.
    whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  },

  social: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    x: "https://x.com",
  },

  currency: "INR" as const,
  locale: "en-IN" as const,

  // Simple flat-rate shipping. Swap for a real rate table/carrier API later —
  // centralizing it here means checkout, cart, and the homepage banner all
  // stay in sync automatically.
  freeShippingThreshold: 999,
  standardShippingFee: 79,

  // Top-level shop categories, also used for nav + homepage tiles.
  categories: [
    { name: "Soaps", slug: "soaps", blurb: "Cold-pressed, botanical bars" },
    { name: "Attars", slug: "attars", blurb: "Alcohol-free perfume oils" },
    { name: "Shilajit", slug: "shilajit", blurb: "Himalayan resin, lab-tested" },
    { name: "Herbal Wellness", slug: "herbal-wellness", blurb: "Daily Ayurvedic rituals" },
  ],

  trustBadges: [
    "100% Natural Ingredients",
    "Cruelty-Free",
    "Secure Razorpay Checkout",
    "Pan-India Shipping",
  ],
} as const;

export type BrandCategorySlug = (typeof brand.categories)[number]["slug"];

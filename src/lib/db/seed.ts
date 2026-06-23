/**
 * Seed script for Arya Heritage wellness e-commerce platform.
 *
 * Run:  npx tsx src/lib/db/seed.ts
 *
 * Idempotent — uses upsert (onConflictDoUpdate / onConflictDoNothing) so it
 * can be run multiple times safely. Existing rows are updated, not duplicated.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema/index";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertCategory(name: string, slug: string) {
  const [row] = await db.insert(schema.categories)
    .values({ name, slug })
    .onConflictDoUpdate({ target: schema.categories.slug, set: { name } })
    .returning();
  return row!;
}

async function upsertBrand(name: string, slug: string) {
  const [row] = await db.insert(schema.brands)
    .values({ name, slug })
    .onConflictDoUpdate({ target: schema.brands.slug, set: { name } })
    .returning();
  return row!;
}

async function upsertColor(name: string, slug: string, hex: string) {
  const [row] = await db.insert(schema.colors)
    .values({ name, slug, hexCode: hex })
    .onConflictDoUpdate({ target: schema.colors.slug, set: { name, hexCode: hex } })
    .returning();
  return row!;
}

async function upsertSize(name: string, slug: string, sortOrder: number) {
  const [row] = await db.insert(schema.sizes)
    .values({ name, slug, sortOrder })
    .onConflictDoUpdate({ target: schema.sizes.slug, set: { name, sortOrder } })
    .returning();
  return row!;
}

// ─── Main seed ────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seeding Arya Heritage database…\n");

  // ── 1. Brand ──────────────────────────────────────────────────────────────
  const brand = await upsertBrand("Arya Heritage");
  console.log(`✓ Brand: ${brand.name}`);

  // ── 2. Categories ─────────────────────────────────────────────────────────
  const catSoaps  = await upsertCategory("Soaps",           "soaps");
  const catAttars = await upsertCategory("Attars",          "attars");
  const catShila  = await upsertCategory("Shilajit",        "shilajit");
  const catHerbal = await upsertCategory("Herbal Wellness", "herbal-wellness");
  console.log("✓ Categories: Soaps, Attars, Shilajit, Herbal Wellness");

  // ── 3. Colours (repurposed as scent / variant labels for wellness products)
  const colRose       = await upsertColor("Rose",         "rose",         "#E8C4C4");
  const colNeem       = await upsertColor("Neem",         "neem",         "#90C67C");
  const colSandalwood = await upsertColor("Sandalwood",   "sandalwood",   "#C8A882");
  const colTurmeric   = await upsertColor("Turmeric",     "turmeric",     "#E8B84B");
  const colCharcoal   = await upsertColor("Charcoal",     "charcoal",     "#4A4A4A");
  const colOud        = await upsertColor("Oud",          "oud",          "#5C3D2E");
  const colJasmine    = await upsertColor("Jasmine",      "jasmine",      "#FFF3C4");
  const colMusk       = await upsertColor("White Musk",   "white-musk",   "#F5F0E8");
  const colKesar      = await upsertColor("Kesar",        "kesar",        "#E8A800");
  const colNatural    = await upsertColor("Natural",      "natural",      "#C8B89A");
  console.log("✓ Colours / variants seeded");

  // ── 4. Sizes (weight / volume SKU variants) ───────────────────────────────
  const sz50g   = await upsertSize("50g",    "50g",    10);
  const sz100g  = await upsertSize("100g",   "100g",   20);
  const sz150g  = await upsertSize("150g",   "150g",   25);
  const sz250g  = await upsertSize("250g",   "250g",   30);
  const sz500g  = await upsertSize("500g",   "500g",   40);
  const sz10ml  = await upsertSize("10ml",   "10ml",   50);
  const sz30ml  = await upsertSize("30ml",   "30ml",   55);
  const sz6ml   = await upsertSize("6ml",    "6ml",    45);
  const sz20g   = await upsertSize("20g",    "20g",    5);
  console.log("✓ Sizes seeded");

  // ── 5. Products ───────────────────────────────────────────────────────────

  type ProductSeed = {
    name: string;
    description: string;
    categoryId: string;
    variants: Array<{
      sku: string;
      price: number;
      salePrice?: number;
      colorId: string;
      sizeId: string;
      stock: number;
      imageUrl: string;
      isPrimary?: boolean;
    }>;
  };

  const UNSPLASH = (id: string, w = 600, h = 600) =>
    `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80`;

  const products: ProductSeed[] = [
    // ── SOAPS ────────────────────────────────────────────────────────────────
    {
      name: "Rose & Geranium Cold-Press Soap",
      description:
        "A luxurious cold-pressed bar soap with Bulgarian rose absolute and geranium essential oil. Enriched with kokum butter and glycerin to leave skin silky-smooth. Suitable for all skin types. Each bar weighs 100g.",
      categoryId: catSoaps.id,
      variants: [
        { sku: "SOAP-ROSE-100", price: 299, colorId: colRose.id, sizeId: sz100g.id, stock: 80, imageUrl: UNSPLASH("1541643600914-78b084683702"), isPrimary: true },
        { sku: "SOAP-ROSE-50",  price: 179, colorId: colRose.id, sizeId: sz50g.id,  stock: 120, imageUrl: UNSPLASH("1541643600914-78b084683702") },
      ],
    },
    {
      name: "Neem & Tulsi Antibacterial Soap",
      description:
        "Cold-process Ayurvedic soap with neem leaf extract and holy basil (tulsi). Neem's natural antimicrobial properties make this ideal for oily, acne-prone or combination skin. No artificial fragrances.",
      categoryId: catSoaps.id,
      variants: [
        { sku: "SOAP-NEEM-100",  price: 249, colorId: colNeem.id, sizeId: sz100g.id, stock: 95,  imageUrl: UNSPLASH("1556228453-efd6c1ff04f6"), isPrimary: true },
        { sku: "SOAP-NEEM-150",  price: 349, colorId: colNeem.id, sizeId: sz150g.id, stock: 60,  imageUrl: UNSPLASH("1556228453-efd6c1ff04f6") },
      ],
    },
    {
      name: "Activated Charcoal Detox Bar",
      description:
        "Deep-cleansing bar powered by activated charcoal and bentonite clay. Draws out impurities, unclogs pores and balances sebum production. Scented lightly with eucalyptus and tea tree essential oils.",
      categoryId: catSoaps.id,
      variants: [
        { sku: "SOAP-CHAR-100", price: 329, salePrice: 279, colorId: colCharcoal.id, sizeId: sz100g.id, stock: 70, imageUrl: UNSPLASH("1607006344380-b6775a866a5e"), isPrimary: true },
        { sku: "SOAP-CHAR-50",  price: 199, salePrice: 169, colorId: colCharcoal.id, sizeId: sz50g.id,  stock: 110, imageUrl: UNSPLASH("1607006344380-b6775a866a5e") },
      ],
    },
    {
      name: "Haldi & Saffron Brightening Soap",
      description:
        "Turmeric and saffron have been used in Indian beauty rituals for millennia. This cold-process bar harnesses both to even skin tone, reduce dark spots and impart a warm glow. Fragrance-free.",
      categoryId: catSoaps.id,
      variants: [
        { sku: "SOAP-TURM-100", price: 349, colorId: colTurmeric.id, sizeId: sz100g.id, stock: 85, imageUrl: UNSPLASH("1612817288484-6f916006741a"), isPrimary: true },
        { sku: "SOAP-KESAR-100", price: 499, colorId: colKesar.id, sizeId: sz100g.id, stock: 40, imageUrl: UNSPLASH("1612817288484-6f916006741a") },
      ],
    },
    {
      name: "Chandan (Sandalwood) Moisture Bar",
      description:
        "The most requested soap in our collection. Pure Mysore sandalwood powder and sandalwood essential oil blended with shea butter and rice bran oil for a bar that cleanses deeply while locking in moisture.",
      categoryId: catSoaps.id,
      variants: [
        { sku: "SOAP-SAND-100", price: 399, colorId: colSandalwood.id, sizeId: sz100g.id, stock: 65, imageUrl: UNSPLASH("1553361371-9b0f-4e73-8bd1-27db26d50e8a"), isPrimary: true },
        { sku: "SOAP-SAND-150", price: 549, colorId: colSandalwood.id, sizeId: sz150g.id, stock: 35, imageUrl: UNSPLASH("1553361371-9b0f-4e73-8bd1-27db26d50e8a") },
      ],
    },

    // ── ATTARS ───────────────────────────────────────────────────────────────
    {
      name: "Oud Al Qadeem Pure Attar",
      description:
        "Steam-distilled pure agarwood (oud) oil from Assam, aged three years for maximum depth and complexity. A dark, woody, animalic fragrance that evolves beautifully on the skin over 8–10 hours. Alcohol-free.",
      categoryId: catAttars.id,
      variants: [
        { sku: "ATT-OUD-6",  price: 1499, colorId: colOud.id, sizeId: sz6ml.id,  stock: 25, imageUrl: UNSPLASH("1547531531-5b8a2e2db41a"), isPrimary: true },
        { sku: "ATT-OUD-10", price: 2199, colorId: colOud.id, sizeId: sz10ml.id, stock: 18, imageUrl: UNSPLASH("1547531531-5b8a2e2db41a") },
      ],
    },
    {
      name: "Gulab (Rose) Attar",
      description:
        "Hydro-distilled rosa damascena from Kannauj — India's attar capital. A floral, rosy, slightly green fragrance that has graced the courts of Mughal emperors. Light, fresh, ideal for daily wear.",
      categoryId: catAttars.id,
      variants: [
        { sku: "ATT-ROSE-6",   price: 899, salePrice: 749, colorId: colRose.id, sizeId: sz6ml.id,  stock: 45, imageUrl: UNSPLASH("1574169208507-84a5b0bfc6c6"), isPrimary: true },
        { sku: "ATT-ROSE-10",  price: 1299, salePrice: 1099, colorId: colRose.id, sizeId: sz10ml.id, stock: 30, imageUrl: UNSPLASH("1574169208507-84a5b0bfc6c6") },
        { sku: "ATT-ROSE-30",  price: 2999, colorId: colRose.id, sizeId: sz30ml.id, stock: 12, imageUrl: UNSPLASH("1574169208507-84a5b0bfc6c6") },
      ],
    },
    {
      name: "Mogra Jasmine Attar",
      description:
        "Night-blooming jasmine sambac (mogra) from Tamil Nadu, traditionally worn by Tamil women in their hair. Heady, sweet, deeply floral — one of the most beloved fragrances in South Asia. Lasts 6–8 hours on skin.",
      categoryId: catAttars.id,
      variants: [
        { sku: "ATT-MOG-6",  price: 799, colorId: colJasmine.id, sizeId: sz6ml.id,  stock: 55, imageUrl: UNSPLASH("1591854002-c4dbbaa55df4"), isPrimary: true },
        { sku: "ATT-MOG-10", price: 1149, colorId: colJasmine.id, sizeId: sz10ml.id, stock: 40, imageUrl: UNSPLASH("1591854002-c4dbbaa55df4") },
      ],
    },
    {
      name: "White Musk & Sandalwood Attar",
      description:
        "A modern attar blending soft white musk base with Mysore sandalwood. Clean, warm, and unisex — perfect as a daily-wear fragrance or a base for layering other attars. Long-lasting 8-hour throw.",
      categoryId: catAttars.id,
      variants: [
        { sku: "ATT-MUSK-6",  price: 699, colorId: colMusk.id, sizeId: sz6ml.id,  stock: 60, imageUrl: UNSPLASH("1547531531-5b8a2e2db41a"), isPrimary: true },
        { sku: "ATT-MUSK-10", price: 999, colorId: colMusk.id, sizeId: sz10ml.id, stock: 42, imageUrl: UNSPLASH("1547531531-5b8a2e2db41a") },
      ],
    },

    // ── SHILAJIT ─────────────────────────────────────────────────────────────
    {
      name: "Himalayan Shilajit Resin — Gold Grade",
      description:
        "Sourced above 16,000 feet from the Himalayan mountain ranges of Himachal Pradesh. Each batch is lab-tested for fulvic acid content (≥60%), heavy metals and microbial safety. No fillers, no additives. Dissolve a pea-sized amount in warm water or milk daily.",
      categoryId: catShila.id,
      variants: [
        { sku: "SHI-GOLD-20",  price: 1299, colorId: colNatural.id, sizeId: sz20g.id,  stock: 50, imageUrl: UNSPLASH("1583912267550-d6e776bbb0b3"), isPrimary: true },
        { sku: "SHI-GOLD-50",  price: 2799, salePrice: 2499, colorId: colNatural.id, sizeId: sz50g.id, stock: 35, imageUrl: UNSPLASH("1583912267550-d6e776bbb0b3") },
        { sku: "SHI-GOLD-100", price: 4999, salePrice: 4499, colorId: colNatural.id, sizeId: sz100g.id, stock: 20, imageUrl: UNSPLASH("1583912267550-d6e776bbb0b3") },
      ],
    },
    {
      name: "Shilajit + Ashwagandha Wellness Blend",
      description:
        "Our signature adaptogen blend — Himalayan shilajit resin combined with KSM-66® ashwagandha root extract at a 3:1 ratio. Formulated to support stress adaptation, energy levels, and cognitive clarity. 30-day supply per jar.",
      categoryId: catShila.id,
      variants: [
        { sku: "SHI-ASH-30",  price: 1799, salePrice: 1499, colorId: colNatural.id, sizeId: sz100g.id, stock: 40, imageUrl: UNSPLASH("1607619056574-7b8a7c2e8d1a"), isPrimary: true },
      ],
    },

    // ── HERBAL WELLNESS ───────────────────────────────────────────────────────
    {
      name: "Triphala Churna — Classic Ayurvedic Formula",
      description:
        "The foundational tridoshic formula of Ayurveda: equal parts amalaki, bibhitaki, and haritaki. Traditionally used to support digestive health, bowel regularity, and gentle detoxification. GMP-manufactured, no synthetic binders.",
      categoryId: catHerbal.id,
      variants: [
        { sku: "HRB-TRIP-100", price: 349, colorId: colNatural.id, sizeId: sz100g.id, stock: 90, imageUrl: UNSPLASH("1515378791036-0648a3ef77b2"), isPrimary: true },
        { sku: "HRB-TRIP-250", price: 749, salePrice: 649, colorId: colNatural.id, sizeId: sz250g.id, stock: 55, imageUrl: UNSPLASH("1515378791036-0648a3ef77b2") },
        { sku: "HRB-TRIP-500", price: 1299, salePrice: 1099, colorId: colNatural.id, sizeId: sz500g.id, stock: 30, imageUrl: UNSPLASH("1515378791036-0648a3ef77b2") },
      ],
    },
    {
      name: "Brahmi & Shankhpushpi Memory Tonic",
      description:
        "A synergistic Ayurvedic blend of brahmi (bacopa monnieri) and shankhpushpi (convolvulus pluricaulis). Long used in the Vedic tradition as medhya rasayanas — herbs that nourish and revitalize the mind. Can be taken with warm milk at bedtime.",
      categoryId: catHerbal.id,
      variants: [
        { sku: "HRB-BRAH-100", price: 449, colorId: colNatural.id, sizeId: sz100g.id, stock: 70, imageUrl: UNSPLASH("1506905925346-21bda4d32df4"), isPrimary: true },
        { sku: "HRB-BRAH-250", price: 949, colorId: colNatural.id, sizeId: sz250g.id, stock: 45, imageUrl: UNSPLASH("1506905925346-21bda4d32df4") },
      ],
    },
    {
      name: "Chyawanprash Premium — Immunity Rasayan",
      description:
        "A modernised formulation of the ancient chyawanprash recipe with 36 herbs including amalaki, ashwagandha, bala, and dashamula. Rich in Vitamin C, antioxidants and immunomodulatory phytochemicals. No artificial colours or preservatives.",
      categoryId: catHerbal.id,
      variants: [
        { sku: "HRB-CHYAW-250", price: 599, salePrice: 499, colorId: colNatural.id, sizeId: sz250g.id, stock: 60, imageUrl: UNSPLASH("1596040033229-a9821ebd058d"), isPrimary: true },
        { sku: "HRB-CHYAW-500", price: 1099, salePrice: 899, colorId: colNatural.id, sizeId: sz500g.id, stock: 40, imageUrl: UNSPLASH("1596040033229-a9821ebd058d") },
      ],
    },
  ];

  let productCount = 0;
  let variantCount = 0;
  let imageCount = 0;

  for (const p of products) {
    // Upsert product
    const existing = await db.select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.name, p.name))
      .limit(1);

    let productId: string;

    if (existing.length) {
      productId = existing[0].id;
      await db.update(schema.products)
        .set({ description: p.description, categoryId: p.categoryId, brandId: brand.id, isPublished: true, updatedAt: new Date() })
        .where(eq(schema.products.id, productId));
    } else {
      const [inserted] = await db.insert(schema.products)
        .values({ name: p.name, description: p.description, categoryId: p.categoryId, brandId: brand.id, isPublished: true })
        .returning();
      productId = inserted!.id;
    }

    // Upsert variants
    let defaultVariantId: string | null = null;
    for (const v of p.variants) {
      const [variant] = await db.insert(schema.productVariants)
        .values({
          productId,
          sku: v.sku,
          price: String(v.price),
          salePrice: v.salePrice ? String(v.salePrice) : null,
          colorId: v.colorId,
          sizeId: v.sizeId,
          inStock: v.stock,
        })
        .onConflictDoUpdate({
          target: schema.productVariants.sku,
          set: {
            price: String(v.price),
            salePrice: v.salePrice ? String(v.salePrice) : null,
            inStock: v.stock,
          },
        })
        .returning();

      if (v.isPrimary) defaultVariantId = variant!.id;

      // Upsert primary image for the variant
      const existingImg = await db.select({ id: schema.productImages.id })
        .from(schema.productImages)
        .where(eq(schema.productImages.url, v.imageUrl))
        .limit(1);

      if (!existingImg.length) {
        await db.insert(schema.productImages).values({
          productId,
          variantId: null,
          url: v.imageUrl,
          sortOrder: 0,
          isPrimary: !!v.isPrimary,
        });
        imageCount++;
      }

      variantCount++;
    }

    // Set default variant
    if (defaultVariantId) {
      await db.update(schema.products)
        .set({ defaultVariantId })
        .where(eq(schema.products.id, productId));
    }

    productCount++;
    console.log(`  ✓ ${p.name} (${p.variants.length} variant${p.variants.length > 1 ? "s" : ""})`);
  }

  console.log(`\n✅ Seed complete!`);
  console.log(`   Products: ${productCount}`);
  console.log(`   Variants: ${variantCount}`);
  console.log(`   Images:   ${imageCount}`);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

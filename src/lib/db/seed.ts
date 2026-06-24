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
  const brand = await upsertBrand("Arya Heritage", "arya-heritage");
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
      name: "Rice Milk Glow Soap",
      description:
          "Handcrafted Ayurvedic bathing bar enriched with rice milk and nourishing botanicals. Gently cleanses while helping skin feel soft, radiant and refreshed. Suitable for daily use.",
      categoryId: catSoaps.id,
      variants: [
        {
          sku: "SOAP-RICEGLOW-100",
          price: 299,
          colorId: colNatural.id,
          sizeId: sz100g.id,
          stock: 100,
          imageUrl: UNSPLASH("1541643600914-78b084683702"),
          isPrimary: true,
        },
      ],
    },
    {
      name: "Mugwort Calm Soap",
      description:
          "A soothing herbal soap crafted with mugwort and skin-loving oils. Designed to provide a gentle cleansing experience while supporting a calm and balanced skincare ritual.",
      categoryId: catSoaps.id,
      variants: [
        {
          sku: "SOAP-MUGWORT-100",
          price: 299,
          colorId: colNeem.id,
          sizeId: sz100g.id,
          stock: 100,
          imageUrl: UNSPLASH("1556228453-efd6c1ff04f6"),
          isPrimary: true,
        },
      ],
    },
    {
      name: "Citrus Glow Soap",
      description:
          "A refreshing Ayurvedic soap infused with bright citrus notes and nourishing ingredients. Leaves skin feeling clean, energized and naturally refreshed.",
      categoryId: catSoaps.id,
      variants: [
        {
          sku: "SOAP-CITRUS-100",
          price: 299,
          colorId: colTurmeric.id,
          sizeId: sz100g.id,
          stock: 100,
          imageUrl: UNSPLASH("1607006344380-b6775a866a5e"),
          isPrimary: true,
        },
      ],
    },
    {
      name: "Golden Ubtan Soap",
      description:
          "Inspired by traditional ubtan rituals, this handcrafted soap combines classic Ayurvedic ingredients to help leave skin feeling smooth, refreshed and naturally glowing.",
      categoryId: catSoaps.id,
      variants: [
        {
          sku: "SOAP-UBTAN-100",
          price: 349,
          colorId: colKesar.id,
          sizeId: sz100g.id,
          stock: 100,
          imageUrl: UNSPLASH("1612817288484-6f916006741a"),
          isPrimary: true,
        },
      ],
    },

// ── ATTARS ───────────────────────────────────────────────────────────────
    {
      name: "Premium Attars Collection",
      description:
          "Coming Soon. Stay tuned for our upcoming collection of traditional attars crafted with timeless fragrance traditions.",
      categoryId: catAttars.id,
      variants: [
        {
          sku: "ATTAR-COMINGSOON",
          price: 0,
          colorId: colOud.id,
          sizeId: sz6ml.id,
          stock: 0,
          imageUrl: UNSPLASH("1547531531-5b8a2e2db41a"),
          isPrimary: true,
        },
      ],
    },

// ── SHILAJIT ─────────────────────────────────────────────────────────────
    {
      name: "Himalayan Shilajit Collection",
      description:
          "Coming Soon. Stay tuned for our premium Himalayan Shilajit range.",
      categoryId: catShila.id,
      variants: [
        {
          sku: "SHILAJIT-COMINGSOON",
          price: 0,
          colorId: colNatural.id,
          sizeId: sz20g.id,
          stock: 0,
          imageUrl: UNSPLASH("1583912267550-d6e776bbb0b3"),
          isPrimary: true,
        },
      ],
    },

// ── HERBAL WELLNESS ──────────────────────────────────────────────────────
    {
      name: "Herbal Wellness Collection",
      description:
          "Coming Soon. Stay tuned for our Ayurvedic wellness products and herbal formulations.",
      categoryId: catHerbal.id,
      variants: [
        {
          sku: "HERBAL-COMINGSOON",
          price: 0,
          colorId: colNatural.id,
          sizeId: sz100g.id,
          stock: 0,
          imageUrl: UNSPLASH("1515378791036-0648a3ef77b2"),
          isPrimary: true,
        },
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

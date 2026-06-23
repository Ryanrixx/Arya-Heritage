import Link from "next/link";
import { Suspense } from "react";
import Card from "@/components/Card";
import CollapsibleSection from "@/components/CollapsibleSection";
import ProductGallery from "@/components/ProductGallery";
import SizePicker from "@/components/SizePicker";
import ColorSwatches from "@/components/ColorSwatches";
import AddToCartButton from "@/components/AddToCartButton";
import { Star } from "lucide-react";
import {
  getProduct,
  getProductReviews,
  getRecommendedProducts,
  type Review,
  type RecommendedProduct,
} from "@/lib/actions/product";
import { formatINR } from "@/lib/payments/money";

type GalleryVariant = { color: string; images: string[] };

async function ReviewsSection({ productId }: { productId: string }) {
  const reviews: Review[] = await getProductReviews(productId);
  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  return (
    <CollapsibleSection
      title={`Reviews (${count})`}
      rightMeta={
        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={14} style={{ fill: i <= Math.round(avg) ? "var(--gold)" : "none", color: "var(--gold)" }} />
          ))}
        </span>
      }
    >
      {reviews.length === 0 ? (
        <p style={{ color: "var(--text-lighter)", fontSize: "0.9rem" }}>No reviews yet. Be the first!</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {reviews.slice(0, 10).map((r) => (
            <li key={r.id} style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--sand)", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--navy)", margin: 0 }}>{r.author}</p>
                <span style={{ display: "flex", gap: "2px" }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={12} style={{ fill: i <= r.rating ? "var(--gold)" : "none", color: "var(--gold)" }} />
                  ))}
                </span>
              </div>
              {r.content && <p style={{ fontSize: "0.875rem", color: "var(--text-light)", margin: 0, lineHeight: 1.6 }}>{r.content}</p>}
              <p style={{ fontSize: "0.75rem", color: "var(--text-lighter)", marginTop: "0.5rem", marginBottom: 0 }}>
                {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </CollapsibleSection>
  );
}

async function AlsoLikeSection({ productId }: { productId: string }) {
  const recs: RecommendedProduct[] = await getRecommendedProducts(productId);
  if (!recs.length) return null;
  return (
    <section style={{ marginTop: "3.5rem" }}>
      <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--navy)", marginBottom: "1.5rem" }}>
        You Might Also Like
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.25rem" }}>
        {recs.map((p) => (
          <Card
            key={p.id}
            title={p.title}
            imageSrc={p.imageUrl}
            minPrice={p.price}
            href={`/products/${p.id}`}
          />
        ))}
      </div>
    </section>
  );
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProduct(id);

  if (!data) {
    return (
      <main className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
        <nav style={{ marginBottom: "1.5rem", fontSize: "0.8125rem", color: "var(--text-lighter)" }}>
          <Link href="/" style={{ color: "inherit" }}>Home</Link> /{" "}
          <Link href="/products" style={{ color: "inherit" }}>Products</Link> / Not found
        </nav>
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.75rem" }}>Product not found</h1>
          <p style={{ color: "var(--text-light)", marginBottom: "1.5rem" }}>This product may have been removed or the link is incorrect.</p>
          <Link href="/products" className="btn btn-primary">Browse Products</Link>
        </div>
      </main>
    );
  }

  const { product, variants, images } = data;

  const galleryVariants: GalleryVariant[] = variants
    .map((v) => {
      const variantImgs = images.filter((img) => img.variantId === v.id).map((img) => img.url);
      const fallback = images
        .filter((img) => !img.variantId)
        .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((img) => img.url);
      return { color: v.color?.name || "Default", images: variantImgs.length ? variantImgs : fallback };
    })
    .filter((gv) => gv.images.length > 0);

  const defaultVariant = variants.find((v) => v.id === product.defaultVariantId) || variants[0];
  const basePrice = defaultVariant ? Number(defaultVariant.price) : null;
  const salePrice = defaultVariant?.salePrice ? Number(defaultVariant.salePrice) : null;
  const displayPrice = salePrice ?? basePrice;
  const discount =
    salePrice && basePrice && basePrice > salePrice
      ? Math.round(((basePrice - salePrice) / basePrice) * 100)
      : null;

  // Build the AddToCart payload (server-side)
  const addToCartItem = defaultVariant
    ? {
        variantId: defaultVariant.id,
        sku: defaultVariant.sku,
        productName: product.name,
        variantLabel: [defaultVariant.size?.name, defaultVariant.color?.name].filter(Boolean).join(" – "),
        price: displayPrice ?? 0,
        imageUrl: galleryVariants[0]?.images[0] ?? null,
      }
    : null;

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: "1.5rem", fontSize: "0.8125rem", color: "var(--text-lighter)", display: "flex", gap: "0.4rem", alignItems: "center" }}>
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Home</Link>
        <span>›</span>
        <Link href="/products" style={{ color: "inherit", textDecoration: "none" }}>Products</Link>
        <span>›</span>
        <span style={{ color: "var(--navy)" }}>{product.name}</span>
      </nav>

      <section style={{ display: "grid", gridTemplateColumns: "1fr min(480px, 100%)", gap: "3rem", alignItems: "start" }}>
        {/* Gallery */}
        {galleryVariants.length > 0 && (
          <ProductGallery productId={product.id} variants={galleryVariants} className="lg:sticky lg:top-6" />
        )}

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Category badge */}
          {product.category && (
            <div>
              <span className="badge badge-gold" style={{ letterSpacing: "0.08em" }}>
                {product.category.name}
              </span>
            </div>
          )}

          <header>
            <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, color: "var(--navy)", lineHeight: 1.2, margin: 0 }}>
              {product.name}
            </h1>
            {product.brand && (
              <p style={{ fontSize: "0.875rem", color: "var(--text-lighter)", margin: "0.35rem 0 0" }}>
                by {product.brand.name}
              </p>
            )}
          </header>

          {/* Price */}
          {displayPrice !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
              <span className="price-current" style={{ fontSize: "1.5rem" }}>{formatINR(displayPrice)}</span>
              {salePrice && basePrice && (
                <>
                  <span className="price-original">{formatINR(basePrice)}</span>
                  {discount !== null && (
                    <span className="badge badge-green">{discount}% off</span>
                  )}
                </>
              )}
            </div>
          )}

          <ColorSwatches productId={product.id} variants={galleryVariants} />
          <SizePicker />

          {/* Add to cart */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {addToCartItem ? (
              <AddToCartButton item={addToCartItem} />
            ) : (
              <button disabled className="btn btn-primary btn-lg" style={{ justifyContent: "center", opacity: 0.5 }}>
                Out of Stock
              </button>
            )}
          </div>

          {/* Trust signals */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {["100% Natural", "Lab Tested", "Free shipping ₹999+"].map((t) => (
              <span key={t} className="badge badge-navy" style={{ fontSize: "0.75rem" }}>✓ {t}</span>
            ))}
          </div>

          <CollapsibleSection title="Product Details" defaultOpen>
            <p style={{ lineHeight: 1.75, color: "var(--text-light)", fontSize: "0.9375rem" }}>{product.description}</p>
          </CollapsibleSection>

          <CollapsibleSection title="Shipping & Returns">
            <div style={{ lineHeight: 1.75, color: "var(--text-light)", fontSize: "0.9375rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <p>🚚 Free shipping on orders above ₹999. Standard delivery 4–7 business days.</p>
              <p>↩ Easy 7-day returns for unopened products. Contact us to initiate.</p>
            </div>
          </CollapsibleSection>

          <Suspense fallback={
            <CollapsibleSection title="Reviews">
              <p style={{ color: "var(--text-lighter)" }}>Loading reviews…</p>
            </CollapsibleSection>
          }>
            <ReviewsSection productId={product.id} />
          </Suspense>
        </div>
      </section>

      <Suspense fallback={null}>
        <AlsoLikeSection productId={product.id} />
      </Suspense>
    </main>
  );
}

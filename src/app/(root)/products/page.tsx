import Card from "@/components/Card";
import Filters from "@/components/Filters";
import Sort from "@/components/Sort";
import { parseFilterParams } from "@/lib/utils/query";
import { getAllProducts } from "@/lib/actions/product";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const parsed = parseFilterParams(sp);
  const { products, totalCount } = await getAllProducts(parsed);

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--navy)", margin: 0 }}>
          All Products
          <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--text-lighter)", marginLeft: "0.5rem" }}>
            ({totalCount})
          </span>
        </h1>
        <Sort />
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "2rem" }}>
        <Filters />
        <div>
          {products.length === 0 ? (
            <div style={{ borderRadius: "var(--radius-lg)", border: "1.5px dashed var(--sand)", padding: "3rem", textAlign: "center" }}>
              <p style={{ color: "var(--text-lighter)", fontSize: "0.9375rem" }}>No products found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
              {products.map((p) => (
                <Card
                  key={p.id}
                  title={p.name}
                  subtitle={p.subtitle ?? undefined}
                  imageSrc={p.imageUrl ?? "/placeholder-product.jpg"}
                  minPrice={p.minPrice}
                  maxPrice={p.maxPrice}
                  href={`/products/${p.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

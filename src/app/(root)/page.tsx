import Link from "next/link";
import { ArrowRight, Leaf, Shield, Star } from "lucide-react";
import { brand } from "@/config/brand";

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section style={{ background: "var(--navy)", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(circle at 20% 80%, var(--gold) 0%, transparent 50%), radial-gradient(circle at 80% 20%, var(--gold) 0%, transparent 50%)" }} />
        <div className="container" style={{ padding: "5rem 1.25rem 4rem", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div className="badge badge-gold" style={{ display: "inline-flex", marginBottom: "1.5rem", letterSpacing: "0.1em" }}>
            ✦ Rooted in Tradition · Crafted for Modern Wellness
          </div>
          <h1 className="heading-display" style={{ color: "var(--cream)", maxWidth: "700px", margin: "0 auto 1.25rem" }}>
            Nature&apos;s Heritage,<br />
            <span style={{ color: "var(--gold)" }}>Crafted for Today</span>
          </h1>
          <p style={{ fontSize: "1.125rem", color: "rgba(250,247,240,.7)", maxWidth: "520px", margin: "0 auto 2.5rem", lineHeight: 1.75 }}>
            Discover handcrafted soaps, authentic shilajit, natural attars, and herbal wellness products inspired by timeless traditions and made for everyday living.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/products" className="btn btn-gold btn-lg">
              Shop Now <ArrowRight size={18} />
            </Link>
            <Link href="/products?category=shilajit" className="btn btn-outline btn-lg" style={{ borderColor: "rgba(250,247,240,.3)", color: "var(--cream)" }}>
              Discover Shilajit
            </Link>
          </div>

          {/* Social proof */}
          <div style={{ display: "flex", gap: "2rem", justifyContent: "center", marginTop: "3rem", flexWrap: "wrap" }}>
            {[["10,000+", "Happy Customers"], ["100%", "Natural Ingredients"], ["Pan-India", "Delivery"]].map(([stat, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--gold)", margin: 0 }}>{stat}</p>
                <p style={{ fontSize: "0.8125rem", color: "rgba(250,247,240,.55)", margin: "0.2rem 0 0", letterSpacing: "0.04em" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gold divider */}
      <div className="divider-gold" style={{ margin: 0 }} />

      {/* ── Categories ────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h2 className="heading-section">Our Collections</h2>
            <p style={{ color: "var(--text-light)", marginTop: "0.5rem" }}>Carefully crafted products inspired by nature.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
            {brand.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                style={{ textDecoration: "none" }}
                className="group"
              >
                <div className="card category-card" style={{ padding: "2rem 1.5rem", textAlign: "center", cursor: "pointer" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
                    {cat.slug === "soaps" ? "🫧" : cat.slug === "attars" ? "🌹" : cat.slug === "shilajit" ? "⛰️" : "🌿"}
                  </div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--navy)", margin: "0 0 0.4rem" }}>{cat.name}</h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-light)", margin: 0 }}>{cat.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Brand story strip ──────────────────────────────────────── */}
      <section style={{ background: "var(--navy)", padding: "3.5rem 0" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: "0.75rem" }}>
            OUR HERITAGE
          </p>
          <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 700, color: "var(--cream)", maxWidth: "640px", margin: "0 auto 1.25rem", lineHeight: 1.3 }}>
            &ldquo;At Arya Heritage, we believe nature offers timeless solutions for everyday wellness.&rdquo;
          </h2>
          <div style={{ height: "2px", width: "60px", background: "var(--gold)", margin: "0 auto 1.5rem" }} />
          <p style={{ color: "rgba(250,247,240,.65)", maxWidth: "560px", margin: "0 auto", lineHeight: 1.8, fontSize: "0.9375rem" }}>
            Our products are inspired by traditional knowledge, crafted with carefully selected ingredients, and created with a commitment to purity, quality, and authenticity.
          </p>
          <p style={{ color: "rgba(250,247,240,.65)", maxWidth: "560px", margin: "0 auto", lineHeight: 1.8, fontSize: "0.9375rem" }}>
            Every product is made with attention to detail and respect for the heritage that inspires us.
          </p>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 0", background: "var(--cream-dark)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
            {[
              { icon: <Leaf size={28} />, title: "100% Natural", desc: "Made with thoughtfully selected ingredients." },
              { icon: <Shield size={28} />, title: "Small Batch Crafted", desc: "Prepared with care and consistency." },
              { icon: <Star size={28} />, title: "Cruelty Free", desc: "Never tested on animals." },
              { icon: "🚚", title: "Pan-India Delivery", desc: `Free shipping above ₹${brand.freeShippingThreshold}.` },
            ].map((f) => (
              <div key={f.title} style={{ background: "white", borderRadius: "var(--radius-lg)", padding: "1.75rem 1.5rem", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                <div style={{ color: "var(--gold-muted)", marginBottom: "0.875rem", display: "flex", justifyContent: "center" }}>
                  {typeof f.icon === "string" ? <span style={{ fontSize: "1.75rem" }}>{f.icon}</span> : f.icon}
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--navy)", margin: "0 0 0.4rem" }}>{f.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-light)", margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 0", textAlign: "center" }}>
        <div className="container">
          <h2 className="heading-section" style={{ marginBottom: "0.75rem" }}>Begin Your Wellness Journey</h2>
          <p style={{ color: "var(--text-light)", marginBottom: "2rem", fontSize: "1rem" }}>
            Discover products inspired by nature and crafted with care.
          </p>
          <Link href="/products" className="btn btn-primary btn-lg">
            Explore All Products <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}

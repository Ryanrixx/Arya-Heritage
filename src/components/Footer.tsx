import Link from "next/link";
import { brand } from "@/config/brand";
import { Instagram, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: "var(--navy)", color: "var(--cream)" }}>
      {/* Gold divider top */}
      <div style={{ height: "3px", background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />

      <div className="container" style={{ padding: "3rem 1.25rem 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2.5rem", marginBottom: "2.5rem" }}>

          {/* Brand column */}
          <div>
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.01em" }}>ARYA</div>
              <div style={{ fontWeight: 300, fontSize: "0.7rem", color: "var(--gold)", letterSpacing: "0.25em" }}>&amp; HERITAGE</div>
            </div>
            <p style={{ fontSize: "0.875rem", color: "rgba(250,247,240,.65)", lineHeight: 1.7, maxWidth: "220px" }}>
              Premium soaps, attars, shilajit, and herbal wellness products inspired by traditional wisdom.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <a href={brand.social.instagram} target="_blank" rel="noopener noreferrer" style={{ color: "rgba(250,247,240,.65)" }} aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href={brand.social.facebook} target="_blank" rel="noopener noreferrer" style={{ color: "rgba(250,247,240,.65)" }} aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href={brand.social.x} target="_blank" rel="noopener noreferrer" style={{ color: "rgba(250,247,240,.65)" }} aria-label="X / Twitter">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gold)", marginBottom: "1rem" }}>Shop</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {brand.categories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/products?category=${cat.slug}`} style={{ fontSize: "0.875rem", color: "rgba(250,247,240,.7)", textDecoration: "none" }}
                    className="hover:text-[var(--cream)] transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/products" style={{ fontSize: "0.875rem", color: "rgba(250,247,240,.7)", textDecoration: "none" }}
                  className="hover:text-[var(--cream)] transition-colors">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gold)", marginBottom: "1rem" }}>Help</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {[
                { label: "Shipping Policy", href: "#" },
                { label: "Returns & Refunds", href: "#" },
                { label: "Track Your Order", href: "#" },
                { label: "FAQ", href: "#" },
              ].map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} style={{ fontSize: "0.875rem", color: "rgba(250,247,240,.7)", textDecoration: "none" }}
                    className="hover:text-[var(--cream)] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gold)", marginBottom: "1rem" }}>Contact</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <a href={`mailto:${brand.contact.supportEmail}`} style={{ fontSize: "0.875rem", color: "rgba(250,247,240,.7)", textDecoration: "none" }}>
                {brand.contact.supportEmail}
              </a>
              {brand.contact.whatsappNumber && (
                <a
                  href={`https://wa.me/${brand.contact.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "0.875rem", color: "#25D366", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.35rem" }}
                >
                  💬 Chat on WhatsApp
                </a>
              )}
            </div>

            {/* Payment methods */}
            <div style={{ marginTop: "1.25rem" }}>
              <p style={{ fontSize: "0.75rem", color: "rgba(250,247,240,.5)", marginBottom: "0.5rem" }}>Secure payments via</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["UPI", "Razorpay", "Visa", "Mastercard"].map((p) => (
                  <span key={p} style={{
                    fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.5rem",
                    border: "1px solid rgba(250,247,240,.2)", borderRadius: "4px",
                    color: "rgba(250,247,240,.6)", letterSpacing: "0.04em"
                  }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(250,247,240,.1)", paddingTop: "1.25rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "0.8125rem", color: "rgba(250,247,240,.4)" }}>
            © {year} {brand.legalName}. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "1.25rem" }}>
            {["Privacy Policy", "Terms of Service"].map((l) => (
              <Link key={l} href="#" style={{ fontSize: "0.8125rem", color: "rgba(250,247,240,.4)", textDecoration: "none" }}>
                {l}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Menu, X, Search } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { brand } from "@/config/brand";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount, openCart } = useCartStore();

  return (
    <>
      {/* Trust / announcement bar */}
      <div className="trust-strip">
        ✦ Free shipping on orders above ₹{brand.freeShippingThreshold} &nbsp;|&nbsp;
        100% Natural &nbsp;|&nbsp; Secure Razorpay Checkout ✦
      </div>

      <header
        style={{ background: "white", borderBottom: "1px solid var(--sand)", position: "sticky", top: 0, zIndex: 50 }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", height: "4rem", gap: "1rem" }}>

          {/* Logo */}
          <Link href="/" style={{ flex: "none", textDecoration: "none" }}>
            <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--navy)", letterSpacing: "-0.01em" }}>
                ARYA
              </span>
              <span style={{ fontWeight: 300, fontSize: "0.7rem", color: "var(--gold-muted)", letterSpacing: "0.25em", textTransform: "uppercase" }}>
                &amp; HERITAGE
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav style={{ flex: 1, display: "flex", justifyContent: "center", gap: "2rem" }} className="hidden md:flex">
            {brand.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text)", textDecoration: "none", letterSpacing: "0.03em" }}
                className="hover:text-[var(--navy)] transition-colors"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/products"
              style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text)", textDecoration: "none", letterSpacing: "0.03em" }}
              className="hover:text-[var(--navy)] transition-colors"
            >
              All Products
            </Link>
          </nav>

          {/* Right actions */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <Link
              href="/products"
              style={{ padding: "0.5rem", color: "var(--text)", display: "flex" }}
              aria-label="Search products"
            >
              <Search size={20} />
            </Link>

            <button
              onClick={openCart}
              style={{ position: "relative", padding: "0.5rem", background: "none", border: "none", cursor: "pointer", color: "var(--navy)" }}
              aria-label={`Open cart (${itemCount} items)`}
            >
              <ShoppingBag size={22} />
              {itemCount > 0 && (
                <span style={{
                  position: "absolute", top: "2px", right: "2px",
                  width: "1.1rem", height: "1.1rem",
                  background: "var(--gold)", color: "var(--navy)",
                  borderRadius: "99px", fontSize: "0.65rem", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              style={{ padding: "0.5rem", background: "none", border: "none", cursor: "pointer", color: "var(--navy)" }}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden" style={{ background: "white", borderTop: "1px solid var(--sand)", padding: "1rem" }}>
            <nav style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {brand.categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  style={{ padding: "0.75rem 0", fontSize: "0.9375rem", fontWeight: 500, color: "var(--text)", textDecoration: "none", borderBottom: "1px solid var(--cream-dark)" }}
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/products"
                onClick={() => setMobileOpen(false)}
                style={{ padding: "0.75rem 0", fontSize: "0.9375rem", fontWeight: 500, color: "var(--navy)", textDecoration: "none" }}
              >
                All Products
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

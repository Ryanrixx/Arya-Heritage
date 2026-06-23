"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { brand } from "@/config/brand";
import { formatINR } from "@/lib/payments/money";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, shippingFee, total } = useCartStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeCart(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeCart]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const toFreeShipping = Math.max(0, brand.freeShippingThreshold - subtotal);
  const progressPct = Math.min(100, (subtotal / brand.freeShippingThreshold) * 100);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
    >
      {/* Backdrop */}
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(2px)" }}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="cart-drawer"
        style={{
          position: "relative",
          marginLeft: "auto",
          width: "min(420px, 100vw)",
          height: "100dvh",
          background: "var(--cream)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,.15)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--sand)", background: "var(--navy)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShoppingBag size={20} color="var(--gold)" />
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--cream)", margin: 0 }}>
              Your Bag {items.length > 0 && <span style={{ color: "var(--gold-light)", fontWeight: 400 }}>({items.length})</span>}
            </h2>
          </div>
          <button
            onClick={closeCart}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "rgba(250,247,240,.7)", display: "flex" }}
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free shipping progress */}
        {items.length > 0 && (
          <div style={{ padding: "0.75rem 1.5rem", background: "white", borderBottom: "1px solid var(--sand)" }}>
            {toFreeShipping > 0 ? (
              <p style={{ fontSize: "0.8125rem", color: "var(--text-light)", marginBottom: "0.5rem" }}>
                Add <strong style={{ color: "var(--navy)" }}>{formatINR(toFreeShipping)}</strong> more for free shipping
              </p>
            ) : (
              <p style={{ fontSize: "0.8125rem", color: "var(--success)", fontWeight: 600, marginBottom: "0.5rem" }}>
                🎉 You&apos;ve unlocked free shipping!
              </p>
            )}
            <div style={{ height: "4px", background: "var(--cream-dark)", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--gold)", borderRadius: "99px", transition: "width 0.4s ease" }} />
            </div>
          </div>
        )}

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <ShoppingBag size={48} color="var(--sand)" style={{ margin: "0 auto 1rem" }} />
              <p style={{ fontSize: "0.9375rem", color: "var(--text-lighter)" }}>Your bag is empty</p>
              <button
                onClick={closeCart}
                className="btn btn-outline btn-sm"
                style={{ marginTop: "1rem" }}
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
              {items.map((item) => (
                <li key={item.variantId} style={{ display: "flex", gap: "0.875rem", background: "white", borderRadius: "var(--radius-md)", padding: "0.875rem", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
                  {/* Image */}
                  <div style={{ width: "72px", height: "72px", borderRadius: "var(--radius-sm)", overflow: "hidden", flexShrink: 0, background: "var(--cream-dark)" }}>
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.productName} width={72} height={72} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🌿</div>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--navy)", margin: "0 0 0.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.productName}
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-lighter)", margin: "0 0 0.5rem" }}>{item.variantLabel}</p>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      {/* Qty stepper */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--cream-dark)", borderRadius: "var(--radius-full)", padding: "0.2rem 0.5rem" }}>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "0.15rem", display: "flex", color: "var(--text)" }}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, minWidth: "1rem", textAlign: "center", color: "var(--navy)" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "0.15rem", display: "flex", color: "var(--text)" }}
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--navy)" }}>
                          {formatINR(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "0.2rem", color: "var(--text-lighter)", display: "flex" }}
                          aria-label={`Remove ${item.productName}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer: totals + CTA */}
        {items.length > 0 && (
          <div style={{ padding: "1.25rem 1.5rem", background: "white", borderTop: "1px solid var(--sand)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-light)" }}>
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-light)" }}>
                <span>Shipping</span>
                <span style={{ color: shippingFee === 0 ? "var(--success)" : undefined }}>
                  {shippingFee === 0 ? "FREE" : formatINR(shippingFee)}
                </span>
              </div>
              <div style={{ height: "1px", background: "var(--sand)", margin: "0.25rem 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: 700, color: "var(--navy)" }}>
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="btn btn-gold"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={closeCart}
            >
              Proceed to Checkout →
            </Link>

            <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-lighter)", marginTop: "0.75rem" }}>
              🔒 Secured by Razorpay · UPI · Cards · NetBanking
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

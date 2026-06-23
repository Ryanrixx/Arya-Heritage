import Link from "next/link";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { getOrderSummary } from "@/lib/actions/order";
import { formatINR } from "@/lib/payments/money";
import { brand } from "@/config/brand";

interface SuccessPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { orderId } = await searchParams;
  const order = orderId ? await getOrderSummary(orderId) : null;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1.25rem" }}>
      <div style={{ maxWidth: "520px", width: "100%", textAlign: "center" }}>

        {/* Success icon */}
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "center" }}>
          <div style={{ width: "5rem", height: "5rem", borderRadius: "50%", background: "rgba(21,128,61,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={48} color="var(--success)" strokeWidth={1.5} />
          </div>
        </div>

        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.5rem" }}>
          Order Confirmed! 🙏
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--text-light)", marginBottom: "2rem", lineHeight: 1.6 }}>
          Thank you for your order. Your Ayurvedic treasures are on their way.
        </p>

        {order ? (
          <div className="card" style={{ padding: "1.5rem", textAlign: "left", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-lighter)", margin: "0 0 0.2rem" }}>Order ID</p>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--navy)", margin: 0, fontFamily: "monospace" }}>
                  {order.id.slice(0, 8).toUpperCase()}…
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "0.8rem", color: "var(--text-lighter)", margin: "0 0 0.2rem" }}>Amount paid</p>
                <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--navy)", margin: 0 }}>
                  {formatINR(order.totalAmount)}
                </p>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--sand)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--text)" }}>{item.productName} {item.variantLabel ? `· ${item.variantLabel}` : ""} ×{item.quantity}</span>
                  <span style={{ fontWeight: 600, color: "var(--navy)" }}>{formatINR(item.priceAtPurchase * item.quantity)}</span>
                </div>
              ))}
            </div>

            {order.shippingCity && (
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--sand)", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                <Package size={16} color="var(--gold-muted)" style={{ marginTop: "2px" }} />
                <p style={{ fontSize: "0.875rem", color: "var(--text-light)", margin: 0 }}>
                  Shipping to {order.shippingCity}, {order.shippingState}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <p style={{ color: "var(--text-light)", fontSize: "0.9rem", margin: 0 }}>
              Your payment was received. You&apos;ll get a confirmation email shortly.
            </p>
          </div>
        )}

        {/* WhatsApp CTA */}
        {brand.contact.whatsappNumber && (
          <a
            href={`https://wa.me/${brand.contact.whatsappNumber}?text=Hi!%20I%20just%20placed%20order%20${orderId ? orderId.slice(0,8) : ""}.%20Wanted%20to%20confirm.`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", background: "#25D366", color: "white", borderRadius: "var(--radius-full)", fontWeight: 600, textDecoration: "none", fontSize: "0.9rem", marginBottom: "1rem" }}
          >
            💬 Chat with us on WhatsApp
          </a>
        )}

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <Link href="/products" className="btn btn-outline">
            Continue Shopping
          </Link>
          <Link href="/" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            Back to Home <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function PaymentFailedPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1.25rem" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "center" }}>
          <div style={{ width: "5rem", height: "5rem", borderRadius: "50%", background: "rgba(220,38,38,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertCircle size={48} color="var(--error)" strokeWidth={1.5} />
          </div>
        </div>

        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.5rem" }}>
          Payment Unsuccessful
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--text-light)", marginBottom: "2rem", lineHeight: 1.6 }}>
          Your payment could not be completed. Your cart is still saved and no amount has been charged.
        </p>

        <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem", textAlign: "left" }}>
          <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--navy)", margin: "0 0 0.75rem" }}>Common reasons:</p>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {["Insufficient balance", "UPI PIN incorrect", "Transaction timeout", "Bank server issue (try again later)"].map((r) => (
              <li key={r} style={{ fontSize: "0.875rem", color: "var(--text-light)" }}>{r}</li>
            ))}
          </ul>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Link href="/checkout" className="btn btn-gold btn-lg" style={{ justifyContent: "center" }}>
            Try Payment Again
          </Link>
          <Link href="/products" className="btn btn-outline" style={{ justifyContent: "center" }}>
            Continue Shopping
          </Link>
        </div>

        <p style={{ marginTop: "1.5rem", fontSize: "0.8125rem", color: "var(--text-lighter)" }}>
          Need help? Email us at{" "}
          <a href="mailto:care@saffronandstone.example" style={{ color: "var(--navy)" }}>
            care@saffronandstone.example
          </a>
        </p>
      </div>
    </div>
  );
}

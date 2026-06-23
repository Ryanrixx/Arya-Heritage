"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Truck } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { createCheckoutOrder, type CheckoutContact, type CreateOrderResult } from "@/lib/actions/order";
import RazorpayCheckout from "@/components/RazorpayCheckout";
import { formatINR } from "@/lib/payments/money";
import { brand } from "@/config/brand";

type Step = "review" | "details" | "payment";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Andaman & Nicobar Islands","Chandigarh",
  "Dadra & Nagar Haveli and Daman & Diu","Delhi","Jammu & Kashmir","Ladakh",
  "Lakshadweep","Puducherry",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, shippingFee, total, clearCart } = useCartStore();
  const [step, setStep] = useState<Step>("review");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<CreateOrderResult | null>(null);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState<CheckoutContact>({
    fullName: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutContact, string>>>({});

  // Guard: if cart is empty and no pending order, redirect home
  useEffect(() => {
    if (items.length === 0 && !orderResult) {
      router.replace("/");
    }
  }, [items.length, orderResult, router]);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) e.fullName = "Full name required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Valid email required";
    if (!form.phone.match(/^[6-9]\d{9}$/)) e.phone = "Enter 10-digit Indian mobile number";
    if (!form.line1.trim() || form.line1.trim().length < 5) e.line1 = "Address line 1 required";
    if (!form.city.trim()) e.city = "City required";
    if (!form.state.trim()) e.state = "State required";
    if (!form.postalCode.match(/^\d{6}$/)) e.postalCode = "6-digit PIN code required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handlePlaceOrder() {
    if (!validate()) return;
    setIsSubmitting(true);
    setFormError("");
    try {
      const result = await createCheckoutOrder({ contact: form, cartItems: items });
      setOrderResult(result);
      setStep("payment");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function field(name: keyof CheckoutContact, label: string, type = "text", placeholder = "") {
    return (
      <div>
        <label className="form-label">{label}</label>
        <input
          type={type}
          value={form[name] as string}
          onChange={(e) => { setForm((f) => ({ ...f, [name]: e.target.value })); setErrors((er) => ({ ...er, [name]: undefined })); }}
          placeholder={placeholder}
          className={`input${errors[name] ? " error" : ""}`}
          autoComplete={name === "postalCode" ? "postal-code" : name === "fullName" ? "name" : name}
        />
        {errors[name] && <p style={{ color: "var(--error)", fontSize: "0.8rem", marginTop: "0.3rem" }}>{errors[name]}</p>}
      </div>
    );
  }

  if (items.length === 0 && !orderResult) return null;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream)", paddingBottom: "4rem" }}>
      {/* Header */}
      <div style={{ background: "var(--navy)", padding: "1rem 0" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ color: "var(--cream)", fontWeight: 700, fontSize: "1rem" }}>SAFFRON</span>
            <span style={{ color: "var(--gold)", fontWeight: 300, fontSize: "0.65rem", letterSpacing: "0.2em", marginLeft: "3px" }}>&amp; STONE</span>
          </Link>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {(["review", "details", "payment"] as Step[]).map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{
                  width: "1.5rem", height: "1.5rem", borderRadius: "99px",
                  background: step === s ? "var(--gold)" : s === "payment" && step === "payment" ? "var(--gold)" : "rgba(250,247,240,.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 700, color: step === s ? "var(--navy)" : "rgba(250,247,240,.5)"
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: "0.75rem", color: step === s ? "var(--gold)" : "rgba(250,247,240,.4)", display: "none" }} className="sm:inline">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
                {i < 2 && <span style={{ color: "rgba(250,247,240,.2)", fontSize: "0.75rem" }}>›</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr min(380px, 100%)", gap: "2rem", alignItems: "start" }}>

          {/* Left: form/steps */}
          <div>
            {/* Step 1: Review cart */}
            {step === "review" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <Link href="/" style={{ color: "var(--text-light)", display: "flex" }} aria-label="Back"><ArrowLeft size={18} /></Link>
                  <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--navy)", margin: 0 }}>Review your bag</h1>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {items.map((item) => (
                    <div key={item.variantId} className="card" style={{ padding: "1rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                      <div style={{ width: "60px", height: "60px", borderRadius: "var(--radius-sm)", background: "var(--cream-dark)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                        🌿
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--navy)", margin: 0 }}>{item.productName}</p>
                        <p style={{ fontSize: "0.8125rem", color: "var(--text-lighter)", margin: "0.2rem 0 0" }}>{item.variantLabel} · Qty {item.quantity}</p>
                      </div>
                      <p style={{ fontWeight: 700, color: "var(--navy)", fontSize: "0.9375rem" }}>{formatINR(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep("details")}
                  className="btn btn-navy"
                  style={{ marginTop: "1.5rem", width: "100%", justifyContent: "center", background: "var(--navy)", color: "var(--cream)", padding: "0.875rem", borderRadius: "var(--radius-full)", fontWeight: 600, fontSize: "0.9375rem", border: "none", cursor: "pointer" }}
                >
                  Continue to Delivery Details →
                </button>
              </div>
            )}

            {/* Step 2: Delivery details */}
            {step === "details" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <button onClick={() => setStep("review")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-light)", display: "flex", padding: 0 }} aria-label="Back">
                    <ArrowLeft size={18} />
                  </button>
                  <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--navy)", margin: 0 }}>Delivery details</h1>
                </div>

                <div className="card" style={{ padding: "1.5rem" }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--navy)", marginTop: 0, marginBottom: "1.25rem" }}>Contact information</h2>
                  <div style={{ display: "grid", gap: "1rem" }}>
                    {field("fullName", "Full Name", "text", "Priya Sharma")}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      {field("email", "Email", "email", "priya@example.com")}
                      <div>
                        <label className="form-label">Phone</label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.875rem", color: "var(--text-lighter)", pointerEvents: "none" }}>+91</span>
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => { setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/, "") })); setErrors((er) => ({ ...er, phone: undefined })); }}
                            placeholder="9876543210"
                            maxLength={10}
                            className={`input${errors.phone ? " error" : ""}`}
                            style={{ paddingLeft: "2.75rem" }}
                            autoComplete="tel"
                          />
                        </div>
                        {errors.phone && <p style={{ color: "var(--error)", fontSize: "0.8rem", marginTop: "0.3rem" }}>{errors.phone}</p>}
                      </div>
                    </div>
                  </div>

                  <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--navy)", marginTop: "1.5rem", marginBottom: "1.25rem" }}>Shipping address</h2>
                  <div style={{ display: "grid", gap: "1rem" }}>
                    {field("line1", "Address Line 1", "text", "House / Flat no., Street")}
                    {field("line2", "Address Line 2 (optional)", "text", "Landmark, Area")}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      {field("city", "City", "text", "Mumbai")}
                      <div>
                        <label className="form-label">PIN Code</label>
                        <input
                          type="text"
                          value={form.postalCode}
                          onChange={(e) => { setForm((f) => ({ ...f, postalCode: e.target.value.replace(/\D/, "") })); setErrors((er) => ({ ...er, postalCode: undefined })); }}
                          placeholder="400001"
                          maxLength={6}
                          className={`input${errors.postalCode ? " error" : ""}`}
                          autoComplete="postal-code"
                        />
                        {errors.postalCode && <p style={{ color: "var(--error)", fontSize: "0.8rem", marginTop: "0.3rem" }}>{errors.postalCode}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="form-label">State</label>
                      <select
                        value={form.state}
                        onChange={(e) => { setForm((f) => ({ ...f, state: e.target.value })); setErrors((er) => ({ ...er, state: undefined })); }}
                        className={`input${errors.state ? " error" : ""}`}
                        style={{ appearance: "none" }}
                      >
                        <option value="">Select state…</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.state && <p style={{ color: "var(--error)", fontSize: "0.8rem", marginTop: "0.3rem" }}>{errors.state}</p>}
                    </div>
                  </div>
                </div>

                {formError && (
                  <div style={{ marginTop: "1rem", padding: "0.875rem", background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "var(--radius-md)", color: "var(--error)", fontSize: "0.875rem" }}>
                    ⚠️ {formError}
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="btn btn-gold btn-lg"
                  style={{ marginTop: "1.5rem", width: "100%", justifyContent: "center", opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? "Creating order…" : "Continue to Payment →"}
                </button>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === "payment" && orderResult && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--navy)", margin: 0 }}>Complete payment</h1>
                </div>

                <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "flex-start" }}>
                    <Truck size={18} color="var(--gold-muted)" style={{ marginTop: "2px" }} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: "0 0 0.2rem", color: "var(--navy)" }}>Delivering to</p>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-light)", margin: 0 }}>
                        {form.fullName} · {form.line1}{form.line2 ? `, ${form.line2}` : ""}, {form.city}, {form.state} – {form.postalCode}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <ShieldCheck size={18} color="var(--success)" />
                    <p style={{ fontSize: "0.875rem", color: "var(--text-light)", margin: 0 }}>Your payment is secured by Razorpay with 256-bit encryption.</p>
                  </div>
                </div>

                <RazorpayCheckout
                  orderId={orderResult.orderId}
                  razorpayOrderId={orderResult.razorpayOrderId}
                  amountPaise={orderResult.amountPaise}
                  currency={orderResult.currency}
                  keyId={orderResult.keyId}
                  contactName={orderResult.contactName}
                  email={orderResult.email}
                  phone={orderResult.phone}
                  onSuccess={() => clearCart()}
                />
              </div>
            )}
          </div>

          {/* Right: order summary */}
          <div style={{ position: "sticky", top: "1.5rem" }}>
            <div className="card" style={{ padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginTop: 0, marginBottom: "1rem" }}>Order Summary</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
                {items.map((item) => (
                  <div key={item.variantId} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 500, margin: 0, color: "var(--text)" }}>{item.productName}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-lighter)", margin: "0.15rem 0 0" }}>{item.variantLabel} ×{item.quantity}</p>
                    </div>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--navy)", flexShrink: 0 }}>{formatINR(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid var(--sand)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-light)" }}>
                  <span>Subtotal</span><span>{formatINR(subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-light)" }}>
                  <span>Shipping</span>
                  <span style={{ color: shippingFee === 0 ? "var(--success)" : undefined }}>
                    {shippingFee === 0 ? "FREE" : formatINR(shippingFee)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: 700, color: "var(--navy)", paddingTop: "0.5rem", borderTop: "1px solid var(--sand)" }}>
                  <span>Total</span><span>{formatINR(total)}</span>
                </div>
              </div>

              {/* Trust signals */}
              <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {brand.trustBadges.map((b) => (
                  <div key={b} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-light)" }}>
                    <span style={{ color: "var(--gold-muted)" }}>✓</span> {b}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

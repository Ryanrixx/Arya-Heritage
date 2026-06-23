"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { brand } from "@/config/brand";

interface RazorpayCheckoutProps {
  orderId: string;             // our internal DB order id
  razorpayOrderId: string;     // Razorpay order id (order_XXXXX)
  amountPaise: number;         // amount in paise (Razorpay format)
  currency: string;
  keyId: string;               // RAZORPAY_KEY_ID — public, safe in browser
  contactName: string;
  email: string;
  phone: string;
  onSuccess?: (orderId: string) => void;
  onFailure?: (reason: string) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string; hide_topbar?: boolean };
  modal?: { ondismiss?: () => void; confirm_close?: boolean; escape?: boolean };
  notes?: Record<string, string>;
}
interface RazorpayInstance { open(): void; }
interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) { resolve(true); return; }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export default function RazorpayCheckout({
  orderId,
  razorpayOrderId,
  amountPaise,
  currency,
  keyId,
  contactName,
  email,
  phone,
  onSuccess,
  onFailure,
}: RazorpayCheckoutProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "processing" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handlePay = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");

    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      setStatus("error");
      setErrorMsg("Razorpay could not be loaded. Please check your connection and try again.");
      return;
    }

    setStatus("processing");

    const options: RazorpayOptions = {
      key: keyId,
      amount: amountPaise,
      currency,
      name: brand.name,
      description: "Secure checkout",
      order_id: razorpayOrderId,
      prefill: {
        name: contactName,
        email: email,
        contact: `+91${phone}`,
      },
      theme: {
        color: "#001F4D",   // --navy
      },
      modal: {
        confirm_close: true,
        escape: false,
        ondismiss: () => {
          setStatus("idle");
        },
      },
      notes: {
        orderId,
      },
      handler: async (response: RazorpayResponse) => {
        // Razorpay modal closed with a successful payment — verify server-side
        setStatus("loading");
        try {
          const res = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              internal_order_id: orderId,
            }),
          });

          const data = (await res.json()) as { ok?: boolean; orderId?: string; error?: string };

          if (!res.ok || !data.ok) {
            throw new Error(data.error ?? "Payment verification failed");
          }

          onSuccess?.(data.orderId ?? orderId);
          router.push(`/checkout/success?orderId=${data.orderId ?? orderId}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Verification failed";
          setStatus("error");
          setErrorMsg(msg);
          onFailure?.(msg);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }, [orderId, razorpayOrderId, amountPaise, currency, keyId, contactName, email, phone, onSuccess, onFailure, router]);

  const isLoading = status === "loading" || status === "processing";

  return (
    <div>
      {status === "error" && errorMsg && (
        <div style={{
          padding: "0.875rem 1rem", marginBottom: "1rem",
          background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.2)",
          borderRadius: "var(--radius-md)", color: "var(--error)", fontSize: "0.875rem"
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={isLoading}
        className="btn btn-gold btn-lg"
        style={{ width: "100%", justifyContent: "center", fontSize: "1rem" }}
      >
        {isLoading ? (
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="animate-pulse-soft">⏳</span>
            {status === "processing" ? "Opening payment…" : "Verifying payment…"}
          </span>
        ) : (
          <>🔒 Pay Securely with Razorpay</>
        )}
      </button>

      <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-lighter)", marginTop: "0.75rem" }}>
        UPI · Google Pay · Cards · NetBanking · Wallets
      </p>
    </div>
  );
}

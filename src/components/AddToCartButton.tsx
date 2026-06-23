"use client";

import { ShoppingBag, Check } from "lucide-react";
import { useState } from "react";
import { useCartStore, type CartItem } from "@/store/cart";

interface AddToCartButtonProps {
  item: Omit<CartItem, "quantity">;
  inStock?: boolean;
}

export default function AddToCartButton({ item, inStock = true }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (!inStock) return;
    addItem(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  if (!inStock) {
    return (
      <button disabled className="btn btn-primary btn-lg" style={{ justifyContent: "center", width: "100%", opacity: 0.5 }}>
        Out of Stock
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className={`btn btn-lg ${added ? "btn-outline" : "btn-primary"}`}
      style={{ justifyContent: "center", width: "100%", transition: "all 0.2s" }}
      aria-label="Add to cart"
    >
      {added ? (
        <>
          <Check size={18} />
          Added to Bag!
        </>
      ) : (
        <>
          <ShoppingBag size={18} />
          Add to Bag
        </>
      )}
    </button>
  );
}

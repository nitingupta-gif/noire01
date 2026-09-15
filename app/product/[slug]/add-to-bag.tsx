"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddToBagButton({ variantId, inStock }: { variantId: string; inStock: boolean }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, quantity: 1 }),
    });
    setLoading(false);

    if (res.status === 401) {
      router.push("/account/login");
      return;
    }
    if (!res.ok) return;

    window.dispatchEvent(new Event("cart-updated"));
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  };

  return (
    <button
      onClick={handleClick}
      disabled={!inStock || loading}
      className="flex-1 py-4 text-xs tracking-widest disabled:opacity-40"
      style={{ background: "#FF3D68", color: "#fff" }}
    >
      {!inStock ? "OUT OF STOCK" : loading ? "ADDING..." : done ? "ADDED ✓" : "ADD TO BAG"}
    </button>
  );
}
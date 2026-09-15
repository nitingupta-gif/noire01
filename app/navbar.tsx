"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [cartCount, setCartCount] = useState(0);
  const [showCartNotice, setShowCartNotice] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    const loadCartCount = async () => {
      const response = await fetch("/api/cart");
      if (!response.ok) return;
      const cart = await response.json();
      const count = cart.items.reduce((total: number, item: { quantity: number }) => total + item.quantity, 0);
      setCartCount(count);
    };

    const handleCartUpdated = async () => {
      await loadCartCount();
      setShowCartNotice(true);
      window.setTimeout(() => setShowCartNotice(false), 1800);
    };

    loadCartCount();
    window.addEventListener("cart-updated", handleCartUpdated);
    return () => window.removeEventListener("cart-updated", handleCartUpdated);
  }, [session?.user]);

  return (
    <header className="sticky top-0 z-50" style={{ background: "linear-gradient(108deg, #FFC6A8 0%, #E99A86 50%, #741A2F 100%)", borderBottom: "1px solid rgba(116, 26, 47, 0.25)", boxShadow: "0 10px 30px rgba(116, 26, 47, 0.18)" }}>
      <div className="max-w-[1440px] mx-auto px-5 md:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="brand-mark font-display text-xl tracking-widest" style={{ color: "#111111" }}>
          NOIRÉ
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/shop?gender=MEN" className="nav-link-hover text-sm font-bold" style={{ color: "#111111" }}>Men</Link>
          <Link href="/shop?gender=WOMEN" className="nav-link-hover text-sm font-bold" style={{ color: "#111111" }}>Women</Link>
          <Link href="/shop?gender=KIDS" className="nav-link-hover text-sm font-bold" style={{ color: "#111111" }}>Kids</Link>
          <Link href="/shop?gender=UNISEX" className="nav-link-hover text-sm font-bold" style={{ color: "#111111" }}>Unisex</Link>
          <Link href="/shop" className="nav-link-hover text-sm font-bold" style={{ color: "#111111" }}>Sale</Link>
        </nav>

        <div className="flex items-center gap-5">
          <Link href="/wishlist" className="nav-link-hover text-sm font-bold" style={{ color: "#111111" }}>Wishlist</Link>
          <div className="relative">
            {showCartNotice && (
              <span className="cart-notice">{cartCount} {cartCount === 1 ? "item" : "items"} in cart</span>
            )}
            <Link href="/cart" className="nav-link-hover text-sm font-bold" style={{ color: "#111111" }}>
              Cart{session?.user && cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          </div>
          {session?.user ? (
            <div className="flex items-center gap-3">
              <Link href="/account" className="text-sm font-bold" style={{ color: "#111111" }}>
                {session.user.name?.split(" ")[0]}
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm font-bold" style={{ color: "#111111" }}>
                Logout
              </button>
            </div>
          ) : (
            <Link href="/account/login" className="text-sm font-bold" style={{ color: "#111111" }}>Sign In</Link>
          )}
        </div>
      </div>
    </header>
  );
}
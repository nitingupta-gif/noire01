import Link from "next/link";

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #EDE0D0", marginTop: 80 }}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2">
          <span className="brand-mark font-display text-xl" style={{ color: "#111111" }}>NOIRÉ</span>
          <p className="text-xs mt-3 max-w-[260px]" style={{ color: "#7A7086", lineHeight: 1.7 }}>
            Curated fashion for every expression. Designed for modern India.
          </p>
        </div>
        <div>
          <span className="text-xs" style={{ color: "#211A2E" }}>Shop</span>
          <div className="flex flex-col gap-2 mt-3">
            <Link href="/shop?gender=MEN" className="text-xs" style={{ color: "#7A7086" }}>Men</Link>
            <Link href="/shop?gender=WOMEN" className="text-xs" style={{ color: "#7A7086" }}>Women</Link>
            <Link href="/shop" className="text-xs" style={{ color: "#7A7086" }}>All Products</Link>
          </div>
        </div>
        <div>
          <span className="text-xs" style={{ color: "#211A2E" }}>Help</span>
          <div className="flex flex-col gap-2 mt-3">
            <Link href="/orders" className="text-xs" style={{ color: "#7A7086" }}>Track Order</Link>
            <Link href="/account" className="text-xs" style={{ color: "#7A7086" }}>My Account</Link>
          </div>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-4" style={{ borderTop: "1px solid #EDE0D0" }}>
        <span className="text-[11px]" style={{ color: "#7A7086" }}>© 2026 NOIRÉ. All rights reserved.</span>
      </div>
    </footer>
  );
}
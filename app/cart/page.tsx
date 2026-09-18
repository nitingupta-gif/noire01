import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CartPage() {
  const session = await auth();
  if (!session?.user) redirect("/account/login");

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: { items: { include: { product: { include: { images: true } }, variant: true } } },
  });

  const items = cart?.items ?? [];
  const subtotal = items.reduce((s, i) => s + (i.product.salePrice ?? i.product.price) * i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-24 text-center">
        <p className="font-display text-2xl" style={{ color: "#211A2E" }}>Your bag is empty</p>
        <Link href="/shop" className="text-sm mt-4 inline-block" style={{ color: "#FF3D68" }}>Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-5 md:px-10 py-10">
      <h1 className="font-display text-3xl mb-8" style={{ color: "#211A2E" }}>Shopping Bag</h1>
      <div className="flex flex-col gap-5">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 pb-5" style={{ borderBottom: "1px solid #EDE0D0" }}>
            {item.product.images[0] && (
              <img src={item.product.images[0].url} className="product-frame w-20 h-24 object-contain p-1" alt={`${item.product.name} product`} />
            )}
            <div className="flex-1">
              <div className="text-sm" style={{ color: "#211A2E" }}>{item.product.name}</div>
              <div className="text-xs mt-1" style={{ color: "#7A7086" }}>
                Size: {item.variant.size} · Color: {item.variant.color} · Qty: {item.quantity}
              </div>
              <div className="text-sm mt-2" style={{ color: "#FF3D68" }}>
                ₹{(((item.product.salePrice ?? item.product.price) * item.quantity) / 100).toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 pt-4" style={{ borderTop: "1px solid #EDE0D0" }}>
        <div className="flex justify-between">
          <span className="text-lg" style={{ color: "#211A2E" }}>Subtotal</span>
          <span className="text-lg" style={{ color: "#211A2E" }}>₹{(subtotal / 100).toLocaleString("en-IN")}</span>
        </div>

        <Link
          href="/checkout"
          className="mt-6 inline-flex w-full items-center justify-center py-4 text-xs tracking-widest"
          style={{ background: "#FF3D68", color: "#fff" }}
        >
          PLACE ORDER
        </Link>
      </div>
    </div>
  );
}
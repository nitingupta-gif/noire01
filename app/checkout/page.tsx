import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CheckoutClient } from "./checkout-client";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/account/login?callbackUrl=/checkout");

  const userId = session.user.id;

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: { include: { images: true } }, variant: true } } },
  });

  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: { isDefault: "desc" },
  });

  const subtotal = cart.items.reduce(
    (s, i) => s + (i.product.salePrice ?? i.product.price) * i.quantity,
    0
  );
  const shipping = subtotal > 299900 ? 0 : 14900;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  return (
    <CheckoutClient
      items={cart.items}
      addresses={addresses}
      subtotal={subtotal}
      shipping={shipping}
      tax={tax}
      total={total}
    />
  );
}
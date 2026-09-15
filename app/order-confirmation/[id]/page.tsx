import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function OrderConfirmation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/account/login");

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, address: true },
  });

  if (!order || order.userId !== (session.user as any).id) {
    notFound();
  }

  return (
    <div className="max-w-[560px] mx-auto px-6 py-24 text-center">
      <p className="font-display text-3xl" style={{ color: "#211A2E" }}>Order Confirmed</p>
      <p className="text-sm mt-2" style={{ color: "#7A7086" }}>Thank you — your order has been placed.</p>

      <div className="mt-6 p-5 text-left" style={{ border: "1px solid #EDE0D0" }}>
        <div className="flex justify-between text-sm mb-1">
          <span style={{ color: "#7A7086" }}>Order ID</span>
          <span style={{ color: "#211A2E" }}>{order.orderNumber}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span style={{ color: "#7A7086" }}>Payment</span>
          <span style={{ color: "#211A2E" }}>{order.paymentMethod === "COD" ? "Cash on Delivery" : "Paid via Razorpay"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: "#7A7086" }}>Total</span>
          <span style={{ color: "#211A2E" }}>₹{(order.total / 100).toLocaleString("en-IN")}</span>
        </div>
      </div>

      <Link href="/shop" className="inline-block mt-6 px-6 py-3 text-xs tracking-widest" style={{ background: "#FF3D68", color: "#fff" }}>
        CONTINUE SHOPPING
      </Link>
    </div>
  );
}
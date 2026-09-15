import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await req.json();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || order.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.paymentMethod !== "RAZORPAY") {
    return NextResponse.json({ error: "Order is not set up for online payment" }, { status: 400 });
  }
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Order already paid" }, { status: 400 });
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: order.total,
    currency: "INR",
    receipt: order.orderNumber,
    notes: { orderId: order.id },
  });

  await prisma.payment.upsert({
    where: { orderId: order.id },
    update: { razorpayOrderId: razorpayOrder.id },
    create: {
      orderId: order.id,
      method: "RAZORPAY",
      status: "PENDING",
      amount: order.total,
      razorpayOrderId: razorpayOrder.id,
    },
  });

  return NextResponse.json({
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
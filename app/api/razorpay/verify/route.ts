import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: { razorpayOrderId: razorpay_order_id },
    include: { order: true },
  });

  if (!payment || payment.order.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const isValid = expectedSignature === razorpay_signature;

  if (!isValid) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: "FAILED" },
    });
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
    }),
  ]);

  return NextResponse.json({ verified: true, orderId: payment.orderId });
}
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { code } = await req.json();

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });
  const subtotal =
    cart?.items.reduce((s, i) => s + (i.product.salePrice ?? i.product.price) * i.quantity, 0) ?? 0;

  const coupon = await prisma.coupon.findUnique({ where: { code: String(code).toUpperCase() } });
  const now = new Date();

  if (!coupon) return NextResponse.json({ valid: false, reason: "Coupon not found" }, { status: 404 });
  if (!coupon.active) return NextResponse.json({ valid: false, reason: "Coupon is inactive" });
  if (now < coupon.startDate || now > coupon.expiryDate)
    return NextResponse.json({ valid: false, reason: "Coupon has expired" });
  if (subtotal < coupon.minOrderAmount)
    return NextResponse.json({ valid: false, reason: `Minimum order amount is ₹${coupon.minOrderAmount / 100}` });
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit)
    return NextResponse.json({ valid: false, reason: "Coupon usage limit reached" });

  let discount =
    coupon.discountType === "PERCENTAGE" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);

  return NextResponse.json({ valid: true, code: coupon.code, discount, discountType: coupon.discountType });
}
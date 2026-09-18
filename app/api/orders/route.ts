import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function orderNumber() {
  return "NR" + Math.floor(100000 + Math.random() * 900000);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { addressId, paymentMethod, couponCode } = await req.json();

  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) return NextResponse.json({ error: "Address not found" }, { status: 404 });

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true, variant: true } } },
  });
  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  for (const item of cart.items) {
    if (item.variant.stock < item.quantity) {
      return NextResponse.json(
        { error: `${item.product.name} (${item.variant.size}/${item.variant.color}) is out of stock` },
        { status: 409 }
      );
    }
  }

  const subtotal = cart.items.reduce(
    (sum, i) => sum + (i.product.salePrice ?? i.product.price) * i.quantity,
    0
  );

  let discount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
    const now = new Date();
    if (
      !coupon ||
      !coupon.active ||
      now < coupon.startDate ||
      now > coupon.expiryDate ||
      subtotal < coupon.minOrderAmount ||
      (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit)
    ) {
      return NextResponse.json({ error: "Coupon is invalid or expired" }, { status: 400 });
    }
    discount =
      coupon.discountType === "PERCENTAGE"
        ? Math.round((subtotal * coupon.value) / 100)
        : coupon.value;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  }

  const shipping = subtotal - discount > 299900 ? 0 : 14900;
  const tax = Math.round((subtotal - discount) * 0.05);
  const total = subtotal - discount + shipping + tax;

  if (paymentMethod === "COD") {
    const codThreshold = Number(process.env.COD_MAX_ORDER_AMOUNT_PAISE ?? "0");
    if (codThreshold > 0 && total > codThreshold) {
      return NextResponse.json({ error: "Order exceeds the Cash on Delivery limit" }, { status: 400 });
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: orderNumber(),
        userId,
        addressId,
        paymentMethod,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        couponCode: coupon?.code,
        items: {
          create: cart.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            size: i.variant.size,
            color: i.variant.color,
            quantity: i.quantity,
            price: i.product.salePrice ?? i.product.price,
          })),
        },
      },
    });

    for (const item of cart.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    if (coupon) {
      await tx.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } });
      await tx.couponUsage.create({ data: { couponId: coupon.id, userId, orderId: created.id } });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return created;
  });

  return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber, total: order.total });
}
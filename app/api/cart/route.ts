// app/api/cart/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: {
      items: {
        include: {
          product: { include: { images: true } },
          variant: true,
        },
      },
    },
  });

  return NextResponse.json(cart);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { variantId, quantity = 1 } = await req.json();

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  if (variant.stock < quantity) {
    return NextResponse.json({ error: "Not enough stock" }, { status: 409 });
  }

  const cart = await prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });

  const item = await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: { increment: quantity } },
    create: { cartId: cart.id, productId: variant.productId, variantId, quantity },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { itemId, quantity } = await req.json();
  if (quantity < 1) return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId } },
    include: { variant: true },
  });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  if (item.variant.stock < quantity) {
    return NextResponse.json({ error: "Not enough stock" }, { status: 409 });
  }

  const updated = await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { itemId } = await req.json();
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cart: { userId } } });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  await prisma.cartItem.delete({ where: { id: itemId } });
  return NextResponse.json({ deleted: true });
}
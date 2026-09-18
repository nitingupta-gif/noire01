import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const wishlist = await prisma.wishlist.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: { items: { include: { product: { include: { images: true } } } } },
  });

  return NextResponse.json(wishlist);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { productId } = await req.json();
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const wishlist = await prisma.wishlist.upsert({ where: { userId }, update: {}, create: { userId } });

  try {
    const item = await prisma.wishlistItem.create({ data: { wishlistId: wishlist.id, productId } });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ ok: true, alreadySaved: true });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { productId } = await req.json();
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) return NextResponse.json({ deleted: false });

  await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId } });
  return NextResponse.json({ deleted: true });
}
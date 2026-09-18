import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1).max(2000),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reviews = await prisma.review.findMany({
    where: { productId: id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const parsed = reviewSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review", issues: parsed.error.issues }, { status: 400 });
  }

  const hasDeliveredOrder = await prisma.orderItem.findFirst({
    where: {
      productId: id,
      order: { userId, status: "DELIVERED" },
    },
  });

  try {
    const review = await prisma.review.create({
      data: {
        productId: id,
        userId,
        rating: parsed.data.rating,
        text: parsed.data.text,
        verified: !!hasDeliveredOrder,
        status: "PENDING",
      },
    });
    return NextResponse.json(review, { status: 201 });
  } catch {
    return NextResponse.json({ error: "You've already reviewed this product" }, { status: 409 });
  }
}
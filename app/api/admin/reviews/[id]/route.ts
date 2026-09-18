import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { status } = await req.json();
  if (!["APPROVED", "HIDDEN", "PENDING"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const review = await prisma.review.update({ where: { id }, data: { status } });

  const approved = await prisma.review.findMany({
    where: { productId: review.productId, status: "APPROVED" },
    select: { rating: true },
  });
  const ratingAvg = approved.length
    ? approved.reduce((s, r) => s + r.rating, 0) / approved.length
    : 0;

  await prisma.product.update({
    where: { id: review.productId },
    data: { ratingAvg, reviewCount: approved.length },
  });

  return NextResponse.json(review);
}
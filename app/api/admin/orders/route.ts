import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ORDER_STATUSES = [
  "ORDER_PLACED",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

async function requireAdmin() {
  const session = await auth();
  return session?.user && (session.user as { role?: string }).role === "ADMIN";
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit") ?? 50), 100);
  const [orders, total, revenue, pending] = await Promise.all([
    prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        address: true,
        items: { include: { product: { select: { name: true } } } },
      },
    }),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.order.count({ where: { status: { in: ["ORDER_PLACED", "CONFIRMED", "PROCESSING"] } } }),
  ]);

  return NextResponse.json({
    orders,
    total,
    summary: {
      revenue: revenue._sum.total ?? 0,
      pending,
    },
  });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status } = await req.json();
  if (typeof id !== "string" || !ORDER_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid order update" }, { status: 400 });
  }

  const order = await prisma.order.update({ where: { id }, data: { status } });
  return NextResponse.json(order);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  price: z.number().int().positive().optional(),
  salePrice: z.number().int().positive().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
});

async function requireAdmin() {
  const session = await auth();
  return session?.user && (session.user as { role?: string }).role === "ADMIN";
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = productUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid product data" }, { status: 400 });

  const product = await prisma.product.update({ where: { id }, data: parsed.data });
  return NextResponse.json(product);
}

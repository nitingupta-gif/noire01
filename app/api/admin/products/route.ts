import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

const productSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1),
  description: z.string().min(1),
  sku: z.string().min(1),
  categoryId: z.string(),
  gender: z.enum(["MEN", "WOMEN", "KIDS", "UNISEX"]),
  price: z.number().int().positive(),
  salePrice: z.number().int().positive().nullable().optional(),
  stock: z.number().int().min(0),
  featured: z.boolean().optional(),
  bestseller: z.boolean().optional(),
  newArrival: z.boolean().optional(),
  published: z.boolean().optional(),
  images: z.array(z.string().url()).min(1),
  variants: z
    .array(z.object({ size: z.string(), color: z.string(), stock: z.number().int().min(0), sku: z.string() }))
    .min(1),
});

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = 20;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      include: { images: true, category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count(),
  ]);

  return NextResponse.json({ products, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product data", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      sku: data.sku,
      categoryId: data.categoryId,
      gender: data.gender,
      price: data.price,
      salePrice: data.salePrice ?? null,
      stock: data.variants.reduce((s, v) => s + v.stock, 0),
      featured: data.featured ?? false,
      bestseller: data.bestseller ?? false,
      newArrival: data.newArrival ?? false,
      published: data.published ?? true,
      images: { create: data.images.map((url, i) => ({ url, position: i })) },
      variants: { create: data.variants },
    },
    include: { images: true, variants: true },
  });

  return NextResponse.json(product, { status: 201 });
}
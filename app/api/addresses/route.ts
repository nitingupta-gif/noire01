import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addressSchema = z.object({
  fullName: z.string().min(1),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  house: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const addresses = await prisma.address.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { isDefault: "desc" },
  });
  return NextResponse.json(addresses);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const parsed = addressSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid address", issues: parsed.error.issues }, { status: 400 });
  }

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({ data: { ...parsed.data, userId } });
  return NextResponse.json(address, { status: 201 });
}
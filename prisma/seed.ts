import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@noire.in";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "change-me-immediately";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "NOIRE Admin",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminPassword, 12),
    },
  });
  console.log(`Seeded admin account: ${adminEmail}`);

  const categories = [
    "T-Shirts", "Shirts", "Jeans", "Trousers", "Dresses", "Jackets",
    "Hoodies", "Sweatshirts", "Co-ords", "Shoes", "Accessories", "Bags",
    "Watches", "Caps", "Sunglasses",
  ];

  const categoryMap: Record<string, string> = {};
  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: { name, slug: name.toLowerCase().replace(/\s+/g, "-") },
    });
    categoryMap[name] = cat.id;
  }
  console.log(`Seeded ${categories.length} categories.`);

  // A few sample products to get started — add more from the admin panel later.
  const sampleProducts = [
    { name: "Oversized Cotton Tee", category: "T-Shirts", gender: "MEN" as const, price: 179900, sku: "NR-TS-1001", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=clip&w=900&q=85" },
    { name: "Tailored Linen Shirt", category: "Shirts", gender: "MEN" as const, price: 329900, sku: "NR-SH-1002", img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=clip&w=900&q=85" },
    { name: "Straight Fit Denim", category: "Jeans", gender: "MEN" as const, price: 349900, sku: "NR-JE-1003", img: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=clip&w=900&q=85" },
    { name: "Wrap Midi Dress", category: "Dresses", gender: "WOMEN" as const, price: 379900, sku: "NR-DR-1004", img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=clip&w=900&q=85" },
    { name: "Heavyweight Hoodie", category: "Hoodies", gender: "UNISEX" as const, price: 299900, sku: "NR-HO-1005", img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=clip&w=900&q=85" },
    { name: "Court Leather Sneaker", category: "Shoes", gender: "UNISEX" as const, price: 599900, sku: "NR-SH-1006", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=clip&w=900&q=85" },
  ];

  for (const p of sampleProducts) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        images: {
          deleteMany: {},
          create: [{ url: p.img, position: 0 }],
        },
      },
      create: {
        name: p.name,
        slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: "Cut from a heavyweight, breathable fabric with a considered drape.",
        sku: p.sku,
        categoryId: categoryMap[p.category],
        gender: p.gender,
        price: p.price,
        stock: 10,
        published: true,
        featured: true,
        newArrival: true,
        images: { create: [{ url: p.img, position: 0 }] },
        variants: {
          create: [
            { size: "S", color: "Black", stock: 5, sku: p.sku + "-S-BLK" },
            { size: "M", color: "Black", stock: 5, sku: p.sku + "-M-BLK" },
          ],
        },
      },
    });
    console.log(`Seeded product: ${product.name}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
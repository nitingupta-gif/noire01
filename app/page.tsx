import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { connection } from "next/server";

export default async function Home() {
  await connection();

  const products = await prisma.product.findMany({
    where: { published: true },
    include: { images: true },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  return (
    <main>
      {/* Hero */}
      <section className="px-6 md:px-10 py-24 max-w-[1440px] mx-auto">
        <h1 className="font-display text-5xl md:text-7xl" style={{ color: "#211A2E" }}>
          DEFINE YOUR STYLE.
        </h1>
        <p className="mt-6 max-w-[440px] text-sm" style={{ color: "#7A7086" }}>
          Curated fashion for every expression. Discover timeless silhouettes,
          contemporary essentials and statement pieces designed for modern India.
        </p>
      </section>

      {/* Products from the database */}
      <section className="px-6 md:px-10 pb-24 max-w-[1440px] mx-auto">
        <h2 className="font-display text-3xl mb-8" style={{ color: "#211A2E" }}>
          New Arrivals
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((p) => (
            <Link key={p.id} href={`/product/${p.slug}`} className="product-hover">
              <div className="product-frame">
                {p.images[0] && (
                  <img src={p.images[0].url} alt={`${p.name} product`} className="product-image" />
                )}
              </div>
              <div className="pt-3">
                <div className="text-sm" style={{ color: "#211A2E" }}>{p.name}</div>
                <div className="text-sm mt-1" style={{ color: "#FF3D68" }}>
                  ₹{(p.price / 100).toLocaleString("en-IN")}
                </div>
              </div>
            </Link>
          ))}
        </div>
        {products.length === 0 && (
          <p style={{ color: "#7A7086" }}>No products found — check that seeding worked.</p>
        )}
      </section>
    </main>
  );
}

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";

const CATEGORIES = ["T-Shirts", "Shirts", "Jeans", "Trousers", "Dresses", "Jackets", "Hoodies", "Sweatshirts", "Co-ords", "Shoes", "Accessories", "Bags", "Watches", "Caps", "Sunglasses"];
const GENDERS = ["MEN", "WOMEN", "KIDS", "UNISEX"] as const;

export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; gender?: string; sort?: string }>;
}) {
  const params = await searchParams;

  const where: Prisma.ProductWhereInput = {
    published: true,
    ...(params.category ? { category: { name: params.category } } : {}),
    ...(params.gender && GENDERS.includes(params.gender as (typeof GENDERS)[number])
      ? { gender: params.gender as (typeof GENDERS)[number] }
      : {}),
  };

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (params.sort === "price-asc") orderBy = { price: "asc" };
  if (params.sort === "price-desc") orderBy = { price: "desc" };
  if (params.sort === "rating") orderBy = { ratingAvg: "desc" };

  const products = await prisma.product.findMany({
    where,
    include: { images: true },
    orderBy,
  });

  const buildLink = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { ...params, ...updates };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) next.set(k, v);
    });
    return `/shop?${next.toString()}`;
  };

  return (
    <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-10">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <h1 className="font-display text-4xl" style={{ color: "#211A2E" }}>Shop All</h1>
          <span className="text-sm" style={{ color: "#7A7086" }}>{products.length} products</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "#7A7086" }}>Sort:</span>
          {[["", "Featured"], ["newest", "Newest"], ["price-asc", "Price: Low to High"], ["price-desc", "Price: High to Low"], ["rating", "Rating"]].map(([val, label]) => (
            <Link
              key={val}
              href={buildLink({ sort: val || undefined })}
              className="text-xs px-2 py-1"
              style={{
                color: (params.sort || "") === val ? "#FF3D68" : "#7A7086",
                textDecoration: (params.sort || "") === val ? "underline" : "none",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
        {/* Filters */}
        <div>
          <div className="mb-8">
            <div className="text-xs mb-3" style={{ color: "#211A2E" }}>CATEGORY</div>
            <div className="flex flex-col gap-2">
              <Link href={buildLink({ category: undefined })} className="text-sm" style={{ color: !params.category ? "#FF3D68" : "#7A7086" }}>
                All Categories
              </Link>
              {CATEGORIES.map((c) => (
                <Link key={c} href={buildLink({ category: c })} className="text-sm" style={{ color: params.category === c ? "#FF3D68" : "#7A7086" }}>
                  {c}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs mb-3" style={{ color: "#211A2E" }}>GENDER</div>
            <div className="flex flex-col gap-2">
              <Link href={buildLink({ gender: undefined })} className="text-sm" style={{ color: !params.gender ? "#FF3D68" : "#7A7086" }}>
                All
              </Link>
              {GENDERS.map((g) => (
                <Link key={g} href={buildLink({ gender: g })} className="text-sm" style={{ color: params.gender === g ? "#FF3D68" : "#7A7086" }}>
                  {g.charAt(0) + g.slice(1).toLowerCase()}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Product grid */}
        <div>
          {products.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-display text-2xl" style={{ color: "#211A2E" }}>No products found</p>
              <p className="text-sm mt-2" style={{ color: "#7A7086" }}>Try a different filter.</p>
              <Link href="/shop" className="text-sm mt-4 inline-block" style={{ color: "#FF3D68" }}>Clear filters</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
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
                      ₹{((p.salePrice ?? p.price) / 100).toLocaleString("en-IN")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
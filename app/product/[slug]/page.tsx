import { AddToBagButton } from "./add-to-bag";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";


export default async function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: true, variants: true, category: true },
  });

  if (!product) {
    notFound();
  }

  const sizes = Array.from(new Set(product.variants.map((v) => v.size)));
  const colors = Array.from(new Set(product.variants.map((v) => v.color)));
  const price = product.salePrice ?? product.price;

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, published: true, NOT: { id: product.id } },
    include: { images: true },
    take: 4,
  });

  return (
    <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-10">
      <div className="flex items-center gap-1.5 mb-8 text-xs" style={{ color: "#7A7086" }}>
        <Link href="/">Home</Link> <span>/</span>
        <Link href="/shop">Shop</Link> <span>/</span>
        <span style={{ color: "#211A2E" }}>{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
        {/* Gallery */}
        <div>
          <div className="product-frame">
            {product.images[0] && (
              <img src={product.images[0].url} alt={`${product.name} product`} className="product-image" />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3 mt-3">
              {product.images.map((img) => (
                <div key={img.id} className="product-frame w-16 h-20">
                  <img src={img.url} alt={`${product.name} thumbnail`} className="product-image p-1" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <span className="text-xs" style={{ color: "#7A7086" }}>{product.brand}</span>
          <h1 className="font-display text-4xl mt-1" style={{ color: "#211A2E" }}>{product.name}</h1>

          <div className="flex items-center gap-3 mt-5">
            <span className="text-2xl" style={{ color: "#211A2E" }}>
              ₹{(price / 100).toLocaleString("en-IN")}
            </span>
            {product.salePrice && (
              <span className="text-base line-through" style={{ color: "#7A7086" }}>
                ₹{(product.price / 100).toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <p className="mt-5 text-sm max-w-[440px]" style={{ color: "#7A7086", lineHeight: 1.75 }}>
            {product.description}
          </p>

          {sizes.length > 0 && (
            <div className="mt-7">
              <span className="text-xs" style={{ color: "#211A2E" }}>SIZE</span>
              <div className="flex flex-wrap gap-2 mt-2.5">
                {sizes.map((s) => (
                  <button key={s} className="min-w-[42px] h-10 px-2 text-xs" style={{ border: "1px solid #EDE0D0", color: "#211A2E" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className="mt-6">
              <span className="text-xs" style={{ color: "#211A2E" }}>COLOR</span>
              <div className="flex gap-2 mt-2.5">
                {colors.map((c) => (
                  <button key={c} className="px-3 h-9 text-xs" style={{ border: "1px solid #EDE0D0", color: "#211A2E" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <AddToBagButton variantId={product.variants[0]?.id ?? ""} inStock={product.stock > 0} />
          </div>
          <p className="text-xs mt-3" style={{ color: "#7A7086" }}>
            SKU: {product.sku} · {product.stock > 0 ? `${product.stock} in stock` : "Currently unavailable"}
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-24">
          <h2 className="font-display text-2xl mb-8" style={{ color: "#211A2E" }}>You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((p) => (
              <Link key={p.id} href={`/product/${p.slug}`} className="product-hover">
                <div className="product-frame">
                  {p.images[0] && <img src={p.images[0].url} alt={`${p.name} product`} className="product-image" />}
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
        </div>
      )}
    </div>
  );
}
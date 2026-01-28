import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SectionContainer } from "../../../../components/website/SectionContainer";
import { GoldButton } from "../../../../components/website/GoldButton";
import { ProductCard } from "../../../../components/website/ProductCard";
import { SkeletonImage } from "../../../../components/website/SkeletonImage";
import { MOCK_PRODUCTS } from "../../../../lib/mock-data";
import { MapPin } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const p = MOCK_PRODUCTS.find((x) => x.id === id);
  if (!p) return { title: "Product | Ushnik-Swarna" };
  return {
    title: `${p.name} | Ushnik-Swarna`,
    description: `${p.name}. ${p.weight ?? ""} ${p.purity ?? ""}. Book and pickup from store.`,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = MOCK_PRODUCTS.find((p) => p.id === id);
  if (!product) notFound();

  const related = MOCK_PRODUCTS.filter(
    (p) => p.id !== id && p.category === product.category
  ).slice(0, 4);
  if (related.length < 4) {
    const more = MOCK_PRODUCTS.filter((p) => p.id !== id && !related.find((r) => r.id === p.id));
    related.push(...more.slice(0, 4 - related.length));
  }

  return (
    <div className="min-h-screen bg-[#fffef7]">
      <SectionContainer className="py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <SkeletonImage
              src={product.image}
              alt={product.name}
              width={600}
              height={600}
              className="aspect-square w-full"
              containerClassName="aspect-square w-full"
            />
          </div>

          <div>
            {product.category && (
              <span className="text-xs font-medium uppercase tracking-wide text-[#888]">
                {product.category}
              </span>
            )}
            <h1 className="mt-1 font-serif text-2xl font-semibold text-[#1a1a1a] sm:text-3xl">
              {product.name}
            </h1>
            <p className="mt-3 text-2xl font-bold text-[#b8962e]">
              ₹{product.price.toLocaleString("en-IN")}
            </p>
            <dl className="mt-6 space-y-2">
              {product.weight && (
                <>
                  <dt className="text-sm text-[#666]">Weight</dt>
                  <dd className="font-medium text-[#1a1a1a]">{product.weight}</dd>
                </>
              )}
              {product.purity && (
                <>
                  <dt className="mt-2 text-sm text-[#666]">Purity</dt>
                  <dd className="font-medium text-[#1a1a1a]">{product.purity}</dd>
                </>
              )}
            </dl>

            <div className="mt-8">
              <GoldButton href={`/booking/success?ref=ORD-${id}-${Date.now().toString(36).slice(-6).toUpperCase()}`}>
                Book Ornament
              </GoldButton>
            </div>

            <div className="mt-8 rounded-2xl border border-[#e8e6e0] bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-[#b8962e]" />
                <div>
                  <h3 className="font-serif font-semibold text-[#1a1a1a]">
                    Store pickup
                  </h3>
                  <p className="mt-1 text-sm text-[#666]">
                    Book and pay online. Collect from your chosen store. We’ll
                    notify you when ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-serif text-xl font-semibold text-[#1a1a1a]">
              Related products
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </section>
        )}
      </SectionContainer>
    </div>
  );
}

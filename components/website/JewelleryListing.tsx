"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SectionContainer } from "./SectionContainer";
import { ProductCard } from "./ProductCard";
import type { ProductCardProps } from "./ProductCard";
import { cn } from "@/lib/utils";

type Cat = { slug: string; label: string };
type Sort = { value: string; label: string };

interface JewelleryListingProps {
  initialProducts: ProductCardProps[];
  categories: Cat[];
  sortOptions: Sort[];
}

const ITEMS_PER_PAGE = 12;
const HOME_CATEGORIES = ["rings", "necklaces", "bangles", "bridal-sets"];

export function JewelleryListing({
  initialProducts,
  categories,
  sortOptions,
}: JewelleryListingProps) {
  const searchParams = useSearchParams();
  const q = searchParams.get("category");
  const [category, setCategory] = useState<string | null>(() => {
    if (!q) return null;
    const valid = [...categories.map((c) => c.slug), ...HOME_CATEGORIES].includes(q);
    return valid ? q : null;
  });
  const [sort, setSort] = useState(sortOptions[0]?.value ?? "newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!q) return;
    const valid = [...categories.map((c) => c.slug), ...HOME_CATEGORIES].includes(q);
    if (valid) {
      setCategory(q);
      setPage(1);
    }
  }, [q, categories]);

  const filtered = useMemo(() => {
    let list = [...initialProducts];
    const withTab = list as (ProductCardProps & { filterTab?: string; category?: string })[];
    if (category) {
      const c = category.toLowerCase();
      const tabMatch = ["gold", "silver", "bridal", "coins"].includes(c);
      if (tabMatch) {
        list = withTab.filter((p) => p.filterTab === c);
      } else {
        list = withTab.filter((p) => {
          const cat = p.category?.toLowerCase().replace(/\s+/g, "-") ?? "";
          return cat === c || cat.includes(c) || (c === "bridal-sets" && cat.includes("bridal"));
        });
      }
    }
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [initialProducts, category, sort]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-[#fffef7]">
      <section className="border-b border-[#e8e6e0] bg-white py-8">
        <SectionContainer>
          <h1 className="font-serif text-3xl font-semibold text-[#1a1a1a]">
            Jewellery
          </h1>
          <p className="mt-1 text-[#666]">
            Browse our collection. Book ornaments and pick up from store.
          </p>
        </SectionContainer>
      </section>

      <SectionContainer className="py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!category}
              onClick={() => {
                setCategory(null);
                setPage(1);
              }}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition",
                !category
                  ? "bg-[#d4af37] text-white"
                  : "bg-white text-[#666] hover:bg-[#fffef7]"
              )}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                role="tab"
                aria-selected={category === c.slug}
                onClick={() => {
                  setCategory(c.slug);
                  setPage(1);
                }}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition",
                  category === c.slug
                    ? "bg-[#d4af37] text-white"
                    : "bg-white text-[#666] hover:bg-[#fffef7]"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-[#666]">
              Sort by
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-[#e8e6e0] bg-white px-3 py-2 text-sm text-[#1a1a1a] focus:border-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.length > 0 ? (
            paginated.map((p) => {
              const { filterTab: _, ...rest } = p as ProductCardProps & { filterTab?: string };
              return <ProductCard key={p.id} {...rest} />;
            })
          ) : (
            <p className="col-span-full py-12 text-center text-[#666]">
              No products in this category yet.
            </p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((x) => Math.max(1, x - 1))}
              disabled={page === 1}
              className="rounded-xl border border-[#e8e6e0] bg-white px-4 py-2 text-sm font-medium text-[#666] transition hover:bg-[#fffef7] disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition",
                  page === n
                    ? "bg-[#d4af37] text-white"
                    : "border border-[#e8e6e0] bg-white text-[#666] hover:bg-[#fffef7]"
                )}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((x) => Math.min(totalPages, x + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-[#e8e6e0] bg-white px-4 py-2 text-sm font-medium text-[#666] transition hover:bg-[#fffef7] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </SectionContainer>
    </div>
  );
}

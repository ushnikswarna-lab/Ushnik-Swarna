"use client";

import Link from "next/link";
import { SkeletonImage } from "./SkeletonImage";
import { GoldButton } from "./GoldButton";
import { cn } from "@/lib/utils";

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  weight?: string;
  purity?: string;
  className?: string;
}

export function ProductCard({
  id,
  name,
  price,
  image,
  category,
  weight,
  purity,
  className,
}: ProductCardProps) {
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <Link href={`/jewellery/${id}`} className="block flex-1">
        <SkeletonImage
          src={image}
          alt={name}
          width={400}
          height={400}
          className="aspect-square w-full"
          containerClassName="aspect-square"
        />
        <div className="flex flex-1 flex-col gap-1 p-4">
          {category && (
            <span className="text-xs font-medium uppercase tracking-wide text-[#888]">
              {category}
            </span>
          )}
          <h3 className="font-serif text-lg font-semibold text-[#1a1a1a] line-clamp-2">
            {name}
          </h3>
          {(weight || purity) && (
            <p className="text-sm text-[#666]">
              {[weight, purity].filter(Boolean).join(" · ")}
            </p>
          )}
          <p className="mt-1 font-semibold text-[#b8962e]">
            ₹{price.toLocaleString("en-IN")}
          </p>
        </div>
      </Link>
      <div className="p-4 pt-0">
        <GoldButton href={`/jewellery/${id}`} variant="outline" className="w-full">
          View & Book
        </GoldButton>
      </div>
    </article>
  );
}

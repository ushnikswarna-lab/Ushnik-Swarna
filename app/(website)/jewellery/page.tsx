import type { Metadata } from "next";
import { Suspense } from "react";
import { JewelleryListing } from "../../../components/website/JewelleryListing";
import { MOCK_PRODUCTS } from "../../../lib/mock-data";

export const metadata: Metadata = {
  title: "Jewellery | Ushnik-Swarna",
  description:
    "Browse gold and silver jewellery. Rings, necklaces, bangles, bridal sets. Book ornaments and pickup from store.",
};

const CATEGORIES = [
  { slug: "gold", label: "Gold" },
  { slug: "silver", label: "Silver" },
  { slug: "bridal", label: "Bridal" },
  { slug: "coins", label: "Coins" },
];

const SORT_OPTIONS = [
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "weight", label: "Weight" },
  { value: "newest", label: "Newest" },
];

function JewelleryFallback() {
  return (
    <div className="min-h-screen bg-[#fffef7] py-12">
      <div className="mx-auto max-w-6xl animate-pulse px-4">
        <div className="h-9 w-48 rounded bg-[#e8e6e0]" />
        <div className="mt-2 h-5 w-80 rounded bg-[#e8e6e0]" />
      </div>
    </div>
  );
}

export default function JewelleryPage() {
  return (
    <Suspense fallback={<JewelleryFallback />}>
      <JewelleryListing
        initialProducts={MOCK_PRODUCTS}
        categories={CATEGORIES}
        sortOptions={SORT_OPTIONS}
      />
    </Suspense>
  );
}

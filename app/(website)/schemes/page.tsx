import type { Metadata } from "next";
import { Suspense } from "react";
import { SchemesPageClient } from "../../../components/website/SchemesPageClient";
import { MOCK_SCHEMES } from "../../../lib/mock-data";

export const metadata: Metadata = {
  title: "Savings Schemes | Ushnik-Swarna",
  description:
    "Gold and silver monthly savings schemes. Save regularly, redeem at maturity.",
};

const MOCK_ACTIVE = [
  {
    id: "gold-11",
    name: "11-Month Gold Plan",
    monthlyAmount: 10000,
    paidCount: 4,
    totalMonths: 11,
    nextDue: "2025-02-05",
  },
];

function SchemesFallback() {
  return (
    <div className="min-h-screen bg-[#fffef7] py-12">
      <div className="mx-auto max-w-6xl animate-pulse px-4">
        <div className="h-9 w-64 rounded bg-[#e8e6e0]" />
        <div className="mt-2 h-5 w-96 rounded bg-[#e8e6e0]" />
      </div>
    </div>
  );
}

export default function SchemesPage() {
  return (
    <Suspense fallback={<SchemesFallback />}>
      <SchemesPageClient
        schemes={MOCK_SCHEMES}
        activeSchemes={MOCK_ACTIVE}
      />
    </Suspense>
  );
}

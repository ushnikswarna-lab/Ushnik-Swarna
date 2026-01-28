"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SectionContainer } from "./SectionContainer";
import { SchemeCard } from "./SchemeCard";
import { GoldButton } from "./GoldButton";
import type { SchemeCardProps } from "./SchemeCard";

type ActiveScheme = {
  id: string;
  name: string;
  monthlyAmount: number;
  paidCount: number;
  totalMonths: number;
  nextDue: string;
};

interface SchemesPageClientProps {
  schemes: SchemeCardProps[];
  activeSchemes: ActiveScheme[];
}

export function SchemesPageClient({
  schemes,
  activeSchemes,
}: SchemesPageClientProps) {
  const searchParams = useSearchParams();
  const [joinId, setJoinId] = useState<string | null>(null);
  const selected = schemes.find((s) => s.id === joinId);

  useEffect(() => {
    const q = searchParams.get("join");
    if (q && schemes.some((s) => s.id === q)) setJoinId(q);
  }, [searchParams, schemes]);

  return (
    <div className="min-h-screen bg-[#fffef7]">
      <section className="border-b border-[#e8e6e0] bg-white py-8">
        <SectionContainer>
          <h1 className="font-serif text-3xl font-semibold text-[#1a1a1a]">
            Savings Schemes
          </h1>
          <p className="mt-1 text-[#666]">
            Monthly gold and silver plans. Join, pay instalments, redeem at
            maturity.
          </p>
        </SectionContainer>
      </section>

      <SectionContainer className="py-8">
        <h2 className="font-serif text-xl font-semibold text-[#1a1a1a]">
          Scheme plans
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {schemes.map((s) => (
            <SchemeCard key={s.id} {...s} />
          ))}
        </div>

        <section className="mt-16">
          <h2 className="font-serif text-xl font-semibold text-[#1a1a1a]">
            My active schemes
          </h2>
          {activeSchemes.length > 0 ? (
            <div className="mt-6 space-y-4">
              {activeSchemes.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-[#e8e6e0] bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-serif font-semibold text-[#1a1a1a]">
                        {a.name}
                      </h3>
                      <p className="mt-1 text-sm text-[#666]">
                        ₹{a.monthlyAmount.toLocaleString("en-IN")}/month ·{" "}
                        {a.paidCount} / {a.totalMonths} paid
                      </p>
                      <p className="mt-1 text-xs text-[#888]">
                        Next due: {a.nextDue}
                      </p>
                    </div>
                    <GoldButton variant="outline" href="/login">Pay instalment</GoldButton>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-[#e8e6e0]">
                      <div
                        className="h-full rounded-full bg-[#d4af37] transition-all"
                        style={{
                          width: `${(a.paidCount / a.totalMonths) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-[#e8e6e0] bg-white p-8 text-center">
              <p className="text-[#666]">
                You have no active schemes. Join a plan above or{" "}
                <Link href="/login" className="font-medium text-[#b8962e] hover:underline">
                  log in
                </Link>{" "}
                to view your schemes.
              </p>
            </div>
          )}
        </section>
      </SectionContainer>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="join-scheme-title"
          onClick={() => setJoinId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="join-scheme-title" className="font-serif text-xl font-semibold text-[#1a1a1a]">
              Join {selected.name}
            </h2>
            <p className="mt-2 text-sm text-[#666]">
              ₹{selected.monthlyAmount.toLocaleString("en-IN")}/month for{" "}
              {selected.durationMonths} months.
            </p>
            {selected.bonus && (
              <p className="mt-1 text-sm text-[#1a1a1a]">{selected.bonus}</p>
            )}
            <div className="mt-6 flex gap-3">
              <GoldButton
                variant="outline"
                className="flex-1"
                onClick={() => setJoinId(null)}
              >
                Cancel
              </GoldButton>
              <GoldButton
                className="flex-1"
                href="/login"
              >
                Continue to pay
              </GoldButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

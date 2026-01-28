"use client";

import { useState } from "react";
import { SectionContainer } from "./SectionContainer";
import { GoldButton } from "./GoldButton";
import { cn } from "@/lib/utils";
import { AlertCircle, Coins, TrendingDown } from "lucide-react";

const MOCK_BALANCE_GMS = 2.5;
const MOCK_RATE_PER_GM = 6500;
const MOCK_TXS = [
  { id: "1", type: "credit" as const, amount: 1, inr: 6500, date: "2025-01-25" },
  { id: "2", type: "credit" as const, amount: 1.5, inr: 9750, date: "2025-01-20" },
  { id: "3", type: "debit" as const, amount: 0.5, inr: 3250, date: "2025-01-18" },
];

export function DigitalGoldPage() {
  const [amount, setAmount] = useState("");
  const inr = amount ? Math.round(parseFloat(amount) * MOCK_RATE_PER_GM) : 0;

  return (
    <div className="min-h-screen bg-[#fffef7]">
      <section className="border-b border-[#e8e6e0] bg-white py-8">
        <SectionContainer>
          <h1 className="font-serif text-3xl font-semibold text-[#1a1a1a]">
            Digital Gold
          </h1>
          <p className="mt-1 text-[#666]">
            Buy 24K gold anytime. Sell when you want — we approve and credit you.
          </p>
        </SectionContainer>
      </section>

      <SectionContainer className="py-8">
        <div id="sell" className="scroll-mt-8" />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-2xl border border-[#e8e6e0] bg-white p-6 shadow-sm">
              <h2 className="font-serif text-lg font-semibold text-[#1a1a1a]">
                Wallet summary
              </h2>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#b8962e]">
                  {MOCK_BALANCE_GMS} g
                </span>
                <span className="text-[#666]">gold</span>
              </div>
              <p className="mt-1 text-sm text-[#666]">
                ≈ ₹{(MOCK_BALANCE_GMS * MOCK_RATE_PER_GM).toLocaleString("en-IN")}{" "}
                (at ₹{MOCK_RATE_PER_GM.toLocaleString("en-IN")}/g)
              </p>
            </div>

            <div className="rounded-2xl border border-[#e8e6e0] bg-white p-6 shadow-sm">
              <h2 className="font-serif text-lg font-semibold text-[#1a1a1a]">
                Buy gold
              </h2>
              <p className="mt-1 text-sm text-[#666]">
                Enter amount in grams. You’ll pay at current rate.
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[180px]">
                  <label htmlFor="buy-amount" className="text-sm text-[#666]">
                    Grams
                  </label>
                  <input
                    id="buy-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#e8e6e0] bg-white px-4 py-2.5 text-[#1a1a1a] focus:border-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  {amount && (
                    <p className="text-sm text-[#666]">
                      ≈ ₹{inr.toLocaleString("en-IN")}
                    </p>
                  )}
                  <GoldButton
                    className="mt-2"
                    disabled={!amount || parseFloat(amount) <= 0}
                  >
                    Buy gold
                  </GoldButton>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e8e6e0] bg-white p-6 shadow-sm">
              <h2 className="font-serif text-lg font-semibold text-[#1a1a1a]">
                Sell gold
              </h2>
              <p className="mt-1 text-sm text-[#666]">
                Submit a sell request. We’ll review and credit your account after
                approval.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <GoldButton variant="outline">Request sell</GoldButton>
                <span className="text-sm text-[#666]">
                  Balance: {MOCK_BALANCE_GMS} g
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <h3 className="font-medium text-amber-900">
                  Admin approval required for sell
                </h3>
                <p className="mt-1 text-sm text-amber-800">
                  Sell requests are reviewed by our team. Once approved, we
                  process the payout to your registered account.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="sticky top-24 rounded-2xl border border-[#e8e6e0] bg-white p-6 shadow-sm">
              <h2 className="font-serif text-lg font-semibold text-[#1a1a1a]">
                Transactions
              </h2>
              <div className="mt-4 space-y-3">
                {MOCK_TXS.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl border border-[#e8e6e0] p-3"
                  >
                    <div className="flex items-center gap-2">
                      {tx.type === "credit" ? (
                        <Coins className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-rose-600" />
                      )}
                      <span className="text-sm font-medium text-[#1a1a1a]">
                        {tx.type === "credit" ? "Buy" : "Sell"} {tx.amount} g
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          tx.type === "credit"
                            ? "text-emerald-600"
                            : "text-rose-600"
                        )}
                      >
                        {tx.type === "credit" ? "+" : "-"}₹
                        {tx.inr.toLocaleString("en-IN")}
                      </span>
                      <p className="text-xs text-[#888]">{tx.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}

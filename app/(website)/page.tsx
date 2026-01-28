import type { Metadata } from "next";
import Link from "next/link";
import { SectionContainer } from "../../components/website/SectionContainer";
import { GoldButton } from "../../components/website/GoldButton";
import { ProductCard } from "../../components/website/ProductCard";
import { SchemeCard } from "../../components/website/SchemeCard";
import { MOCK_PRODUCTS, MOCK_SCHEMES, CATEGORIES } from "../../lib/mock-data";
import {
  Coins,
  TrendingUp,
  Calendar,
  Gem,
  Shield,
  CreditCard,
  Award,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Ushnik-Swarna | Jewellery, Digital Gold & Savings",
  description:
    "Pure Gold. Trusted Legacy. Buy jewellery online, invest in digital gold, and join gold & silver savings schemes.",
};

export default function HomePage() {
  return (
    <>
      {/* A. Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fffef7] to-white py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,175,55,0.12),transparent)]" />
        <SectionContainer className="relative text-center">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#1a1a1a] sm:text-5xl lg:text-6xl">
            Ushnik-Swarna
          </h1>
          <p className="mt-4 text-lg text-[#666] sm:text-xl">
            Pure Gold. Trusted Legacy.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <GoldButton href="/digital-gold">Buy Digital Gold</GoldButton>
            <GoldButton href="/jewellery" variant="outline">
              View Jewellery
            </GoldButton>
            <GoldButton href="/schemes" variant="outline">
              Join Schemes
            </GoldButton>
          </div>
        </SectionContainer>
      </section>

      {/* B. Quick Services Bar */}
      <section className="border-y border-[#e8e6e0] bg-white py-4">
        <SectionContainer>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-6">
            <Link
              href="/digital-gold"
              className="flex items-center gap-3 rounded-xl p-4 transition hover:bg-[#fffef7]"
            >
              <div className="rounded-lg bg-amber-50 p-2">
                <Coins className="h-5 w-5 text-[#b8962e]" />
              </div>
              <span className="text-sm font-medium text-[#1a1a1a]">Buy Gold</span>
            </Link>
            <Link
              href="/digital-gold#sell"
              className="flex items-center gap-3 rounded-xl p-4 transition hover:bg-[#fffef7]"
            >
              <div className="rounded-lg bg-amber-50 p-2">
                <TrendingUp className="h-5 w-5 text-[#b8962e]" />
              </div>
              <span className="text-sm font-medium text-[#1a1a1a]">Sell Gold</span>
            </Link>
            <Link
              href="/schemes"
              className="flex items-center gap-3 rounded-xl p-4 transition hover:bg-[#fffef7]"
            >
              <div className="rounded-lg bg-amber-50 p-2">
                <Calendar className="h-5 w-5 text-[#b8962e]" />
              </div>
              <span className="text-sm font-medium text-[#1a1a1a]">
                Savings Scheme
              </span>
            </Link>
            <Link
              href="/jewellery"
              className="flex items-center gap-3 rounded-xl p-4 transition hover:bg-[#fffef7]"
            >
              <div className="rounded-lg bg-amber-50 p-2">
                <Gem className="h-5 w-5 text-[#b8962e]" />
              </div>
              <span className="text-sm font-medium text-[#1a1a1a]">
                Book Ornament
              </span>
            </Link>
          </div>
        </SectionContainer>
      </section>

      {/* C. Jewellery Categories */}
      <section className="py-14 sm:py-20">
        <SectionContainer>
          <h2 className="font-serif text-2xl font-semibold text-[#1a1a1a] sm:text-3xl">
            Jewellery Categories
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/jewellery?category=${c.slug}`}
                className="flex flex-col items-center rounded-2xl border border-[#e8e6e0] bg-white p-6 shadow-sm transition hover:border-[#d4af37]/40 hover:shadow-md"
              >
                <span className="font-serif text-lg font-medium text-[#1a1a1a]">
                  {c.label}
                </span>
                <ChevronRight className="mt-2 h-4 w-4 text-[#888]" />
              </Link>
            ))}
          </div>
        </SectionContainer>
      </section>

      {/* D. Featured Products */}
      <section className="bg-white py-14 sm:py-20">
        <SectionContainer>
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-2xl font-semibold text-[#1a1a1a] sm:text-3xl">
              Featured Products
            </h2>
            <Link
              href="/jewellery"
              className="text-sm font-medium text-[#b8962e] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_PRODUCTS.slice(0, 6).map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </SectionContainer>
      </section>

      {/* E. Digital Gold Explanation */}
      <section className="bg-[#fffef7] py-14 sm:py-20">
        <SectionContainer>
          <h2 className="font-serif text-2xl font-semibold text-[#1a1a1a] sm:text-3xl">
            Digital Gold
          </h2>
          <p className="mt-2 max-w-2xl text-[#666]">
            Buy 24K digital gold anytime. It sits in your wallet. When you sell,
            we process your request and credit you after approval.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#e8e6e0] bg-white p-6 shadow-sm">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#d4af37] text-sm font-bold text-white">
                1
              </span>
              <h3 className="mt-4 font-serif text-lg font-semibold text-[#1a1a1a]">
                Buy
              </h3>
              <p className="mt-1 text-sm text-[#666]">
                Add gold to your wallet. Pay via UPI, card, or net banking.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e8e6e0] bg-white p-6 shadow-sm">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#d4af37] text-sm font-bold text-white">
                2
              </span>
              <h3 className="mt-4 font-serif text-lg font-semibold text-[#1a1a1a]">
                Store
              </h3>
              <p className="mt-1 text-sm text-[#666]">
                Your gold is stored securely. View balance anytime in your
                dashboard.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e8e6e0] bg-white p-6 shadow-sm">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#d4af37] text-sm font-bold text-white">
                3
              </span>
              <h3 className="mt-4 font-serif text-lg font-semibold text-[#1a1a1a]">
                Sell
              </h3>
              <p className="mt-1 text-sm text-[#666]">
                Request a sell. We approve and credit your account. Simple and
                transparent.
              </p>
            </div>
          </div>
          <div className="mt-8">
            <GoldButton href="/digital-gold">Go to Digital Gold</GoldButton>
          </div>
        </SectionContainer>
      </section>

      {/* F. Savings Scheme Promotion */}
      <section className="py-14 sm:py-20">
        <SectionContainer>
          <h2 className="font-serif text-2xl font-semibold text-[#1a1a1a] sm:text-3xl">
            Savings Schemes
          </h2>
          <p className="mt-2 max-w-2xl text-[#666]">
            Monthly gold and silver plans. Save regularly and redeem as jewellery
            or cash at maturity.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_SCHEMES.map((s) => (
              <SchemeCard key={s.id} {...s} />
            ))}
          </div>
          <div className="mt-8">
            <GoldButton href="/schemes">View all schemes</GoldButton>
          </div>
        </SectionContainer>
      </section>

      {/* G. Trust Badges */}
      <section className="border-t border-[#e8e6e0] bg-white py-14 sm:py-20">
        <SectionContainer>
          <h2 className="sr-only">Trust & assurance</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-amber-50 p-4">
                <Shield className="h-8 w-8 text-[#b8962e]" />
              </div>
              <h3 className="mt-3 font-serif text-lg font-semibold text-[#1a1a1a]">
                BIS Hallmark
              </h3>
              <p className="mt-1 text-sm text-[#666]">
                Certified purity on gold jewellery.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-amber-50 p-4">
                <CreditCard className="h-8 w-8 text-[#b8962e]" />
              </div>
              <h3 className="mt-3 font-serif text-lg font-semibold text-[#1a1a1a]">
                Secure Payments
              </h3>
              <p className="mt-1 text-sm text-[#666]">
                Safe checkout with trusted gateways.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-amber-50 p-4">
                <Award className="h-8 w-8 text-[#b8962e]" />
              </div>
              <h3 className="mt-3 font-serif text-lg font-semibold text-[#1a1a1a]">
                Trusted Sellers
              </h3>
              <p className="mt-1 text-sm text-[#666]">
                Years of expertise in gold and jewellery.
              </p>
            </div>
          </div>
        </SectionContainer>
      </section>
    </>
  );
}

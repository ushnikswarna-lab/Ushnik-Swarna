import type { Metadata } from "next";
import { SectionContainer } from "../../../../components/website/SectionContainer";
import { GoldButton } from "../../../../components/website/GoldButton";
import { CheckCircle2, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Booking confirmed | Ushnik-Swarna",
  description: "Your ornament booking is confirmed. Collect from store.",
};

interface PageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function BookingSuccessPage({ searchParams }: PageProps) {
  const { ref } = await searchParams;
  const reference = ref ?? "—";

  return (
    <div className="min-h-screen bg-[#fffef7] py-16">
      <SectionContainer className="flex flex-col items-center text-center">
        <div className="rounded-full bg-emerald-50 p-4">
          <CheckCircle2 className="h-16 w-16 text-emerald-600" />
        </div>
        <h1 className="mt-6 font-serif text-2xl font-semibold text-[#1a1a1a] sm:text-3xl">
          Booking confirmed
        </h1>
        <p className="mt-2 text-[#666]">
          Thank you. We’ll prepare your order for pickup.
        </p>
        <div className="mt-6 rounded-2xl border border-[#e8e6e0] bg-white px-6 py-4 shadow-sm">
          <p className="text-sm text-[#666]">Booking reference</p>
          <p className="mt-1 font-mono font-semibold text-[#1a1a1a]">
            {reference}
          </p>
        </div>
        <div className="mt-8 flex max-w-md flex-col gap-4 rounded-2xl border border-[#e8e6e0] bg-white p-6 text-left shadow-sm">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 shrink-0 text-[#b8962e]" />
            <div>
              <h2 className="font-serif font-semibold text-[#1a1a1a]">
                Store pickup
              </h2>
              <p className="mt-1 text-sm text-[#666]">
                We’ll notify you when your order is ready. Visit your chosen
                store with this reference and ID to collect.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-10">
          <GoldButton href="/dashboard">Go to Dashboard</GoldButton>
        </div>
      </SectionContainer>
    </div>
  );
}

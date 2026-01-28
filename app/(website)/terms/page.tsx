import type { Metadata } from "next";
import { SectionContainer } from "../../../components/website/SectionContainer";

export const metadata: Metadata = {
  title: "Terms & Conditions | Ushnik-Swarna",
  description: "Terms of use for Ushnik-Swarna jewellery and digital gold platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#fffef7] py-12">
      <SectionContainer className="prose prose-neutral max-w-3xl">
        <h1 className="font-serif text-3xl font-semibold text-[#1a1a1a]">
          Terms & Conditions
        </h1>
        <p className="mt-2 text-[#666]">
          By using Ushnik-Swarna you agree to these terms. They cover jewellery
          orders, digital gold, savings schemes, and store pickup. Pricing and
          availability are subject to change. Disputes are subject to
          applicable law.
        </p>
        <p className="mt-4 text-sm text-[#666]">
          For complete terms, please contact us. We may update this page
          periodically.
        </p>
      </SectionContainer>
    </div>
  );
}

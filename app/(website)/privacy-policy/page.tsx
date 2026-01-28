import type { Metadata } from "next";
import { SectionContainer } from "../../../components/website/SectionContainer";

export const metadata: Metadata = {
  title: "Privacy Policy | Ushnik-Swarna",
  description: "How we collect, use, and protect your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#fffef7] py-12">
      <SectionContainer className="prose prose-neutral max-w-3xl">
        <h1 className="font-serif text-3xl font-semibold text-[#1a1a1a]">
          Privacy Policy
        </h1>
        <p className="mt-2 text-[#666]">
          We collect and use your information to run our jewellery, digital
          gold, and savings scheme services. We do not sell your data. We use
          secure systems and comply with applicable data protection laws.
        </p>
        <p className="mt-4 text-sm text-[#666]">
          For full terms, please contact us. This page may be updated from time
          to time.
        </p>
      </SectionContainer>
    </div>
  );
}

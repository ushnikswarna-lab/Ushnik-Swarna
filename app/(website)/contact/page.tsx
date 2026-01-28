import type { Metadata } from "next";
import { SectionContainer } from "../../../components/website/SectionContainer";
import { GoldButton } from "../../../components/website/GoldButton";
import { Mail, Phone, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact | Ushnik-Swarna",
  description: "Get in touch for jewellery, digital gold, and scheme enquiries.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#fffef7] py-12">
      <SectionContainer>
        <h1 className="font-serif text-3xl font-semibold text-[#1a1a1a]">
          Contact us
        </h1>
        <p className="mt-2 max-w-2xl text-[#666]">
          Reach out for orders, digital gold, savings schemes, or store visits.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <div className="flex items-start gap-4 rounded-2xl border border-[#e8e6e0] bg-white p-6 shadow-sm">
            <Mail className="h-5 w-5 shrink-0 text-[#b8962e]" />
            <div>
              <h2 className="font-serif font-semibold text-[#1a1a1a]">Email</h2>
              <a
                href="mailto:hello@ushnik-swarna.com"
                className="mt-1 block text-sm text-[#666] hover:text-[#b8962e]"
              >
                hello@ushnik-swarna.com
              </a>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-2xl border border-[#e8e6e0] bg-white p-6 shadow-sm">
            <Phone className="h-5 w-5 shrink-0 text-[#b8962e]" />
            <div>
              <h2 className="font-serif font-semibold text-[#1a1a1a]">Phone</h2>
              <a
                href="tel:+919876543210"
                className="mt-1 block text-sm text-[#666] hover:text-[#b8962e]"
              >
                +91 98765 43210
              </a>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-2xl border border-[#e8e6e0] bg-white p-6 shadow-sm">
            <MapPin className="h-5 w-5 shrink-0 text-[#b8962e]" />
            <div>
              <h2 className="font-serif font-semibold text-[#1a1a1a]">Stores</h2>
              <p className="mt-1 text-sm text-[#666]">
                Store addresses and hours coming soon.
              </p>
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}

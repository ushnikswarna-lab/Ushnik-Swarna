import Link from "next/link";
import { SectionContainer } from "./SectionContainer";

const footerLinks = [
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
];

export function WebsiteFooter() {
  return (
    <footer className="border-t border-[#e8e6e0] bg-[#fffef7]">
      <SectionContainer as="div" className="py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-serif text-lg font-semibold text-[#1a1a1a]">
              Ushnik-Swarna
            </p>
            <p className="mt-1 text-sm text-[#666]">
              Pure Gold. Trusted Legacy.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#666]">
              Contact
            </p>
            <ul className="mt-2 space-y-1">
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-[#444] hover:text-[#b8962e]"
                >
                  Get in touch
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#666]">
              Policies
            </p>
            <ul className="mt-2 space-y-1">
              {footerLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-[#444] hover:text-[#b8962e]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#666]">
              Stores
            </p>
            <p className="mt-2 text-sm text-[#444]">
              Visit our stores for pickups and consultations. Locations coming soon.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-[#e8e6e0] pt-6 text-center text-sm text-[#888]">
          © {new Date().getFullYear()} Ushnik-Swarna. All rights reserved.
        </div>
      </SectionContainer>
    </footer>
  );
}

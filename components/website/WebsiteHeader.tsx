"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { GoldButton } from "./GoldButton";
import { SectionContainer } from "./SectionContainer";

const nav = [
  { label: "Home", href: "/" },
  { label: "Jewellery", href: "/jewellery" },
  { label: "Digital Gold", href: "/digital-gold" },
  { label: "Savings Schemes", href: "/schemes" },
];

export function WebsiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e8e6e0] bg-white/95 backdrop-blur">
      <SectionContainer as="div" className="flex h-16 items-center justify-between lg:h-18">
        <Link
          href="/"
          className="font-serif text-xl font-semibold text-[#1a1a1a] sm:text-2xl"
        >
          Ushnik-Swarna
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[#444] transition hover:text-[#b8962e]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <GoldButton href="/jewellery" variant="outline">
            Book Ornament
          </GoldButton>
          <GoldButton href="/login">Login</GoldButton>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-[#444] hover:bg-[#fffef7] md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </SectionContainer>

      {open && (
        <div className="border-t border-[#e8e6e0] bg-white md:hidden">
          <SectionContainer as="div" className="flex flex-col gap-1 py-4">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[#444] hover:bg-[#fffef7] hover:text-[#b8962e]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 px-4">
              <GoldButton href="/jewellery" variant="outline" className="w-full justify-center">
                Book Ornament
              </GoldButton>
            </div>
          </SectionContainer>
        </div>
      )}
    </header>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const mainNav = [
  { title: "Home", href: "/" },
  { title: "Accommodations", href: "/accommodations" },
  { title: "Amenities", href: "/amenities" },
  { title: "Packages", href: "/packages" },
  { title: "Gallery", href: "/gallery" },
  { title: "Events", href: "/events" },
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
];

const secondaryNav = [
  { title: "Book Now", href: "/bookings" },
  { title: "Help & FAQs", href: "/help" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [openAccordion, setOpenAccordion] = React.useState<string | null>(null);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <nav className="container flex h-16 items-center justify-between px-4">
        {/* LOGO - Left */}
        <div className="flex-1 flex justify-start">
          <motion.div
            whileHover={{ scale: 1.05, opacity: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="relative h-full w-auto origin-left whitespace-nowrap"
          >
            <Link href="/" className="flex items-end relative gap-2">
              <motion.div whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <img
                  src="/logo.png"
                  alt="P2tEcostay Logo"
                  className="img-fluid h-[60px] w-auto"
                />
              </motion.div>
            </Link>
          </motion.div>
        </div>

        {/* DESKTOP MENU - Middle */}
        <div className="hidden lg:flex flex-[2] justify-center items-center gap-8">
          <div className="flex items-center gap-6">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium text-foreground transition-colors hover:text-primary",
                  isActive(item.href) && "text-primary"
                )}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>

        {/* ACTIONS - Right */}
        <div className="hidden lg:flex flex-1 justify-end items-center gap-3">
          <Button asChild>
            <Link
              href="/bookings"
              className={cn(
                "text-sm font-medium",
                isActive("/bookings") && "ring-2 ring-primary ring-offset-2"
              )}
            >
              Book Now
            </Link>
          </Button>
        </div>

        {/* MOBILE MENU */}
        <div className="flex items-center gap-2 lg:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="h-full overflow-y-auto">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">Main navigation</SheetDescription>
              <div className="mt-8 flex flex-col space-y-4">
                {[
                  { title: "Explore", items: mainNav },
                  { title: "Experience", items: secondaryNav },
                ].map((section) => {
                  const isOpen = openAccordion === section.title;
                  return (
                    <div key={section.title}>
                      <button
                        onClick={() => setOpenAccordion(isOpen ? null : section.title)}
                        className="flex w-full items-center justify-between py-2 text-lg font-semibold text-foreground"
                      >
                        {section.title}
                        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                          <ChevronDown className="h-5 w-5" />
                        </motion.div>
                      </button>
                      <motion.div
                        initial={false}
                        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 space-y-2 border-l-2 border-muted pl-4">
                          {section.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={cn(
                                "block py-2 text-base text-foreground hover:text-primary hover:bg-muted rounded-md px-2 transition-colors",
                                isActive(item.href) && "text-primary"
                              )}
                            >
                              {item.title}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
                <Link
                  href="/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-primary underline underline-offset-4"
                >
                  Book Now
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  );
}
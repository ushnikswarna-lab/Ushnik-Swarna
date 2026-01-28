"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Store,
  Phone,
  User,
  Heart,
  ShoppingBag,
  Truck,
  ChevronDown,
  Coins,
  Percent,
  Contact,
  Mail,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { MAIN_NAV, MEGA_MENU } from "./header-data";

const GOLD = "#D4AF37";

// Dummy auth – replace with useAuth when AuthProvider wraps website
const useDummyAuth = () => ({ user: null });

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useDummyAuth();
  const loggedIn = !!user;

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [megaMenu, setMegaMenu] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  const openLogin = () => setLoginOpen(true);
  const closeLogin = () => setLoginOpen(false);

  const handleAccountClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (loggedIn) router.push("/dashboard");
    else openLogin();
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (loggedIn) router.push("/wishlist");
    else openLogin();
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href.split("?")[0]);
  };

  return (
    <>
      <header className="sticky top-0 z-50 p-0 m-0 w-full bg-background shadow">
        {/* Tier 1: Utility bar */}
        <div className="border-b border-primary/20">
          <div className="container px-4 flex flex-wrap items-center justify-between gap-3 py-2 lg:px-6">
            {/* Logo + tagline */}
            <Link href="/" className="flex items-center gap-2 lg:gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#D4AF37]">
                <div className="h-2 w-2 rounded-full" />
              </div>
              <div>
                <span className="text-lg font-semibold">
                  Ushnik-Swarna
                </span>
                <p className="text-xs text-[#666]">Pure Gold. Trusted Legacy.</p>
              </div>
            </Link>
            {/* Store, Phone – hidden on small */}
              <Link
                href="/contact"
                className="items-center hidden md:flex gap-2 text-sm font-semibold text-foreground hover:text-primary"
              >
                <Store className="h-6 w-6" />
                <span className="hidden lg:flex">Store</span>
              </Link>
              <Link
                href="tel:+918025127900"
                className="items-center hidden md:flex gap-2 text-sm font-semibold text-foreground hover:text-primary"
              >
                <Phone className="h-6 w-6" />
                <span className="hidden lg:flex">+91 8025 <br/>127 900</span>
              </Link>
              <div className="hidden relative lg:block">
                <Input
                  placeholder="Search for Gold Earrings"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-3 pr-9 text-sm "
                />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              </div>
              <Link
                href="/schemes"
                className="hidden items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary sm:flex"
              >
                <Coins className="h-6 w-6"/>
                <span className="hidden md:flex">Gold <br/>Scheme</span>
              </Link>
              <Link
                href="/schemes"
                className="hidden items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary sm:flex"
              >
                <IndianRupee className="h-6 w-6"/>
                <span className="hidden lg:flex">Today <br/>Prices</span>
              </Link>
              <button
                type="button"
                onClick={handleAccountClick}
                className="rounded-lg p-2 font-semibold text-foreground hover:text-primary"
                aria-label="My Account"
              >
                <User className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={handleWishlistClick}
                className="rounded-lg p-2 font-semibold text-foreground hover:text-primary"
                aria-label="Wishlist"
              >
                <Heart className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="rounded-lg p-2 font-semibold text-foreground hover:text-primary"
                aria-label="Cart"
              >
                <ShoppingBag className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 font-semibold text-foreground hover:text-primary"
                aria-label="Menu"
              >
                <Menu className="h-6 w-6" />
              </button>
          </div>
        </div>

        {/* Tier 2: Main nav */}
        <nav className="hidden bg-white lg:block">
          <div className="relative container flex items-center justify-between gap-4 px-4">
            {/* Main Nav */}
            <div className="flex w-full items-center justify-between">
              {MAIN_NAV.map((item) => {
                const hasMega = "megaMenu" in item && item.megaMenu;
                const active = isActive(item.href);

                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => hasMega && setMegaMenu(item.href)}
                    onMouseLeave={() => setMegaMenu(null)}
                  >
                    {hasMega ? (
                      /* ---------- MEGA MENU TRIGGER ---------- */
                      <span
                        className={cn(
                          "group relative block cursor-default px-3 py-3 text-sm font-medium transition-colors",
                          active || megaMenu === item.href
                            ? "text-primary"
                            : "text-foreground hover:text-primary"
                        )}
                      >
                        {"icon" in item && item.icon === "truck" && (
                          <Truck className="mr-1 inline h-5 w-5" />
                        )}
                        {item.title}

                        {/* underline */}
                        <span
                          className={cn(
                            "pointer-events-none absolute left-1/2 -bottom-0 h-[2px] bg-primary transition-all duration-300 ease-out",
                            active || megaMenu === item.href
                              ? "w-full -translate-x-1/2"
                              : "w-0 group-hover:w-full group-hover:-translate-x-1/2"
                          )}
                        />
                      </span>
                    ) : (
                      /* ---------- NORMAL LINK ---------- */
                      <Link
                        href={item.href}
                        className={cn(
                          "group relative block px-3 py-3 text-sm font-medium transition-colors",
                          active
                            ? "text-primary"
                            : "text-foreground hover:text-primary"
                        )}
                      >
                        {"icon" in item && item.icon === "truck" && (
                          <Truck className="mr-1 inline h-5 w-5" />
                        )}
                        {item.title}

                        {/* underline */}
                        <span
                          className={cn(
                            "pointer-events-none absolute left-1/2 -bottom-0 h-[2px] bg-primary transition-all duration-300 ease-out",
                            active
                              ? "w-full -translate-x-1/2"
                              : "w-0 group-hover:w-full group-hover:-translate-x-1/2"
                          )}
                        />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <Link
                href="/jewellery?offers=1"
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Percent className="h-4 w-4" />
                Offers
              </Link>
            </div>
          </div>

          {/* ================= MEGA MENU ================= */}
          {megaMenu && (
            <div
              className="absolute left-0 right-0 top-full z-40 border-t border-primary/10 bg-background shadow-lg"
              onMouseEnter={() => setMegaMenu(megaMenu)}
              onMouseLeave={() => setMegaMenu(null)}
            >
              <div className="container grid grid-cols-12 gap-8 px-6 py-8">
                {/* Column 1 */}
                <div className="col-span-3">
                  <h3 className="mb-3 border-b pb-2 text-sm font-semibold">
                    Shop by Style
                  </h3>
                  <ul className="space-y-2">
                    {MEGA_MENU.shopByStyle.map((s) => (
                      <li key={s.href}>
                        <Link
                          href={s.href}
                          className="text-sm text-muted-foreground hover:text-gold"
                        >
                          {s.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 2 */}
                <div className="col-span-3">
                  <h3 className="mb-3 border-b pb-2 text-sm font-semibold">
                    Shop by Price
                  </h3>
                  <ul className="space-y-2">
                    {MEGA_MENU.shopByPrice.map((s) => (
                      <li key={s.href}>
                        <Link
                          href={s.href}
                          className="text-sm text-muted-foreground hover:text-gold"
                        >
                          {s.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 3 */}
                <div className="col-span-3">
                  <h3 className="mb-3 border-b pb-2 text-sm font-semibold">
                    Shop by Occasion
                  </h3>
                  <ul className="space-y-2">
                    {MEGA_MENU.shopByOccasion.map((s) => (
                      <li key={s.href}>
                        <Link
                          href={s.href}
                          className="text-sm text-muted-foreground hover:text-gold"
                        >
                          {s.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Image / Promo */}
                <div className="col-span-3">
                  <div className="aspect-[4/5] rounded-lg bg-gradient-to-br from-amber-50 to-rose-50" />
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-serif">Menu</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-4">
            <div className="relative">
              <Input
                placeholder="Search"
                className="pr-9"
              />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888]" />
            </div>
            {MAIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block py-2 text-sm font-medium",
                  isActive(item.href) ? "text-[#b8962e]" : "text-[#444]"
                )}
              >
                {item.title}
              </Link>
            ))}
            <Link
              href="/schemes"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-2 text-sm font-medium text-[#444]"
            >
              <Coins className="h-4 w-4 text-primary" />
              Gold Scheme
            </Link>
            <Link
              href="/jewellery?offers=1"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-4 py-2 text-center text-sm font-medium text-white"
              style={{ backgroundColor: GOLD }}
            >
              Offers
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cart offcanvas */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="right" className="w-full max-w-sm sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-serif">Cart</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center">
            <ShoppingBag className="h-12 w-12 text-[#e8e6e0]" />
            <p className="text-sm text-[#666]">Your cart is empty.</p>
            <Button
              onClick={() => { setCartOpen(false); }}
              asChild
            >
              <Link href="/jewellery">Continue Shopping</Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Login modal */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Sign in</DialogTitle>
            <DialogDescription>
              Sign in to access your account, wishlist, and orders.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button asChild className="w-full" style={{ backgroundColor: GOLD }}>
              <Link href="/login?redirect=/dashboard" onClick={closeLogin}>
                Go to Login
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/register" onClick={closeLogin}>
                Create account
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

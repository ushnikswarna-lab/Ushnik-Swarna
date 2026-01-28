"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  ScanBarcode,
  LayoutGrid,
  Coins,
  HelpCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BOTTOMBAR_ITEMS } from "./header-data";

const GOLD = "#D4AF37";

// Dummy auth – replace with useAuth when AuthProvider wraps website
const useDummyAuth = () => ({ user: null });
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  user: User,
  barcode: ScanBarcode,
  grid: LayoutGrid,
  coins: Coins,
  help: HelpCircle,
};

export function Bottombar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useDummyAuth();
  const loggedIn = !!user;

  const [loginOpen, setLoginOpen] = React.useState(false);

  const openLogin = () => setLoginOpen(true);
  const closeLogin = () => setLoginOpen(false);

  const handleAccountClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    if (loggedIn) router.push(href);
    else openLogin();
  };

  const isActive = (href: string, id: string) => {
    if (id === "account") return pathname?.startsWith("/dashboard");
    if (id === "categories") return pathname?.startsWith("/jewellery");
    if (id === "scheme") return pathname?.startsWith("/schemes");
    if (id === "help") return pathname?.startsWith("/contact");
    return pathname === href;
  };

  return (
    <>
     <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-primary/10 bg-background shadow-lg md:hidden"
        aria-label="Bottom navigation"
      >
        {BOTTOMBAR_ITEMS.map((item) => {
          const Icon = ICONS[item.icon] ?? User;
          const active = isActive(item.href, item.id);

          if (item.id === "account") {
            return (
              <button
                key={item.id}
                type="button"
                onClick={(e) => handleAccountClick(e, item.href)}
                className="flex flex-col items-center gap-1 px-3 py-2"
                aria-label={item.label}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active ? "text-primary" : "text-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    active ? "text-primary" : "text-foreground"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group relative flex flex-col items-center gap-1 px-3 py-2 transition-colors",
                active ? "text-primary" : "text-foreground hover:text-primary"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  active ? "text-primary" : "text-foreground group-hover:text-primary"
                )}
              />

              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-foreground group-hover:text-primary"
                )}
              >
                {item.label}
              </span>

              {/* TOP BORDER ANIMATION */}
              <span
                className={cn(
                  "pointer-events-none absolute top-0 left-1/2 h-[2px] bg-primary transition-all duration-300 ease-out",
                  active
                    ? "w-full -translate-x-1/2"
                    : "w-0 group-hover:w-full group-hover:-translate-x-1/2"
                )}
              />
            </Link>
          );
        })}
      </nav>


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
              <Link href="/login" onClick={closeLogin}>
                Create account
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

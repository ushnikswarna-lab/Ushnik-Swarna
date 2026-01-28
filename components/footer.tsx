"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Linkedin, Mail, Phone, MapPin, CalendarRange, Camera, Instagram } from "lucide-react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { NewsletterSignup } from "./newsletter-signup";
import { WeatherWidget } from "./weather-widget";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-primary/10 bg-background">
      {/* subtle background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.08),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_240%_120%,hsl(var(--primary)/0.08),transparent_100%)]" />
      <div className="relative container px-4">
        <div className="grid gap-12 lg:grid-cols-[3fr_6fr_3fr] py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link href="/" className="flex items-end gap-2">
              <motion.div whileHover={{ rotate: [0, -6, 6, -3, 0] }} transition={{ duration: 0.4 }}>
                <Image
                  src="/logo.png"
                  alt="P2tEcostay Logo"
                  height={75}
                  width={150}
                  priority
                  className="object-contain"
                />
              </motion.div>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              A premium eco-friendly resort crafted for slow travel, intimate gatherings, and restorative getaways.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <SocialButton icon={<Instagram />} href="https://www.instagram.com/p2tecostay/" />
              <SocialButton icon={<Mail />} href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@p2tecostay.com'}`} />
              <ThemeToggle />
            </div>
          </motion.div>
          <div className="grid gap-12 md:grid-cols-4 grid-cols-2">
            <FooterColumn
              title="About Resort"
              links={[
                { label: "About Us", href: "/about" },
                { label: "Accommodations", href: "/accommodations" },
                { label: "Packages & Offers", href: "/packages" },
                { label: "Amenities", href: "/amenities" },
                { label: "Special Packages", href: "/packages" },
              ]}
            />

            <FooterColumn
              title="Stay With Us"
              links={[
                { label: "Gallery", href: "/gallery" },
                { label: "Events", href: "/events" },
                { label: "Book Now", href: "/bookings" },
                { label: "Check Availability", href: "/bookings" },
                { label: "Visit & Travel", href: "/visit" },
              ]}
            />

            <FooterColumn
              title="Help & Info"
              links={[
                { label: "Help & Support", href: "/help" },
                { label: "FAQs", href: "/faq" },
                { label: "News & Updates", href: "/news" },
                { label: "Contact Us", href: "/contact" },
                { label: "Track Booking", href: "/track-booking" },
              ]}
            />
            <FooterColumn
              title="Legal"
              links={[
                { label: "Privacy Policy", href: "/privacy-policy" },
                { label: "Terms & Conditions", href: "/terms" },
                { label: "Code of Conduct", href: "/code-of-conduct" },
                { label: "Site Map", href: "/site-map" },
                { label: "Developers", href: "https://github.com/developer" },
              ]}
            />

          </div>
          <motion.div
            id="newsletter"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-6"
          >
            <div>
              <NewsletterSignup variant="compact" />
            </div>
            <div>
              <WeatherWidget />
            </div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-primary/10 py-4">
          <p className="text-xs text-muted-foreground">
            © 2025 P2tEcostay Resort. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------ helpers ------------------ */

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <h4 className="mb-4 text-sm font-semibold tracking-wide text-foreground">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label + '-' + link.href}>
            <Link
              href={link.href}
              className="group text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="relative">
                {link.label}
                <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-primary transition-all group-hover:w-full" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function SocialButton({ icon, href }: { icon: React.ReactNode; href?: string }) {
  const button = (
    <Button
      variant="ghost"
      size="icon"
    >
      {icon}
    </Button>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {button}
      </a>
    );
  }

  return button;
}

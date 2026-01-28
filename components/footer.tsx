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
    <footer className="relative overflow-hidden border-t border-primary/10 bg-primary/5">
      <div className="relative border-b border-primary/40">
        <div className="container p-4">
        {/* <div className="grid gap-12 md:grid-cols-3 grid-cols-2"> */}
          <div className="flex items-center justify-between">
            <div className="flex gap-5">
              <div className="flex items-center justify-center gap-3">
                <Phone className="text-primary"/>
                <div className="flex flex-col gap-1">
                  <h2 className="">
                    Call Us :
                  </h2>
                  <p className="text-xs font-semibold">
                    +91 XXXX XXX XXX
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Mail className="text-primary"/>
                <div className="flex flex-col gap-1">
                  <h2 className="">
                    Email Us :
                  </h2>
                  <p className="text-xs font-semibold">
                    +91 XXXX XXX XXX
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
      <div className="relative container px-4">
        <div className="grid gap-12 lg:grid-cols-[9fr_3fr] py-10">
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-primary/40 py-4">
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

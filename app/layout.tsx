import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";
import { ReCaptchaProvider } from "@/components/recaptcha-provider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { SITE_NAME, BASE_URL, getPageDescription, getLodgingBusinessSchema } from "@/lib/seo";

const SITE_SUFFIX = ` | ${SITE_NAME}`;

function formatSegment(str: string) {
  return str.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export async function generateMetadata(): Promise<Metadata> {
  const fullPath = (await headers()).get("x-next-pathname") || "/";
  const segments = fullPath.split("/").filter(Boolean);

  let title = SITE_NAME;

  if (segments.length === 1) {
    title = `${formatSegment(segments[0])}${SITE_SUFFIX}`;
  } else if (segments.length >= 2) {
    const parent = formatSegment(segments[0]);
    const child = formatSegment(segments[segments.length - 1]);
    title = `${child} - ${parent}${SITE_SUFFIX}`;
  }

  const canonicalPath = fullPath.startsWith("/") ? fullPath : `/${fullPath}`;
  const description = getPageDescription(canonicalPath);

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}${canonicalPath}` },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `${BASE_URL}${canonicalPath}`,
      title,
      description,
      siteName: SITE_NAME,
      images: [{ url: `${BASE_URL}/logo.png`, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${BASE_URL}/logo.png`],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    icons: {
      icon: [
        { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
      ],
      apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
      shortcut: "/favicon-32.png",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = getLodgingBusinessSchema();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}`} />
        <Script id="ga4-init">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}');
          `}
        </Script>

        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ReCaptchaProvider>
            {children}
            <Toaster />
            <SonnerToaster position="bottom-right" richColors />
          </ReCaptchaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

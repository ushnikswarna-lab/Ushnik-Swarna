import { Lora } from "next/font/google";
import "./website.css";
import { WebsiteHeader } from "../../components/website/WebsiteHeader";
import { WebsiteFooter } from "../../components/website/WebsiteFooter";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`ushnik-website ${lora.variable} flex min-h-screen flex-col bg-[#fffef7] font-sans text-[#1a1a1a]`}>
      <WebsiteHeader />
      <main className="flex-1">{children}</main>
      <WebsiteFooter />
    </div>
  );
}

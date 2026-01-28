import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Topbar } from "@/components/topbar";
import Script from "next/script";
import { Bottombar } from "@/components/bottombar";

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <Bottombar />
      {/* <QuickContactManager /> */}
      <Script
        id="tawk-to"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
            (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/6974557c678dd919824c7a6b/1jfn6rroo';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
            })();
          `,
        }}
      />
    </div>
  );
}


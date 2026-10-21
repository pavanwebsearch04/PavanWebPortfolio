import type { Metadata } from "next";
import "./globals.css";
import MotionProvider from "@/components/motion/MotionProvider";

export const metadata: Metadata = {
  title: "Pavan Vasita — Web Developer & WordPress Developer in Udaipur",
  description:
    "Pavan Vasita is a Web Developer in Udaipur, Rajasthan, specializing in WordPress development, responsive web design and frontend development with React and Next.js.",
  authors: [{ name: "Pavan Vasita" }],
  keywords: ["Web Developer", "WordPress Developer", "WordPress Development", "Responsive Web Design", "Frontend Development", "Udaipur", "Rajasthan"],
  // canonical URL and Open Graph image are intentionally left out until the
  // production domain is known
  openGraph: {
    type: "website",
    title: "Pavan Vasita — Web Developer",
    description: "WordPress development, responsive web design and frontend development from Udaipur, Rajasthan.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-body antialiased bg-ink text-paper">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-crimson-bright focus:bg-ink focus:px-4 focus:py-3 focus:font-mono focus:text-nav focus:text-paper"
        >
          SKIP TO CONTENT
        </a>
        {/* content must stay visible if scripts fail: undo the pre-reveal hidden state */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}[data-reveal] *{transform:none!important;opacity:1!important}`}</style>
        </noscript>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

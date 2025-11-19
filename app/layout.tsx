import "./globals.css";
import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-baloo", // this powers var(--font-baloo) in your CSS
});

export const metadata: Metadata = {
  title: "Farcasturd",
  description:
    "Mint your 1:1 Farcasturd on Base — non-transferable poop tied to your Farcaster ID.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={baloo.variable}>
      <body className="fc-root">{children}</body>
    </html>
  );
}

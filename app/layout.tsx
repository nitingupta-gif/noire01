import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { SmoothScroll } from "./smooth-scroll";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NOIRÉ — Fashion for every expression",
  description: "Curated fashion for every expression. Designed for modern India.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${inter.variable} antialiased`}>
        <Providers>
          <SmoothScroll />
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
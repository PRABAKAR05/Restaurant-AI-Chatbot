import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Spice Garden | AI Menu Assistant",
  description:
    "Ask our AI assistant about the Spice Garden restaurant menu — dishes, prices, dietary options, and recommendations. Powered by AI for instant answers.",
  keywords: [
    "restaurant",
    "menu",
    "AI chatbot",
    "Indian cuisine",
    "Spice Garden",
    "food ordering",
  ],
  openGraph: {
    title: "Spice Garden | AI Menu Assistant",
    description:
      "Get instant answers about our menu, prices, and dietary options with our AI assistant.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}

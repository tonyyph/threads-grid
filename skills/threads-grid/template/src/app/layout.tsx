import type { Metadata } from "next";
import { Be_Vietnam_Pro, Cormorant_Garamond, Inter, JetBrains_Mono, Lora, Montserrat, Playfair_Display, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Every font ships the Vietnamese subset so diacritics (ầ, ữ, ợ...) never fall back.
// Variable names must match FONT_OPTIONS in src/lib/constants.ts.
const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-inter", display: "block" });
const beVietnam = Be_Vietnam_Pro({ subsets: ["latin", "vietnamese"], weight: ["300", "400", "500", "600", "700", "800", "900"], variable: "--font-be-vietnam", display: "block" });
const montserrat = Montserrat({ subsets: ["latin", "vietnamese"], variable: "--font-montserrat", display: "block" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin", "vietnamese"], variable: "--font-space-grotesk", display: "block" });
const playfair = Playfair_Display({ subsets: ["latin", "vietnamese"], variable: "--font-playfair", display: "block" });
const cormorant = Cormorant_Garamond({ subsets: ["latin", "vietnamese"], weight: ["300", "400", "500", "600", "700"], style: ["normal", "italic"], variable: "--font-cormorant", display: "block" });
const lora = Lora({ subsets: ["latin", "vietnamese"], style: ["normal", "italic"], variable: "--font-lora", display: "block" });
const jetbrains = JetBrains_Mono({ subsets: ["latin", "vietnamese"], variable: "--font-jetbrains", display: "block" });

export const metadata: Metadata = {
  title: "threads-grid",
  description: "Connected multi-post grid editor for Threads / Instagram",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const vars = [inter, beVietnam, montserrat, spaceGrotesk, playfair, cormorant, lora, jetbrains].map((f) => f.variable).join(" ");
  return (
    <html lang="en" className={vars}>
      <body>{children}</body>
    </html>
  );
}

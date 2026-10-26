import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Nagłówki: Archivo (grotesk o technicznym charakterze, jak katalogi sprzętu).
// Tekst: Source Sans 3. Liczby w specyfikacjach: IBM Plex Mono.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin", "latin-ext"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Apex Sport: ceny i specyfikacje sprzętu sportowego",
    template: "%s | Apex Sport",
  },
  description:
    "Porównanie cen sprzętu sportowego w polskich sklepach, pełne specyfikacje, historia cen i alerty o obniżkach. Na start: narty zjazdowe.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${archivo.variable} ${sourceSans.variable} ${plexMono.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

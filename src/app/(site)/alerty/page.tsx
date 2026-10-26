import type { Metadata } from "next";
import { AlertsList } from "@/components/AlertsList";

export const metadata: Metadata = {
  title: "Twoje alerty cenowe",
  robots: { index: false },
};

export default function AlertsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Alerty cenowe</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Ceny sprawdzamy raz dziennie we wszystkich sklepach. Gdy najniższa cena spadnie do Twojego
        progu, wysyłamy jeden e-mail z linkiem do oferty, a alert się zamyka.
      </p>
      <div className="mt-6">
        <AlertsList />
      </div>
    </div>
  );
}

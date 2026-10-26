import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Ogłoszenie niedostępne" };

export default function UnavailablePage() {
  return (
    <div className="mx-auto max-w-md rounded-md border bg-card p-8 text-center">
      <SearchX className="mx-auto size-8 text-muted-foreground" />
      <h1 className="mt-4 text-xl font-semibold">Tego ogłoszenia już nie ma</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sprzedający je sprzedał albo usunął. Oznaczyliśmy je w panelu jako nieaktualne, a bot dalej szuka nowych ofert.
      </p>
      <Button asChild className="mt-6">
        <Link href="/panel/ogloszenia">Wróć do ogłoszeń</Link>
      </Button>
    </div>
  );
}

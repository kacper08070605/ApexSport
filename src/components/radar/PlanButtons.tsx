"use client";

import { useState, useTransition } from "react";
import { cancelPlanAction, upgradePlanAction } from "@/app/panel/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UpgradeBox({ monthly, yearly }: { monthly: number; yearly: number }) {
  const [period, setPeriod] = useState<"month" | "year">("year");
  const [pending, start] = useTransition();
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["month", "Miesięcznie", `${monthly} zł / mies.`, ""],
            ["year", "Rocznie", `${yearly} zł / rok`, `${Math.round(yearly / 12)} zł / mies., ${monthly * 12 - yearly} zł taniej`],
          ] as const
        ).map(([id, label, price, note]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPeriod(id)}
            className={cn("rounded-sm border p-3 text-left", period === id ? "border-primary ring-1 ring-primary" : "hover:border-foreground/30")}
          >
            <span className="block text-sm text-muted-foreground">{label}</span>
            <span className="block font-heading text-lg font-semibold">{price}</span>
            {note && <span className="text-xs text-deal">{note}</span>}
          </button>
        ))}
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="mt-4 h-10 w-full">Przejdź na Pro</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Płatność w wersji demonstracyjnej</AlertDialogTitle>
            <AlertDialogDescription>
              W tej wersji nie pobieramy płatności. Plan Pro włączy się od razu na {period === "year" ? "rok" : "30 dni"}. W wersji
              produkcyjnej w tym miejscu otworzy się bramka płatności (Stripe albo Przelewy24, BLIK i karty).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={() => start(() => upgradePlanAction(period))}>
              Włącz Pro (demo)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function CancelPlanButton() {
  const [pending, start] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="h-9 bg-card">
          Zrezygnuj z Pro
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Zrezygnować z planu Pro?</AlertDialogTitle>
          <AlertDialogDescription>
            Konto wróci do planu Free. Wyszukiwania zostaną, ale powiadomienia „od razu” zmienimy na podsumowanie dzienne.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Zostaję przy Pro</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={() => start(() => cancelPlanAction())} className="bg-destructive hover:bg-destructive/90">
            Zrezygnuj
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

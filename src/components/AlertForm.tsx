"use client";

import { BellRing, CircleCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addStoredAlertId } from "@/lib/alerts-client";

type State = { kind: "idle" } | { kind: "sending" } | { kind: "done"; target: number } | { kind: "error"; message: string };

export function AlertForm({ slug, currentPrice }: { slug: string; currentPrice: number }) {
  const suggested = Math.round((currentPrice * 0.9) / 10) * 10;
  const [email, setEmail] = useState("");
  const [target, setTarget] = useState(suggested);
  const [state, setState] = useState<State>({ kind: "idle" });

  if (state.kind === "done") {
    return (
      <div className="flex gap-3 rounded-xl border border-deal/30 bg-deal-soft p-4 text-sm">
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-deal" />
        <div>
          <p className="font-medium">Alert zapisany</p>
          <p className="mt-0.5 text-muted-foreground">
            Napiszemy na {email}, gdy najniższa cena spadnie do {target.toLocaleString("pl-PL")} zł lub niżej.{" "}
            <Link href="/alerty" className="font-medium text-foreground underline underline-offset-2">
              Twoje alerty
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      className="panel p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ kind: "sending" });
        try {
          const res = await fetch("/api/alerts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, slug, targetPrice: target }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? "Nie udało się zapisać alertu");
          addStoredAlertId(json.id);
          setState({ kind: "done", target });
        } catch (err) {
          setState({ kind: "error", message: err instanceof Error ? err.message : "Błąd" });
        }
      }}
    >
      <p className="flex items-center gap-2 font-medium">
        <BellRing className="size-4 text-primary" /> Powiadom o obniżce
      </p>
      <p className="mt-1 text-sm text-muted-foreground">Dostaniesz jeden e-mail, gdy któryś sklep zejdzie do Twojej ceny.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px]">
        <div className="grid gap-1.5">
          <Label htmlFor={`alert-email-${slug}`}>E-mail</Label>
          <Input
            id={`alert-email-${slug}`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jan@example.com"
            className="h-10"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`alert-price-${slug}`}>Cena docelowa</Label>
          <div className="relative">
            <Input
              id={`alert-price-${slug}`}
              type="number"
              required
              min={1}
              max={currentPrice}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="h-10 pr-9 tabular-nums"
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">zł</span>
          </div>
        </div>
      </div>
      <Button type="submit" variant="secondary" disabled={state.kind === "sending"} className="mt-4 h-10 w-full">
        {state.kind === "sending" ? "Zapisywanie…" : "Ustaw alert cenowy"}
      </Button>
      {state.kind === "error" && <p className="mt-2 text-sm text-destructive">{state.message}</p>}
    </form>
  );
}

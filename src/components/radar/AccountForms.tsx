"use client";

import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteAccountAction,
  removeDiscordAction,
  saveDiscordAction,
  testDiscordAction,
  updateProfileAction,
  type FormState,
} from "@/app/panel/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({ name, email }: { name: string | null; email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, {});
  useEffect(() => {
    if (state.ok) toast.success(state.ok);
  }, [state]);
  return (
    <form action={action} className="grid max-w-md gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" value={email} disabled className="h-10" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="name">Imię</Label>
        <Input id="name" name="name" defaultValue={name ?? ""} className="h-10" />
      </div>
      <Button type="submit" disabled={pending} className="h-10 w-fit">
        Zapisz
      </Button>
    </form>
  );
}

export function DeleteAccountButton() {
  const [pending, start] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="h-9 bg-card text-destructive hover:text-destructive">
          Usuń konto
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usunąć konto?</AlertDialogTitle>
          <AlertDialogDescription>Usuniemy wyszukiwania, znalezione ogłoszenia i historię powiadomień. Tego nie da się cofnąć.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={() => start(() => deleteAccountAction())} className="bg-destructive hover:bg-destructive/90">
            Usuń konto
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DiscordForm({ webhook }: { webhook: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveDiscordAction, {});
  const [busy, start] = useTransition();
  useEffect(() => {
    if (state.ok) toast.success(state.ok);
  }, [state]);
  const run = (fn: () => Promise<FormState>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(r.ok);
      if (r.error) toast.error(r.error);
    });

  if (webhook)
    return (
      <div className="grid max-w-xl gap-3">
        <p className="text-sm">
          Połączony z webhookiem <span className="font-mono text-xs text-muted-foreground">…/{webhook.split("/").slice(-2, -1)[0]}</span>.
          Nowe ogłoszenia trafiają na kanał razem z e-mailem.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy} onClick={() => run(testDiscordAction)} className="h-9">
            Wyślij test
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => run(removeDiscordAction)} className="h-9 bg-card">
            Odłącz
          </Button>
        </div>
      </div>
    );

  return (
    <form action={action} className="grid max-w-xl gap-3">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Na Discordzie otwórz ustawienia kanału, potem Integracje i Webhooki.</li>
        <li>Kliknij „Nowy webhook”, nazwij go np. Apex Radar i skopiuj adres.</li>
        <li>Wklej adres poniżej. Wyślemy na kanał wiadomość próbną.</li>
      </ol>
      <div className="grid gap-1.5">
        <Label htmlFor="webhook">Adres webhooka</Label>
        <Input id="webhook" name="webhook" placeholder="https://discord.com/api/webhooks/…" className="h-10 font-mono text-xs" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="h-10 w-fit">
        {pending ? "Łączę…" : "Połącz z Discordem"}
      </Button>
    </form>
  );
}

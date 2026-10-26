"use client";

import { Bookmark, BookmarkCheck, ExternalLink, Loader2, Mail, RefreshCw, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteWatchAction,
  scanNowAction,
  sendDigestNowAction,
  setMatchStatusAction,
  toggleWatchAction,
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
import { Switch } from "@/components/ui/switch";

function useToastResult(state: FormState) {
  useEffect(() => {
    if (state.ok) toast.success(state.ok);
    if (state.error) toast.error(state.error);
  }, [state]);
}

export function ScanButton({ variant = "default" }: { variant?: "default" | "outline" }) {
  const [state, action, pending] = useActionState<FormState>(scanNowAction, {});
  useToastResult(state);
  return (
    <form action={action}>
      <Button type="submit" variant={variant} disabled={pending} className="h-9">
        {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        {pending ? "Sprawdzam ogłoszenia…" : "Skanuj teraz"}
      </Button>
    </form>
  );
}

export function DigestButton() {
  const [state, action, pending] = useActionState<FormState>(sendDigestNowAction, {});
  useToastResult(state);
  return (
    <form action={action}>
      <Button type="submit" variant="outline" disabled={pending} className="h-9 bg-card">
        <Mail /> {pending ? "Wysyłam…" : "Wyślij podsumowanie teraz"}
      </Button>
    </form>
  );
}

export function WatchSwitch({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Switch
      checked={active}
      disabled={pending}
      onCheckedChange={(v) => start(() => toggleWatchAction(id, v))}
      aria-label={active ? "Wstrzymaj wyszukiwanie" : "Włącz wyszukiwanie"}
    />
  );
}

export function DeleteWatchButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="h-9 bg-card text-destructive hover:text-destructive">
          <Trash2 /> Usuń
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usunąć wyszukiwanie „{name}”?</AlertDialogTitle>
          <AlertDialogDescription>Znalezione ogłoszenia i historia powiadomień dla tego wyszukiwania też znikną.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={() => start(() => deleteWatchAction(id))} className="bg-destructive hover:bg-destructive/90">
            Usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function MatchActions({
  matchId,
  status,
  url,
  removed = false,
}: {
  matchId: number;
  status: "new" | "saved" | "dismissed";
  url: string;
  removed?: boolean;
}) {
  const [pending, start] = useTransition();
  const set = (s: "new" | "saved" | "dismissed") => start(() => setMatchStatusAction(matchId, s));
  return (
    <div className="flex items-center gap-1.5">
      {removed ? (
        <Button size="sm" variant="outline" className="h-8 bg-card" disabled>
          Nieaktualne
        </Button>
      ) : (
        <Button asChild size="sm" className="h-8">
          <a href={url} target="_blank" rel="noopener nofollow">
            Ogłoszenie <ExternalLink />
          </a>
        </Button>
      )}
      <Button
        size="icon-sm"
        variant="outline"
        className="size-8 bg-card"
        disabled={pending}
        onClick={() => set(status === "saved" ? "new" : "saved")}
        aria-label={status === "saved" ? "Usuń z zapisanych" : "Zapisz"}
        title={status === "saved" ? "Usuń z zapisanych" : "Zapisz"}
      >
        {status === "saved" ? <BookmarkCheck className="text-primary" /> : <Bookmark />}
      </Button>
      <Button
        size="icon-sm"
        variant="outline"
        className="size-8 bg-card"
        disabled={pending}
        onClick={() => set(status === "dismissed" ? "new" : "dismissed")}
        aria-label={status === "dismissed" ? "Przywróć" : "Odrzuć"}
        title={status === "dismissed" ? "Przywróć" : "Odrzuć"}
      >
        <X />
      </Button>
    </div>
  );
}

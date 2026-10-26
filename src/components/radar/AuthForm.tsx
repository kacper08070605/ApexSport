"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, registerAction, type FormState } from "@/app/panel/actions";

/** Konto testowe wpisane w formularz logowania (wersja demonstracyjna). */
const DEMO_LOGIN = { email: "demo@apexsport.pl", password: "demo1234" };

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? loginAction : registerAction, {});
  const register = mode === "register";

  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {register && (
        <div className="grid gap-1.5">
          <Label htmlFor="name">Imię (opcjonalnie)</Label>
          <Input id="name" name="name" autoComplete="given-name" className="h-10" />
        </div>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={register ? undefined : DEMO_LOGIN.email}
          className="h-10"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Hasło</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={register ? 8 : undefined}
          defaultValue={register ? undefined : DEMO_LOGIN.password}
          autoComplete={register ? "new-password" : "current-password"}
          className="h-10"
        />
        {register && <p className="text-xs text-muted-foreground">Co najmniej 8 znaków.</p>}
      </div>
      {!register && (
        <p className="rounded-sm bg-muted px-3 py-2 text-xs text-muted-foreground">
          Konto testowe: {DEMO_LOGIN.email} / {DEMO_LOGIN.password}. Dane są już wpisane.
        </p>
      )}
      {state.error && <p className="rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="h-10 w-full">
        {pending ? "Chwileczkę…" : register ? "Załóż konto" : "Zaloguj się"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {register ? (
          <>
            Masz już konto?{" "}
            <Link href="/radar/logowanie" className="text-foreground underline underline-offset-2">
              Zaloguj się
            </Link>
          </>
        ) : (
          <>
            Nie masz konta?{" "}
            <Link href="/radar/rejestracja" className="text-foreground underline underline-offset-2">
              Załóż je za darmo
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

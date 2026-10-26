import type { Metadata } from "next";
import { AuthForm } from "@/components/radar/AuthForm";

export const metadata: Metadata = { title: "Załóż konto w Apex Radar", robots: { index: false } };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold">Załóż konto</h1>
      <p className="mt-1 text-sm text-muted-foreground">Plan Free: 2 wyszukiwania i codzienne podsumowanie. Pro możesz włączyć w panelu.</p>
      <div className="mt-6">
        <AuthForm mode="register" />
      </div>
    </div>
  );
}

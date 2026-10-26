import type { Metadata } from "next";
import { AuthForm } from "@/components/radar/AuthForm";

export const metadata: Metadata = { title: "Logowanie do Apex Radar", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold">Zaloguj się</h1>
      <p className="mt-1 text-sm text-muted-foreground">Panel Apex Radar: wyszukiwania i znalezione ogłoszenia.</p>
      <div className="mt-6">
        <AuthForm mode="login" />
      </div>
    </div>
  );
}

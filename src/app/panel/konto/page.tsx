import type { Metadata } from "next";
import { Suspense } from "react";
import { DeleteAccountButton, DiscordForm, ProfileForm } from "@/components/radar/AccountForms";
import { PageHeader, PanelSkeleton } from "@/components/radar/PageHeader";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Konto" };

async function Account() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Konto" description={`Założone ${new Date(user.createdAt).toLocaleDateString("pl-PL", { dateStyle: "long" })}`} />
      <div className="space-y-6">
        <section className="rounded-md border bg-card p-6">
          <h2 className="mb-4 font-semibold">Dane</h2>
          <ProfileForm name={user.name} email={user.email} />
        </section>
        <section id="discord" className="rounded-md border bg-card p-6">
          <h2 className="font-semibold">Powiadomienia na Discordzie</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Ogłoszenia ze zdjęciem, ceną i linkiem wysyłamy na wybrany kanał Twojego serwera.
          </p>
          <DiscordForm webhook={user.discordWebhook} />
        </section>
        <section className="rounded-md border border-destructive/30 bg-card p-6">
          <h2 className="font-semibold">Usunięcie konta</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">Wszystkie dane konta zostaną trwale usunięte.</p>
          <DeleteAccountButton />
        </section>
      </div>
    </>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Account />
    </Suspense>
  );
}

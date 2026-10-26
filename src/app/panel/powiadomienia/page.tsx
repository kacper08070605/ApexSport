import { Mail } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, PanelSkeleton } from "@/components/radar/PageHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/radar/repo";

const CHANNELS: Record<string, string> = {
  email: "e-mail wysłany",
  demo: "e-mail w trybie demo",
  discord: "Discord",
  discord_error: "Discord: błąd wysyłki",
};
const channelLabel = (c: string) => c.split(",").map((x) => CHANNELS[x] ?? x).join(" · ");

export const metadata: Metadata = { title: "Powiadomienia" };

async function Notifications() {
  const user = await requireUser();
  const items = await listNotifications(user.id);
  return (
    <>
      <PageHeader
        title="Powiadomienia"
        description={
          <>
            Wysłane na <span className="text-foreground">{user.email}</span>. Bez klucza Resend (tryb demo) wiadomości zapisujemy tylko
            tutaj.
          </>
        }
      />
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
          Jeszcze nie wysłaliśmy żadnego powiadomienia.
        </div>
      ) : (
        <Accordion type="single" collapsible className="rounded-md border bg-card">
          {items.map((n) => (
            <AccordionItem key={n.id} value={String(n.id)} className="px-4">
              <AccordionTrigger className="gap-3 hover:no-underline">
                <span className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{n.subject}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {new Date(n.created_at).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                      {n.matches} ogł. · {channelLabel(n.channel)}
                    </span>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <pre className="rounded-sm bg-muted p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">{n.body}</pre>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Notifications />
    </Suspense>
  );
}

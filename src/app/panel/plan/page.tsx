import { Check, CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, PanelSkeleton } from "@/components/radar/PageHeader";
import { CancelPlanButton, UpgradeBox } from "@/components/radar/PlanButtons";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { PLANS } from "@/lib/radar/plans";

export const metadata: Metadata = { title: "Plan i płatności" };

async function PlanContent({ searchParams }: { searchParams: Promise<{ aktywowano?: string }> }) {
  const user = await requireUser();
  const activated = (await searchParams).aktywowano === "1";
  const plan = PLANS[user.plan];
  const used = (getDb().prepare("SELECT COUNT(*) AS n FROM watches WHERE user_id = ?").get(user.id) as { n: number }).n;

  return (
    <>
      <PageHeader title="Plan i płatności" />
      {activated && (
        <div className="mb-6 flex gap-3 rounded-md border border-deal/30 bg-deal-soft p-4 text-sm">
          <CircleCheck className="size-5 shrink-0 text-deal" />
          Plan Pro jest aktywny. Możesz teraz ustawić powiadomienia „od razu” w swoich wyszukiwaniach.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border bg-card p-6">
          <p className="text-sm text-muted-foreground">Twój plan</p>
          <h2 className="mt-1 text-2xl font-semibold">{plan.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.plan === "pro" && user.planUntil
              ? `Aktywny do ${new Date(user.planUntil).toLocaleDateString("pl-PL", { dateStyle: "long" })}`
              : "Bez opłat"}
          </p>
          <div className="mt-5">
            <div className="flex justify-between text-sm">
              <span>Wyszukiwania</span>
              <span className="tabular-nums">
                {used} / {plan.maxWatches}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-muted">
              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(100, (used / plan.maxWatches) * 100)}%` }} />
            </div>
          </div>
          <ul className="mt-5 space-y-2 text-sm">
            {plan.features.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-deal" />
                {f}
              </li>
            ))}
          </ul>
          {user.plan === "pro" && (
            <div className="mt-6 border-t pt-5">
              <CancelPlanButton />
            </div>
          )}
        </section>

        {user.plan === "free" && (
          <section className="rounded-md border border-foreground bg-card p-6">
            <p className="text-sm text-muted-foreground">Przejdź na</p>
            <h2 className="mt-1 text-2xl font-semibold">Pro</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {PLANS.pro.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-deal" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <UpgradeBox monthly={PLANS.pro.priceMonthly} yearly={PLANS.pro.priceYearly} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Rezygnacja w każdej chwili. Faktura VAT na adres konta.</p>
          </section>
        )}
      </div>
    </>
  );
}

export default function PlanPage({ searchParams }: PageProps<"/panel/plan">) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <PlanContent searchParams={searchParams as Promise<{ aktywowano?: string }>} />
    </Suspense>
  );
}

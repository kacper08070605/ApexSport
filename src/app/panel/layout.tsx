import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PanelMobileNav, PanelSidebar } from "@/components/radar/PanelNav";
import { UserMenu } from "@/components/radar/UserMenu";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth";
import { PLANS } from "@/lib/radar/plans";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Apex Radar" },
  robots: { index: false },
};

async function PlanBox() {
  const user = await requireUser();
  const plan = PLANS[user.plan];
  return (
    <div className="rounded-sm bg-muted p-3 text-sm">
      <p className="font-medium">Plan {plan.name}</p>
      <p className="text-xs text-muted-foreground">
        {user.plan === "pro" && user.planUntil
          ? `do ${new Date(user.planUntil).toLocaleDateString("pl-PL")}`
          : `${plan.maxWatches} wyszukiwania, podsumowanie raz dziennie`}
      </p>
      {user.plan === "free" && (
        <Link href="/panel/plan" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Przejdź na Pro <ArrowUpRight className="size-3" />
        </Link>
      )}
    </div>
  );
}

async function TopUser() {
  const user = await requireUser();
  return <UserMenu email={user.email} name={user.name} plan={user.plan} />;
}

export default function PanelLayout({ children }: LayoutProps<"/panel">) {
  return (
    <div className="flex min-h-dvh bg-muted/40">
      <PanelSidebar
        footer={
          <Suspense fallback={<Skeleton className="h-16" />}>
            <PlanBox />
          </Suspense>
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card px-4">
          <PanelMobileNav />
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Apex Sport
          </Link>
          <div className="ml-auto">
            <Suspense fallback={<Skeleton className="h-8 w-40" />}>
              <TopUser />
            </Suspense>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

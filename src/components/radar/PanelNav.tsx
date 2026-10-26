"use client";

import { Bell, CreditCard, LayoutDashboard, ListFilter, Menu, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/panel", label: "Przegląd", icon: LayoutDashboard, exact: true },
  { href: "/panel/wyszukiwania", label: "Wyszukiwania", icon: ListFilter },
  { href: "/panel/ogloszenia", label: "Znalezione ogłoszenia", icon: Search },
  { href: "/panel/powiadomienia", label: "Powiadomienia", icon: Bell },
  { href: "/panel/plan", label: "Plan i płatności", icon: CreditCard },
  { href: "/panel/konto", label: "Konto", icon: UserRound },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="grid gap-0.5">
      {ITEMS.map((it) => {
        const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors",
              active ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <it.icon className="size-4" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function PanelSidebar({ footer }: { footer?: React.ReactNode }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-card lg:flex">
      <Link href="/" className="flex h-14 items-center border-b px-4">
        <Logo />
      </Link>
      <div className="px-3 pt-4">
        <p className="px-3 pb-2 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">Apex Radar</p>
        <Suspense fallback={<div className="h-56" />}>
          <NavList />
        </Suspense>
      </div>
      <div className="mt-auto border-t p-3">{footer}</div>
    </aside>
  );
}

export function PanelMobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu panelu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <div className="px-3">
          <Suspense fallback={null}>
            <NavList onNavigate={() => setOpen(false)} />
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  );
}

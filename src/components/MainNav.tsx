"use client";

import { Bike, CloudSnow, Radar, Footprints, HardHat, Menu, Mountain, Scale, Sparkles, Tent } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

const SKI_LINKS = [
  { href: "/narciarstwo/narty-zjazdowe", title: "Narty zjazdowe", text: "Katalog z cenami z 6 sklepów", icon: Mountain },
  { href: "/dobor-nart", title: "Dobór nart", text: "Długość i modele w 5 krokach", icon: Sparkles },
  { href: "/porownaj", title: "Porównaj modele", text: "Do trzech nart obok siebie", icon: Scale },
  { href: "/narciarstwo/osrodki", title: "Ośrodki i warunki", text: "Prognoza śniegu, mapy tras, cenniki", icon: CloudSnow },
  { href: "/radar", title: "Radar ogłoszeń", text: "Powiadomienia z OLX, Allegro i Vinted", icon: Radar },
];

const SOON = [
  { title: "Buty narciarskie", icon: Footprints },
  { title: "Kaski i gogle", icon: HardHat },
  { title: "Rowery", icon: Bike },
  { title: "Outdoor", icon: Tent },
];

const TOP = [
  { href: "/narciarstwo/osrodki", label: "Ośrodki" },
  { href: "/radar", label: "Radar ogłoszeń" },
  { href: "/artykuly", label: "Poradniki" },
];

export function MainNav() {
  const pathname = usePathname();
  return (
    <NavigationMenu viewport={false} className="hidden lg:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent">Narciarstwo</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[560px] grid-cols-[1fr_180px] gap-2 p-2">
              <ul className="grid gap-1">
                {SKI_LINKS.map((l) => (
                  <li key={l.href}>
                    <NavigationMenuLink asChild>
                      <Link href={l.href} className="flex-row items-start gap-3 rounded-lg p-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                          <l.icon className="size-4" />
                        </span>
                        <span>
                          <span className="block font-medium">{l.title}</span>
                          <span className="block text-xs text-muted-foreground">{l.text}</span>
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground">Wkrótce</p>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {SOON.map((s) => (
                    <li key={s.title} className="flex items-center gap-2">
                      <s.icon className="size-4" />
                      {s.title}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        {TOP.map((t) => (
          <NavigationMenuItem key={t.href}>
            <NavigationMenuLink asChild data-active={pathname.startsWith(t.href) ? "" : undefined}>
              <Link href={t.href} className="rounded-md px-3 py-2 text-sm font-medium">
                {t.label}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <nav className="grid gap-1 px-3">
          {[...SKI_LINKS, { href: "/artykuly", title: "Poradniki", text: "Porównania i testy", icon: Mountain }].map((l) => (
            <Link
              key={l.href + l.title}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted",
                pathname.startsWith(l.href) && "bg-secondary font-medium text-secondary-foreground",
              )}
            >
              <l.icon className="size-4" />
              {l.title}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

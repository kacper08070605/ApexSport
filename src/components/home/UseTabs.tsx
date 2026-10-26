"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface UseTab {
  id: string;
  label: string;
  hint: string;
  href: string;
  content: React.ReactNode;
}

/** Zakładki „według jazdy”: każda pokazuje najtańsze modele z danej grupy. */
export function UseTabs({ tabs }: { tabs: UseTab[] }) {
  return (
    <Tabs defaultValue={tabs[0].id}>
      <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b bg-transparent p-0 [scrollbar-width:none]">
        {tabs.map((t) => (
          <TabsTrigger
            key={t.id}
            value={t.id}
            className="flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-4 py-2.5 text-muted-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.id} value={t.id} className="mt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">{t.hint}</p>
            <Button asChild variant="link" className="h-auto p-0">
              <Link href={t.href}>
                Zobacz wszystkie <ArrowRight />
              </Link>
            </Button>
          </div>
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

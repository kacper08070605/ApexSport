"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getStoredAlertIds, subscribeAlerts } from "@/lib/alerts-client";

export function AlertsBadge() {
  const count = useSyncExternalStore(
    subscribeAlerts,
    () => getStoredAlertIds().length,
    () => 0,
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" asChild className="relative shrink-0">
          <Link href="/alerty" aria-label="Alerty cenowe">
            <Bell className="size-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Alerty cenowe</TooltipContent>
    </Tooltip>
  );
}

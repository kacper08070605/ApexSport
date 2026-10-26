"use client";

import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/panel/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ email, name, plan }: { email: string; name: string | null; plan: string }) {
  const initials = (name || email).slice(0, 2).toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-sm px-1.5 py-1 hover:bg-muted">
        <Avatar className="size-8 rounded-sm">
          <AvatarFallback className="rounded-sm bg-secondary text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden text-left text-sm leading-tight sm:block">
          <span className="block max-w-40 truncate font-medium">{name || email}</span>
          <span className="text-xs text-muted-foreground">Plan {plan === "pro" ? "Pro" : "Free"}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/panel/konto">
            <UserRound /> Konto
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => logoutAction()}>
          <LogOut /> Wyloguj
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { checkListing } from "@/lib/radar/liveness";
import type { Listing } from "@/lib/radar/match";

/**
 * Przejście do ogłoszenia: najpierw sprawdzamy, czy jeszcze istnieje,
 * żeby zamiast „page not found” w serwisie pokazać informację u nas.
 */
export async function GET(req: NextRequest, ctx: RouteContext<"/panel/ogloszenie/[id]">) {
  const { id } = await ctx.params;
  const l = await db.get("SELECT id, source, url, removed_at FROM listings WHERE id = ?", id) as
    | (Pick<Listing, "id" | "source" | "url"> & { removed_at: string | null })
    | undefined;
  if (!l) return NextResponse.redirect(new URL("/panel/ogloszenia", req.url));
  const state = l.removed_at ? "removed" : await checkListing(l);
  if (state === "removed") return NextResponse.redirect(new URL("/panel/niedostepne", req.url));
  return NextResponse.redirect(l.url);
}

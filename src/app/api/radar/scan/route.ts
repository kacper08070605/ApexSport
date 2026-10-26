import { runScan, sendDigests } from "@/lib/radar/scan";

/**
 * Wywoływane przez harmonogram (cron), np. co 15 minut: POST /api/radar/scan
 * oraz raz dziennie z ?digest=1 (podsumowania dla planu Free i ustawienia „raz dziennie”).
 * Wymaga nagłówka Authorization: Bearer <CRON_SECRET>.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Brak autoryzacji" }, { status: 401 });
  }
  const digest = new URL(request.url).searchParams.get("digest") === "1";
  const scan = await runScan();
  const digests = digest ? await sendDigests() : 0;
  return Response.json({ ...scan, digests });
}

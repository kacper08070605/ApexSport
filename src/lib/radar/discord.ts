import "server-only";
import { bestOffer } from "../catalog";
import type { Listing } from "./match";
import { CONDITIONS, SOURCES } from "./sources";

/**
 * Powiadomienia na Discorda przez webhook kanału (Ustawienia serwera → Integracje → Webhooki).
 * Użytkownik wkleja adres webhooka w panelu; nie potrzeba bota ani tokenu po naszej stronie.
 */

const WEBHOOK_RE = /^https:\/\/(?:canary\.|ptb\.)?(?:discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/;

export const isDiscordWebhook = (url: string) => WEBHOOK_RE.test(url.trim());

const zl = (n: number) => `${n.toLocaleString("pl-PL")} zł`;
const hex = (color: string) => parseInt(color.replace("#", ""), 16);

function embed(l: Listing) {
  const fresh = l.ski_slug ? bestOffer(l.ski_slug)?.price : undefined;
  const details = [l.condition ? CONDITIONS[l.condition] : null, l.length_cm ? `${l.length_cm} cm` : null, l.size != null ? `rozmiar ${l.size}` : null, l.location]
    .filter(Boolean)
    .join(" · ");
  return {
    title: l.title.slice(0, 250),
    url: l.url,
    color: hex(SOURCES[l.source].color),
    description: [
      `**${zl(l.price)}**${fresh ? ` · nowe od ${zl(fresh)} (−${Math.round((1 - l.price / fresh) * 100)}%)` : ""}`,
      details,
    ]
      .filter(Boolean)
      .join("\n"),
    ...(l.image ? { thumbnail: { url: l.image } } : {}),
    footer: { text: SOURCES[l.source].label },
    timestamp: l.posted_at,
  };
}

/** Wysyła ogłoszenia (Discord przyjmuje do 10 kart w jednej wiadomości). */
export async function sendDiscord(webhook: string, heading: string, items: Listing[], link?: string): Promise<boolean> {
  let ok = true;
  for (let i = 0; i < Math.max(items.length, 1); i += 10) {
    const chunk = items.slice(i, i + 10);
    const content = i === 0 ? [heading, link].filter(Boolean).join("\n") : undefined;
    const res = await fetch(`${webhook.trim()}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Apex Radar", content, embeds: chunk.map(embed), allowed_mentions: { parse: [] } }),
    }).catch(() => null);
    ok &&= Boolean(res?.ok);
  }
  return ok;
}

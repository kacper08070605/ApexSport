import "server-only";

/**
 * Wysyłka e-maili przez Resend (https://resend.com), gdy ustawiono RESEND_API_KEY.
 * Bez klucza wiadomość nie wychodzi, a aplikacja zapisuje ją tylko w bazie (tryb demo).
 */
export async function sendEmail(to: string, subject: string, text: string): Promise<"email" | "demo"> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return "demo";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.ALERT_FROM ?? "Apex Radar <radar@apexsport.pl>", to, subject, text }),
  });
  return res.ok ? "email" : "demo";
}

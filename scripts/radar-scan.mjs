// Uruchamia przebieg bota Apex Radar (do crona / Harmonogramu zadań).
// Użycie: CRON_SECRET=... node scripts/radar-scan.mjs [--digest]
const base = process.env.SITE_URL ?? "http://localhost:3000";
const res = await fetch(`${base}/api/radar/scan${process.argv.includes("--digest") ? "?digest=1" : ""}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` },
});
console.log(res.status, await res.text());

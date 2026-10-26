/** Kody pogody WMO → opis po polsku i symbol do ikony. */
export function weatherLabel(code: number): { label: string; icon: "sun" | "partly" | "cloud" | "fog" | "rain" | "snow" | "storm" } {
  if (code === 0) return { label: "Bezchmurnie", icon: "sun" };
  if (code <= 2) return { label: "Częściowe zachmurzenie", icon: "partly" };
  if (code === 3) return { label: "Pochmurno", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "Mgła", icon: "fog" };
  if (code >= 71 && code <= 77) return { label: code >= 75 ? "Intensywny śnieg" : "Śnieg", icon: "snow" };
  if (code === 85 || code === 86) return { label: "Przelotny śnieg", icon: "snow" };
  if (code >= 95) return { label: "Burza", icon: "storm" };
  if (code >= 51) return { label: code === 66 || code === 67 ? "Marznący deszcz" : "Deszcz", icon: "rain" };
  return { label: "Pochmurno", icon: "cloud" };
}

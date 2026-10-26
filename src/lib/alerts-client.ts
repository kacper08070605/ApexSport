// Identyfikatory alertów założonych w tej przeglądarce (bez kont użytkowników w demo).

const KEY = "apex-alerts";
const EVENT = "apex-alerts-change";

export function getStoredAlertIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function save(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // tryb prywatny lub zablokowany storage: alert i tak istnieje na serwerze
  }
  window.dispatchEvent(new Event(EVENT));
}

export function addStoredAlertId(id: string) {
  save([...new Set([...getStoredAlertIds(), id])]);
}

export function removeStoredAlertId(id: string) {
  save(getStoredAlertIds().filter((x) => x !== id));
}

export function subscribeAlerts(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export type PlanId = "free" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  maxWatches: number;
  instant: boolean;
  scanEvery: string;
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    maxWatches: 2,
    instant: false,
    scanEvery: "raz dziennie",
    features: ["2 wyszukiwania", "Codzienne podsumowanie na e-mail i Discorda", "Narty i buty narciarskie", "Historia ogłoszeń z 7 dni"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 39,
    priceYearly: 349,
    maxWatches: 25,
    instant: true,
    scanEvery: "co 15 minut",
    features: [
      "25 wyszukiwań",
      "Powiadomienie od razu na e-mail i Discorda",
      "Skanowanie co 15 minut",
      "Porównanie z ceną nowych nart",
      "Historia ogłoszeń bez limitu",
    ],
  },
};

/** Plan aktywny teraz: Pro wygasa po dacie plan_until. */
export function effectivePlan(plan: string, planUntil: string | null): PlanId {
  if (plan === "pro" && (!planUntil || new Date(planUntil) > new Date())) return "pro";
  return "free";
}

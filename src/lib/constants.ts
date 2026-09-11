// Central collection and database identifiers
// Change names here anytime to reflect across the entire app
export const COLLECTIONS = {
  GYMS: "gyms",
  MEMBERS: "members",
  PAYMENTS: "payments",
  ATTENDANCE: "attendance",
  STAFF: "staff",
} as const;

// Default plan durations in months
export const PLAN_DURATIONS = {
  MONTHLY: 1,
  QUARTERLY: 3,
  HALF_YEARLY: 6,
  ANNUAL: 12,
} as const;

export const TRIAL_DURATION_DAYS = 30;
export const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
export const TRIAL_MEMBER_LIMIT = 50;
export const GROWTH_MEMBER_LIMIT = 100;

export function getNormalizedPlan(gym: any): "TRIAL" | "STARTER" | "GROWTH" | "UNLIMITED" | "PAID" {
  if (!gym) return "TRIAL";
  const rawPlan = String(gym.subscriptionPlan || gym.plan || gym.tier || "").trim().toUpperCase();
  if (rawPlan === "GROWTH") return "GROWTH";
  if (rawPlan === "UNLIMITED") return "UNLIMITED";
  if (rawPlan === "STARTER") return "STARTER";
  if (rawPlan === "PAID") return "PAID";
  if (gym.billing_model === "flat_subscription") {
    return gym.member_cap === 100 ? "GROWTH" : "UNLIMITED";
  }
  if (gym.billing_model === "prepaid_credits" && rawPlan !== "TRIAL") {
    return "STARTER";
  }
  if (rawPlan === "TRIAL" || !rawPlan) return "TRIAL";
  return "PAID";
}

export function isGymInTrial(gym: any): boolean {
  if (!gym) return false;
  return getNormalizedPlan(gym) === "TRIAL";
}

export function isGymTrialExpired(gym: any): boolean {
  if (!gym) return false;
  if (!isGymInTrial(gym)) return false;
  if (!gym.createdAt) return false;
  const createdAt = new Date(gym.createdAt).getTime();
  const now = Date.now();
  return (now - createdAt) > TRIAL_DURATION_MS;
}

export function getTrialDaysRemaining(gym: any): number {
  if (!gym || !isGymInTrial(gym) || !gym.createdAt) return 0;
  const createdAt = new Date(gym.createdAt).getTime();
  const now = Date.now();
  const elapsed = now - createdAt;
  return Math.max(0, Math.ceil((TRIAL_DURATION_MS - elapsed) / (1000 * 60 * 60 * 24)));
}

export function isFlatSubscription(gym: any): boolean {
  if (!gym) return false;
  const plan = getNormalizedPlan(gym);
  return (
    gym.billing_model === "flat_subscription" ||
    plan === "GROWTH" ||
    plan === "UNLIMITED"
  );
}

export function isSubscriptionActive(gym: any): boolean {
  if (!gym) return false;
  if (!isFlatSubscription(gym)) return false;
  if (!gym.planExpiresAt) return false;
  return new Date(gym.planExpiresAt).getTime() > Date.now();
}

export function isSubscriptionExpired(gym: any): boolean {
  if (!gym) return false;
  if (!isFlatSubscription(gym)) return false;
  if (!gym.planExpiresAt) return true;
  return new Date(gym.planExpiresAt).getTime() <= Date.now();
}

export function getSubscriptionDaysRemaining(gym: any): number {
  if (!gym || !gym.planExpiresAt) return 0;
  const expiry = new Date(gym.planExpiresAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
}

export function getMemberCap(gym: any): number | null {
  if (!gym) return null;
  const plan = getNormalizedPlan(gym);
  if (plan === "TRIAL") return TRIAL_MEMBER_LIMIT;
  if (plan === "GROWTH") return GROWTH_MEMBER_LIMIT;
  if (typeof gym.member_cap === "number") return gym.member_cap;
  return null;
}
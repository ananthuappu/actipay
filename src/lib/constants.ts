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

export function isGymTrialExpired(gym: any): boolean {
  if (!gym) return false;
  if (gym.subscriptionPlan === "PAID") return false;
  if (!gym.createdAt) return false;
  const createdAt = new Date(gym.createdAt).getTime();
  const now = Date.now();
  return (now - createdAt) > TRIAL_DURATION_MS;
}

export function isGymInTrial(gym: any): boolean {
  if (!gym) return false;
  return gym.subscriptionPlan !== "PAID";
}

export function getTrialDaysRemaining(gym: any): number {
  if (!gym || gym.subscriptionPlan === "PAID" || !gym.createdAt) return 0;
  const createdAt = new Date(gym.createdAt).getTime();
  const now = Date.now();
  const elapsed = now - createdAt;
  return Math.max(0, Math.ceil((TRIAL_DURATION_MS - elapsed) / (1000 * 60 * 60 * 24)));
}
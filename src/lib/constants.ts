// Central collection and database identifiers
// Change names here anytime to reflect across the entire app
export const COLLECTIONS = {
  GYMS: "gyms",
  MEMBERS: "members",
  PAYMENTS: "payments",
  ATTENDANCE: "attendance",
} as const;

// Default plan durations in months
export const PLAN_DURATIONS = {
  MONTHLY: 1,
  QUARTERLY: 3,
  HALF_YEARLY: 6,
  ANNUAL: 12,
} as const;
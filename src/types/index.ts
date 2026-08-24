
export interface GymProfile {
  gymId: string;
  ownerId: string;
  name: string;
  phone: string;
  authEmail?: string;
  currency: string;
  walletBalance: number;
  subscriptionPlan?: "TRIAL" | "PAID";
  role?: "owner" | "admin";
  createdAt: string;
}

export type PlanType = "Monthly" | "Quarterly" | "Half_Yearly" | "Annual";

export interface Member {
  id: string;
  fullName: string;
  phone: string;
  planType: PlanType;
  feeAmount: number;
  admissionFee?: number;
  startDate: string;
  nextDueDate: string;
  isActive: boolean; // false if member exits the gym
  isPT?: boolean; // True if they opted for Personal Training
  notes?: string;
  createdAt: string;
}

export type PaymentMode = "Cash" | "UPI" | "Card" | "Bank Transfer";
export type PaymentCategory = "MEMBERSHIP" | "ADMISSION" | "RENEWAL";

export interface PaymentRecord {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  paymentMode: PaymentMode;
  category?: PaymentCategory;
  paymentDate: string;
  validFrom: string;
  validUntil: string;
  loggedBy: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  type: "MANUAL" | "BIOMETRIC_FINGER" | "BIOMETRIC_FACE";
  timestamp: string;
}
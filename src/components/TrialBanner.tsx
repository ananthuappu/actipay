"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Info } from "lucide-react";

export default function TrialBanner() {
  const { gym } = useAuth();

  if (!gym || gym.subscriptionPlan === "PAID") {
    return null;
  }

  // Calculate days left in trial
  const createdAt = new Date(gym.createdAt).getTime();
  const now = Date.now();
  const trialMs = 30 * 24 * 60 * 60 * 1000; // 30 days
  const elapsed = now - createdAt;
  const daysLeft = Math.max(0, Math.ceil((trialMs - elapsed) / (1000 * 60 * 60 * 24)));

  return (
    <div className="mx-4 mt-3 mb-2 bg-blue-50/90 border border-blue-200/80 p-3.5 rounded-2xl shadow-xs flex items-start gap-3">
      <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs text-blue-950 font-medium leading-snug">
          You are currently on the Free Trial. Your data is completely safe with us — recharge with an AMC pack anytime to continue uninterrupted.
        </p>
        <p className="text-[10px] font-bold text-blue-700 mt-1 uppercase tracking-wider">
          {daysLeft > 0 ? `${daysLeft} Days Remaining in Trial` : "Trial Completed • Recharge Anytime"}
        </p>
      </div>
    </div>
  );
}

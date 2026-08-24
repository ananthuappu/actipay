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
  const trialMs = 5 * 24 * 60 * 60 * 1000; // 5 days
  const elapsed = now - createdAt;
  const daysLeft = Math.max(0, Math.ceil((trialMs - elapsed) / (1000 * 60 * 60 * 24)));

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-start gap-3">
      <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs text-amber-800 font-medium leading-snug">
          You are on a Free Trial. Please recharge with an AMC pack to upgrade your account and prevent deletion after 5 days.
        </p>
        <p className="text-[10px] font-bold text-amber-600 mt-1 uppercase tracking-wide">
          {daysLeft} Days Left
        </p>
      </div>
    </div>
  );
}

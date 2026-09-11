"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { isGymInTrial, getTrialDaysRemaining, TRIAL_MEMBER_LIMIT } from "@/lib/constants";
import { Info } from "lucide-react";

export default function TrialBanner() {
  const { gym } = useAuth();

  if (!gym || !isGymInTrial(gym)) {
    return null;
  }

  const daysLeft = getTrialDaysRemaining(gym);

  return (
    <div className="mx-4 mt-3 mb-2 bg-blue-50/90 border border-blue-200/80 p-3.5 rounded-2xl shadow-xs flex items-start gap-3">
      <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs text-blue-950 font-medium leading-snug">
          You are currently on the 30-day Free Trial (up to {TRIAL_MEMBER_LIMIT} members). All features, attendance, and payments are unrestricted.
        </p>
        <p className="text-[10px] font-bold text-blue-700 mt-1 uppercase tracking-wider">
          {daysLeft > 0 ? `${daysLeft} Days Remaining in Free Trial • ${TRIAL_MEMBER_LIMIT} Member Cap` : "Trial Completed • Upgrade to Continue"}
        </p>
      </div>
    </div>
  );
}

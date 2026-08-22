"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import UpgradeModal from "./UpgradeModal";
import { Zap } from "lucide-react";

export default function SubscriptionBanner() {
  const { gym } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!gym) return null;

  // 1. Logic for PRO Users (Renewals)
  if (gym.isSubscribed) {
    if (!gym.subscriptionExpiresAt) return null;
    
    const expiryDate = new Date(gym.subscriptionExpiresAt);
    const msLeft = expiryDate.getTime() - Date.now();
    const daysLeftToRenew = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

    // Hide banner if they have more than 7 days left
    if (daysLeftToRenew > 7) return null;

    const isProExpired = daysLeftToRenew <= 0;

    return (
      <>
        <div className="bg-red-50 border-b border-red-200 p-4 shadow-sm">
          <div className="flex flex-col gap-3 max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-xl shrink-0 mt-0.5 shadow-sm">
                <Zap className="h-5 w-5 fill-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-red-900 flex items-center gap-1.5">
                  {isProExpired ? "SaaS Subscription Expired" : `Subscription ends in ${daysLeftToRenew} days`}
                </h4>
                <p className="text-xs font-semibold text-red-700/90 mt-0.5 leading-snug">
                  {isProExpired ? "Please renew to avoid service interruption." : "Renew your plan soon to keep the app running smoothly."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-fit mx-auto bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-black px-8 py-2.5 rounded-xl shadow-md hover:from-red-600 hover:to-red-700 transition-all uppercase tracking-wide mt-1"
            >
              Renew Now
            </button>
          </div>
        </div>
        <UpgradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  // 2. Logic for FREE TRIAL Users
  let daysLeft = 5;
  if (gym?.createdAt) {
    const createdDate = new Date(gym.createdAt);
    const msPassed = Date.now() - createdDate.getTime();
    const daysPassed = Math.floor(msPassed / (1000 * 60 * 60 * 24));
    daysLeft = Math.max(5 - daysPassed, 0);
  }

  const isExpired = daysLeft === 0;

  return (
    <>
      <div className="bg-amber-50 border-b border-amber-200 p-4 shadow-sm">
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl shrink-0 mt-0.5 shadow-sm">
              <Zap className="h-5 w-5 fill-amber-500" />
            </div>
            
            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                {isExpired ? "Free trial expired" : `Trial ends in ${daysLeft} days`}
              </h4>
              <p className="text-xs font-semibold text-amber-700/90 mt-0.5 leading-snug">
                Limited to 1 member. Accounts are auto-deleted 5 days after creation.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-fit mx-auto bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-black px-8 py-2.5 rounded-xl shadow-md hover:from-amber-600 hover:to-amber-700 transition-all uppercase tracking-wide mt-1"
          >
            Unlock Pro
          </button>
        </div>
      </div>
      <UpgradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import RechargeModal from "./RechargeModal";
import { Zap, AlertTriangle, Clock } from "lucide-react";
import {
  isGymInTrial,
  isFlatSubscription,
  isSubscriptionExpired,
  getSubscriptionDaysRemaining,
} from "@/lib/constants";

export default function RechargeBanner() {
  const { gym } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hidden for trial accounts (handled by TrialBanner)
  if (!gym || isGymInTrial(gym)) return null;

  // Handle Flat Subscriptions (Growth / Unlimited)
  if (isFlatSubscription(gym)) {
    const isExpired = isSubscriptionExpired(gym);
    const daysRemaining = getSubscriptionDaysRemaining(gym);

    // If subscription is healthy (> 3 days left), don't show annoying banner
    if (!isExpired && daysRemaining > 3) return null;

    return (
      <>
        <div
          className={`mx-4 mt-3 mb-2 p-4 rounded-2xl border shadow-xs ${
            isExpired ? "bg-red-50/90 border-red-200/80" : "bg-amber-50/90 border-amber-200/80"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl shrink-0 mt-0.5 shadow-xs ${
                  isExpired ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                }`}
              >
                {isExpired ? (
                  <AlertTriangle className="h-5 w-5 fill-red-500" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4
                  className={`text-sm font-bold flex items-center gap-1.5 ${
                    isExpired ? "text-red-900" : "text-amber-900"
                  }`}
                >
                  {isExpired
                    ? `${gym.subscriptionPlan || "Subscription"} Plan Expired`
                    : `${gym.subscriptionPlan || "Subscription"} Expiring in ${daysRemaining} day${
                        daysRemaining === 1 ? "" : "s"
                      }`}
                </h4>
                <p
                  className={`text-xs font-semibold mt-0.5 leading-snug ${
                    isExpired ? "text-red-700/90" : "text-amber-700/90"
                  }`}
                >
                  {isExpired
                    ? "Renew your flat monthly subscription to continue adding members."
                    : "Renew your subscription soon to avoid any interruption in member additions."}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className={`w-fit shrink-0 text-white text-xs font-black px-6 py-2.5 rounded-xl shadow-xs transition-all uppercase tracking-wide bg-gradient-to-r ${
                isExpired
                  ? "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  : "from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              }`}
            >
              {isExpired ? "Renew Now" : "Extend Plan"}
            </button>
          </div>
        </div>
        <RechargeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  // Handle Prepaid Credit Accounts (Starter / Grandfathered PAID)
  const balance = gym.walletBalance || 0;

  // Don't show banner if they have plenty of credits
  if (balance >= 5) return null;

  const isEmpty = balance === 0;

  return (
    <>
      <div
        className={`mx-4 mt-3 mb-2 p-4 rounded-2xl border shadow-xs ${
          isEmpty ? "bg-red-50/90 border-red-200/80" : "bg-amber-50/90 border-amber-200/80"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl shrink-0 mt-0.5 shadow-xs ${
                isEmpty ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
              }`}
            >
              {isEmpty ? (
                <AlertTriangle className="h-5 w-5 fill-red-500" />
              ) : (
                <Zap className="h-5 w-5 fill-amber-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4
                className={`text-sm font-bold flex items-center gap-1.5 ${
                  isEmpty ? "text-red-900" : "text-amber-900"
                }`}
              >
                {isEmpty ? "Wallet Empty: 0 AMCs" : `Low Balance: ${balance} AMCs remaining`}
              </h4>
              <p
                className={`text-xs font-semibold mt-0.5 leading-snug ${
                  isEmpty ? "text-red-700/90" : "text-amber-700/90"
                }`}
              >
                {isEmpty
                  ? "Recharge now to continue renewing or adding members."
                  : "Recharge soon to keep renewing members without interruption."}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className={`w-fit shrink-0 text-white text-xs font-black px-6 py-2.5 rounded-xl shadow-xs transition-all uppercase tracking-wide bg-gradient-to-r ${
              isEmpty
                ? "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                : "from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            }`}
          >
            Recharge Now
          </button>
        </div>
      </div>
      <RechargeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

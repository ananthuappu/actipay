"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import RechargeModal from "./RechargeModal";
import { Zap, AlertTriangle } from "lucide-react";

export default function RechargeBanner() {
  const { gym } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!gym) return null;

  const balance = gym.walletBalance || 0;

  // Don't show banner if they have plenty of credits
  if (balance >= 5) return null;

  const isEmpty = balance === 0;

  return (
    <>
      <div className={`${isEmpty ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"} border-b p-4 shadow-sm`}>
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl shrink-0 mt-0.5 shadow-sm ${isEmpty ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
              {isEmpty ? <AlertTriangle className="h-5 w-5 fill-red-500" /> : <Zap className="h-5 w-5 fill-amber-500" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-bold flex items-center gap-1.5 ${isEmpty ? "text-red-900" : "text-amber-900"}`}>
                {isEmpty ? "Wallet Empty: 0 AMCs" : `Low Balance: ${balance} AMCs remaining`}
              </h4>
              <p className={`text-xs font-semibold mt-0.5 leading-snug ${isEmpty ? "text-red-700/90" : "text-amber-700/90"}`}>
                {isEmpty 
                  ? "Recharge now to continue renewing or adding members." 
                  : "Recharge soon to keep renewing members without interruption."}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className={`w-fit mx-auto text-white text-sm font-black px-8 py-2.5 rounded-xl shadow-md transition-all uppercase tracking-wide mt-1 bg-gradient-to-r ${
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

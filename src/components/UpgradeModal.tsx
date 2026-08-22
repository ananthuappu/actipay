"use client";

import React, { useState } from "react";
import { Zap, Check, X, MessageSquare, Users, Infinity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export default function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  const { gym } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"PRO_100" | "PRO_UNLIMITED">("PRO_UNLIMITED");

  if (!isOpen) return null;

  const handleWhatsAppUpgrade = () => {
    const planName = selectedPlan === "PRO_100" ? "GymPay Pro (₹399/mo for 100 members)" : "GymPay Pro (₹799/mo for Unlimited members)";
    const message = `Hi! I want to activate ${planName} for my gym ${
      gym?.name || "My Gym"
    }. Please share your UPI details.`;
    const waUrl = `https://wa.me/918921376778?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Zap className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Upgrade to Pro</h2>
          {reason ? (
            <p className="mt-2 text-sm text-red-600 font-medium">{reason}</p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              Unlock the full potential of your gym with our Pro plans.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setSelectedPlan("PRO_100")}
            className={`border rounded-xl p-4 text-left transition ${
              selectedPlan === "PRO_100" ? "border-blue-600 ring-1 ring-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <Users className={`h-5 w-5 ${selectedPlan === "PRO_100" ? "text-blue-600" : "text-slate-400"}`} />
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${selectedPlan === "PRO_100" ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                {selectedPlan === "PRO_100" && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900">₹399<span className="text-xs font-normal text-slate-500">/mo</span></div>
            <div className="text-xs font-semibold text-slate-700 mt-1">Up to 100 Members</div>
          </button>

          <button
            onClick={() => setSelectedPlan("PRO_UNLIMITED")}
            className={`border rounded-xl p-4 text-left transition ${
              selectedPlan === "PRO_UNLIMITED" ? "border-blue-600 ring-1 ring-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <Infinity className={`h-5 w-5 ${selectedPlan === "PRO_UNLIMITED" ? "text-blue-600" : "text-slate-400"}`} />
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${selectedPlan === "PRO_UNLIMITED" ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                {selectedPlan === "PRO_UNLIMITED" && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900">₹799<span className="text-xs font-normal text-slate-500">/mo</span></div>
            <div className="text-xs font-semibold text-slate-700 mt-1">Unlimited Members</div>
          </button>
        </div>

        <div className="mb-8 space-y-4">
          <div className="flex items-start">
            <Check className="mr-3 h-5 w-5 shrink-0 text-green-500" />
            <span className="text-sm text-gray-600">WhatsApp dues reminders</span>
          </div>
          <div className="flex items-start">
            <Check className="mr-3 h-5 w-5 shrink-0 text-green-500" />
            <span className="text-sm text-gray-600">4+ days absentee alerts</span>
          </div>
          <div className="flex items-start">
            <Check className="mr-3 h-5 w-5 shrink-0 text-green-500" />
            <span className="text-sm text-gray-600">Monthly revenue analytics</span>
          </div>
        </div>

        <button
          onClick={handleWhatsAppUpgrade}
          className="flex w-full items-center justify-center rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
        >
          <MessageSquare className="mr-2 h-5 w-5" />
          Activate via WhatsApp
        </button>
      </div>
    </div>
  );
}

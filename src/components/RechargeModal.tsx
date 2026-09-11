"use client";

import React, { useState } from "react";
import { Zap, Check, X, MessageSquare, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export default function RechargeModal({ isOpen, onClose, reason }: RechargeModalProps) {
  const { gym } = useAuth();
  const [selectedPack, setSelectedPack] = useState<"starter" | "growth" | "unlimited">("growth");

  if (!isOpen) return null;

  const packs = {
    starter: {
      id: "starter",
      title: "Starter",
      badge: "Prepaid",
      price: "₹299",
      period: "",
      sub: "30 AMCs",
      rate: "₹9.96/member",
      info: "Prepaid member credits that never expire. Deducts on member add/renewal.",
    },
    growth: {
      id: "growth",
      title: "Growth",
      badge: "Most Popular",
      price: "₹599",
      period: "/ mo",
      sub: "Up to 100 Members",
      rate: "Flat rate",
      info: "Flat monthly subscription for up to 100 active members. Zero credit math.",
    },
    unlimited: {
      id: "unlimited",
      title: "Unlimited",
      badge: "No Caps",
      price: "₹999",
      period: "/ mo",
      sub: "Unlimited Members",
      rate: "Flat rate",
      info: "Flat monthly subscription for unlimited members. Never worry about upgrading.",
    },
  };

  const handleWhatsAppRecharge = () => {
    const pack = packs[selectedPack];
    let planDesc = "";
    if (selectedPack === "starter") {
      planDesc = "Starter Pack (₹299 for 30 AMCs - Prepaid)";
    } else if (selectedPack === "growth") {
      planDesc = "Growth Plan (₹599/month - Up to 100 Members)";
    } else {
      planDesc = "Unlimited Plan (₹999/month - Unlimited Members)";
    }

    const message = `Hi! I want to upgrade/recharge my ActiPay Fitness account to the ${planDesc} for my business ${
      gym?.name || ""
    } (${gym?.phone || ""}). Please share your UPI / payment details.`;
    const waUrl = `https://wa.me/918921376778?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-xs">
            <Wallet className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Upgrade or Recharge</h2>
          {reason ? (
            <p className="mt-2 text-xs sm:text-sm text-red-600 font-semibold bg-red-50 py-1.5 px-3 rounded-xl border border-red-200 inline-block">
              {reason}
            </p>
          ) : (
            <p className="mt-1.5 text-xs sm:text-sm text-gray-500">
              Select the plan that fits your gym's size and billing preference.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {Object.entries(packs).map(([key, pack]) => {
            const isSelected = selectedPack === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedPack(key as any)}
                className={`border-2 rounded-2xl p-4 text-left transition relative flex flex-col justify-between ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 shadow-sm"
                    : "border-slate-200 hover:border-blue-300 bg-white"
                }`}
              >
                {pack.badge && (
                  <div
                    className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-xs ${
                      key === "growth"
                        ? "bg-amber-400 text-amber-950"
                        : key === "unlimited"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-700 text-slate-100"
                    }`}
                  >
                    {pack.badge}
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      {pack.title}
                    </span>
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300"
                      }`}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-extrabold text-slate-900">{pack.price}</span>
                    <span className="text-[11px] font-medium text-slate-500">{pack.period}</span>
                  </div>
                  <div className="text-[11px] font-bold text-blue-600 mt-1">{pack.sub}</div>
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-2 pt-2 border-t border-slate-100">
                  {pack.rate}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mb-6 space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="text-xs font-bold text-slate-800 mb-1">
            {packs[selectedPack].title} Highlights:
          </div>
          <div className="flex items-start">
            <Check className="mr-2.5 h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span className="text-xs text-slate-600">{packs[selectedPack].info}</span>
          </div>
          <div className="flex items-start">
            <Check className="mr-2.5 h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span className="text-xs text-slate-600">
              Instant activation with UPI or bank transfer.
            </span>
          </div>
        </div>

        <button
          onClick={handleWhatsAppRecharge}
          className="flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.99] transition"
        >
          <MessageSquare className="mr-2 h-5 w-5" />
          Continue via WhatsApp
        </button>
      </div>
    </div>
  );
}

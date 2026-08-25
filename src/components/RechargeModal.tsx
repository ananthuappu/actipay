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
  const [selectedPack, setSelectedPack] = useState<"30" | "100" | "300">("100");

  if (!isOpen) return null;

  const packs = {
    "30": { amc: 30, price: "₹299", desc: "₹9.96 / member" },
    "100": { amc: 100, price: "₹599", desc: "₹5.99 / member" },
    "300": { amc: 300, price: "₹1,199", desc: "₹3.99 / member" },
  };

  const handleWhatsAppRecharge = () => {
    const pack = packs[selectedPack];
    const message = `Hi! I want to recharge my ActiPay Fitness wallet with the ${pack.amc} AMC Pack (${pack.price}) for my business ${
      gym?.name || ""
    } (${gym?.phone || ""}). Please share your UPI details.`;
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
            <Wallet className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Recharge Wallet</h2>
          {reason ? (
            <p className="mt-2 text-sm text-red-600 font-medium">{reason}</p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              Buy Active Member Credits (AMCs). 1 AMC = 1 Member for 30 Days. Credits never expire!
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {Object.entries(packs).map(([key, pack]) => {
            const isSelected = selectedPack === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedPack(key as any)}
                className={`border rounded-xl p-3 text-left transition relative ${
                  isSelected ? "border-blue-600 ring-1 ring-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                }`}
              >
                {key === "300" && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    BEST VALUE
                  </div>
                )}
                <div className="flex justify-between items-start mb-2">
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                    {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="text-lg font-bold text-slate-900">{pack.price}</div>
                <div className="text-[10px] font-bold text-blue-600 mt-1 uppercase">{pack.amc} AMCs</div>
                <div className="text-[9px] font-semibold text-slate-500 mt-0.5">{pack.desc}</div>
              </button>
            );
          })}
        </div>

        <div className="mb-8 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex items-start">
            <Check className="mr-3 h-4 w-4 shrink-0 text-green-500 mt-0.5" />
            <span className="text-xs text-slate-600 font-medium">1 AMC is deducted only when a member renews for 30 days.</span>
          </div>
          <div className="flex items-start">
            <Check className="mr-3 h-4 w-4 shrink-0 text-green-500 mt-0.5" />
            <span className="text-xs text-slate-600 font-medium">Inactive members cost nothing. You never overpay in slow months.</span>
          </div>
          <div className="flex items-start">
            <Check className="mr-3 h-4 w-4 shrink-0 text-green-500 mt-0.5" />
            <span className="text-xs text-slate-600 font-medium">Credits stay in your wallet forever.</span>
          </div>
        </div>

        <button
          onClick={handleWhatsAppRecharge}
          className="flex w-full items-center justify-center rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
        >
          <MessageSquare className="mr-2 h-5 w-5" />
          Recharge via WhatsApp
        </button>
      </div>
    </div>
  );
}

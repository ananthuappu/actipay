"use client";

import React, { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import { X, Download, CheckCircle2, Share2 } from "lucide-react";
import { PaymentRecord } from "@/types";

interface ReceiptModalProps {
  payment: PaymentRecord;
  gymName: string;
  gymPhone?: string;
  onClose: () => void;
}

export default function ReceiptModal({ payment, gymName, gymPhone, onClose }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleShareOrDownload = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      // Need a small timeout to ensure fonts load before generating
      await new Promise(res => setTimeout(res, 100));
      const dataUrl = await htmlToImage.toJpeg(receiptRef.current, { 
        quality: 1.0, 
        backgroundColor: "#ffffff",
        style: { transform: 'scale(1)', transformOrigin: 'top left' } // Prevents cutoff on mobile
      });

      const filename = `Receipt_${payment.memberName.replace(/\s+/g, '_')}_${payment.paymentDate}.jpg`;

      // Convert dataUrl to File object for Web Share API
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "image/jpeg" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Payment Receipt",
          text: `Payment Receipt for ${payment.memberName} from ${gymName}`,
        });
      } else {
        // Fallback to direct download
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        link.click();
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Failed to generate/share receipt:", err);
        alert("Failed to share receipt. Please try again.");
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10 bg-white/50 rounded-full p-1"
        >
          <X className="h-5 w-5" />
        </button>

        {/* The Actual Receipt Div - What gets rendered to image */}
        <div ref={receiptRef} className="bg-white p-6 pb-8 relative pt-10">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{gymName}</h2>
            {gymPhone && <p className="text-xs text-slate-500 font-medium">Ph: {gymPhone}</p>}
          </div>

          <div className="border-t border-dashed border-slate-300 my-4" />

          <div className="text-center mb-6">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Payment Successful</p>
            <p className="text-4xl font-black text-slate-900">₹{payment.amount.toLocaleString("en-IN")}</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">Paid via {payment.paymentMode}</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Member Name</span>
              <span className="font-bold text-slate-800">{payment.memberName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Payment Date</span>
              <span className="font-bold text-slate-800">{payment.paymentDate}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Valid Until</span>
              <span className="font-bold text-slate-800">{payment.validUntil}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Category</span>
              <span className="font-bold text-slate-800">{payment.category}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Transaction ID</span>
              <span className="font-bold text-slate-800 text-xs">{payment.id.slice(0, 10).toUpperCase()}</span>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-slate-400 font-medium">
            Generated via ActiPay Fitness
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={handleShareOrDownload}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition active:scale-95 disabled:opacity-50 shadow-sm"
          >
            <Share2 className="h-4 w-4" />
            {downloading ? "Processing..." : "Share / Save Receipt"}
          </button>
        </div>
      </div>
    </div>
  );
}

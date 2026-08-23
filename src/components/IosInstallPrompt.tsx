"use client";

import { useState, useEffect } from "react";
import { X, Share } from "lucide-react";

export default function IosInstallPrompt() {
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    // Detect if already installed (standalone mode)
    const isStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;

    setIsIos(isIosDevice);
    setIsStandalone(isStandaloneMode);

    // If it's iOS and NOT installed, show the prompt (maybe after a small delay)
    if (isIosDevice && !isStandaloneMode) {
      // Check if user previously dismissed it
      const hasDismissed = localStorage.getItem("iosInstallDismissed");
      if (!hasDismissed) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.1)] pb-8 animate-in slide-in-from-bottom-full duration-300">
      <div className="max-w-md mx-auto flex gap-4 items-start relative">
        <button 
          onClick={() => {
            setShowPrompt(false);
            localStorage.setItem("iosInstallDismissed", "true");
          }}
          className="absolute -top-2 -right-2 p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="bg-blue-100 p-3 rounded-2xl flex-shrink-0">
          <img src="/icon.svg" alt="ActiPay" className="h-10 w-10 rounded-xl" />
        </div>
        
        <div>
          <h3 className="font-bold text-slate-900 leading-tight">Install ActiPay</h3>
          <p className="text-xs text-slate-600 mt-1 leading-snug">
            Install this app on your iPhone for quick access and offline mode.
          </p>
          <p className="text-xs font-semibold text-slate-800 mt-2 flex items-center gap-1.5 bg-slate-100 w-fit px-2 py-1 rounded-md">
            Tap <Share className="h-3.5 w-3.5 text-blue-600" /> then &quot;Add to Home Screen&quot;
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { X, Share, Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PwaInstallPrompt() {
  const { user } = useAuth();
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    // Detect if already installed (standalone mode)
    const isStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    // Also check standard display-mode (for Android/Desktop Chromium)
    const isStandardStandalone = window.matchMedia('(display-mode: standalone)').matches;

    setIsIos(isIosDevice);
    setIsStandalone(isStandaloneMode || isStandardStandalone);

    // If it's iOS and NOT installed, show the iOS prompt (maybe after a small delay)
    if (user && isIosDevice && !isStandaloneMode && !isStandardStandalone) {
      const hasDismissed = localStorage.getItem("installDismissed");
      if (!hasDismissed) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    }

    // For Android / Desktop Chromium: listen for the beforeinstallprompt event globally
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      const hasDismissed = localStorage.getItem("installDismissed");
      if (user && !hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [user]);

  // Secondary effect to show prompt if user logs in and we already have a deferredPrompt
  useEffect(() => {
    if (user && deferredPrompt && !localStorage.getItem("installDismissed")) {
      setShowPrompt(true);
    }
  }, [user, deferredPrompt]);

  if (!showPrompt) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the native install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("installDismissed", "true");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.1)] pb-8 animate-in slide-in-from-bottom-full duration-300">
      <div className="max-w-md mx-auto flex gap-4 items-start relative">
        <button 
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="bg-blue-100 p-3 rounded-2xl flex-shrink-0">
          <img src="/icon.svg" alt="ActiPay Fitness" className="h-10 w-10 rounded-xl" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 leading-tight">Install ActiPay Fitness</h3>
          <p className="text-xs text-slate-600 mt-1 leading-snug">
            Install this app for quick access and offline mode.
          </p>
          
          {isIos ? (
            <p className="text-xs font-semibold text-slate-800 mt-2 flex items-center gap-1.5 bg-slate-100 w-fit px-2 py-1 rounded-md">
              Tap <Share className="h-3.5 w-3.5 text-blue-600" /> then &quot;Add to Home Screen&quot;
            </p>
          ) : (
            <button 
              onClick={handleInstallClick}
              className="mt-3 flex items-center justify-center w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-xl transition"
            >
              <Download className="h-4 w-4" /> Install App
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

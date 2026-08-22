"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Dumbbell, ArrowRight } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 max-w-md mx-auto">
      <div className="w-full flex justify-between items-center py-4">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900">
          <div className="p-2 bg-blue-600 text-white rounded-xl">
            <Dumbbell className="h-5 w-5" />
          </div>
          GymPay
        </div>
        <Link
          href="/login"
          className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition"
        >
          Sign In
        </Link>
      </div>

      <div className="w-full my-auto text-center space-y-4 py-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          ⚡ Mobile Payment Tracker
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          Collect Gym Fees <br />
          <span className="text-blue-600">On Time, Every Time</span>
        </h1>
        <p className="text-sm text-slate-600 px-4">
          Simple member dues tracking and one-tap WhatsApp payment reminders built for gym owners.
        </p>

        {/* Pricing Cards */}
        <div className="mt-8 space-y-4 max-w-sm mx-auto">
          {/* Pro 100 */}
          <div className="text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Pro 100</h2>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-extrabold text-slate-900">₹399</span>
              <span className="text-xs text-slate-500 font-medium">/ month</span>
            </div>
            
            <ul className="space-y-2 mb-4">
              <li className="flex items-start text-xs text-slate-600">
                <span className="mr-2 text-green-500">✓</span>
                Up to 100 members
              </li>
              <li className="flex items-start text-xs text-slate-600">
                <span className="mr-2 text-green-500">✓</span>
                WhatsApp dues reminders & alerts
              </li>
            </ul>
          </div>

          {/* Pro Unlimited */}
          <div className="text-left bg-blue-50 border border-blue-200 ring-1 ring-blue-500 rounded-2xl p-5 shadow-xs relative">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl rounded-tr-xl">
              BEST VALUE
            </div>
            <h2 className="text-lg font-bold text-blue-900 mb-1">Pro Unlimited</h2>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-extrabold text-blue-900">₹799</span>
              <span className="text-xs text-blue-600 font-medium">/ month</span>
            </div>
            
            <ul className="space-y-2 mb-4">
              <li className="flex items-start text-xs text-slate-600">
                <span className="mr-2 text-green-500">✓</span>
                Unlimited members & payments
              </li>
              <li className="flex items-start text-xs text-slate-600">
                <span className="mr-2 text-green-500">✓</span>
                All features from Pro 100
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="w-full space-y-3 pb-8 max-w-sm mx-auto">
        <Link
          href="/register"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-slate-900 font-semibold text-white shadow-md hover:bg-slate-800 transition active:scale-[0.98]"
        >
          Try Free Trial (1 Member limit) <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/login"
          className="flex items-center justify-center w-full py-3 rounded-xl border border-slate-300 font-medium text-slate-700 hover:bg-slate-100 transition text-sm mt-2"
        >
          Already have an account? Sign In
        </Link>
      </div>
    </main>
  );
}
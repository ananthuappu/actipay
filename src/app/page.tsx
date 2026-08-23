"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Activity, ArrowRight } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
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
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="leading-none">ActiPay</span>
            <span className="text-[9px] text-slate-500 tracking-wide mt-0.5">PAY PER ACTIVE MEMBER</span>
          </div>
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
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
          Zero Dead <br /> Subscriptions. <br />
          <span className="text-blue-600">Pay Per Active Member.</span>
        </h1>
        <p className="text-sm text-slate-600 px-4">
          Stop paying flat monthly software fees for ghost members. Our prepaid credit system ensures you only pay for members who actually attend.
        </p>

        {/* Pricing Cards - Prepaid AMC */}
        <div className="mt-8 space-y-4 max-w-sm mx-auto">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prepaid Active Member Credits</p>
          
          {/* 50 AMC Pack */}
          <div className="text-left bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-1">50 AMC Pack</h2>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-extrabold text-slate-900">₹229</span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">~₹4.58 / member</span>
            </div>
            <p className="text-xs text-slate-600">Valid for 50 active member renewals.</p>
          </div>

          {/* 100 AMC Pack */}
          <div className="text-left bg-blue-50 border border-blue-200 ring-1 ring-blue-500 rounded-2xl p-4 shadow-xs relative">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl rounded-tr-xl">
              POPULAR
            </div>
            <h2 className="text-lg font-bold text-blue-900 mb-1">100 AMC Pack</h2>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-extrabold text-blue-900">₹399</span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">~₹3.99 / member</span>
            </div>
            <p className="text-xs text-blue-800/80">Valid for 100 active member renewals.</p>
          </div>

          {/* 300 AMC Pack */}
          <div className="text-left bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-1">300 AMC Pack</h2>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-extrabold text-slate-900">₹899</span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">~₹2.99 / member</span>
            </div>
            <p className="text-xs text-slate-600">Valid for 300 active member renewals.</p>
          </div>
        </div>
      </div>

      <div className="w-full space-y-3 pb-8 max-w-sm mx-auto">
        <Link
          href="/register"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-slate-900 font-semibold text-white shadow-md hover:bg-slate-800 transition active:scale-[0.98]"
        >
          Try Free Trial (1 Free AMC) <ArrowRight className="h-4 w-4" />
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
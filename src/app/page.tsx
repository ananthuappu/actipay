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
      </div>

      <div className="w-full space-y-3 pb-8">
        <Link
          href="/register"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-blue-600 font-semibold text-white shadow-md hover:bg-blue-700 transition active:scale-[0.98]"
        >
          Get Started Free <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/login"
          className="flex items-center justify-center w-full py-3 rounded-xl border border-slate-300 font-medium text-slate-700 hover:bg-slate-100 transition text-sm"
        >
          Already have an account? Sign In
        </Link>
      </div>
    </main>
  );
}
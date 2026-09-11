"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  ChevronLeft,
} from "lucide-react";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const authEmail = identifier.trim().toLowerCase();

    try {
      await signInWithEmailAndPassword(auth, authEmail, password);
      router.push("/dashboard");
    } catch (err: any) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid email address or password.");
      } else {
        setError(err.message || "Failed to login. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-950 font-sans">
      {/* Left Column: Brand & Value Showcase (Desktop) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 flex-col justify-between p-10 lg:p-16 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white border-r border-slate-800/80">
        {/* Ambient Gradient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <span className="text-2xl lg:text-3xl font-black tracking-tight text-white group-hover:text-blue-400 transition">
              ActiPay
            </span>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 tracking-wider">
              Fitness OS
            </span>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 max-w-xl space-y-6 my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Pay-As-You-Grow Gym Management</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
            Manage gym members, dues, and staff without fixed software waste.
          </h2>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5">
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0 border border-emerald-500/30">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">WhatsApp Due Reminders with 1-Tap UPI</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct UPI payment links sent straight to members for quick collections.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 mt-0.5 shrink-0 border border-blue-500/30">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">Front-Desk & Trainer Multi-Role Logins</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Staff can punch attendance and collect fees while owner revenue stays private.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 mt-0.5 shrink-0 border border-indigo-500/30">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">Starter from ₹299 or Flat ₹599/mo</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Start pay-as-you-go and switch to flat pricing anytime. 30-day Free Trial included.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Left Footer */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>ActiPay Fitness Technologies</span>
          <span className="text-blue-400 font-semibold">30-Day Free Trial (Up to 50 Members)</span>
        </div>
      </div>

      {/* Right Column: Form Card */}
      <div className="w-full md:w-1/2 lg:w-2/5 min-h-screen flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 bg-white sm:bg-slate-50 md:bg-white relative">
        {/* Back link for mobile/desktop */}
        <div className="w-full max-w-md mb-6 flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <div className="md:hidden">
            <span className="text-lg font-black tracking-tight text-blue-600">ActiPay</span>
          </div>
        </div>

        <div className="w-full max-w-md bg-white sm:p-8 sm:rounded-3xl sm:border sm:border-slate-200/80 sm:shadow-xl sm:shadow-slate-200/50">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sign In</h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter your Gym Owner or Staff credentials to access your account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-red-50 text-red-700 rounded-2xl border border-red-200 leading-relaxed animate-in fade-in">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Login Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="owner@gym.com or staff@gym.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 pl-10 pr-10 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="pt-4 border-t border-slate-100 text-center space-y-2">
              <p className="text-xs text-slate-600">
                New gym owner?{" "}
                <Link
                  href="/register"
                  className="text-blue-600 font-bold hover:text-blue-700 hover:underline"
                >
                  Register your gym (30-Day Free Trial)
                </Link>
              </p>
              <p className="text-[11px] text-slate-400">
                Front-desk staff logins are created by gym owners in the Dashboard.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

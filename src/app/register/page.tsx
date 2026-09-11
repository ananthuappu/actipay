"use client";

import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Eye,
  EyeOff,
  Building,
  Phone,
  Mail,
  Lock,
  QrCode,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  ChevronLeft,
} from "lucide-react";

export default function RegisterPage() {
  const { user, loading, refreshGymData } = useAuth();
  const [gymName, setGymName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [upiId, setUpiId] = useState("");
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      setIsSubmitting(false);
      return;
    }

    const authEmail = email.trim().toLowerCase();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
      const user = userCredential.user;

      const gymData = {
        gymId: user.uid,
        ownerId: user.uid,
        name: gymName.trim(),
        phone: cleanPhone,
        authEmail: authEmail,
        upiId: upiId.trim(),
        currency: "INR",
        walletBalance: 0, // Trial mode does not track AMCs
        subscriptionPlan: "TRIAL",
        role: "owner",
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, COLLECTIONS.GYMS, user.uid), gymData);
      await refreshGymData();

      router.push("/dashboard");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this phone/email already exists. Please log in.");
      } else {
        setError(err.message || "Failed to create account. Please check your details.");
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
        <div className="relative z-10 max-w-xl space-y-6 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-300">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Instant 30-Day Free Trial (Up to 50 Members)</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
            Start managing your fitness center in under 2 minutes.
          </h2>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5">
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0 border border-emerald-500/30">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">Zero Credit Card Required</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Get full unrestricted access to add up to 50 members, punch attendance, and test payment flows.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 mt-0.5 shrink-0 border border-blue-500/30">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">Automated WhatsApp Payment Receipts</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Deliver professional branded receipts and due reminders straight to member WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 mt-0.5 shrink-0 border border-indigo-500/30">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">Multi-Staff & Front Desk Support</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Add unlimited receptionists or trainers while keeping business revenue logs secure.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Left Footer */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>ActiPay Fitness Technologies</span>
          <span className="text-emerald-400 font-semibold">No Setup or Onboarding Fees</span>
        </div>
      </div>

      {/* Right Column: Form Card */}
      <div className="w-full md:w-1/2 lg:w-2/5 min-h-screen flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 bg-white sm:bg-slate-50 md:bg-white relative overflow-y-auto">
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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase mb-2">
              30-Day Free Trial (50 Member Cap)
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Register Your Gym</h1>
            <p className="text-xs text-slate-500 mt-1">
              Create your business account to start managing members and collections.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-3.5">
            {error && (
              <div className="p-3 text-xs bg-red-50 text-red-700 rounded-2xl border border-red-200 leading-relaxed animate-in fade-in">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gym / Center Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Iron & Steel Fitness"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Owner&apos;s WhatsApp Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Login Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="owner@gym.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">UPI ID / VPA</label>
                <span className="text-[10px] text-slate-400 font-medium">Optional</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <QrCode className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. gymname@okaxis or 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-xs"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Direct UPI link attached to WhatsApp fee due reminders.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="•••••••• (Min 6 chars)"
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Start 30-Day Free Trial</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="pt-3 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-600">
                Already registered?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 font-bold hover:text-blue-700 hover:underline"
                >
                  Login to your account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

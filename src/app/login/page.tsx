"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // Can be phone or email
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const input = identifier.trim();
    // If input is purely digits or doesn't contain '@', treat it as a phone alias
    const isEmail = input.includes("@");
    const cleanPhone = input.replace(/\D/g, "");
    const authEmail = isEmail ? input.toLowerCase() : `${cleanPhone}@gympay.app`;

    try {
      await signInWithEmailAndPassword(auth, authEmail, password);
      router.push("/dashboard");
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid phone/email or password.");
      } else {
        setError(err.message || "Failed to login. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col justify-center px-6 py-10 sm:max-w-md sm:mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">GymPay</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to manage your gym</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        {error && (
          <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Mobile Number or Email
          </label>
          <input
            type="text"
            required
            placeholder="9876543210 or owner@gym.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-xs text-slate-500 pt-2">
          New gym owner?{" "}
          <Link href="/register" className="text-blue-600 font-semibold hover:underline">
            Register your gym
          </Link>
        </p>
      </form>
    </main>
  );
}
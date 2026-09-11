"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, notFound } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  COLLECTIONS,
  isSubscriptionActive,
  isSubscriptionExpired,
  getSubscriptionDaysRemaining,
  getTrialDaysRemaining,
} from "@/lib/constants";
import { GymProfile } from "@/types";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  increment,
  query,
} from "firebase/firestore";
import {
  Coins,
  Search,
  RotateCcw,
  CheckCircle2,
  Building2,
  Phone,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Clock,
  Calendar,
  Wallet,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function AdminPage() {
  const { user, gym, loading } = useAuth();
  const router = useRouter();

  const [gyms, setGyms] = useState<GymProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlan, setFilterPlan] = useState<"ALL" | "TRIAL" | "STARTER" | "GROWTH" | "UNLIMITED">("ALL");
  const [updatingGymId, setUpdatingGymId] = useState<string | null>(null);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!loading && gym && gym.role !== "admin") {
    notFound();
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchGyms = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const q = query(collection(db, COLLECTIONS.GYMS));
      const snap = await getDocs(q);
      const list: GymProfile[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          gymId: d.id,
          name: data.name || "Unnamed Gym",
          phone: data.phone || "No phone",
          currency: data.currency || "INR",
          walletBalance: data.walletBalance ?? 0,
          subscriptionPlan: data.subscriptionPlan || "TRIAL",
          billing_model: data.billing_model,
          member_cap: data.member_cap,
          planExpiresAt: data.planExpiresAt,
          createdAt: data.createdAt || "",
          ...data,
        } as GymProfile);
      });
      setGyms(list);
    } catch (err) {
      console.error("Error fetching gyms:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGyms();
    }
  }, [user]);

  // 1. Credit Top-Up Handlers (Starter Prepaid)
  const handleAddCredits = async (gymId: string, gymName: string, amount: number) => {
    if (amount === 0) return;
    setUpdatingGymId(gymId);

    try {
      const gymRef = doc(db, COLLECTIONS.GYMS, gymId);
      await updateDoc(gymRef, {
        walletBalance: increment(amount),
        subscriptionPlan: "STARTER",
        billing_model: "prepaid_credits",
        member_cap: null,
      });

      setGyms((prev) =>
        prev.map((g) =>
          g.gymId === gymId
            ? {
                ...g,
                walletBalance: (g.walletBalance || 0) + amount,
                subscriptionPlan: "STARTER",
                billing_model: "prepaid_credits",
                member_cap: null,
              }
            : g
        )
      );

      setCustomAmounts((prev) => ({ ...prev, [gymId]: "" }));
      setStatusMessage(`Added +${amount} AMCs to ${gymName}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error: any) {
      console.error("Failed to update wallet balance:", error);
      alert("Error: " + error.message);
    } finally {
      setUpdatingGymId(null);
    }
  };

  // 2. Flat Subscription Activation (+30 Days for Growth or Unlimited)
  const handleActivateSubscription = async (
    gymId: string,
    gymName: string,
    plan: "GROWTH" | "UNLIMITED"
  ) => {
    const gymObj = gyms.find((g) => g.gymId === gymId);
    const existingExpiry = gymObj?.planExpiresAt
      ? new Date(gymObj.planExpiresAt).getTime()
      : 0;
    const baseTime = existingExpiry > Date.now() ? existingExpiry : Date.now();
    const newExpiry = new Date(baseTime + 30 * 24 * 60 * 60 * 1000).toISOString();
    const cap = plan === "GROWTH" ? 100 : null;

    if (!confirm(`Activate 30 Days of ${plan} Subscription for ${gymName}? (Valid until: ${newExpiry.split("T")[0]})`)) return;

    setUpdatingGymId(gymId);
    try {
      const gymRef = doc(db, COLLECTIONS.GYMS, gymId);
      await updateDoc(gymRef, {
        subscriptionPlan: plan,
        billing_model: "flat_subscription",
        member_cap: cap,
        planExpiresAt: newExpiry,
      });

      setGyms((prev) =>
        prev.map((g) =>
          g.gymId === gymId
            ? {
                ...g,
                subscriptionPlan: plan,
                billing_model: "flat_subscription",
                member_cap: cap,
                planExpiresAt: newExpiry,
              }
            : g
        )
      );

      setStatusMessage(`Activated +30 Days ${plan} Plan for ${gymName}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error: any) {
      console.error("Failed to activate subscription:", error);
      alert("Error: " + error.message);
    } finally {
      setUpdatingGymId(null);
    }
  };

  // 3. Set to Starter Plan (Prepaid)
  const handleSetStarterPlan = async (gymId: string, gymName: string) => {
    if (!confirm(`Switch ${gymName} to Starter (Prepaid AMCs)?`)) return;

    setUpdatingGymId(gymId);
    try {
      const gymRef = doc(db, COLLECTIONS.GYMS, gymId);
      await updateDoc(gymRef, {
        subscriptionPlan: "STARTER",
        billing_model: "prepaid_credits",
        member_cap: null,
      });

      setGyms((prev) =>
        prev.map((g) =>
          g.gymId === gymId
            ? {
                ...g,
                subscriptionPlan: "STARTER",
                billing_model: "prepaid_credits",
                member_cap: null,
              }
            : g
        )
      );

      setStatusMessage(`Updated ${gymName} to Starter Plan`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error: any) {
      console.error("Failed to update plan:", error);
      alert("Error: " + error.message);
    } finally {
      setUpdatingGymId(null);
    }
  };

  // 4. Set to Trial Plan
  const handleSetTrialPlan = async (gymId: string, gymName: string) => {
    if (!confirm(`Reset ${gymName} back to 30-Day Free Trial (50 Cap)?`)) return;

    setUpdatingGymId(gymId);
    try {
      const gymRef = doc(db, COLLECTIONS.GYMS, gymId);
      await updateDoc(gymRef, {
        subscriptionPlan: "TRIAL",
        billing_model: "prepaid_credits",
        member_cap: 50,
      });

      setGyms((prev) =>
        prev.map((g) =>
          g.gymId === gymId
            ? {
                ...g,
                subscriptionPlan: "TRIAL",
                billing_model: "prepaid_credits",
                member_cap: 50,
              }
            : g
        )
      );

      setStatusMessage(`Reset ${gymName} to Free Trial`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error: any) {
      console.error("Failed to update subscription plan:", error);
      alert("Error: " + error.message);
    } finally {
      setUpdatingGymId(null);
    }
  };

  const handleSetExactBalance = async (gymId: string, gymName: string, exactValue: number) => {
    if (!confirm(`Reset ${gymName}'s wallet balance to ${exactValue} AMCs?`)) return;

    setUpdatingGymId(gymId);
    try {
      const gymRef = doc(db, COLLECTIONS.GYMS, gymId);
      await updateDoc(gymRef, { walletBalance: exactValue });

      setGyms((prev) =>
        prev.map((g) => (g.gymId === gymId ? { ...g, walletBalance: exactValue } : g))
      );

      setStatusMessage(`Reset ${gymName} balance to ${exactValue}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error: any) {
      console.error("Failed to reset balance:", error);
      alert("Error: " + error.message);
    } finally {
      setUpdatingGymId(null);
    }
  };

  // 5. Expired Trial Cleanup Logic
  const now = Date.now();
  const EXPIRED_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  const expiredGyms = gyms.filter((g) => {
    // Target only accounts on trial
    if (g.subscriptionPlan && g.subscriptionPlan !== "TRIAL") return false;
    if (!g.createdAt) return false;

    const createdTime = new Date(g.createdAt).getTime();
    return now - createdTime > EXPIRED_MS;
  });

  const handleDeleteExpired = async () => {
    if (
      !confirm(
        `Permanently delete ${expiredGyms.length} expired gym accounts and all their members, payments, and attendance subcollections?`
      )
    )
      return;

    setDeleting(true);
    let deletedCount = 0;

    for (const g of expiredGyms) {
      try {
        // Purge Members
        const membersSnap = await getDocs(
          collection(db, COLLECTIONS.GYMS, g.gymId, COLLECTIONS.MEMBERS)
        );
        for (const mDoc of membersSnap.docs) {
          await deleteDoc(doc(db, COLLECTIONS.GYMS, g.gymId, COLLECTIONS.MEMBERS, mDoc.id));
        }

        // Purge Payments
        const paymentsSnap = await getDocs(
          collection(db, COLLECTIONS.GYMS, g.gymId, COLLECTIONS.PAYMENTS)
        );
        for (const pDoc of paymentsSnap.docs) {
          await deleteDoc(doc(db, COLLECTIONS.GYMS, g.gymId, COLLECTIONS.PAYMENTS, pDoc.id));
        }

        // Purge Attendance
        const attendanceSnap = await getDocs(
          collection(db, COLLECTIONS.GYMS, g.gymId, COLLECTIONS.ATTENDANCE)
        );
        for (const aDoc of attendanceSnap.docs) {
          await deleteDoc(doc(db, COLLECTIONS.GYMS, g.gymId, COLLECTIONS.ATTENDANCE, aDoc.id));
        }

        // Purge Gym Root Document
        await deleteDoc(doc(db, COLLECTIONS.GYMS, g.gymId));
        deletedCount++;
      } catch (err) {
        console.error("Failed to delete gym:", g.gymId, err);
      }
    }

    alert(`Successfully purged ${deletedCount} expired gyms.`);
    setDeleting(false);
    fetchGyms();
  };

  const filteredGyms = gyms.filter((g) => {
    const matchesSearch =
      g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.phone?.includes(searchQuery) ||
      g.gymId?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterPlan === "TRIAL") return !g.subscriptionPlan || g.subscriptionPlan === "TRIAL";
    if (filterPlan === "STARTER") return g.subscriptionPlan === "STARTER" || g.subscriptionPlan === "PAID";
    if (filterPlan === "GROWTH") return g.subscriptionPlan === "GROWTH";
    if (filterPlan === "UNLIMITED") return g.subscriptionPlan === "UNLIMITED";
    return true;
  });

  const trialCount = gyms.filter((g) => !g.subscriptionPlan || g.subscriptionPlan === "TRIAL").length;
  const starterCount = gyms.filter((g) => g.subscriptionPlan === "STARTER" || g.subscriptionPlan === "PAID").length;
  const growthCount = gyms.filter((g) => g.subscriptionPlan === "GROWTH").length;
  const unlimitedCount = gyms.filter((g) => g.subscriptionPlan === "UNLIMITED").length;
  const totalAMCsCirculating = gyms.reduce((acc, g) => acc + (g.walletBalance || 0), 0);

  if (loading || loadingData || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-24 pt-6 px-4 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 text-white rounded-2xl shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Admin Control Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Manage subscriptions, Starter AMCs, and gym accounts</p>
        </div>

        {/* Global Summary Badges */}
        <div className="flex flex-wrap gap-2">
          <div className="bg-white px-3 py-2 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Gyms</p>
            <p className="text-base font-black text-slate-900">{gyms.length}</p>
          </div>
          <div className="bg-white px-3 py-2 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] uppercase font-bold text-indigo-600">Subscriptions</p>
            <p className="text-base font-black text-indigo-700">{growthCount + unlimitedCount}</p>
          </div>
          <div className="bg-white px-3 py-2 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] uppercase font-bold text-emerald-600">Prepaid AMCs</p>
            <p className="text-base font-black text-emerald-700">{totalAMCsCirculating}</p>
          </div>
        </div>
      </div>

      {/* Floating Status Toast */}
      {statusMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Section 1: Database Maintenance & Cleanup */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Trial Account Maintenance</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {expiredGyms.length} expired trial accounts (&gt;30 days)
          </span>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Purge un-upgraded trial accounts to prevent orphaned documents and optimize database storage.
        </p>

        {expiredGyms.length > 0 && (
          <button
            onClick={handleDeleteExpired}
            disabled={deleting}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-2xl bg-red-600 font-bold text-white text-xs shadow-xs hover:bg-red-700 transition disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "Purging Accounts..." : `Purge ${expiredGyms.length} Expired Gym Accounts`}
          </button>
        )}
      </div>

      {/* Section 2: Gym Accounts & Subscription Management */}
      <div className="space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search gym by name, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-xs"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto bg-white p-1 rounded-2xl border border-slate-200 shadow-xs shrink-0">
            {[
              { id: "ALL", label: `All (${gyms.length})` },
              { id: "TRIAL", label: `Trial (${trialCount})` },
              { id: "STARTER", label: `Starter (${starterCount})` },
              { id: "GROWTH", label: `Growth (${growthCount})` },
              { id: "UNLIMITED", label: `Unlimited (${unlimitedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterPlan(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap ${
                  filterPlan === tab.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gym Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {filteredGyms.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500 text-xs">
              No gyms found matching your query.
            </div>
          ) : (
            filteredGyms.map((gymItem) => {
              const currentBal = gymItem.walletBalance || 0;
              const isUpdating = updatingGymId === gymItem.gymId;
              const customVal = customAmounts[gymItem.gymId] || "";

              const isGrowth = gymItem.subscriptionPlan === "GROWTH";
              const isUnlimited = gymItem.subscriptionPlan === "UNLIMITED";
              const isStarter = gymItem.subscriptionPlan === "STARTER" || gymItem.subscriptionPlan === "PAID";
              const isTrial = !gymItem.subscriptionPlan || gymItem.subscriptionPlan === "TRIAL";

              const isSubActive = isSubscriptionActive(gymItem);
              const daysRemaining = getSubscriptionDaysRemaining(gymItem);
              const trialDaysRemaining = getTrialDaysRemaining(gymItem);

              return (
                <div
                  key={gymItem.gymId}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-indigo-300 transition"
                >
                  {/* Top Bar: Gym Info & Plan Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                        <h3 className="font-bold text-sm text-slate-900 truncate">{gymItem.name}</h3>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider border shrink-0 ${
                            isUnlimited
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : isGrowth
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : isStarter
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {isUnlimited
                            ? "Unlimited (₹999/mo)"
                            : isGrowth
                            ? "Growth (₹599/mo)"
                            : isStarter
                            ? "Starter (Prepaid)"
                            : "Trial (50 Cap)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-medium">
                          <Phone className="h-3 w-3" /> {gymItem.phone || "No phone"}
                        </span>
                        {gymItem.upiId && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 font-semibold">UPI: {gymItem.upiId}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="font-mono text-[10px] text-slate-400">ID: {gymItem.gymId.slice(0, 6)}...</span>
                      </div>
                    </div>
                  </div>

                  {/* Plan Status Banner inside Card */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    {(isGrowth || isUnlimited) ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800">
                            {isUnlimited ? "Unlimited Members" : "Up to 100 Members"}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {gymItem.planExpiresAt ? (
                              isSubActive ? (
                                <span className="text-emerald-700 font-semibold">
                                  Expires {gymItem.planExpiresAt.split("T")[0]} ({daysRemaining}d left)
                                </span>
                              ) : (
                                <span className="text-red-600 font-semibold">
                                  Expired on {gymItem.planExpiresAt.split("T")[0]}
                                </span>
                              )
                            ) : (
                              "No expiry timestamp set"
                            )}
                          </p>
                        </div>
                      </div>
                    ) : isTrial ? (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800">30-Day Free Trial (50 Member Cap)</p>
                          <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                            {trialDaysRemaining > 0 ? `${trialDaysRemaining} days remaining` : "Trial period completed"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800">Prepaid AMC Ledger (No Subscription)</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Deducts 1 AMC per active member/month</p>
                        </div>
                      </div>
                    )}

                    {/* Balance Display */}
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Wallet</span>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                          currentBal <= 0
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : currentBal < 10
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {currentBal} AMCs
                      </span>
                    </div>
                  </div>

                  {/* Actions Section 1: Subscription Activation */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Activate Subscription:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleActivateSubscription(gymItem.gymId, gymItem.name, "GROWTH")}
                        className="px-3 py-1.5 bg-amber-50 text-amber-900 hover:bg-amber-600 hover:text-white rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-40 border border-amber-200 shadow-xs"
                      >
                        +30d Growth (₹599)
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleActivateSubscription(gymItem.gymId, gymItem.name, "UNLIMITED")}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-900 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-40 border border-indigo-200 shadow-xs"
                      >
                        +30d Unlimited (₹999)
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleSetStarterPlan(gymItem.gymId, gymItem.name)}
                        className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-semibold transition active:scale-95 disabled:opacity-40 border border-emerald-200"
                      >
                        Set Starter
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleSetTrialPlan(gymItem.gymId, gymItem.name)}
                        className="px-2.5 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-medium transition active:scale-95 disabled:opacity-40"
                      >
                        Set Trial
                      </button>
                    </div>
                  </div>

                  {/* Actions Section 2: Starter AMC Top-Up */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Starter Prepaid AMCs:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { label: "+30 (₹299)", amt: 30 },
                        { label: "+100 (₹599)", amt: 100 },
                        { label: "+300", amt: 300 },
                      ].map((btn) => (
                        <button
                          key={btn.amt}
                          disabled={isUpdating}
                          onClick={() => handleAddCredits(gymItem.gymId, gymItem.name, btn.amt)}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-800 hover:text-white rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-40"
                        >
                          {btn.label}
                        </button>
                      ))}

                      {/* Custom Top-Up */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <input
                          type="number"
                          placeholder="Custom"
                          value={customVal}
                          onChange={(e) =>
                            setCustomAmounts((prev) => ({ ...prev, [gymItem.gymId]: e.target.value }))
                          }
                          className="w-20 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          disabled={!customVal || isUpdating}
                          onClick={() =>
                            handleAddCredits(gymItem.gymId, gymItem.name, parseInt(customVal, 10) || 0)
                          }
                          className="px-3 py-1 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition disabled:opacity-40"
                        >
                          Add
                        </button>
                        <button
                          title="Reset balance to 0"
                          disabled={isUpdating}
                          onClick={() => handleSetExactBalance(gymItem.gymId, gymItem.name, 0)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

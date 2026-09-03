"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, notFound } from "next/navigation";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
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
} from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function AdminPage() {
  const { user, gym, loading } = useAuth();
  const router = useRouter();

  const [gyms, setGyms] = useState<GymProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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

  // 1. Credit Top-Up Handlers
  const handleAddCredits = async (gymId: string, gymName: string, amount: number) => {
    if (amount === 0) return;
    setUpdatingGymId(gymId);

    try {
      const gymRef = doc(db, COLLECTIONS.GYMS, gymId);
      await updateDoc(gymRef, {
        walletBalance: increment(amount),
        subscriptionPlan: "PAID",
      });

      setGyms((prev) =>
        prev.map((g) =>
          g.gymId === gymId
            ? { ...g, walletBalance: (g.walletBalance || 0) + amount, subscriptionPlan: "PAID" }
            : g
        )
      );

      setCustomAmounts((prev) => ({ ...prev, [gymId]: "" }));
      setStatusMessage(`Added +${amount} Tokens to ${gymName}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error: any) {
      console.error("Failed to update wallet balance:", error);
      alert("Error: " + error.message);
    } finally {
      setUpdatingGymId(null);
    }
  };

  const handleSetExactBalance = async (gymId: string, gymName: string, exactValue: number) => {
    if (!confirm(`Set ${gymName}'s balance to ${exactValue} tokens?`)) return;

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

  // 2. Expired Trial Cleanup Logic
  const now = Date.now();
  const EXPIRED_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  const expiredGyms = gyms.filter((g) => {
    // Target only accounts still on trial
    if (g.subscriptionPlan === "PAID") return false;
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

  const filteredGyms = gyms.filter(
    (g) =>
      g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.phone?.includes(searchQuery) ||
      g.gymId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTokensCirculating = gyms.reduce((acc, g) => acc + (g.walletBalance || 0), 0);

  if (loading || loadingData || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-20 pt-6 px-4 max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 text-white rounded-3xl shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900">Admin Control Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Manage token top-ups and database maintenance</p>
        </div>

        {/* Global Stats */}
        <div className="flex gap-2">
          <div className="bg-white px-3.5 py-2 rounded-3xl border border-slate-200 shadow-xs">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Gyms</p>
            <p className="text-base font-black text-slate-900">{gyms.length}</p>
          </div>
          <div className="bg-white px-3.5 py-2 rounded-3xl border border-slate-200 shadow-xs">
            <p className="text-[10px] uppercase font-bold text-indigo-500">Active Tokens</p>
            <p className="text-base font-black text-indigo-600">{totalTokensCirculating}</p>
          </div>
        </div>
      </div>

      {/* Floating Status Toast */}
      {statusMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-3xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Section 1: Database Health & Expired Cleaner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Spark Tier Database Maintenance</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {expiredGyms.length} expired accounts (&gt;5 days)
          </span>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Clean un-upgraded trial accounts to prevent orphaned documents from exceeding Firebase free limits.
        </p>

        {expiredGyms.length > 0 && (
          <button
            onClick={handleDeleteExpired}
            disabled={deleting}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-full bg-red-600 font-bold text-white text-xs shadow-xs hover:bg-red-700 transition disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "Purging Accounts..." : `Purge ${expiredGyms.length} Expired Gym Accounts`}
          </button>
        )}
      </div>

      {/* Section 2: Token Management & Top-Ups */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Coins className="h-4 w-4 text-indigo-600" />
            <span>Gym Token Management</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search gym by name, phone, or Gym ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-3xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-xs"
          />
        </div>

        {/* Gym List */}
        <div className="space-y-3">
          {filteredGyms.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
              No gyms found matching your query.
            </div>
          ) : (
            filteredGyms.map((gym) => {
              const currentBal = gym.walletBalance || 0;
              const isUpdating = updatingGymId === gym.gymId;
              const customVal = customAmounts[gym.gymId] || "";

              return (
                <div
                  key={gym.gymId}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 hover:border-indigo-200 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <h3 className="font-bold text-sm text-slate-900">{gym.name}</h3>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ml-1 ${
                          gym.subscriptionPlan === "PAID" 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {gym.subscriptionPlan || "TRIAL"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {gym.phone || "No phone"}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[10px] text-slate-400">ID: {gym.gymId.slice(0, 8)}...</span>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Wallet</span>
                      <span
                        className={`text-sm font-black px-2.5 py-0.5 rounded-lg inline-block mt-0.5 ${
                          currentBal <= 0
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : currentBal < 25
                            ? "bg-amber-50 text-amber-600 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {currentBal} Tokens
                      </span>
                    </div>
                  </div>

                  {/* Top-up Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Quick Top-Up:</span>

                    {[
                      { label: "+25", amt: 25 },
                      { label: "+50", amt: 50 },
                      { label: "+100", amt: 100 },
                      { label: "+300", amt: 300 },
                    ].map((btn) => (
                      <button
                        key={btn.amt}
                        disabled={isUpdating}
                        onClick={() => handleAddCredits(gym.gymId, gym.name, btn.amt)}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition active:scale-95 disabled:opacity-40"
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
                          setCustomAmounts((prev) => ({ ...prev, [gym.gymId]: e.target.value }))
                        }
                        className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        disabled={!customVal || isUpdating}
                        onClick={() =>
                          handleAddCredits(gym.gymId, gym.name, parseInt(customVal, 10) || 0)
                        }
                        className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition disabled:opacity-40"
                      >
                        Add
                      </button>
                      <button
                        title="Reset balance to 0"
                        disabled={isUpdating}
                        onClick={() => handleSetExactBalance(gym.gymId, gym.name, 0)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
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
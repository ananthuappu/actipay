"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { PaymentRecord } from "@/types";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import {
  IndianRupee,
  TrendingUp,
  Wallet,
  CreditCard,
  Banknote,
  Search,
  Calendar,
  ArrowDownLeft,
} from "lucide-react";

export default function PaymentsPage() {
  const { user, gym, loading } = useAuth();
  const router = useRouter();

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      setLoadingData(true);
      try {
        const q = query(
          collection(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.PAYMENTS),
          orderBy("paymentDate", "desc")
        );
        const snap = await getDocs(q);
        const list: PaymentRecord[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        setPayments(list);
      } catch (err) {
        console.error("Error fetching payment logs:", err);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchPayments();
    }
  }, [user]);

  // Available months for selector
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    payments.forEach((p) => {
      if (p.paymentDate) {
        monthsSet.add(p.paymentDate.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [payments]);

  // Current Month String (e.g., "2026-08")
  const currentMonthStr = useMemo(() => {
    return new Date().toISOString().substring(0, 7);
  }, []);

  // Filtered Payments based on Month & Search
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesMonth =
        selectedMonth === "ALL" || p.paymentDate?.startsWith(selectedMonth);
      const matchesSearch =
        p.memberName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.paymentMode?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMonth && matchesSearch;
    });
  }, [payments, selectedMonth, searchQuery]);

  // Analytics Computations
  const stats = useMemo(() => {
    let totalLifetime = 0;
    let thisMonthTotal = 0;
    const modeCounts: Record<string, number> = { UPI: 0, Cash: 0, Card: 0 };

    payments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      totalLifetime += amt;

      if (p.paymentDate?.startsWith(currentMonthStr)) {
        thisMonthTotal += amt;
      }

      if (p.paymentMode) {
        modeCounts[p.paymentMode] = (modeCounts[p.paymentMode] || 0) + amt;
      }
    });

    return { totalLifetime, thisMonthTotal, modeCounts };
  }, [payments, currentMonthStr]);

  if (loading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
        <h1 className="font-bold text-lg text-slate-900 leading-tight">
          Payment Analytics
        </h1>
        <p className="text-[11px] text-slate-500 font-medium">
          Revenue overview for {gym?.name || "Gym"}
        </p>
      </header>

      {/* Top Cards: Total Collections */}
      <section className="p-4 space-y-3">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between opacity-90 text-xs font-medium mb-1">
            <span>This Month&apos;s Collection</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight">
            ₹{stats.thisMonthTotal.toLocaleString("en-IN")}
          </div>
          <div className="mt-4 pt-3 border-t border-white/20 flex justify-between text-xs opacity-90">
            <span>Lifetime Revenue</span>
            <span className="font-bold">₹{stats.totalLifetime.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Payment Modes Split */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs text-center">
            <div className="flex items-center justify-center text-blue-600 mb-1">
              <Wallet className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-semibold text-slate-400">UPI</p>
            <p className="text-xs font-bold text-slate-800">
              ₹{(stats.modeCounts["UPI"] || 0).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs text-center">
            <div className="flex items-center justify-center text-emerald-600 mb-1">
              <Banknote className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-semibold text-slate-400">Cash</p>
            <p className="text-xs font-bold text-slate-800">
              ₹{(stats.modeCounts["Cash"] || 0).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs text-center">
            <div className="flex items-center justify-center text-purple-600 mb-1">
              <CreditCard className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-semibold text-slate-400">Card / Other</p>
            <p className="text-xs font-bold text-slate-800">
              ₹{(
                (stats.modeCounts["Card"] || 0) +
                (stats.modeCounts["Bank Transfer"] || 0)
              ).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </section>

      {/* Transaction History Section */}
      <section className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Transaction History</h2>
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Months</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {new Date(m + "-01").toLocaleString("default", {
                  month: "short",
                  year: "numeric",
                })}
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search member name or mode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Transactions List */}
        <div className="space-y-2 pt-1">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-200 p-4">
              <IndianRupee className="h-6 w-6 text-slate-300 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-500">No payment records found.</p>
            </div>
          ) : (
            filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ArrowDownLeft className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {payment.memberName}
                    </h4>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>{payment.paymentMode}</span> •{" "}
                      <Calendar className="h-2.5 w-2.5" /> {payment.paymentDate}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-emerald-600">
                    +₹{payment.amount}
                  </span>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    To {payment.validUntil}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Persistent Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
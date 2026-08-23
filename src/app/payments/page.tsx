"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { PaymentRecord } from "@/types";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import RechargeBanner from "@/components/RechargeBanner";
import {
  IndianRupee,
  TrendingUp,
  Wallet,
  CreditCard,
  Banknote,
  Search,
  Calendar,
  ArrowDownLeft,
  Share2,
  BarChart3,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function PaymentsPage() {
  const { user, gym, loading } = useAuth();
  const router = useRouter();

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("THIS_MONTH");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState(false);

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

  // Date utilities
  const today = new Date();
  
  const getMonthStr = (d: Date) => d.toISOString().substring(0, 7);
  
  const thisMonthStr = getMonthStr(today);
  
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthStr = getMonthStr(lastMonthDate);

  const threeMonthsAgoDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  const threeMonthsAgoStr = getMonthStr(threeMonthsAgoDate);

  // Filtered Payments based on Date Range & Search
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      let matchesDate = true;
      if (dateFilter === "THIS_MONTH") {
        matchesDate = p.paymentDate?.startsWith(thisMonthStr);
      } else if (dateFilter === "LAST_MONTH") {
        matchesDate = p.paymentDate?.startsWith(lastMonthStr);
      } else if (dateFilter === "LAST_3_MONTHS") {
        matchesDate = p.paymentDate >= threeMonthsAgoStr;
      } else if (dateFilter === "CUSTOM") {
        if (customStart && customEnd) {
          matchesDate = p.paymentDate >= customStart && p.paymentDate <= customEnd;
        } else if (customStart) {
          matchesDate = p.paymentDate >= customStart;
        } else if (customEnd) {
          matchesDate = p.paymentDate <= customEnd;
        }
      }

      const matchesSearch =
        p.memberName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.paymentMode?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDate && matchesSearch;
    });
  }, [payments, dateFilter, searchQuery, customStart, customEnd, thisMonthStr, lastMonthStr, threeMonthsAgoStr]);

  // Analytics Computations
  const stats = useMemo(() => {
    let totalLifetime = 0;
    let thisMonthTotal = 0;
    
    // Split
    let recurringTotal = 0;
    let advanceTotal = 0;

    const modeCounts: Record<string, number> = { UPI: 0, Cash: 0, Card: 0 };

    // 6 Month Revenue Chart Data
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      return {
        monthStr: getMonthStr(d),
        label: d.toLocaleString('default', { month: 'short' }),
        revenue: 0
      };
    }).reverse();

    payments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      totalLifetime += amt;

      const isAdvance = p.category === "ADMISSION" || p.validUntil === "-";
      
      // Update Split
      if (isAdvance) advanceTotal += amt;
      else recurringTotal += amt;

      if (p.paymentDate?.startsWith(thisMonthStr)) {
        thisMonthTotal += amt;
      }

      if (p.paymentMode) {
        modeCounts[p.paymentMode] = (modeCounts[p.paymentMode] || 0) + amt;
      }

      // Populate 6 Month Chart
      if (p.paymentDate) {
        const pMonthStr = p.paymentDate.substring(0, 7);
        const targetMonth = last6Months.find(m => m.monthStr === pMonthStr);
        if (targetMonth) {
          targetMonth.revenue += amt;
        }
      }
    });

    // Calculate max revenue for chart scaling
    const maxRevenue = Math.max(...last6Months.map(m => m.revenue), 1);

    return { 
      totalLifetime, 
      thisMonthTotal, 
      modeCounts, 
      recurringTotal, 
      advanceTotal,
      last6Months,
      maxRevenue
    };
  }, [payments, thisMonthStr, today]);

  const sendWhatsAppReceipt = (payment: PaymentRecord) => {
    const gymName = gym?.name || "Our Gym";
    const amountStr = `₹${payment.amount}`;
    let text = `Hi ${payment.memberName}, this is a payment receipt from ${gymName}.\n\n`;
    text += `✅ *Amount Received:* ${amountStr}\n`;
    text += `📅 *Date:* ${payment.paymentDate}\n`;
    text += `💳 *Mode:* ${payment.paymentMode}\n`;
    if (payment.validUntil !== "-") {
      text += `⏱️ *Valid Until:* ${payment.validUntil}\n`;
    } else {
      text += `🏷️ *Category:* Admission / Advance\n`;
    }
    text += `\nThank you!`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading || loadingData || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Calculate percentages for split bar
  const splitTotal = stats.recurringTotal + stats.advanceTotal || 1; // avoid div by 0
  const recurringPct = (stats.recurringTotal / splitTotal) * 100;
  const advancePct = (stats.advanceTotal / splitTotal) * 100;

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
      
      <RechargeBanner />

      <section className="p-4 space-y-4">
        {/* Top Cards: Total Collections */}
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

        {/* Expandable Analytics Toggle */}
        <button
          onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
          className="flex items-center justify-between w-full bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-xs text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            Detailed Analytics
          </div>
          {isAnalyticsExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {isAnalyticsExpanded && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            {/* 6-Month Revenue Bar Chart */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm mb-4">
                <BarChart3 className="h-4 w-4 text-blue-600" /> 6-Month Revenue Trend
              </div>
              <div className="flex items-end justify-between h-32 gap-1.5">
                {stats.last6Months.map((m, i) => {
                  const heightPct = (m.revenue / stats.maxRevenue) * 100;
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 group">
                      <div className="relative w-full flex justify-center h-full items-end group-hover:bg-slate-50 rounded-t-sm transition pb-1">
                        <div 
                          className="w-full max-w-[28px] bg-blue-500 rounded-t-sm transition-all relative"
                          style={{ height: `${Math.max(heightPct, 4)}%` }}
                        >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded transition">
                            ₹{(m.revenue/1000).toFixed(1)}k
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 mt-1">{m.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subscription vs Advance Split */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Revenue Split (Lifetime)</h3>
              
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100 mb-3 shadow-inner">
                {stats.recurringTotal > 0 && (
                  <div 
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${recurringPct}%` }}
                    title="Recurring Fees"
                  />
                )}
                {stats.advanceTotal > 0 && (
                  <div 
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${advancePct}%` }}
                    title="Advance / Admission"
                  />
                )}
              </div>
              
              <div className="flex justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <div>
                    <p className="font-semibold text-slate-700">₹{stats.recurringTotal.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-slate-500">Recurring Fees</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <div className="text-right">
                    <p className="font-semibold text-slate-700">₹{stats.advanceTotal.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-slate-500">Admission / Advance</p>
                  </div>
                </div>
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
          </div>
        )}
      </section>

      {/* Transaction History Section */}
      <section className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Transaction History</h2>
          {/* Preset Date Range Selector */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          >
            <option value="ALL">All Time</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="LAST_3_MONTHS">Last 3 Months</option>
            <option value="CUSTOM">Custom Range</option>
          </select>
        </div>

        {dateFilter === "CUSTOM" && (
          <div className="flex gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
            <span className="text-slate-400 self-center text-xs">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search member name or mode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
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
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
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

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-emerald-600">
                      +₹{payment.amount}
                    </span>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      To {payment.validUntil}
                    </p>
                  </div>
                  <button 
                    onClick={() => sendWhatsAppReceipt(payment)}
                    className="flex items-center gap-1 text-[9px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2 py-1 rounded transition border border-slate-200 hover:border-emerald-200 font-semibold"
                    title="Share Receipt on WhatsApp"
                  >
                    <Share2 className="h-3 w-3" /> Share
                  </button>
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
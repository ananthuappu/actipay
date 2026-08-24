"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { Member, PlanType } from "@/types";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import RechargeBanner from "@/components/RechargeBanner";
import {
  Users,
  Search,
  Phone,
  Edit2,
  UserX,
  UserCheck,
  Trash2,
  X,
  Calendar,
  AlertTriangle,
  Send,
} from "lucide-react";

export default function MembersPage() {
  const { user, gym, loading } = useAuth();
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [lastAttendanceMap, setLastAttendanceMap] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "ABSENT" | "EXITED">("ACTIVE");

  // Edit Modal State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPlan, setEditPlan] = useState<PlanType>("Monthly");
  const [editFee, setEditFee] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editIsPT, setEditIsPT] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchMembersAndAttendance = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      // 1. Fetch Members
      const q = query(
        collection(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.MEMBERS),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const list: Member[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as any) });
      });
      setMembers(list);

      // 2. Fetch Attendance to compute last attendance date for each member
      const attSnap = await getDocs(
        collection(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.ATTENDANCE)
      );
      const attMap: Record<string, string> = {};
      attSnap.forEach((d) => {
        const att = d.data();
        if (att.memberId && att.date) {
          if (!attMap[att.memberId] || att.date > attMap[att.memberId]) {
            attMap[att.memberId] = att.date;
          }
        }
      });
      setLastAttendanceMap(attMap);
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMembersAndAttendance();
    }
  }, [user]);

  // Dynamic Inactivity / Absence Days Calculation
  const getDaysAbsent = (member: Member) => {
    const today = new Date();
    // Use last attendance date, or fall back to membership start date
    const lastActiveDateStr = lastAttendanceMap[member.id] || member.startDate;
    if (!lastActiveDateStr) return 0;

    const lastActive = new Date(lastActiveDateStr);
    const diffTime = today.getTime() - lastActive.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setEditName(m.fullName);
    setEditPhone(m.phone);
    setEditPlan(m.planType);
    setEditFee(String(m.feeAmount));
    setEditDueDate(m.nextDueDate);
    setEditIsPT(m.isPT || false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingMember) return;

    try {
      await updateDoc(
        doc(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.MEMBERS, editingMember.id),
        {
          fullName: editName.trim(),
          phone: editPhone.trim().replace(/\D/g, ""),
          planType: editPlan,
          feeAmount: Number(editFee),
          nextDueDate: editDueDate,
          isPT: editIsPT,
        }
      );
      setEditingMember(null);
      fetchMembersAndAttendance();
    } catch (err) {
      console.error("Error updating member:", err);
    }
  };

  const handleToggleExit = async (m: Member) => {
    if (!user) return;
    const action = m.isActive ? "mark as exited" : "reactivate";
    if (!confirm(`Are you sure you want to ${action} ${m.fullName}?`)) return;

    try {
      await updateDoc(
        doc(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.MEMBERS, m.id),
        {
          isActive: !m.isActive,
        }
      );
      fetchMembersAndAttendance();
    } catch (err) {
      console.error("Error toggling member status:", err);
    }
  };

  // Cascade Permanent Delete (Member + Payments + Attendance)
  const handleDeletePermanent = async (m: Member) => {
    if (!user) return;
    const confirmMessage = `Permanently delete ${m.fullName}?\n\nThis will permanently remove their profile, payment receipts, and attendance records.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const batch = writeBatch(db);

      // 1. Member document
      batch.delete(doc(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.MEMBERS, m.id));

      // 2. Payments
      const paymentsSnap = await getDocs(
        query(collection(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.PAYMENTS), where("memberId", "==", m.id))
      );
      paymentsSnap.forEach((d) => batch.delete(d.ref));

      // 3. Attendance
      const attendanceSnap = await getDocs(
        query(collection(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.ATTENDANCE), where("memberId", "==", m.id))
      );
      attendanceSnap.forEach((d) => batch.delete(d.ref));

      await batch.commit();
      fetchMembersAndAttendance();
    } catch (err) {
      console.error("Error deleting member data:", err);
    }
  };

  // WhatsApp Absent Nudge Message
  const sendAbsenceWhatsApp = (member: Member, days: number) => {
    const gymName = gym?.name || "our gym";
    const text = `Hi ${member.fullName}, we missed you at ${gymName}! You haven't checked in for the last ${days} days. Is everything okay? Let's get back on track with your fitness routine! 💪🏋️`;
    window.open(`https://wa.me/91${member.phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const isExited = m.isActive === false;
      const daysAbsent = getDaysAbsent(m);

      let matchesTab = false;
      if (statusFilter === "ACTIVE") matchesTab = !isExited;
      if (statusFilter === "ABSENT") matchesTab = !isExited && daysAbsent >= 4;
      if (statusFilter === "EXITED") matchesTab = isExited;

      const matchesSearch =
        m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.phone.includes(searchQuery);

      return matchesTab && matchesSearch;
    });
  }, [members, statusFilter, searchQuery, lastAttendanceMap]);

  const activeCount = members.filter((m) => m.isActive !== false).length;
  const activePTCount = members.filter((m) => m.isActive !== false && m.isPT).length;
  const absentCount = members.filter((m) => m.isActive !== false && getDaysAbsent(m) >= 4).length;
  const exitedCount = members.filter((m) => m.isActive === false).length;

  if (loading || loadingData || !user) {
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
        <h1 className="font-bold text-lg text-slate-900 leading-tight">Member Management</h1>
        <p className="text-[11px] text-slate-500 font-medium">
          {gym?.name || "Gym"} Directory & Retention
        </p>
      </header>
      
      <RechargeBanner />

      {/* Filter Tabs */}
      <div className="p-4 pb-2">
        <div className="flex bg-slate-200/70 p-1 rounded-xl gap-1">
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              statusFilter === "ACTIVE"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            All Active ({activeCount})
            {activePTCount > 0 && (
              <span className="ml-1 text-[9px] bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded">
                {activePTCount} PT
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter("ABSENT")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
              statusFilter === "ABSENT"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-amber-700 hover:text-amber-900 bg-amber-100/60"
            }`}
          >
            <AlertTriangle className="h-3 w-3" /> Absent 4d+ ({absentCount})
          </button>
          <button
            onClick={() => setStatusFilter("EXITED")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              statusFilter === "EXITED"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Exited ({exitedCount})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Members List */}
      <main className="px-4 space-y-2.5">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200 p-4">
            <Users className="h-6 w-6 text-slate-300 mx-auto mb-1" />
            <p className="text-xs font-medium text-slate-500">
              {statusFilter === "ABSENT"
                ? "Great! No members have been absent for 4+ days."
                : `No ${statusFilter.toLowerCase()} members found.`}
            </p>
          </div>
        ) : (
          filteredMembers.map((m) => {
            const daysAbsent = getDaysAbsent(m);
            const isAbsentAlert = m.isActive !== false && daysAbsent >= 4;

            return (
              <div
                key={m.id}
                className={`bg-white p-3.5 rounded-xl border shadow-xs space-y-2.5 transition ${
                  isAbsentAlert ? "border-amber-300 bg-amber-50/20" : "border-slate-200"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {m.fullName}
                      {m.isPT && (
                        <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                          PT
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <Phone className="h-3 w-3" /> {m.phone}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        m.isActive !== false
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-300"
                      }`}
                    >
                      {m.isActive !== false ? "Active" : "Exited"}
                    </span>

                    {isAbsentAlert && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" /> Absent {daysAbsent}d
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between text-xs py-1.5 px-2.5 bg-slate-50 rounded-lg text-slate-600">
                  <span>
                    ₹{m.feeAmount} • {m.planType}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" /> Due: {m.nextDueDate}
                  </span>
                </div>

                {/* Absent Action Banner if absent for 4+ days */}
                {isAbsentAlert && (
                  <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-[11px] font-medium text-amber-800">
                      Not visited for {daysAbsent} days
                    </span>
                    <button
                      onClick={() => sendAbsenceWhatsApp(m, daysAbsent)}
                      className="flex items-center gap-1 text-[11px] font-bold py-1 px-2.5 rounded-md bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 transition active:scale-95"
                    >
                      <Send className="h-3 w-3" /> Nudge WhatsApp
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="flex items-center gap-1 text-xs font-semibold py-1 px-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  >
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>

                  <button
                    onClick={() => handleToggleExit(m)}
                    className={`flex items-center gap-1 text-xs font-semibold py-1 px-2.5 rounded-lg transition ${
                      m.isActive !== false
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                  >
                    {m.isActive !== false ? (
                      <>
                        <UserX className="h-3 w-3" /> Exit Member
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3 w-3" /> Reactivate
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeletePermanent(m)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition"
                    title="Permanent Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* MODAL: Edit Member Details */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Edit Member Details</h2>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plan</label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value as PlanType)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half_Yearly">Half Yearly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={editFee}
                    onChange={(e) => setEditFee(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Next Due Date</label>
                <input
                  type="date"
                  required
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 bg-indigo-50 p-3 rounded-lg border border-indigo-100 mt-2">
                <input
                  type="checkbox"
                  id="edit-pt-checkbox"
                  checked={editIsPT}
                  onChange={(e) => setEditIsPT(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="edit-pt-checkbox" className="text-xs font-semibold text-indigo-900 cursor-pointer select-none">
                  Personal Training (PT)
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Persistent Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
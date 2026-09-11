"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { COLLECTIONS, PLAN_DURATIONS } from "@/lib/constants";
import { Member, PlanType, PaymentMode } from "@/types";
import {
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  writeBatch,
  query,
  orderBy,
  runTransaction,
} from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import RechargeBanner from "@/components/RechargeBanner";
import TrialBanner from "@/components/TrialBanner";
import RechargeModal from "@/components/RechargeModal";
import {
  Users,
  AlertCircle,
  Clock,
  Plus,
  LogOut,
  Send,
  CreditCard,
  X,
  Phone,
  Calendar,
  History,
  Trash2,
  AlertTriangle,
  Settings,
  Banknote,
  Download,
  Search,
} from "lucide-react";

export default function DashboardPage() {
  const { user, gym, loading, logout, refreshGymData } = useAuth();
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [filter, setFilter] = useState<"ALL" | "DUE_SOON" | "OVERDUE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Edit Profile state
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Recharge state
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [rechargeReason, setRechargeReason] = useState("");

  // Delete Account modal state
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states for adding member
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPlan, setNewPlan] = useState<PlanType>("Monthly");
  const [newFee, setNewFee] = useState("1500");
  const [newAdmissionFee, setNewAdmissionFee] = useState("500");
  const [newStartDate, setNewStartDate] = useState(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]
  );
  const [newIsPT, setNewIsPT] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for recording payment
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("UPI");
  const [planExtension, setPlanExtension] = useState<PlanType>("Monthly");

  // History states
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchMembers = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.MEMBERS),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const list: Member[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      setMembers(list);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user]);

  // Dynamic Status Calculation (Keeps Firebase $0 spark friendly)
  const getStatus = (nextDueDate: string) => {
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
    const due = new Date(nextDueDate);
    const now = new Date(today);
    const diffDays = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      const absDiff = Math.abs(diffDays);
      const monthsOverdue = Math.floor(absDiff / 30);
      let label = "OVERDUE";
      if (monthsOverdue > 0) {
        label += ` (${monthsOverdue} MO)`;
      } else {
        label += ` (${absDiff} D)`;
      }
      return { label, color: "bg-red-100 text-red-700 border-red-200" };
    }
    if (diffDays <= 3) return { label: "DUE SOON", color: "bg-amber-100 text-amber-700 border-amber-200" };
    return { label: "ACTIVE", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  };

  // Helper to calculate future date anchoring to the join date
  const calculateNextDueDate = (baseDateStr: string, plan: PlanType, originalStartDateStr?: string) => {
    const [bYear, bMonth, bDay] = baseDateStr.split("-").map(Number);
    const months = PLAN_DURATIONS[plan.toUpperCase() as keyof typeof PLAN_DURATIONS] || 1;
    
    let targetMonth = bMonth - 1 + months; // 0-indexed month
    let targetYear = bYear;
    let targetDay = bDay;

    if (originalStartDateStr) {
      const [, , oDay] = originalStartDateStr.split("-").map(Number);
      targetDay = oDay; // Force the day to be the join date
    }

    const newDate = new Date(targetYear, targetMonth, targetDay);
    
    // Handle months with fewer days (e.g. asking for Feb 31st results in Mar 3rd)
    // If the month rolled over to the next month, clamp it to the last day of the intended month
    if (newDate.getMonth() !== (targetMonth % 12 + 12) % 12) {
      newDate.setDate(0); 
    }
    
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, "0");
    const day = String(newDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const calculateOwedAmount = (member: Member) => {
    const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
    const today = new Date(todayStr);
    const due = new Date(member.nextDueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let multiplier = 1;
    if (diffDays > 0) {
      const planDurationMonths = PLAN_DURATIONS[member.planType.toUpperCase() as keyof typeof PLAN_DURATIONS] || 1;
      const cycleLengthDays = planDurationMonths * 30;
      multiplier = Math.max(1, Math.ceil(diffDays / cycleLengthDays));
    }
    return member.feeAmount * multiplier;
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    const requiredAmcs = PLAN_DURATIONS[newPlan.toUpperCase() as keyof typeof PLAN_DURATIONS] || 1;

    const calculatedDueDate = calculateNextDueDate(newStartDate, newPlan, newStartDate);
    const planFeeNum = Number(newFee) || 0;
    const admissionFeeNum = Number(newAdmissionFee) || 0;

    const memberData = {
      fullName: newFullName.trim(),
      phone: newPhone.trim().replace(/\D/g, ""),
      planType: newPlan,
      feeAmount: planFeeNum,
      admissionFee: admissionFeeNum,
      startDate: newStartDate,
      nextDueDate: calculatedDueDate,
      isActive: true,
      isPT: newIsPT,
      createdAt: new Date().toISOString(),
    };

    try {
      await runTransaction(db, async (transaction) => {
        const gymRef = doc(db, COLLECTIONS.GYMS, user.uid);
        const gymDoc = await transaction.get(gymRef);
        
        if (!gymDoc.exists()) {
          throw new Error("Gym document not found");
        }
        
        const currentBalance = gymDoc.data().walletBalance || 0;
        
        if (currentBalance < requiredAmcs) {
          throw new Error(`INSUFFICIENT_FUNDS:${currentBalance}`);
        }

        // 1. Generate refs
        const memberRef = doc(collection(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.MEMBERS));
        const admissionPaymentRef = doc(collection(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.PAYMENTS));
        const membershipPaymentRef = doc(collection(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.PAYMENTS));

        // 2. Set Member
        transaction.set(memberRef, memberData);

        // 3. Log Admission Fee (if any)
        if (admissionFeeNum > 0) {
          transaction.set(admissionPaymentRef, {
            memberId: memberRef.id,
            memberName: `${newFullName.trim()} (Admission / Advance)`,
            memberPhone: memberData.phone,
            amount: admissionFeeNum,
            paymentMode: "UPI",
            category: "ADMISSION",
            paymentDate: newStartDate,
            validFrom: newStartDate,
            validUntil: "-",
            loggedBy: user.uid,
            createdAt: new Date().toISOString(),
          });
        }

        // 4. Log Membership Fee
        transaction.set(membershipPaymentRef, {
          memberId: memberRef.id,
          memberName: newFullName.trim(),
          memberPhone: memberData.phone,
          amount: planFeeNum,
          paymentMode: "UPI",
          category: "MEMBERSHIP",
          paymentDate: newStartDate,
          validFrom: newStartDate,
          validUntil: calculatedDueDate,
          loggedBy: user.uid,
          createdAt: new Date().toISOString(),
        });

        // 5. Deduct AMCs
        transaction.update(gymRef, {
          walletBalance: currentBalance - requiredAmcs
        });
      });

      setIsAddModalOpen(false);
      setNewFullName("");
      setNewPhone("");
      setNewAdmissionFee("0");
      setNewIsPT(false);
      fetchMembers();
    } catch (err: any) {
      if (err.message && err.message.startsWith("INSUFFICIENT_FUNDS")) {
        const balance = err.message.split(":")[1];
        setRechargeReason(`Adding a ${newPlan} member requires ${requiredAmcs} AMCs. You only have ${balance} AMCs.`);
        setIsRechargeModalOpen(true);
      } else {
        console.error("Failed to add member:", err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !gym) return;
    setIsEditingProfile(true);
    try {
      const gymRef = doc(db, COLLECTIONS.GYMS, user.uid);
      await updateDoc(gymRef, {
        name: editName.trim(),
        phone: editPhone.trim().replace(/\D/g, ""),
      });
      await refreshGymData();
      setIsEditProfileModalOpen(false);
    } catch (err) {
      console.error("Failed to update gym profile:", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsEditingProfile(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMember || isSubmitting) return;

    setIsSubmitting(true);
    const requiredAmcs = PLAN_DURATIONS[planExtension.toUpperCase() as keyof typeof PLAN_DURATIONS] || 1;

    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
    const baseDate = selectedMember.nextDueDate > today ? selectedMember.nextDueDate : today;
    const newDueDate = calculateNextDueDate(baseDate, planExtension, selectedMember.startDate);

    try {
      await runTransaction(db, async (transaction) => {
        const gymRef = doc(db, COLLECTIONS.GYMS, user.uid);
        const gymDoc = await transaction.get(gymRef);
        
        if (!gymDoc.exists()) {
          throw new Error("Gym document not found");
        }
        
        const currentBalance = gymDoc.data().walletBalance || 0;
        
        if (currentBalance < requiredAmcs) {
          throw new Error(`INSUFFICIENT_FUNDS:${currentBalance}`);
        }

        const paymentRef = doc(collection(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.PAYMENTS));
        const memberRef = doc(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.MEMBERS, selectedMember.id);

        transaction.set(paymentRef, {
          memberId: selectedMember.id,
          memberName: selectedMember.fullName,
          memberPhone: selectedMember.phone,
          amount: Number(paymentAmount),
          paymentMode,
          category: "RENEWAL",
          paymentDate: today,
          validFrom: baseDate,
          validUntil: newDueDate,
          loggedBy: user.uid,
          createdAt: new Date().toISOString(),
        });

        transaction.update(memberRef, {
          nextDueDate: newDueDate,
          planType: planExtension,
          isActive: true,
        });

        transaction.update(gymRef, {
          walletBalance: currentBalance - requiredAmcs
        });
      });

      setIsPaymentModalOpen(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (err: any) {
      if (err.message && err.message.startsWith("INSUFFICIENT_FUNDS")) {
        const balance = err.message.split(":")[1];
        setRechargeReason(`Renewing for ${planExtension} requires ${requiredAmcs} AMCs. You only have ${balance} AMCs.`);
        setIsRechargeModalOpen(true);
      } else {
        console.error("Failed to record payment:", err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewMemberHistory = async (member: Member) => {
    if (!user) return;
    setSelectedMember(member);
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.PAYMENTS),
        orderBy("paymentDate", "desc")
      );
      const snap = await getDocs(q);
      const historyList: any[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.memberId === member.id) {
          historyList.push({ id: d.id, ...data });
        }
      });
      setPaymentHistory(historyList);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const sendWhatsAppReminder = (member: Member) => {
    const gymTitle = gym?.name || "the gym";
    const text = `Hi ${member.fullName}, your membership fee of ₹${member.feeAmount} for ${gymTitle} was due on ${member.nextDueDate}. Please pay to continue your workout sessions!`;
    window.open(`https://wa.me/91${member.phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Complete purge of all gym data and auth account with re-authentication
  const handleDeleteGymAccount = async () => {
    if (!user || !user.email) return;

    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      alert("Please type 'DELETE' to confirm.");
      return;
    }

    if (!deletePassword) {
      alert("Please enter your current password to confirm account deletion.");
      return;
    }

    setIsDeleting(true);

    try {
      // 1. Re-authenticate user to satisfy Firebase security requirement
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Cascade Batch Delete all Firestore collections
      const batch = writeBatch(db);

      // a. Delete all Members
      const membersSnap = await getDocs(
        collection(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.MEMBERS)
      );
      membersSnap.forEach((d) => batch.delete(d.ref));

      // b. Delete all Payments
      const paymentsSnap = await getDocs(
        collection(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.PAYMENTS)
      );
      paymentsSnap.forEach((d) => batch.delete(d.ref));

      // c. Delete all Attendance records
      const attendanceSnap = await getDocs(
        collection(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.ATTENDANCE)
      );
      attendanceSnap.forEach((d) => batch.delete(d.ref));

      // d. Delete Root Gym Profile Document
      const gymDocRef = doc(db, COLLECTIONS.GYMS, user.uid);
      batch.delete(gymDocRef);

      // Commit Firestore batch deletion
      await batch.commit();

      // 3. Delete Firebase Authentication Account
      await deleteUser(user);

      // 4. Redirect to home
      router.push("/");
    } catch (error: any) {
      console.error("Error deleting gym account:", error);
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        alert("Incorrect password. Please verify your password and try again.");
      } else {
        alert("Failed to delete account: " + (error.message || "Unknown error"));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const status = getStatus(m.nextDueDate).label;
    const matchesFilter =
      filter === "ALL"
        ? true
        : filter === "OVERDUE"
        ? status.startsWith("OVERDUE")
        : filter === "DUE_SOON"
        ? status === "DUE SOON" || status.startsWith("OVERDUE")
        : true;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      m.fullName.toLowerCase().includes(query) ||
      m.phone.includes(query);

    return matchesFilter && matchesSearch;
  });

  const totalActive = members.length;
  const ptCount = members.filter((m) => m.isPT).length;
  const overdueCount = members.filter((m) => getStatus(m.nextDueDate).label.startsWith("OVERDUE")).length;
  const dueSoonCount = members.filter((m) => getStatus(m.nextDueDate).label === "DUE SOON").length;

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 max-w-5xl mx-auto bg-transparent">
      {/* Header */}
      <header className="px-4 pt-6 pb-2 flex items-start justify-between md:pt-10">
        <div>
          <h1 className="text-2xl md:text-3xl text-slate-900 flex items-center gap-2">
            <span className="font-semibold">{gym?.name || "ActiPay"}</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
            Dashboard
            <span className={`px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold uppercase rounded ${
              (gym?.walletBalance || 0) < 5 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
            }`}>
              {gym?.walletBalance || 0} AMC{gym?.walletBalance === 1 ? "" : "s"}
            </span>
          </p>
        </div>

        {/* Header Actions (Delete Account & Sign Out) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsDeleteAccountModalOpen(true)}
            className="p-2 text-slate-400 hover:text-red-600 transition rounded-xl hover:bg-red-50"
            title="Delete Gym Account"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 transition rounded-xl hover:bg-slate-100"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Top Notification Banners */}
      <TrialBanner />
      <RechargeBanner />

      {/* Quick Actions (Skyline Style) */}
      <section className="px-4 mt-4 mb-8">
        <div className="grid grid-cols-4 gap-2 sm:flex sm:gap-6 md:gap-8">
          <button 
            onClick={() => {
              if ((gym?.walletBalance || 0) === 0) {
                setRechargeReason(
                  "Your wallet is empty. You need at least 1 AMC to add a member."
                );
                setIsRechargeModalOpen(true);
              } else {
                setIsAddModalOpen(true);
              }
            }}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-600 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20 active:scale-95 transition">
              <Users className="h-6 w-6 md:h-7 md:w-7" />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-slate-700 uppercase tracking-wide">ADD</span>
          </button>

          <button 
            onClick={() => setFilter("DUE_SOON")}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 bg-[#1e293b] rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20 active:scale-95 transition">
              <Banknote className="h-6 w-6 md:h-7 md:w-7" />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-slate-700 uppercase tracking-wide">Collect</span>
          </button>

          <button 
            onClick={() => setIsRechargeModalOpen(true)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-500 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition">
              <Download className="h-6 w-6 md:h-7 md:w-7" />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-slate-700 uppercase tracking-wide">Recharge</span>
          </button>

          <button 
            onClick={() => {
              setEditName(gym?.name || "");
              setEditPhone(gym?.phone || "");
              setIsEditProfileModalOpen(true);
            }}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 bg-indigo-500 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition">
              <Settings className="h-6 w-6 md:h-7 md:w-7" />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-slate-700 uppercase tracking-wide">Profile</span>
          </button>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="px-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-8">
        <div className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Active Members</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalActive}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Currently active</p>
        </div>
        
        <div className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">PT Enrolled</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{ptCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Personal training</p>
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Due Soon</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{dueSoonCount}</p>
          <p className="text-[10px] text-blue-600/70 mt-0.5">Expiring in 5 days</p>
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Overdue</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{overdueCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Needs attention</p>
        </div>
      </section>

      {/* Urgent Actions */}
      {overdueCount > 0 && (
        <section className="px-4 mb-6">
          <h2 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-3">Urgent Actions</h2>
          <div className="bg-[#fceef0] p-4 rounded-3xl shadow-sm border border-[#fad3d8] flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#b91c1c]">Pending Renewals ({overdueCount})</h3>
              <p className="text-xs text-[#b91c1c]/80 mt-0.5">
                There are {overdueCount} members whose memberships have expired and need attention.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Search & Filter Section */}
      <div className="px-4 space-y-3 mb-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search member name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(["ALL", "DUE_SOON", "OVERDUE"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition ${
                filter === tab
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab === "ALL" ? "All" : tab === "DUE_SOON" ? "Due Soon" : "Overdue"}
            </button>
          ))}
        </div>
      </div>

      {/* Member Cards List */}
      <main className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-6">
            <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No members found</p>
            <p className="text-xs text-slate-500 mt-1">
              Tap the &quot;+&quot; button below to add your first member.
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const status = getStatus(member.nextDueDate);
            return (
              <div
                key={member.id}
                className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      {member.fullName}
                      {member.isPT && (
                        <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                          PT
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                      <Phone className="h-3 w-3" /> {member.phone}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="flex justify-between text-xs py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-slate-400 text-[10px]">Fee Plan</p>
                    <p className="font-semibold text-slate-700">
                      ₹{member.feeAmount} ({member.planType})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-[10px]">Next Due</p>
                    <p className="font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" /> {member.nextDueDate}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => sendWhatsAppReminder(member)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition active:scale-95"
                  >
                    <Send className="h-3.5 w-3.5" /> WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMember(member);
                      setPaymentAmount(String(calculateOwedAmount(member)));
                      setIsPaymentModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition active:scale-95 shadow-xs"
                  >
                    <CreditCard className="h-3.5 w-3.5" /> 
                    {status.label === "ACTIVE" ? "Extend" : "Pay"}
                  </button>
                  <button
                    onClick={() => viewMemberHistory(member)}
                    className="flex items-center justify-center p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                    title="View Payment History"
                  >
                    <History className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>



      {/* MODAL: Add Member */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Add New Member</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp Number (10 digits)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Duration</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as PlanType)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly (3 Mo)</option>
                    <option value="Half_Yearly">Half Yearly (6 Mo)</option>
                    <option value="Annual">Annual (1 Yr)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admission / Advance Fee (₹)
                </label>
                <input
                  type="number"
                  placeholder="0 if none"
                  value={newAdmissionFee}
                  onChange={(e) => setNewAdmissionFee(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Joining / Start Date</label>
                <input
                  type="date"
                  required
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 bg-indigo-50 p-3 rounded-lg border border-indigo-100 mt-2">
                <input
                  type="checkbox"
                  id="pt-checkbox"
                  checked={newIsPT}
                  onChange={(e) => setNewIsPT(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="pt-checkbox" className="text-xs font-semibold text-indigo-900 cursor-pointer select-none">
                  Opted for Personal Training (PT)
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-3 rounded-full bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Member & Log Payment"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Renewal Payment */}
      {isPaymentModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900">Record Payment</h2>
                <p className="text-xs text-slate-500">{selectedMember.fullName}</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Extend By</label>
                  <select
                    value={planExtension}
                    onChange={(e) => setPlanExtension(e.target.value as PlanType)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Monthly">1 Month</option>
                    <option value="Quarterly">3 Months</option>
                    <option value="Half_Yearly">6 Months</option>
                    <option value="Annual">1 Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-3 rounded-full bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSubmitting ? "Confirming..." : "Confirm Payment & Extend"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Payment History */}
      {isHistoryModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4 shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900">Payment History</h2>
                <p className="text-xs text-slate-500">{selectedMember.fullName}</p>
              </div>
              <button
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setSelectedMember(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {loadingHistory ? (
                <p className="text-center text-xs text-slate-400 py-6">Loading payments...</p>
              ) : paymentHistory.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">No payment records found.</p>
              ) : (
                paymentHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">₹{item.amount}</p>
                      <p className="text-[10px] text-slate-400">
                        {item.paymentMode} • {item.paymentDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                        {item.validUntil === "-" ? "Admission Fee" : `To ${item.validUntil}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Profile */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Edit Business Profile</h2>
              <button
                onClick={() => setIsEditProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Login Email</label>
                <input
                  type="email"
                  disabled
                  value={gym?.authEmail || user?.email || ""}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-1">Authentication email cannot be changed.</p>
              </div>

              <button
                type="submit"
                disabled={isEditingProfile}
                className="w-full py-3 rounded-full bg-blue-600 font-bold text-white shadow-md hover:bg-blue-700 transition active:scale-95 disabled:opacity-70"
              >
                {isEditingProfile ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Entire Gym Account */}
      {isDeleteAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                <AlertTriangle className="h-5 w-5" />
                <span>Delete Gym Account</span>
              </div>
              <button
                onClick={() => {
                  setIsDeleteAccountModalOpen(false);
                  setDeleteConfirmText("");
                  setDeletePassword("");
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed bg-red-50 p-3.5 rounded-3xl border border-red-200">
              <p className="font-bold text-red-800">Permanent Data Loss Warning</p>
              <p>
                This action will permanently delete <strong>{gym?.name || "your gym"}</strong>, including:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-700">
                <li>All registered gym members</li>
                <li>All payment receipts & revenue logs</li>
                <li>All daily attendance history</li>
                <li>Your login account</li>
              </ul>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password:
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your account password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full rounded-3xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full rounded-3xl border border-slate-300 px-3 py-2 text-sm font-semibold tracking-wider uppercase focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteAccountModalOpen(false);
                  setDeleteConfirmText("");
                  setDeletePassword("");
                }}
                className="flex-1 py-3 rounded-3xl border border-slate-200 font-semibold text-xs text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  deleteConfirmText.trim().toUpperCase() !== "DELETE" ||
                  !deletePassword ||
                  isDeleting
                }
                onClick={handleDeleteGymAccount}
                className="flex-1 py-3 rounded-full bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                {isDeleting ? "Deleting Everything..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Navigation */}
      <BottomNav />

      {/* Upgrade Modal */}
      <RechargeModal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        reason={rechargeReason}
      />
    </div>
  );
}

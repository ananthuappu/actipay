"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { Member, AttendanceRecord } from "@/types";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import RechargeBanner from "@/components/RechargeBanner";
import {
  UserCheck,
  Search,
  Fingerprint,
  ScanFace,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";

export default function AttendancePage() {
  const { user, gym, loading } = useAuth();
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const loadData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      // Run both queries concurrently
      const membersPromise = getDocs(
        collection(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.MEMBERS)
      );
      
      const attQuery = query(
        collection(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.ATTENDANCE),
        where("date", "==", todayStr)
      );
      const attPromise = getDocs(attQuery);

      const [membersSnap, attSnap] = await Promise.all([membersPromise, attPromise]);

      const mList: Member[] = [];
      membersSnap.forEach((d) => {
        const data = d.data();
        if (data.isActive !== false) {
          mList.push({
            id: d.id,
            fullName: data.fullName || "",
            phone: data.phone || "",
            planType: data.planType || "Monthly",
            feeAmount: Number(data.feeAmount) || 0,
            admissionFee: Number(data.admissionFee) || 0,
            startDate: data.startDate || "",
            nextDueDate: data.nextDueDate || "",
            isActive: data.isActive !== false,
            isPT: data.isPT || false,
            notes: data.notes || "",
            createdAt: data.createdAt || "",
          });
        }
      });
      setMembers(mList);

      const aList: AttendanceRecord[] = [];
      attSnap.forEach((d) => {
        const data = d.data();
        aList.push({
          id: d.id,
          memberId: data.memberId || "",
          memberName: data.memberName || "",
          date: data.date || todayStr,
          time: data.time || "",
          type: data.type || "MANUAL",
          timestamp: data.timestamp || "",
        });
      });

      // Sort in client memory
      aList.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
      setAttendanceList(aList);
    } catch (err) {
      console.error("Error loading attendance:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, todayStr]);

  const checkedInMemberIds = useMemo(() => {
    return new Set(attendanceList.map((a) => a.memberId));
  }, [attendanceList]);

  const handlePunchAttendance = async (member: Member) => {
    if (!user) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    try {
      await addDoc(
        collection(db, COLLECTIONS.GYMS, user.uid, COLLECTIONS.ATTENDANCE),
        {
          memberId: member.id,
          memberName: member.fullName,
          date: todayStr,
          time: timeStr,
          type: "MANUAL",
          timestamp: now.toISOString(),
        }
      );
      loadData();
    } catch (err) {
      console.error("Error checking in member:", err);
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) =>
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-bold text-lg text-slate-900 leading-tight">Daily Attendance</h1>
            <p className="text-[11px] text-slate-500 font-medium">{gym?.name || "Gym"}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
            <UserCheck className="h-3.5 w-3.5" />
            <span>{attendanceList.length} Present</span>
          </div>
        </div>
      </header>
      
      <RechargeBanner />

      {/* Hardware / Biometric Ready Banner */}
      <section className="p-4 pb-2">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
            <Zap className="h-4 w-4" /> Hardware Biometric Sync (coming soon)
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Connect your eSSL / ZKTeco face or fingerprint scanner via cloud webhook to log scans automatically.
          </p>
          <div className="mt-2.5 flex items-center gap-3 pt-2 border-t border-slate-700 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Fingerprint className="h-3 w-3 text-emerald-400" /> Fingerprint Ready
            </span>
            <span className="flex items-center gap-1">
              <ScanFace className="h-3 w-3 text-emerald-400" /> Facial Scan Ready
            </span>
          </div>
        </div>
      </section>

      {/* Search Input */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search member to mark check-in..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Today's Punch List */}
      <main className="px-4 space-y-2 pt-1">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Members Check-in ({filteredMembers.length})
        </h2>

        {filteredMembers.map((member) => {
          const isCheckedIn = checkedInMemberIds.has(member.id);
          const attendanceRecord = attendanceList.find((a) => a.memberId === member.id);

          return (
            <div
              key={member.id}
              className={`p-3 rounded-xl border transition flex items-center justify-between shadow-xs ${
                isCheckedIn
                  ? "bg-emerald-50/70 border-emerald-200"
                  : "bg-white border-slate-200"
              }`}
            >
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  {member.fullName}
                  {member.isPT && (
                    <span className="bg-indigo-100 text-indigo-700 text-[8px] font-bold px-1 py-0.5 rounded uppercase">
                      PT
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isCheckedIn ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> Checked in at {attendanceRecord?.time}
                    </span>
                  ) : (
                    `Plan: ${member.planType} • Due: ${member.nextDueDate}`
                  )}
                </p>
              </div>

              {isCheckedIn ? (
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold py-1 px-2.5 bg-emerald-100 rounded-lg">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Done
                </div>
              ) : (
                <button
                  onClick={() => handlePunchAttendance(member)}
                  className="py-1.5 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition active:scale-95 shadow-xs"
                >
                  Mark In
                </button>
              )}
            </div>
          );
        })}
      </main>

      {/* Persistent Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
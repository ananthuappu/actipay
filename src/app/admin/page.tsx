"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { GymProfile } from "@/types";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { Trash2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [gyms, setGyms] = useState<GymProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // You can restrict this to your specific email address
  const ADMIN_EMAILS = ["your-email@gmail.com"]; // Replace with your actual email

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchGyms = async () => {
      setLoadingData(true);
      try {
        const q = query(collection(db, COLLECTIONS.GYMS));
        const snap = await getDocs(q);
        const list: GymProfile[] = [];
        snap.forEach((d) => {
          list.push(d.data() as GymProfile);
        });
        setGyms(list);
      } catch (err) {
        console.error("Error fetching gyms:", err);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchGyms();
    }
  }, [user]);

  if (loading || loadingData) return <div className="p-10 text-center">Loading...</div>;

  // IMPORTANT: Since this deletes collections on the client, you can just manually secure this page.
  // We recommend wrapping the page in a quick email check.
  /*
  if (user && !ADMIN_EMAILS.includes(user.email || "")) {
    return <div className="p-10 text-center text-red-600 font-bold">Unauthorized. Admin only.</div>;
  }
  */

  const now = Date.now();
  const EXPIRED_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

  const expiredGyms = gyms.filter((g) => {
    if (g.isSubscribed) return false; // Pro users are safe
    if (!g.createdAt) return false;
    
    const createdTime = new Date(g.createdAt).getTime();
    return (now - createdTime) > EXPIRED_MS;
  });

  const handleDeleteExpired = async () => {
    if (!confirm(`Are you sure you want to permanently delete ${expiredGyms.length} expired gym accounts? This will orphan their member subcollections unless you wipe them too.`)) return;
    
    setDeleting(true);
    let deletedCount = 0;
    
    for (const g of expiredGyms) {
      try {
        // Step 1: Delete all members inside this gym
        const membersSnap = await getDocs(collection(db, COLLECTIONS.GYMS, g.gymId, COLLECTIONS.MEMBERS));
        for (const mDoc of membersSnap.docs) {
          await deleteDoc(doc(db, COLLECTIONS.GYMS, g.gymId, COLLECTIONS.MEMBERS, mDoc.id));
        }

        // Step 2: Delete all payments
        const paymentsSnap = await getDocs(collection(db, COLLECTIONS.GYMS, g.gymId, COLLECTIONS.PAYMENTS));
        for (const pDoc of paymentsSnap.docs) {
          await deleteDoc(doc(db, COLLECTIONS.GYMS, g.gymId, COLLECTIONS.PAYMENTS, pDoc.id));
        }

        // Step 3: Delete all attendance
        const attendanceSnap = await getDocs(collection(db, COLLECTIONS.GYMS, g.gymId, COLLECTIONS.ATTENDANCE));
        for (const aDoc of attendanceSnap.docs) {
          await deleteDoc(doc(db, COLLECTIONS.GYMS, g.gymId, COLLECTIONS.ATTENDANCE, aDoc.id));
        }

        // Step 4: Delete the gym document itself
        await deleteDoc(doc(db, COLLECTIONS.GYMS, g.gymId));
        
        deletedCount++;
      } catch (err) {
        console.error("Failed to delete gym:", g.gymId, err);
      }
    }

    alert(`Successfully deleted ${deletedCount} expired gyms.`);
    setDeleting(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen p-6 max-w-lg mx-auto bg-slate-50">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="h-6 w-6 text-indigo-600" />
        <h1 className="text-xl font-bold text-slate-900">Admin Cleanup Panel</h1>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs mb-6">
        <h2 className="text-sm font-bold text-slate-800 mb-2">Platform Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-600 font-semibold mb-1">Total Gyms</p>
            <p className="text-2xl font-black text-blue-900">{gyms.length}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl">
            <p className="text-xs text-red-600 font-semibold mb-1">Expired (&gt; 5 days)</p>
            <p className="text-2xl font-black text-red-900">{expiredGyms.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-xs">
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-sm font-bold">Auto-Delete Expired Trials</h2>
        </div>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          The Free Tier (Spark Plan) on Firebase doesn&apos;t support scheduled Node.js Cloud Functions. 
          To keep your database footprint at $0, you can manually trigger the auto-delete script from here once a week.
          It will safely wipe the orphaned Members, Payments, and the Gym profile.
        </p>

        {expiredGyms.length > 0 ? (
          <button
            onClick={handleDeleteExpired}
            disabled={deleting}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-600 font-bold text-white shadow-md hover:bg-red-700 transition disabled:opacity-50"
          >
            {deleting ? (
              "Deleting..."
            ) : (
              <>
                <Trash2 className="h-4 w-4" /> Delete {expiredGyms.length} Expired Accounts
              </>
            )}
          </button>
        ) : (
          <div className="text-center p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
            All clean! No expired accounts found.
          </div>
        )}
      </div>
    </div>
  );
}

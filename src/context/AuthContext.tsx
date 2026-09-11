"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { GymProfile, StaffProfile, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  gym: GymProfile | null;
  staffProfile: StaffProfile | null;
  userRole: UserRole;
  activeGymId: string | null;
  loading: boolean;
  refreshGymData: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  gym: null,
  staffProfile: null,
  userRole: "owner",
  activeGymId: null,
  loading: true,
  refreshGymData: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [gym, setGym] = useState<GymProfile | null>(null);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("owner");
  const [activeGymId, setActiveGymId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeGym: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // 1. Check if user is a Gym Owner
        const gymDocRef = doc(db, COLLECTIONS.GYMS, currentUser.uid);
        const gymSnap = await getDoc(gymDocRef);

        if (gymSnap.exists()) {
          const gymData = { gymId: gymSnap.id, ...gymSnap.data() } as GymProfile;
          setGym(gymData);
          setUserRole(gymData.role || "owner");
          setActiveGymId(currentUser.uid);
          setStaffProfile(null);
          setLoading(false);

          // Realtime listener for owner gym doc
          unsubscribeGym = onSnapshot(
            gymDocRef,
            (snap) => {
              if (snap.exists()) {
                setGym({ gymId: snap.id, ...snap.data() } as GymProfile);
              }
            },
            (err) => {
              console.error("Gym snapshot listener error:", err);
            }
          );
        } else {
          // 2. Check if user is a Staff member
          const staffDocRef = doc(db, COLLECTIONS.STAFF, currentUser.uid);
          const staffSnap = await getDoc(staffDocRef);

          if (staffSnap.exists()) {
            const staffData = staffSnap.data() as StaffProfile;
            setStaffProfile(staffData);
            setUserRole("staff");
            setActiveGymId(staffData.gymId);

            // Fetch and listen to the target gym doc
            const targetGymRef = doc(db, COLLECTIONS.GYMS, staffData.gymId);
            unsubscribeGym = onSnapshot(targetGymRef, (snap) => {
              if (snap.exists()) {
                setGym(snap.data() as GymProfile);
              }
              setLoading(false);
            }, (err) => {
              console.error("Error fetching target gym profile for staff:", err);
              setLoading(false);
            });
          } else {
            setGym(null);
            setStaffProfile(null);
            setActiveGymId(null);
            setUserRole("owner");
            setLoading(false);
          }
        }
      } else {
        setGym(null);
        setStaffProfile(null);
        setActiveGymId(null);
        setUserRole("owner");
        setLoading(false);
        if (unsubscribeGym) unsubscribeGym();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeGym) unsubscribeGym();
    };
  }, []);

  const refreshGymData = async () => {
    if (activeGymId) {
      const gymSnap = await getDoc(doc(db, COLLECTIONS.GYMS, activeGymId));
      if (gymSnap.exists()) {
        setGym(gymSnap.data() as GymProfile);
      }
    }
  };

  const logout = async () => {
    await fbSignOut(auth);
    setUser(null);
    setGym(null);
    setStaffProfile(null);
    setActiveGymId(null);
    setUserRole("owner");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        gym,
        staffProfile,
        userRole,
        activeGymId,
        loading,
        refreshGymData,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
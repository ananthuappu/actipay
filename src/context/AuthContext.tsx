"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { GymProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  gym: GymProfile | null;
  loading: boolean;
  refreshGymData: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  gym: null,
  loading: true,
  refreshGymData: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [gym, setGym] = useState<GymProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGymProfile = async (uid: string) => {
    try {
      const gymDocRef = doc(db, COLLECTIONS.GYMS, uid);
      const gymSnap = await getDoc(gymDocRef);
      if (gymSnap.exists()) {
        setGym(gymSnap.data() as GymProfile);
      } else {
        setGym(null);
      }
    } catch (err) {
      console.error("Error fetching gym profile:", err);
      setGym(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchGymProfile(currentUser.uid);
      } else {
        setGym(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshGymData = async () => {
    if (user) {
      await fetchGymProfile(user.uid);
    }
  };

  const logout = async () => {
    await fbSignOut(auth);
    setUser(null);
    setGym(null);
  };

  return (
    <AuthContext.Provider value={{ user, gym, loading, refreshGymData, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
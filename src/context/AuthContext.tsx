"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
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

  useEffect(() => {
    let unsubscribeGym: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const gymDocRef = doc(db, COLLECTIONS.GYMS, currentUser.uid);
        unsubscribeGym = onSnapshot(gymDocRef, (gymSnap) => {
          if (gymSnap.exists()) {
            setGym(gymSnap.data() as GymProfile);
          } else {
            setGym(null);
          }
          setLoading(false);
        }, (err) => {
          console.error("Error fetching gym profile:", err);
          setGym(null);
          setLoading(false);
        });
      } else {
        setGym(null);
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
    if (user) {
      const gymSnap = await getDoc(doc(db, COLLECTIONS.GYMS, user.uid));
      if (gymSnap.exists()) {
        setGym(gymSnap.data() as GymProfile);
      }
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
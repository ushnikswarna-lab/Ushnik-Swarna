"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

if (typeof window !== "undefined" && !auth) {
  console.warn("Firebase Auth not initialized. Please check your environment variables.");
}

export type UserRole = "admin" | "manager" | "user";

export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  createdAt?: any;
  updatedAt?: any;
  disabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (firebaseUser: User, autoCreateUser: boolean = false): Promise<UserData | null> => {
    if (!db) return null;
    try {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          role: data.role as UserRole,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          disabled: data.disabled || false,
        };
      } else {
        // If autoCreateUser is true (for Google login), create a user role account
        if (autoCreateUser && firebaseUser.email) {
          try {
            const response = await fetch("/api/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: "user",
              }),
            });
            
            if (response.ok) {
              // Fetch the newly created user
              const newUserDoc = await getDoc(doc(db, "users", firebaseUser.uid));
              if (newUserDoc.exists()) {
                const data = newUserDoc.data();
                return {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  role: data.role as UserRole,
                  createdAt: data.createdAt,
                  updatedAt: data.updatedAt,
                  disabled: data.disabled || false,
                };
              }
            }
          } catch (error) {
            console.error("Error auto-creating user:", error);
          }
        }
        // User document does not exist - strict login only for admin/manager
        return null;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const data = await fetchUserData(firebaseUser);
        setUserData(data);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const data = await fetchUserData(userCredential.user);
    
    if (!data) {
      await firebaseSignOut(auth);
      throw new Error("User account not found. Please contact an administrator.");
    }
    
    if (data.disabled) {
      await firebaseSignOut(auth);
      throw new Error("Account is disabled");
    }
    
    setUserData(data);
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    // Auto-create user role account if doesn't exist (for public bookings)
    const data = await fetchUserData(userCredential.user, true);
    
    if (!data) {
      await firebaseSignOut(auth);
      throw new Error("User account not found. Please contact an administrator.");
    }
    
    if (data.disabled) {
      await firebaseSignOut(auth);
      throw new Error("Account is disabled");
    }
    
    setUserData(data);
  };

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
    setUser(null);
    setUserData(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    if (!user || !user.email) throw new Error("User not authenticated");

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  };

  const refreshUserData = async () => {
    if (user) {
      const data = await fetchUserData(user);
      setUserData(data);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signIn,
        signInWithGoogle,
        signOut,
        refreshUserData,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


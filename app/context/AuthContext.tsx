"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { User } from "firebase/auth"; // Import Firebase User type
import { auth } from "@/lib/firebase";

// Define the AuthContextType interface with specific types
interface AuthContextType {
  user: User | null; // Use Firebase User type or null
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null, // Default value for user
  signIn: async () => {}, // Default no-op function
  signOut: async () => {}, // Default no-op function
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); // Use User | null type
  const [loading, setLoading] = useState(true); // Initialize loading as true

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null); // Set user to null if firebaseUser is undefined
      setLoading(false); // Stop loading once the user state is determined
    });

    return () => unsubscribe(); // Clean up the listener
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      // Propagate the error to be caught in the login page
      throw error;
    }
  };

  const signOut = async () => {
    await signOut(); // 
    setUser(null); // Reset user to null after signing out
  };

 

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
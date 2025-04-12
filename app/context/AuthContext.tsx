"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { User } from "firebase/auth"; // Import Firebase User type
import { auth } from "@/lib/firebase";

// Define the AuthContextType interface with specific types
interface AuthContextType {
  signIn: (email: string, password: string) => Promise<void>;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userProfile: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  signIn: async () => {}, // Default no-op function
  user: null,
  loading: true,
  signOut: async () => {},
  userProfile: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); // Use User | null type
  const [loading, setLoading] = useState(true); // Initialize loading as true
  const [userProfile, setUserProfile] = useState<{
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null); // Set user to null if firebaseUser is undefined
      
      // Extract profile data including photo URL from Firebase user
      if (firebaseUser) {
        setUserProfile({
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL // This will contain the Google profile image URL
        });
      } else {
        setUserProfile(null);
      }
      
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
    try {
      await firebaseSignOut(auth); // Call Firebase signOut function
      setUser(null); // Reset user to null after signing out
      setUserProfile(null); // Reset user profile
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading, userProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
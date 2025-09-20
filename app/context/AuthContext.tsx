'use client';

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const refreshUserProfile = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile((prev) => {
          const newProfile: UserProfile = {
            uid: data.uid,
            email: data.email,
            displayName: data.displayName,
            firstName: data.firstName,
            lastName: data.lastName,
            photoURL: data.photoURL,
            emailVerified: data.emailVerified,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };
          if (JSON.stringify(prev) !== JSON.stringify(newProfile)) {
            console.log('Updating userProfile:', newProfile);
            return newProfile;
          }
          return prev;
        });
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      unsubscribeProfile = onSnapshot(
        userRef,
        (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setUserProfile((prev) => {
              const newProfile: UserProfile = {
                uid: data.uid,
                email: data.email,
                displayName: data.displayName,
                firstName: data.firstName,
                lastName: data.lastName,
                photoURL: data.photoURL,
                emailVerified: data.emailVerified,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
              };
              if (JSON.stringify(prev) !== JSON.stringify(newProfile)) {
                console.log('onSnapshot updating userProfile:', newProfile);
                return newProfile;
              }
              console.log('No userProfile update needed');
              return prev;
            });
          } else {
            setUserProfile(null);
          }
        },
        (error) => {
          console.error('Error listening to user profile:', error);
          setUserProfile(null);
        }
      );
    } else {
      setUserProfile(null);
    }
    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      userProfile,
      loading,
      signOut,
      refreshUserProfile,
    }),
    [user, userProfile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
// utils/userUtils.tsx
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';

// Define the user data interface for Firestore
export interface UserData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: 'user' | 'instructor' | 'admin';
  createdAt: any; // Firestore serverTimestamp
  updatedAt: any; // Firestore serverTimestamp
}

// Type for additional data that can be passed
export interface AdditionalUserData {
  role?: 'user' | 'instructor' | 'admin';
  [key: string]: any;
}

export const createUserDocument = async (
  user: User | null,
  additionalData: AdditionalUserData = {}
): Promise<void> => {
  if (!user) {
    console.warn('No user provided to createUserDocument');
    return;
  }
  
  const userRef = doc(db, 'users', user.uid);
  
  try {
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create new user document
      const { displayName, email, photoURL, uid } = user;
      const userData: Partial<UserData> = {
        uid,
        displayName: displayName || '',
        email: email || '',
        photoURL: photoURL || '',
        role: additionalData.role || 'user', // Default role
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...additionalData,
      };
      
      await setDoc(userRef, userData);
      console.log('User document created successfully for:', uid);
    } else {
      // Update existing user document
      const updateData = {
        updatedAt: serverTimestamp(),
        // Update photoURL if it changed (common with Google sign-in)
        ...(user.photoURL && { photoURL: user.photoURL }),
        // Update displayName if it changed
        ...(user.displayName && { displayName: user.displayName }),
        ...additionalData,
      };
      
      await setDoc(userRef, updateData, { merge: true });
      console.log('User document updated successfully for:', user.uid);
    }
  } catch (error) {
    console.error('Error creating/updating user document:', error);
    throw new Error(`Failed to create user document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to get user data from Firestore
export const getUserDocument = async (uid: string): Promise<UserData | null> => {
  if (!uid) return null;
  
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user document:', error);
    return null;
  }
};

// Helper function to update user role (admin only)
export const updateUserRole = async (
  uid: string,
  newRole: 'user' | 'instructor' | 'admin'
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    console.log(`User role updated to ${newRole} for:`, uid);
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new Error(`Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
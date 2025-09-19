// utils/userUtils.ts
import { User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

export const createUserDocument = async (user: User, additionalData?: any) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    // Parse display name into first and last name
    let firstName = '';
    let lastName = '';
    
    if (user.displayName) {
      const nameParts = user.displayName.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    const userData: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName,
      firstName: firstName || additionalData?.firstName || '',
      lastName: lastName || additionalData?.lastName || '',
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...additionalData
    };

    try {
      await setDoc(userRef, userData);
      console.log('User document created successfully');
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  } else {
    // Update existing user document with any new information
    const existingData = snapshot.data();
    
    // Only update if we have new information
    const updates: any = {
      updatedAt: new Date()
    };

    // Update photo URL if it's new
    if (user.photoURL && user.photoURL !== existingData.photoURL) {
      updates.photoURL = user.photoURL;
    }

    // Update display name and parse it if it's new
    if (user.displayName && user.displayName !== existingData.displayName) {
      updates.displayName = user.displayName;
      
      const nameParts = user.displayName.trim().split(' ');
      updates.firstName = nameParts[0] || existingData.firstName || '';
      updates.lastName = nameParts.slice(1).join(' ') || existingData.lastName || '';
    }

    // Update email verification status
    if (user.emailVerified !== existingData.emailVerified) {
      updates.emailVerified = user.emailVerified;
    }

    // Add any additional data
    if (additionalData) {
      Object.assign(updates, additionalData);
    }

    // Only update if there are actual changes
    if (Object.keys(updates).length > 1) { // More than just updatedAt
      try {
        await setDoc(userRef, updates, { merge: true });
        console.log('User document updated successfully');
      } catch (error) {
        console.error('Error updating user document:', error);
      }
    }
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  if (!uid) return;

  const userRef = doc(db, 'users', uid);
  
  try {
    await setDoc(userRef, {
      ...updates,
      updatedAt: new Date()
    }, { merge: true });
    console.log('User profile updated successfully');
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!uid) return null;

  const userRef = doc(db, 'users', uid);
  
  try {
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return snapshot.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};
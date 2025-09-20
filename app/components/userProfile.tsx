'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/utils/userUtils';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { FiCamera, FiEdit2, FiSave, FiX, FiUser, FiMail, FiCalendar } from 'react-icons/fi';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const UserProfile = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(userProfile?.firstName || '');
  const [lastName, setLastName] = useState(userProfile?.lastName || '');
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');

  React.useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName || '');
      setLastName(userProfile.lastName || '');
      setDisplayName(userProfile.displayName || '');
    }
  }, [userProfile]);

  const getDisplayName = () => {
    if (userProfile?.firstName || userProfile?.lastName) {
      const firstName = userProfile.firstName || '';
      const lastName = userProfile.lastName || '';
      return `${firstName} ${lastName}`.trim();
    }
    return userProfile?.displayName || userProfile?.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    if (userProfile?.firstName || userProfile?.lastName) {
      const firstInitial = userProfile.firstName ? userProfile.firstName[0].toUpperCase() : '';
      const lastInitial = userProfile.lastName ? userProfile.lastName[0].toUpperCase() : '';
      return `${firstInitial}${lastInitial}`.trim() || 'U';
    }
    if (userProfile?.displayName) {
      const nameParts = userProfile.displayName.trim().split(' ');
      const firstInitial = nameParts[0] ? nameParts[0][0].toUpperCase() : '';
      const lastInitial = nameParts[1] ? nameParts[1][0].toUpperCase() : '';
      return `${firstInitial}${lastInitial}`.trim() || firstInitial || 'U';
    }
    return userProfile?.email ? userProfile.email[0].toUpperCase() : 'U';
  };

  const handleSave = async () => {
    if (!user || !userProfile) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!firstName.trim()) {
        setError('First name is required');
        setLoading(false);
        return;
      }
      if (!lastName.trim()) {
        setError('Last name is required');
        setLoading(false);
        return;
      }

      const newDisplayName = `${firstName.trim()} ${lastName.trim()}`;

      // Check if data has changed
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      const currentData = docSnap.exists() ? docSnap.data() : {};
      const hasChanges =
        currentData.firstName !== firstName.trim() ||
        currentData.lastName !== lastName.trim() ||
        currentData.displayName !== newDisplayName;

      if (!hasChanges) {
        setSuccess('No changes to save');
        setLoading(false);
        setIsEditing(false);
        setTimeout(() => setSuccess(null), 3000);
        return;
      }

      await updateProfile(user, { displayName: newDisplayName });
      await updateUserProfile(user.uid, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: newDisplayName,
      });

      await refreshUserProfile();

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFirstName(userProfile?.firstName || '');
    setLastName(userProfile?.lastName || '');
    setDisplayName(userProfile?.displayName || '');
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setError('Photo upload feature coming soon! Currently showing Google profile photo.');
    setTimeout(() => setError(null), 3000);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="bg-gray-300 dark:bg-gray-700 h-8 w-48 rounded mb-6"></div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-6 mb-6">
              <div className="bg-gray-300 dark:bg-gray-700 h-24 w-24 rounded-full"></div>
              <div>
                <div className="bg-gray-300 dark:bg-gray-700 h-6 w-32 rounded mb-2"></div>
                <div className="bg-gray-300 dark:bg-gray-700 h-4 w-48 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Same JSX as provided */}
    </div>
  );
};

export default UserProfile;
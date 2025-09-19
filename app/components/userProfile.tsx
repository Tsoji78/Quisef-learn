// pages/profile.tsx or components/UserProfile.tsx
'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/utils/userUtils';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { FiCamera, FiEdit2, FiSave, FiX, FiUser, FiMail, FiCalendar } from 'react-icons/fi';

const UserProfile = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [firstName, setFirstName] = useState(userProfile?.firstName || '');
  const [lastName, setLastName] = useState(userProfile?.lastName || '');
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');

  // Update form states when userProfile changes
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
      // Validate required fields
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

      // Create new display name
      const newDisplayName = `${firstName.trim()} ${lastName.trim()}`;

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: newDisplayName
      });

      // Update Firestore document
      await updateUserProfile(user.uid, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: newDisplayName
      });

      // Refresh the user profile data
      refreshUserProfile();

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
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

    // For now, just show a message that this feature needs to be implemented
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
      minute: '2-digit'
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account information and preferences</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              {userProfile.photoURL ? (
                <div className="h-24 w-24 relative overflow-hidden rounded-full border-4 border-white shadow-lg">
                  <Image
                    src={userProfile.photoURL}
                    alt={`${getDisplayName()}'s profile photo`}
                    fill
                    className="object-cover cursor-pointer"
                    onClick={handleImageClick}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="h-full w-full rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold cursor-pointer">${getUserInitials()}</div>`;
                        parent.onclick = handleImageClick;
                      }
                    }}
                  />
                </div>
              ) : (
                <div 
                  className="h-24 w-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold cursor-pointer border-4 border-white shadow-lg"
                  onClick={handleImageClick}
                >
                  {getUserInitials()}
                </div>
              )}
              <button
                onClick={handleImageClick}
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors duration-200"
                aria-label="Change profile photo"
              >
                <FiCamera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{getDisplayName()}</h2>
              <p className="text-blue-100 mt-1">{userProfile.email}</p>
              <div className="flex items-center mt-2">
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                  userProfile.emailVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {userProfile.emailVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <FiUser className="h-5 w-5 mr-2" />
              Personal Information
            </h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                <FiEdit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSave className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your first name"
                  disabled={loading}
                />
              ) : (
                <p className="py-2 text-gray-900 dark:text-white">
                  {userProfile.firstName || 'Not provided'}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your last name"
                  disabled={loading}
                />
              ) : (
                <p className="py-2 text-gray-900 dark:text-white">
                  {userProfile.lastName || 'Not provided'}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiMail className="inline h-4 w-4 mr-1" />
                Email Address
              </label>
              <p className="py-2 text-gray-900 dark:text-white">
                {userProfile.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Email cannot be changed here. Contact support if needed.
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <p className="py-2 text-gray-900 dark:text-white">
                {getDisplayName()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically generated from first and last name
              </p>
            </div>
          </div>

          {/* Account Information */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FiCalendar className="h-5 w-5 mr-2" />
              Account Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Created
                </label>
                <p className="text-gray-900 dark:text-white">
                  {formatDate(userProfile.createdAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Updated
                </label>
                <p className="text-gray-900 dark:text-white">
                  {formatDate(userProfile.updatedAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User ID
                </label>
                <p className="text-gray-900 dark:text-white font-mono text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  {userProfile.uid}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Status
                </label>
                <div className="flex items-center space-x-2">
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                    userProfile.emailVerified 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>
                    {userProfile.emailVerified ? 'Active & Verified' : 'Email Verification Pending'}
                  </span>
                </div>
                {!userProfile.emailVerified && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Please check your email and verify your account to access all features.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Security & Privacy
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white">Change Password</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Update your account password</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200">
                  Change Password
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security to your account</p>
                </div>
                <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200">
                  Set Up 2FA
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white">Download Your Data</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Export a copy of your account data</p>
                </div>
                <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200">
                  Download Data
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div>
                  <h5 className="font-medium text-red-900 dark:text-red-300">Delete Account</h5>
                  <p className="text-sm text-red-600 dark:text-red-400">Permanently delete your account and all data</p>
                </div>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
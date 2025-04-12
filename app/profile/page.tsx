// app/profile/page.tsx (depending on your Next.js version)
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

const ProfilePage = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-32"></div>
        
        <div className="px-6 py-4 flex flex-col items-center -mt-16">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 mb-4">
            {userProfile.photoURL ? (
              <Image 
                src={userProfile.photoURL} 
                alt={userProfile.displayName || "Profile"} 
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-4xl text-white">
                {userProfile.displayName ? userProfile.displayName[0].toUpperCase() : 
                (userProfile.email ? userProfile.email[0].toUpperCase() : 'U')}
              </div>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {userProfile.displayName || 'User'}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {userProfile.email}
          </p>
          
          <div className="mt-8 w-full">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Profile Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </h3>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {userProfile.email}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Name
                </h3>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {userProfile.displayName || 'Not provided'}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Profile Image
                </h3>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {userProfile.photoURL ? 'Provided by Google' : 'Not provided'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
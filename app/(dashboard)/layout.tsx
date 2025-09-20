'use client';

import { useState, useEffect } from 'react';
import SafeImage from '@/components/SafeImage';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { HiMenuAlt3 } from 'react-icons/hi';
import { FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { userProfile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (window.innerWidth < 768 && !target.closest('.sidebar-container') && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [sidebarOpen]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (menuOpen && !target.closest('.user-menu-container')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [menuOpen]);

  // Function to get user's display name with priority order
  const getDisplayName = () => {
    if (userProfile?.firstName || userProfile?.lastName) {
      // Prioritize first name + last name
      const firstName = userProfile.firstName || '';
      const lastName = userProfile.lastName || '';
      return `${firstName} ${lastName}`.trim();
    }
    
    // Fallback to displayName
    if (userProfile?.displayName) {
      return userProfile.displayName;
    }
    
    // Last fallback to email or 'User'
    return userProfile?.email ? userProfile.email.split('@')[0] : 'User';
  };

  // Function to get user's initials for avatar
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
    
    if (userProfile?.email) {
      return userProfile.email[0].toUpperCase();
    }
    
    return 'Q'
  };

  if (!mounted) {
    return <div className="min-h-screen" style={{ visibility: 'hidden' }}></div>;
  }

  const handleLogout = () => {
    signOut();
  };

  const displayName = getDisplayName();
  const userInitials = getUserInitials();

  return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col h-screen overflow-auto">
          <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none md:hidden transition-colors duration-300"
                    aria-label="Toggle sidebar"
                  >
                    <HiMenuAlt3 className="h-6 w-6" />
                  </button>
                  <span className="text-xl font-bold text-gray-800 dark:text-gray-100 ml-2">
                    Dashboard
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <ThemeToggle isDarkMode={isDark} onToggle={toggleTheme} />
                  
                  {/* User greeting - show first name if available */}
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Welcome back,
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {userProfile?.firstName || displayName}
                    </span>
                  </div>
                  
                  <div className="relative user-menu-container">
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                      aria-label="Open user menu"
                    >
                      <div className="h-8 w-8 relative overflow-hidden rounded-full border-2 border-gray-200 dark:border-gray-600">
                        <SafeImage
                          src={userProfile?.photoURL || ''}
                          alt={`${displayName}'s profile photo`}
                          width={32}
                          height={32}
                          className="rounded-full cursor-pointer"
                          fallbackInitials={userInitials}
                          onClick={() => setMenuOpen(!menuOpen)}
                        />
                      </div>
                    </button>
                    {menuOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-600 ring-opacity-5 z-50">
                        <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                          <p className="font-medium text-base">{displayName}</p>
                          {userProfile?.firstName && userProfile?.lastName && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {userProfile.firstName} {userProfile.lastName}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                            {userProfile?.email || ''}
                          </p>
                        </div>
                        <a
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <FiUser className="h-4 w-4" />
                          Your Profile
                        </a>
                        <a
                          href="/settings"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <FiSettings className="h-4 w-4" />
                          Settings
                        </a>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <FiLogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-1 max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100">
            {children}
          </main>
          <footer className="bg-white dark:bg-gray-800 shadow-inner p-4">
            <div className="max-w-7xl mx-auto text-center text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Quisef Learn. All rights reserved.
            </div>
          </footer>
        </div>
      </div>
  );
};

export default Layout;
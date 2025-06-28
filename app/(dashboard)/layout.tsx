'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Sidebar from "@/components/Sidebar";
import { useAuth } from '@/context/AuthContext';
import { BsSun, BsMoon } from 'react-icons/bs';
import { HiMenuAlt3 } from 'react-icons/hi';
import { FiUser, FiSettings, FiLogOut } from 'react-icons/fi';

const defaultImage = "/image/flat.jpg";

const Layout = ({ children }: { children: React.ReactNode }) => {
  // Initialize dark mode based on localStorage or system preference
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { userProfile, signOut } = useAuth();

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme to document and persist in localStorage
  useEffect(() => {
    if (!mounted) return;
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode, mounted]);

  // Handle click outside sidebar to collapse it on mobile
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

  // Close menu when clicking outside
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

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Prevent rendering until mounted to avoid theme flickering
  if (!mounted) {
    return (
      <div
        className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300"
        style={{ visibility: 'hidden' }}
      ></div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} darkMode={darkMode} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-auto">
        {/* Navbar */}
        <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-10 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                {/* Mobile menu button with react-icon */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none md:hidden transition-colors duration-300"
                  aria-label="Toggle sidebar"
                >
                  <span className="sr-only">Open sidebar</span>
                  <HiMenuAlt3 className="h-6 w-6" />
                </button>
                <span className="text-xl font-bold text-gray-800 dark:text-gray-100 ml-2 transition-colors duration-300">
                  Dashboard
                </span>
              </div>
              <div className="flex items-center">
                {/* Dark Mode Toggle Button */}
               

                {/* User Profile Menu */}
                <div className="ml-4 flex items-center user-menu-container">
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-300"
                      aria-label="Open user menu"
                    >
                      <span className="sr-only">Open user menu</span>
                      {userProfile?.photoURL ? (
                        <div className="h-8 w-8 relative overflow-hidden rounded-full border-2 border-gray-200 dark:border-gray-600 transition-colors duration-300">
                          <Image
                            src={userProfile.photoURL || defaultImage}
                            alt={userProfile.displayName || "User profile"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white dark:text-gray-100 transition-colors duration-300">
                          {userProfile?.displayName
                            ? userProfile.displayName[0].toUpperCase()
                            : userProfile?.email
                            ? userProfile.email[0].toUpperCase()
                            : 'U'}
                        </div>
                      )}
                    </button>

                    {/* Profile dropdown */}
                    {menuOpen && (
                      <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-600 ring-opacity-5 focus:outline-none transition-colors duration-300 z-50">
                        <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 transition-colors duration-300">
                          <p className="font-medium">{userProfile?.displayName || 'User'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {userProfile?.email || ''}
                          </p>
                        </div>
                        <a
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                        >
                          <FiUser className="h-4 w-4" />
                          Your Profile
                        </a>
                        <a
                          href="/settings"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                        >
                          <FiSettings className="h-4 w-4" />
                          Settings
                        </a>
                        <button
                          onClick={() => signOut()}
                          className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
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
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100 transition-colors duration-300">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 shadow-inner p-4 transition-colors duration-300">
          <div className="max-w-7xl mx-auto text-center text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
            © {new Date().getFullYear()} LMS Dashboard. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
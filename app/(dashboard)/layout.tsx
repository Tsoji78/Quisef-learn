
// dasboard/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from '@/context/AuthContext';

const Layout = ({ children }: { children: React.ReactNode }) => {
  // Use localStorage to persist dark mode preference
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Only run after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Check for user's preferred color scheme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial state based on saved preference or system preference
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
    }
  }, []);

  // Handle dark mode toggle
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
      // Only collapse sidebar on mobile views when clicking outside sidebar
      if (window.innerWidth < 768 && !target.closest('.sidebar-container') && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [sidebarOpen]);

  // Don't render UI until after client-side hydration to prevent theme flickering
  if (!mounted) {
    return <div className="min-h-screen bg-gray-100"></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} darkMode={darkMode} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-auto">
        {/* Navbar */}
        <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-10 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none md:hidden"
                >
                  <span className="sr-only">Open sidebar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <span className="text-xl font-bold text-gray-800 dark:text-white ml-2 transition-colors duration-200">
                 Dashboard
                </span>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? (
                    <span className="text-2xl text-yellow-400">☀️</span>
                  ) : (
                    <span className="text-2xl text-gray-600">🌙</span>
                  )}
                </button>
                <div className="ml-4 flex items-center">
                  <div className="relative">
                    <button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                        U
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <AuthProvider>{children}</AuthProvider>
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 shadow-inner p-4 transition-colors duration-200">
          <div className="max-w-7xl mx-auto text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} LMS Dashboard. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
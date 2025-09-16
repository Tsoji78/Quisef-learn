'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useTheme();

  useEffect(() => {
    if (!isOpen) {
      setIsCollapsed(false);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    router.push('/login');
  };

  const navItems = [
    { name: 'Home', path: '/home', icon: '🏠' },
    { name: 'Courses', path: '/courses', icon: '📚' },
    { name: 'Class Schedules', path: '/class', icon: '👥' },
    { name: 'Groups', path: '/group', icon: '📊' },
    { name: 'Certificates', path: '/certificate', icon: '⚙️' },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0  bg-opacity-50 z-20 transition-opacity md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div
        className={`sidebar-container fixed inset-y-0 left-0 z-30 md:relative md:inset-y-auto md:left-auto 
          bg-gray-800 text-white h-screen transition-all duration-300 flex-shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
          ${isCollapsed ? 'w-16 md:w-16' : 'w-64 md:w-64'}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
            {!isCollapsed && <span className="font-bold text-lg">Quisef Learn</span>}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded hover:bg-gray-700 focus:outline-none"
              aria-label="Toggle sidebar width"
            >
              <span className="text-xl">{isCollapsed ? '›' : '‹'}</span>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center p-2 rounded transition-colors
                      ${pathname === item.path ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                      ${isCollapsed ? 'justify-center' : 'px-4'}`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {!isCollapsed && <span className="ml-3">{item.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className={`w-full p-2 rounded hover:bg-gray-700 transition-colors flex items-center ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <span className="text-xl">🚪</span>
              {!isCollapsed && <span className="ml-3">Logout</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
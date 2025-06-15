"use client";

import { useState } from "react";
import Link from "next/link";

export default function WelcomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-blue-600 dark:text-blue-400 text-xl font-bold">QuisefLearn</span>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/about" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                About
              </Link>
              <Link href="/catalog" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Catalogue
              </Link>
              <Link href="/contact" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Contact
              </Link>
              <Link href="/login" className="ml-4 px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-gray-700">
                Sign In
              </Link>
              <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Sign Up
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
              >
                <svg
                  className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden bg-white dark:bg-gray-800 shadow-lg`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/https://quietshelter.org/about" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md">
              About
            </Link>
            <Link href="/catalog" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md">
              Catalogue
            </Link>
            <Link href="/contact" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md">
              Contact
            </Link>
            <Link href="/login" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md">
              Sign In
            </Link>
            <Link href="/signup" className="block px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <div className="flex-grow flex flex-col md:flex-row items-center justify-center p-4 md:p-8 lg:p-12">
        {/* Left Column - Text Content */}
        <div className="w-full md:w-1/2 flex flex-col space-y-6 mb-8 md:mb-0 md:pr-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
            Learn Without <span className="text-blue-600 dark:text-blue-400">Limits</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-lg">
            Join thousands of students on our platform to acquire new skills, advance your career, and discover a world of knowledge.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link href="/signup" className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition duration-200">
              Get Started
            </Link>
            <Link href="/catalog" className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200">
              Browse catalogs
            </Link>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6">
            <div className="text-center p-3">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Courses</div>
            </div>
            <div className="text-center p-3">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">50k+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Students</div>
            </div>
            <div className="text-center p-3 col-span-2 sm:col-span-1">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">200+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Instructors</div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Hero Image */}
        <div className="w-full md:w-1/2">
          <div className="relative rounded-lg overflow-hidden shadow-xl">
            <img 
              src="/image/globe.jpg" 
              alt="Students learning online" 
              className="w-full h-auto object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
              <div className="text-white text-xl font-medium">Start your learning journey today</div>
            </div>
          </div>
          
          {/* Featured Course Cards */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <div className="font-medium text-blue-600 dark:text-blue-400">Web Development</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">20 courses available</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <div className="font-medium text-blue-600 dark:text-blue-400">Data Science</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">15 courses available</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-gray-700 dark:text-gray-300">© 2025 QuisefLearn. All rights reserved.</span>
            </div>
            <div className="flex space-x-4">
              <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                Terms
              </Link>
              <Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                Privacy
              </Link>
              <Link href="/help" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                Help
              </Link>
              <Link href="/https://learn.quietshelter.org/signin" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
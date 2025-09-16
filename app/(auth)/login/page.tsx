"use client";

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { createUserDocument } from '@/utils/userUtils';

export const dynamic = 'force-dynamic'

interface CarouselImage {
  src: string;
  alt: string;
  caption: string;
}

const LoginPage: React.FC = () => {
  const carouselImages: CarouselImage[] = [
    { src: "/image/children.jpg", alt: "Welcome to our platform", caption: "Join our community of professionals" },
    { src: "/image/flat.jpg", alt: "Learn and Innovate", caption: "Shape your World" },
    { src: "/image/interracial.jpg", alt: "Connect and collaborate", caption: "Work together with teams around the world" }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        router.push("/home");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check email verification
      if (!userCredential.user.emailVerified) {
        setError("Please verify your email before logging in");
        await auth.signOut();
        setLoading(false);
        return;
      }
      
      // Create user document in Firestore
      await createUserDocument(userCredential.user);
      
      console.log('Successfully logged in with email');
      
      // Router push will be handled by the useEffect above
      
    } catch (error: any) {
      console.error('Email login error:', error);
      let errorMessage = 'An error occurred during login';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Incorrect email or password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Configure Google provider
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Sign in with popup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Create user document in Firestore
      await createUserDocument(user);
      
      console.log('Successfully logged in with Google');
      console.log('Profile image URL:', user.photoURL);
      
      // Router push will be handled by the useEffect above
      
    } catch (error: any) {
      console.error('Google login error:', error);
      let errorMessage = 'An error occurred during Google sign-in';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = "Sign-in canceled. Please try again.";
          break;
        case 'auth/popup-blocked':
          errorMessage = "Popup blocked. Please allow popups and try again.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection and try again.";
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = "Another popup is already open.";
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login | Your Platform</title>
        <meta name="description" content="Login to access your account" />
      </Head>

      <div className="flex h-screen">
        {/* Carousel Section */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900">
          {carouselImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                priority={index === 0}
                onError={(e) => console.log(`Failed to load image: ${image.src}`)}
              />
              <div className="absolute inset-0 bg-black opacity-40 z-10"></div>
              <div className="absolute bottom-10 left-10 text-white z-20">
                <h2 className="text-3xl font-bold mb-2">{image.alt}</h2>
                <p className="text-xl">{image.caption}</p>
              </div>
            </div>
          ))}

          {/* Navigation Dots */}
          <div className="absolute bottom-5 left-0 right-0 flex justify-center z-20">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`mx-1 h-2 w-2 rounded-full ${
                  index === currentSlide ? 'bg-white' : 'bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 relative">
          <div className="w-full max-w-md">
            {/* Back to Home Arrow Button */}
            <button
              onClick={() => router.push("/")}
              className="absolute top-4 left-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200"
              aria-label="Back to home"
            >
              <svg
                className="h-6 w-6 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="text-center mb-10">
              <h1 className="text-3xl text-white font-bold mb-2">Welcome Back</h1>
              <p className="text-gray-600">Please sign in to your account</p>
            </div>

            {error && (
              <div className="mb-4 p-3 text-red-500 bg-red-50 border border-red-200 rounded-md text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-white">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button 
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="flex items-center mt-2">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="mt-4 w-full flex text-black items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                  </g>
                </svg>
                {loading ? 'Processing...' : 'Sign in with Google'}
              </button>
            </div>

            <p className="mt-8 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/signup" className="font-medium text-blue-600 hover:underline">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
"use client";

import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [lastResetTime, setLastResetTime] = useState<number | null>(null);
  const COOLDOWN_PERIOD = 60000; // 1 minute in milliseconds

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!email) {
      setError("Please enter your email address");
      setLoading(false);
      return;
    }

    if (lastResetTime && Date.now() - lastResetTime < COOLDOWN_PERIOD) {
      const remainingSeconds = Math.ceil((COOLDOWN_PERIOD - (Date.now() - lastResetTime)) / 1000);
      setError(`Please wait ${remainingSeconds} seconds before trying again`);
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      setEmail("");
      setLastResetTime(Date.now());
    } catch (err: any) {
      switch (err.code) {
        case "auth/invalid-email":
          setError("Invalid email format");
          break;
        case "auth/user-not-found":
          setError("No account found with this email");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts, please try again later");
          break;
        default:
          setError(err.message || "Failed to send reset email");
      }
    } finally {
      setLoading(false);
    }
  };

  // Complex Spinner Component
  const ComplexSpinner = () => (
    <div className="flex justify-center items-center">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <div className="absolute inset-2 animate-spin-reverse rounded-full border-4 border-blue-300 border-b-transparent"></div>
        <div className="absolute inset-4 animate-pulse bg-blue-500/20 rounded-full"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Reset Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you a link to reset your password
        </p>

        <div className="mt-8 bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-3 rounded-md text-sm">
              Password reset email sent! Please check your inbox (and spam folder) for the reset link.
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="you@example.com"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <ComplexSpinner /> : "Send Reset Link"}
              </button>
            </div>
          </form>

          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Remember your password?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
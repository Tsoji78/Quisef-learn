"use client";

import { useState } from "react";


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent!");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleReset} className="p-6 bg-gray-100 dark:bg-gray-900 rounded">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="mb-4 p-2 w-full border"
        />
        <button type="submit" className="w-full p-2 bg-black dark:bg-white text-white dark:text-black">
          Reset Password
        </button>
      </form>
    </div>
  );
}
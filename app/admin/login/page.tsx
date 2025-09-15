"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAdminAuth } from "@/utils/adminAuth";
import { showErrorToast, showSuccessToast } from "@/components/ToastSystem";

interface LoginFormData {
  id: string;
  password: string;
}

export default function AdminLogin() {
  const router = useRouter();
  const { login, checkAuth } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<LoginFormData>();

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const admin = await checkAuth();
      if (admin) {
        router.push('/admin');
        return;
      }
    } catch (error) {
      console.log("Not authenticated, showing login form");
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      const result = await login(data.id, data.password);
      
      if (result.success) {
        showSuccessToast("Login successful! Redirecting...");
        setTimeout(() => {
          router.push('/admin');
        }, 1000);
      } else {
        setError("password", { 
          type: "manual", 
          message: result.error || "Invalid credentials" 
        });
        showErrorToast(result.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      showErrorToast("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.707-4.293a1 1 0 010 1.414L9.414 18.414a1 1 0 01-1.414 0L4.293 14.707a1 1 0 010-1.414L8 10.586V6a1 1 0 011-1h6a1 1 0 011 1v4.586l3.707 3.707z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Smart Tracking Admin
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your admin account
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-200 sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Admin ID Field */}
            <div>
              <label htmlFor="id" className="block text-sm font-medium text-gray-700">
                Admin ID
              </label>
              <div className="mt-1">
                <input
                  id="id"
                  type="text"
                  autoComplete="username"
                  {...register("id", {
                    required: "Admin ID is required",
                    minLength: {
                      value: 2,
                      message: "Admin ID must be at least 2 characters"
                    }
                  })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your admin ID"
                />
                {errors.id && (
                  <p className="mt-2 text-sm text-red-600">{errors.id.message}</p>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 1,
                      message: "Password is required"
                    }
                  })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Remember me checkbox */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Smart Tracking System v2.0
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                ← Back to Portfolio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          © 2024 Smart Tracking System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
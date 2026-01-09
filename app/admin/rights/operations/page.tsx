"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft, Users, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminOperationsPage() {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const [targetPage, setTargetPage] = useState<string | null>(null);

  const handleNavigation = (path: string, title: string) => {
    setNavigating(true);
    setTargetPage(title);
    
    // Small delay for smooth transition
    setTimeout(() => {
      router.push(path);
    }, 300);
  };

  const operationOptions = [
    {
      id: "live-users",
      title: "Live Active User Count",
      description: "Check real-time active, minimized, and inactive users",
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      hoverBorder: "hover:border-blue-400",
      hoverShadow: "hover:shadow-blue-500/10",
      path: "/admin/rights/operations/live-users",
    },
    {
      id: "force-update",
      title: "Update Old Connections",
      description: "Force reload all client browsers to update to latest code",
      icon: RefreshCw,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      hoverBorder: "hover:border-orange-400",
      hoverShadow: "hover:shadow-orange-500/10",
      path: "/admin/rights/operations/force-update",
    },
    // Future operations can be added here
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with gradient */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Operations Hub</h1>
                <p className="text-sm text-gray-600 mt-0.5">Monitor and manage live system operations</p>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => router.push("/admin/rights")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Admin Rights</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>
        </div>
      </div>

      {/* Operation Options */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {operationOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => handleNavigation(option.path, option.title)}
                disabled={navigating}
                className={`relative flex flex-col items-start p-6 bg-white rounded-xl border-2 ${option.borderColor} ${option.hoverBorder} transition-all duration-200 hover:shadow-xl ${option.hoverShadow} group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 w-full">
                  {/* Icon and Title Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${option.bgColor}`}>
                        <Icon className={`w-6 h-6 ${option.iconColor}`} />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">{option.title}</h2>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 pl-[60px]">{option.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
              <p className="text-sm text-gray-700 mb-3">
                More admin operations will be added here, including:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• System health monitoring</li>
                <li>• Database performance metrics</li>
                <li>• API usage statistics</li>
                <li>• Bulk user operations</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {navigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="bg-white rounded-xl shadow-2xl p-6 flex items-center gap-4">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <div>
                <p className="font-medium text-gray-900">Loading...</p>
                <p className="text-sm text-gray-600">{targetPage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

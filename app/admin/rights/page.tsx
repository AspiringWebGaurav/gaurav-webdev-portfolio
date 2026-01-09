"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Wrench, Trash2, Activity, AlertOctagon, ChevronRight, ArrowLeft, Home, Loader2, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminRightsPage() {
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

  const menuOptions = [
    {
      id: "maintenance",
      title: "Maintenance Mode",
      description: "Enable or disable site maintenance mode",
      icon: Wrench,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      hoverBorder: "hover:border-purple-400",
      hoverShadow: "hover:shadow-purple-500/10",
      path: "/admin/rights/maintenance",
    },
    {
      id: "cache",
      title: "Cache Management",
      description: "Clear application cache and manage storage",
      icon: Trash2,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      hoverBorder: "hover:border-red-400",
      hoverShadow: "hover:shadow-red-500/10",
      path: "/admin/rights/cache",
    },
    {
      id: "operations",
      title: "Admin Operations Hub",
      description: "Live active user count and system operations",
      icon: Activity,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      hoverBorder: "hover:border-blue-400",
      hoverShadow: "hover:shadow-blue-500/10",
      path: "/admin/rights/operations",
    },
    {
      id: "suspension",
      title: "Suspension Mode",
      description: "Temporarily suspend all services - redirect users",
      icon: AlertOctagon,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      hoverBorder: "hover:border-red-400",
      hoverShadow: "hover:shadow-red-500/10",
      path: "/admin/rights/suspension",
    },
    {
      id: "sbis",
      title: "Smart Burn Intelligence",
      description: "Monitor resource usage and autonomous burn prevention",
      icon: Brain,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      hoverBorder: "hover:border-emerald-400",
      hoverShadow: "hover:shadow-emerald-500/10",
      path: "/admin/rights/sbis",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with gradient */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-purple-300 shadow-lg shadow-purple-500/20">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Rights Manager</h1>
                <p className="text-sm text-gray-600 mt-0.5">Manage critical system settings and controls</p>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Options */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuOptions.map((option, index) => {
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
                      <div className={`p-3 rounded-lg ${option.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className={`w-6 h-6 ${option.iconColor}`} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {option.title}
                      </h3>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200" />
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {option.description}
                  </p>
                </div>

                {/* Bottom decoration line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
                  option.id === 'maintenance' ? 'from-purple-500 to-indigo-600' : 
                  option.id === 'cache' ? 'from-red-500 to-pink-600' :
                  option.id === 'operations' ? 'from-blue-500 to-cyan-600' :
                  option.id === 'suspension' ? 'from-red-500 to-orange-600' :
                  'from-emerald-500 to-teal-600'
                } transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
              </motion.button>
            );
          })}
        </div>

        {/* Future Features Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Home className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Coming Soon</p>
              <p className="text-sm text-blue-800">
                User roles, access permissions, activity logs, and more advanced admin controls.
              </p>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-sm font-medium text-gray-700">Loading {targetPage}...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

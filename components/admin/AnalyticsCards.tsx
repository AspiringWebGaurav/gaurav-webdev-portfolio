"use client";

import { useState, useEffect } from 'react';

interface AnalyticsData {
  totalVisitors: number;
  activeVisitors: number;
  bannedVisitors: number;
  pendingAppeals: number;
  todayVisitors: number;
  onlineVisitors: number;
  totalBans: number;
  recentActivity: number;
}

interface AnalyticsCardsProps {
  data: AnalyticsData;
  isLoading?: boolean;
}

export default function AnalyticsCards({ data, isLoading = false }: AnalyticsCardsProps) {
  const [animatedData, setAnimatedData] = useState<AnalyticsData>(data);

  useEffect(() => {
    // Animate numbers when data changes
    const animateNumbers = () => {
      const duration = 1000; // 1 second
      const steps = 30;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);

        setAnimatedData({
          totalVisitors: Math.round(animatedData.totalVisitors + (data.totalVisitors - animatedData.totalVisitors) * easeOutQuart),
          activeVisitors: Math.round(animatedData.activeVisitors + (data.activeVisitors - animatedData.activeVisitors) * easeOutQuart),
          bannedVisitors: Math.round(animatedData.bannedVisitors + (data.bannedVisitors - animatedData.bannedVisitors) * easeOutQuart),
          pendingAppeals: Math.round(animatedData.pendingAppeals + (data.pendingAppeals - animatedData.pendingAppeals) * easeOutQuart),
          todayVisitors: Math.round(animatedData.todayVisitors + (data.todayVisitors - animatedData.todayVisitors) * easeOutQuart),
          onlineVisitors: Math.round(animatedData.onlineVisitors + (data.onlineVisitors - animatedData.onlineVisitors) * easeOutQuart),
          totalBans: Math.round(animatedData.totalBans + (data.totalBans - animatedData.totalBans) * easeOutQuart),
          recentActivity: Math.round(animatedData.recentActivity + (data.recentActivity - animatedData.recentActivity) * easeOutQuart),
        });

        if (currentStep >= steps) {
          clearInterval(interval);
          setAnimatedData(data);
        }
      }, stepDuration);

      return () => clearInterval(interval);
    };

    if (!isLoading) {
      animateNumbers();
    }
  }, [data, isLoading]);

  const cards = [
    {
      title: "Total Visitors",
      value: animatedData.totalVisitors,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: "blue",
      gradient: "from-blue-500/20 to-blue-600/20",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      textColor: "text-blue-300"
    },
    {
      title: "Active Now",
      value: animatedData.onlineVisitors,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      ),
      color: "green",
      gradient: "from-green-500/20 to-green-600/20",
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
      textColor: "text-green-300",
      pulse: true
    },
    {
      title: "Today's Visitors",
      value: animatedData.todayVisitors,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: "purple",
      gradient: "from-purple-500/20 to-purple-600/20",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
      textColor: "text-purple-300"
    },
    {
      title: "Pending Appeals",
      value: animatedData.pendingAppeals,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "yellow",
      gradient: "from-yellow-500/20 to-yellow-600/20",
      iconBg: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
      textColor: "text-yellow-300",
      badge: animatedData.pendingAppeals > 0
    },
    {
      title: "Active Visitors",
      value: animatedData.activeVisitors,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "emerald",
      gradient: "from-emerald-500/20 to-emerald-600/20",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
      textColor: "text-emerald-300"
    },
    {
      title: "Banned Visitors",
      value: animatedData.bannedVisitors,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
      ),
      color: "red",
      gradient: "from-red-500/20 to-red-600/20",
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
      textColor: "text-red-300"
    },
    {
      title: "Total Bans",
      value: animatedData.totalBans,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "orange",
      gradient: "from-orange-500/20 to-orange-600/20",
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-400",
      textColor: "text-orange-300"
    },
    {
      title: "Recent Activity",
      value: animatedData.recentActivity,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: "indigo",
      gradient: "from-indigo-500/20 to-indigo-600/20",
      iconBg: "bg-indigo-500/20",
      iconColor: "text-indigo-400",
      textColor: "text-indigo-300"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className="relative bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 hover:scale-[1.02] group"
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          {/* Background gradient on hover */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
          
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.iconBg} rounded-full flex items-center justify-center ${card.pulse ? 'animate-pulse' : ''} transition-transform duration-300 group-hover:scale-110`}>
                <div className={card.iconColor}>
                  {card.icon}
                </div>
              </div>
              
              {card.badge && card.value > 0 && (
                <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce shadow-sm" />
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-slate-500 text-sm font-medium">{card.title}</p>
              <div className="flex items-baseline space-x-3">
                {isLoading ? (
                  <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
                ) : (
                  <p className="text-3xl font-bold text-slate-900 transition-colors duration-300">
                    {card.value.toLocaleString()}
                  </p>
                )}
                
                {/* Trend indicator */}
                <div className="flex items-center text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="font-medium">+12%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Subtle border accent on hover */}
          <div className={`absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-${card.color}-200 transition-all duration-300`} />
        </div>
      ))}
    </div>
  );
}

// Loading skeleton component
export function AnalyticsCardsLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-slate-200 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-16 bg-slate-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
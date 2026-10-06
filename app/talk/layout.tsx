import type { Metadata, Viewport } from "next";
import React from "react";
import { Geist, Geist_Mono } from "next/font/google";

const adminSans = Geist({
  variable: "--font-admin-sans",
  subsets: ["latin"],
  display: "swap",
});

const adminMono = Geist_Mono({
  variable: "--font-admin-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#FAFAFA",
};

export const metadata: Metadata = {
  title: "talk",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TalkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-portal="talk"
      className={`${adminSans.variable} ${adminMono.variable} font-admin-sans relative h-[100dvh] w-full bg-[#FAFAFA] dark:bg-[#07090E] text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200 selection:bg-[#7C3AED]/20 selection:text-[#7C3AED] overflow-hidden`}
    >
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){
            try {
              var p = new URLSearchParams(window.location.search);
              var u = p.get('theme');
              var t = (u === 'light' || u === 'dark') ? u : null;
              if (!t) {
                var ck = document.cookie.split(';');
                for (var i = 0; i < ck.length; i++) {
                  var c = ck[i].trim();
                  if (c.indexOf('theme=') === 0) {
                    var v = c.substring(6);
                    if (v === 'light' || v === 'dark') { t = v; break; }
                  }
                }
              }
              if (!t) {
                var st = localStorage.getItem('gaurav_theme_sync_storage');
                if (st) {
                  var parsed = JSON.parse(st);
                  if (parsed && (parsed.theme === 'light' || parsed.theme === 'dark')) {
                    t = parsed.theme;
                  }
                }
              }
              if (!t) {
                var saved = localStorage.getItem('talk_theme');
                if (saved === 'dark' || saved === 'light') { t = saved; }
              }
              if (!t) { t = 'dark'; }
              var el = document.documentElement;
              el.classList.remove('light', 'dark');
              el.classList.add(t);
              el.style.colorScheme = t;
            } catch(e) {}
          })();`,
        }}
      />
      {/* Background Architectural Dashed Vertical Guides (Shiro Style: 4px dash, 4px gap) */}
      <div className="fixed inset-0 pointer-events-none flex justify-center z-0">
        <div className="w-full max-w-[1700px] h-full relative px-4 sm:px-6 md:px-8">
          {/* Left Vertical Guide */}
          <div className="absolute left-4 sm:left-6 md:left-8 inset-y-0 w-px">
            <svg className="w-px h-full text-[#E2E8F0] dark:text-[#1E293B] overflow-visible">
              <line x1="0" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            </svg>
          </div>

          {/* Right Vertical Guide */}
          <div className="absolute right-4 sm:right-6 md:right-8 inset-y-0 w-px">
            <svg className="w-px h-full text-[#E2E8F0] dark:text-[#1E293B] overflow-visible">
              <line x1="0" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col h-full min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

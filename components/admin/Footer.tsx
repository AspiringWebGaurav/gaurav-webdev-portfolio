import React from "react";
import VersionWithChangelog from "./VersionWithChangelog";
import { Github, Linkedin, Shield, Zap } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-gray-200 bg-white backdrop-blur-lg">
      <div className="w-full px-6 py-3">
        {/* Desktop & Tablet Layout */}
        <div className="hidden sm:flex items-center justify-between w-full">
          {/* Left: Content with Icon */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                Made exclusively for Portfolio
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-100 text-purple-700">
                  PRIVATE
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">© {year} Portfolio — Personal use only</p>
            </div>
          </div>

          {/* Center: Enhanced Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-medium text-green-700">System Active</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Secure & Private</span>
            </div>
          </div>

          {/* Right: Version & Social with Enhanced Design */}
          <div className="flex items-center gap-4">
            {/* Version with Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200">
              <span className="text-xs font-medium text-gray-600">Version:</span>
              <VersionWithChangelog />
            </div>

            {/* Social Links with Enhanced Design */}
            <div className="flex items-center gap-1.5">
              <a
                href="https://github.com/AspiringWebGaurav"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-gray-100 hover:bg-gray-900 hover:text-white rounded-lg transition-all duration-200 border border-gray-200 group hover:scale-105"
                aria-label="GitHub Profile"
              >
                <Github className="w-4 h-4 text-gray-700 group-hover:text-white transition-colors" />
              </a>
              <a
                href="https://linkedin.com/in/your-profile"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200 border border-gray-200 group hover:scale-105"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="w-4 h-4 text-gray-700 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Clean & Minimal */}
        <div className="sm:hidden">
          {/* Single centered row with version */}
          <div className="flex flex-col items-center justify-center gap-2 py-1">
            {/* Version Badge - Center */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-linear-to-r from-gray-50 to-gray-100 border border-gray-200 shadow-sm">
              <span className="text-[10px] font-medium text-gray-500">Version</span>
              <VersionWithChangelog />
            </div>

            {/* Minimal copyright text */}
            <p className="text-[10px] text-gray-400">© {year} Portfolio • Private</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

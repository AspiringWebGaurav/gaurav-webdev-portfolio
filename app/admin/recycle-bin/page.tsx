"use client";

import React, { useState } from "react";
import Navbar from "@/components/admin/Navbar";
import Breadcrumb from "@/components/admin/Breadcrumb";
import Footer from "@/components/admin/Footer";
import RecycleBin from "@/components/admin/RecycleBin";
import VersionNotesModal from "@/components/admin/VersionNotesModal";

export default function RecycleBinPage() {
  const [showVersionNotes, setShowVersionNotes] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      <div className="shrink-0">
        <Navbar 
          onVersionNotesClick={() => setShowVersionNotes(true)}
        />
        <Breadcrumb activeTab="Recycle Bin" activeTabIcon="🗑️" />
      </div>

      {/* Main Content - Scrollable Recycle Bin Section */}
      <main className="flex-1 overflow-y-auto bg-gray-50 scrollbar-hide">
        <div className="max-w-7xl mx-auto p-6">
          <RecycleBin />
        </div>
      </main>

      <div className="shrink-0">
        <Footer />
      </div>

      {/* Version Notes Modal */}
      <VersionNotesModal 
        isOpen={showVersionNotes} 
        onClose={() => setShowVersionNotes(false)} 
      />

      {/* Hide scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  TECH_ICONS,
  TECH_ICON_CATEGORIES,
  TechIcon,
  searchIcons,
  getIconsByCategory,
  TechIconCategory,
} from "@/data/techIcons";
import { Search, X, Check, Upload } from "lucide-react";

interface IconPickerProps {
  selectedIcons: string[];
  onSelect: (iconUrl: string) => void;
  onRemove: (iconUrl: string) => void;
  maxIcons: number;
  onClose: () => void;
  onCustomUpload?: () => void;
}

export default function IconPicker({
  selectedIcons,
  onSelect,
  onRemove,
  maxIcons,
  onClose,
  onCustomUpload,
}: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    TechIconCategory | "All"
  >("All");

  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    let icons = TECH_ICONS;

    // Filter by category
    if (selectedCategory !== "All") {
      icons = getIconsByCategory(selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const searchResults = searchIcons(searchQuery);
      if (selectedCategory !== "All") {
        icons = searchResults.filter((icon) =>
          icons.some((i) => i.id === icon.id)
        );
      } else {
        icons = searchResults;
      }
    }

    return icons;
  }, [searchQuery, selectedCategory]);

  const isSelected = (iconUrl: string) => selectedIcons.includes(iconUrl);
  const canSelectMore = selectedIcons.length < maxIcons;

  const handleIconClick = (icon: TechIcon) => {
    if (isSelected(icon.url)) {
      onRemove(icon.url);
    } else if (canSelectMore) {
      onSelect(icon.url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Select Technology Icons
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedIcons.length}/{maxIcons} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search technologies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === "All"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {TECH_ICON_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Icons Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
            {/* Custom Upload Button */}
            {onCustomUpload && (
              <button
                onClick={onCustomUpload}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center p-2"
                title="Upload custom icon"
              >
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500 text-center">
                  Custom
                </span>
              </button>
            )}

            {/* Icon Grid */}
            {filteredIcons.map((icon) => {
              const selected = isSelected(icon.url);
              const disabled = !selected && !canSelectMore;

              return (
                <button
                  key={icon.id}
                  onClick={() => handleIconClick(icon)}
                  disabled={disabled}
                  className={`relative aspect-square rounded-lg border-2 transition-all group ${
                    selected
                      ? "border-blue-500 bg-blue-50"
                      : disabled
                      ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
                      : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                  }`}
                  title={icon.name}
                >
                  {/* Icon Image with nested backgrounds for visibility */}
                  <div className="w-full h-full p-2 flex items-center justify-center bg-black rounded-md">
                    <div className="w-full h-full bg-white/10 backdrop-blur-sm rounded-sm p-1.5 flex items-center justify-center relative">
                      <Image
                        src={icon.url}
                        alt={icon.name}
                        fill
                        sizes="80px"
                        className="object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] p-2"
                        loading="lazy"
                        unoptimized
                        onError={(e) => {
                          e.currentTarget.style.opacity = "0.3";
                          e.currentTarget.parentElement!.classList.add(
                            "border-2",
                            "border-red-500"
                          );
                        }}
                      />
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {selected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Icon Name Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {icon.name}
                  </div>
                </button>
              );
            })}
          </div>

          {/* No Results */}
          {filteredIcons.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No icons found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or category filter
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Click icons to select/deselect. Maximum {maxIcons} icons allowed.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

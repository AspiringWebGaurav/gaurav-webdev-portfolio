"use client";

import { useMemo } from 'react';

interface EmptyStateOptions<T> {
  data: T[];
  isLoading: boolean;
  isSearching: boolean;
  isFiltering: boolean;
  searchQuery?: string;
  activeFilters?: Record<string, any>;
  error?: Error | null;
}

export function useSmartEmptyState<T>({
  data,
  isLoading,
  isSearching,
  isFiltering,
  searchQuery,
  activeFilters,
  error
}: EmptyStateOptions<T>) {
  
  const emptyState = useMemo(() => {
    // Don't show empty state while loading
    if (isLoading || isSearching || isFiltering) {
      return { shouldShow: false, type: 'loading' as const };
    }

    // Show error state if there's an error
    if (error) {
      return { 
        shouldShow: true, 
        type: 'error' as const,
        title: 'Failed to load data',
        message: error.message,
        action: 'retry'
      };
    }

    // No data at all
    if (data.length === 0) {
      // Check if it's due to search/filters
      const hasActiveSearch = searchQuery && searchQuery.trim().length > 0;
      const hasActiveFilters = activeFilters && Object.values(activeFilters).some(v => 
        v !== null && v !== undefined && v !== '' && v !== 'all'
      );

      if (hasActiveSearch || hasActiveFilters) {
        return {
          shouldShow: true,
          type: 'no-results' as const,
          title: 'No results found',
          message: hasActiveSearch 
            ? `No results for "${searchQuery}". Try adjusting your search.`
            : 'No results match your current filters. Try adjusting your filters.',
          action: 'clear-filters'
        };
      }

      // Truly empty - no data exists
      return {
        shouldShow: true,
        type: 'empty' as const,
        title: 'No data available',
        message: 'There is no data to display at this time.',
        action: 'refresh'
      };
    }

    // Has data, don't show empty state
    return { shouldShow: false, type: 'has-data' as const };
  }, [data.length, isLoading, isSearching, isFiltering, searchQuery, activeFilters, error]);

  return emptyState;
}
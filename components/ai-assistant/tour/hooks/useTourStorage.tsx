import { useState, useEffect } from 'react';
import { TourPreferences, TourEvent, TourEventType } from '../types';

const TOUR_STORAGE_KEY = 'gaurav-ai-tour-preferences';
const TOUR_EVENTS_KEY = 'gaurav-ai-tour-events';

// Default tour preferences
const defaultPreferences: TourPreferences = {
  hasCompletedTour: false,
  hasSkippedTour: false,
  lastTourDate: '',
  tourCompletedAt: '',
  preferredSkipMode: false
};

export const useTourStorage = () => {
  const [preferences, setPreferences] = useState<TourPreferences>(defaultPreferences);
  const [events, setEvents] = useState<TourEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem(TOUR_STORAGE_KEY);
      const savedEvents = localStorage.getItem(TOUR_EVENTS_KEY);
      
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
      
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents);
        setEvents(Array.isArray(parsedEvents) ? parsedEvents : []);
      }
    } catch (error) {
      console.warn('Failed to load tour preferences:', error);
      setPreferences(defaultPreferences);
      setEvents([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = (newPreferences: Partial<TourPreferences>) => {
    try {
      const updated = { ...preferences, ...newPreferences };
      setPreferences(updated);
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save tour preferences:', error);
    }
  };

  // Log tour event
  const logEvent = (type: TourEventType, step?: number) => {
    try {
      const event: TourEvent = {
        type,
        step,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      
      const updatedEvents = [...events, event];
      setEvents(updatedEvents);
      
      // Keep only last 50 events to avoid storage bloat
      const trimmedEvents = updatedEvents.slice(-50);
      localStorage.setItem(TOUR_EVENTS_KEY, JSON.stringify(trimmedEvents));
    } catch (error) {
      console.warn('Failed to log tour event:', error);
    }
  };

  // Mark tour as completed
  const markTourCompleted = () => {
    const timestamp = new Date().toISOString();
    savePreferences({
      hasCompletedTour: true,
      tourCompletedAt: timestamp,
      lastTourDate: timestamp
    });
    logEvent('tour_completed');
  };

  // Mark tour as skipped
  const markTourSkipped = () => {
    const timestamp = new Date().toISOString();
    savePreferences({
      hasSkippedTour: true,
      lastTourDate: timestamp
    });
    logEvent('tour_skipped');
  };

  // Mark tour as started
  const markTourStarted = () => {
    const timestamp = new Date().toISOString();
    savePreferences({
      lastTourDate: timestamp
    });
    logEvent('tour_started');
  };

  // Reset tour preferences (for testing or user request)
  const resetTourPreferences = () => {
    try {
      setPreferences(defaultPreferences);
      setEvents([]);
      localStorage.removeItem(TOUR_STORAGE_KEY);
      localStorage.removeItem(TOUR_EVENTS_KEY);
    } catch (error) {
      console.warn('Failed to reset tour preferences:', error);
    }
  };

  // Check if user should see tour
  const shouldShowTour = (): boolean => {
    if (!isLoaded) return false;
    
    // Don't show if user completed or explicitly skipped
    if (preferences.hasCompletedTour || preferences.hasSkippedTour) {
      return false;
    }
    
    // Show tour for new users
    return true;
  };

  // Check if this is a returning user
  const isReturningUser = (): boolean => {
    return isLoaded && (preferences.hasCompletedTour || preferences.hasSkippedTour || !!preferences.lastTourDate);
  };

  // Get tour analytics data
  const getTourAnalytics = () => {
    const completionRate = events.filter(e => e.type === 'tour_completed').length;
    const skipRate = events.filter(e => e.type === 'tour_skipped').length;
    const startRate = events.filter(e => e.type === 'tour_started').length;
    
    return {
      totalSessions: startRate,
      completions: completionRate,
      skips: skipRate,
      completionRate: startRate > 0 ? (completionRate / startRate) * 100 : 0,
      skipRate: startRate > 0 ? (skipRate / startRate) * 100 : 0,
      events: events.slice(-10) // Last 10 events for debugging
    };
  };

  return {
    preferences,
    events,
    isLoaded,
    savePreferences,
    logEvent,
    markTourCompleted,
    markTourSkipped,
    markTourStarted,
    resetTourPreferences,
    shouldShowTour,
    isReturningUser,
    getTourAnalytics
  };
};

export default useTourStorage;
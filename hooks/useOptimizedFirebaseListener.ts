"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ListenerOptions<T> {
  collectionName: string;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  debounceMs?: number;
  maxRetries?: number;
  onError?: (error: Error) => void;
  transform?: (doc: any) => T;
}

export function useOptimizedFirebaseListener<T>(options: ListenerOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveSync, setIsLiveSync] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryCountRef = useRef(0);
  const lastUpdateRef = useRef<number>(0);
  const dataHashRef = useRef<string>('');
  
  // Debounced data processor with smart diffing
  const processData = useCallback((snapshot: any) => {
    try {
      // Check if snapshot exists and has docs
      if (!snapshot || !snapshot.docs) {
        console.warn(`Invalid snapshot for ${options.collectionName}:`, snapshot);
        setIsLoading(false);
        setIsLiveSync(false);
        return;
      }

      const newData = snapshot.docs.map((doc: any) => {
        const docData = doc.data();
        return options.transform ? options.transform({ id: doc.id, ...docData }) : {
          id: doc.id,
          ...docData
        };
      });
      
      // Smart diffing - only update if data actually changed
      const newDataHash = JSON.stringify(newData);
      const isForceRefresh = dataHashRef.current === '';
      
      if (dataHashRef.current !== newDataHash || isForceRefresh) {
        if (isForceRefresh) {
          console.log(`🔥 Force refresh: ${options.collectionName} (${newData.length} items) - bypassing cache`);
        } else {
          console.log(`📡 Data updated: ${options.collectionName} (${newData.length} items)`);
        }
        setData(newData);
        dataHashRef.current = newDataHash;
      } else {
        console.log(`⚡ No changes detected for ${options.collectionName} (${newData.length} items)`);
      }
      
      setIsLoading(false);
      setIsLiveSync(false);
      setError(null);
      retryCountRef.current = 0;
      lastUpdateRef.current = Date.now();
      
    } catch (err) {
      console.error(`Error processing ${options.collectionName} data:`, err);
      setError(err as Error);
      setIsLoading(false);
      setIsLiveSync(false);
      // Don't call onError during render - it causes React state update errors
      setTimeout(() => {
        options.onError?.(err as Error);
      }, 0);
    }
  }, [options]);
  
  // Debounce the data processing to prevent rapid updates
  const debouncedProcessData = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (snapshot: any) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          processData(snapshot);
        }, options.debounceMs || 300);
      };
    })(),
    [processData, options.debounceMs]
  );
  
  const startListener = useCallback(() => {
    if (unsubscribeRef.current) {
      console.log(`🔄 Restarting listener for ${options.collectionName}`);
      unsubscribeRef.current();
    }
    
    try {
      // Check if Firebase is available
      if (!db) {
        console.error('Firebase database not available');
        setError(new Error('Firebase database not available'));
        setIsLoading(false);
        return;
      }

      let firestoreQuery = collection(db as any, options.collectionName);
      
      if (options.orderByField) {
        firestoreQuery = query(
          firestoreQuery,
          orderBy(options.orderByField, options.orderDirection || 'desc')
        ) as any;
      }
      
      const unsubscribe = onSnapshot(
        firestoreQuery,
        (snapshot) => {
          // Only process if not from cache or if it's the initial load
          if (!snapshot || snapshot.metadata.fromCache && data.length > 0) {
            return;
          }
          
          setIsLiveSync(true);
          debouncedProcessData(snapshot);
        },
        (error) => {
          console.error(`❌ ${options.collectionName} listener error:`, error);
          setError(error);
          setIsLoading(false);
          setIsLiveSync(false);
          
          // Retry logic with exponential backoff
          if (retryCountRef.current < (options.maxRetries || 3)) {
            retryCountRef.current++;
            const retryDelay = Math.pow(2, retryCountRef.current) * 1000;
            
            console.log(`🔄 Retrying ${options.collectionName} listener in ${retryDelay}ms (attempt ${retryCountRef.current})`);
            
            setTimeout(() => {
              startListener();
            }, retryDelay);
          } else {
            // Don't call onError during render - it causes React state update errors
            setTimeout(() => {
              options.onError?.(error);
            }, 0);
          }
        }
      );
      
      unsubscribeRef.current = unsubscribe;
      console.log(`✅ Started optimized listener for ${options.collectionName}`);
      
    } catch (err) {
      console.error(`Failed to start ${options.collectionName} listener:`, err);
      setError(err as Error);
      setIsLoading(false);
      // Don't call onError during render
      setTimeout(() => {
        options.onError?.(err as Error);
      }, 0);
    }
  }, [options, debouncedProcessData, data.length]);
  
  const stopListener = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      console.log(`🛑 Stopped listener for ${options.collectionName}`);
    }
  }, [options.collectionName]);
  
  const refresh = useCallback((forceUpdate = false) => {
    console.log(`🔄 Manual refresh triggered for ${options.collectionName}`, { forceUpdate });
    setIsLoading(true);
    if (forceUpdate) {
      // Reset hash to force data update even if content is the same
      dataHashRef.current = '';
      console.log(`🔥 Force refresh: Reset data hash for ${options.collectionName}`);
    }
    startListener();
  }, [startListener, options.collectionName]);
  
  // Auto-start listener
  useEffect(() => {
    startListener();
    return stopListener;
  }, [startListener, stopListener]);
  
  return {
    data,
    isLoading,
    isLiveSync,
    error,
    refresh,
    stopListener,
    lastUpdate: lastUpdateRef.current
  };
}
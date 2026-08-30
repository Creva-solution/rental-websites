'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import CrevaWebzLoader from '@/components/CrevaWebzLoader';

interface LoadingContextType {
  showGlobalLoader: () => void;
  hideGlobalLoader: () => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showComponent, setShowComponent] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShowComponent(true);
    }
  }, [isLoading]);

  const showGlobalLoader = () => setIsLoading(true);
  const hideGlobalLoader = () => setIsLoading(false);

  // Expose triggers globally on the window object
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).showGlobalLoader = showGlobalLoader;
      (window as any).hideGlobalLoader = hideGlobalLoader;
    }
    return () => {
      if (typeof window !== 'undefined') {
        try {
          delete (window as any).showGlobalLoader;
          delete (window as any).hideGlobalLoader;
        } catch (e) {
          (window as any).showGlobalLoader = undefined;
          (window as any).hideGlobalLoader = undefined;
        }
      }
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ showGlobalLoader, hideGlobalLoader, isLoading }}>
      {children}
      {showComponent && (
        <CrevaWebzLoader
          isAppReady={!isLoading}
          onFadeOutComplete={() => setShowComponent(false)}
        />
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

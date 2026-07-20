'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type UIMode = 'tactical' | 'classic';

interface UIModeContextType {
  mode: UIMode;
  setMode: (mode: UIMode) => void;
  toggle: () => void;
}

const UIModeContext = createContext<UIModeContextType | undefined>(undefined);

export function UIModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<UIMode>('tactical');

  useEffect(() => {
    const saved = localStorage.getItem('bandes_ui_mode') as UIMode | null;
    if (saved === 'classic' || saved === 'tactical') setMode(saved);
  }, []);

  const toggle = useCallback(() => {
    setMode(prev => {
      const next: UIMode = prev === 'tactical' ? 'classic' : 'tactical';
      localStorage.setItem('bandes_ui_mode', next);
      return next;
    });
  }, []);

  return (
    <UIModeContext.Provider value={{ mode, setMode, toggle }}>
      {children}
    </UIModeContext.Provider>
  );
}

export function useUIMode() {
  const ctx = useContext(UIModeContext);
  if (!ctx) throw new Error('useUIMode must be used within UIModeProvider');
  return ctx;
}

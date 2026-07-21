'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoldTraceabilityProvider } from '../src/context/GoldTraceabilityContext';
import { Sidebar } from '../src/components/Sidebar';
import { WeightToggle } from '../src/components/WeightToggle';
import { Calendar } from 'lucide-react';
import './globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: process.env.NODE_ENV === 'development' ? 0 : 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 10_000,
      gcTime: 5 * 60 * 1000,
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isV2 = pathname.startsWith('/v2');
  const activeTab = pathname.replace('/', '').replace('v2/', '') || 'dashboard';
  const [systemTime, setSystemTime] = useState<string>('');

  const userName = 'Administrador';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(
        now.toLocaleTimeString(undefined, { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: false 
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // If v2, render minimal wrapper — v2/layout.tsx handles its own chrome
  if (isV2) {
    return (
      <html lang="es">
        <head>
          <title>Control Mining</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body>
          <QueryClientProvider client={queryClient}>
            <GoldTraceabilityProvider>
              {children}
            </GoldTraceabilityProvider>
          </QueryClientProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="es">
      <head>
        <title>Control Mining</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <GoldTraceabilityProvider>
            <div id="app-root" className="min-h-screen bg-[#141414] text-[#E5E5E5] font-sans flex overflow-hidden">
              
              <Sidebar />

              <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden lg:ml-16">
                
                {activeTab === 'dashboard' && (
                  <header className="h-20 border-b border-neutral-800/40 bg-[#121212]/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-30">
                    
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex flex-col">
                        <span className="text-sm font-semibold text-[#D5B042] uppercase tracking-wider flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D5B042] animate-pulse"></span>
                          Bienvenido, {userName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          localStorage.setItem('bandes_ui_mode', 'tactical');
                          router.push('/v2/dashboard');
                        }}
                        className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border border-[#00E5FF]/40 text-[#00E5FF] bg-black hover:bg-[#00E5FF]/10 active:scale-95 transition-all cursor-pointer"
                      >
                        {'>'} MODO TÁCTICO
                      </button>

                      <div className="hidden lg:flex items-center gap-2 bg-black border border-neutral-800/40 px-3 py-1.5 rounded-full font-mono text-[11px] text-[#8C8C8C]">
                        <Calendar className="w-3.5 h-3.5 text-[#D5B042]" />
                        <span>2026-07-16</span>
                      </div>

                      <WeightToggle />

                      <div className="flex items-center gap-2.5 bg-black border border-neutral-800/40 pl-2.5 pr-4 py-1 rounded-full shadow-inner">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#8C6D1F] to-[#D5B042] flex items-center justify-center text-black font-bold text-xs">
                          {userName.charAt(0)}
                        </div>
                        <div className="hidden sm:flex flex-col text-left">
                          <span className="text-[11px] font-bold text-[#E5E5E5] leading-none">{userName}</span>
                          <span className="text-[9px] text-[#8C8C8C] font-mono mt-0.5 leading-none">Owner</span>
                        </div>
                      </div>
                    </div>
                  </header>
                )}

                <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#141414] relative">
                  <div className="max-w-7xl mx-auto space-y-8">
                    {children}
                  </div>
                </main>

              </div>
            </div>
          </GoldTraceabilityProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
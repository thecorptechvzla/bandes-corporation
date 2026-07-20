'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, ClipboardList, Flame,
  ArrowLeftRight, FileText, FolderUp, Menu, Coins, LogOut,
} from 'lucide-react';
import { useUIMode } from '@/context/UIModeContext';

const menuItems = [
  { id: 'dashboard', name: 'DASHBOARD', icon: LayoutDashboard },
  { id: 'clientes', name: 'PROVEEDORES', icon: Users },
  { id: 'ingresos', name: 'INGRESOS', icon: ClipboardList },
  { id: 'procesos', name: 'PROCESOS', icon: Flame },
  { id: 'egresos', name: 'EGRESOS', icon: ArrowLeftRight },
  { id: 'packing', name: 'PACKING', icon: FolderUp },
  { id: 'reportes', name: 'REPORTES', icon: FileText },
];

export function TacticalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggle } = useUIMode();
  const activeTab = pathname.split('/').pop() || 'dashboard';

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed bottom-6 right-6 z-50 p-3 bg-[var(--tac-bg-tertiary)] border border-[var(--tac-border)] text-[var(--tac-accent-cyan)] active:scale-95 transition-all"
        title="Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex flex-col w-14 lg:w-14 lg:hover:w-56 group bg-[var(--tac-bg-primary)] border-r border-[var(--tac-border)] overflow-hidden transition-all duration-200">
        {/* Logo */}
        <div className="flex items-center justify-center h-14 shrink-0 border-b border-[var(--tac-border)]">
          <Coins className="w-5 h-5 text-[var(--tac-accent-cyan)] shrink-0" />
          <span className="ml-2 text-xs font-mono font-bold text-[var(--tac-text-primary)] tracking-widest whitespace-nowrap opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
            BANDES
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-0.5 px-1.5 py-3 overflow-y-auto">
          {menuItems.map(item => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            const href = `/v2/${item.id === 'dashboard' ? 'dashboard' : item.id}`;
            return (
              <Link
                key={item.id}
                href={href}
                className={`
                  relative flex items-center gap-2.5 px-2 py-2.5 text-[10px] font-mono font-bold
                  tracking-wider transition-all duration-150 active:scale-95
                  ${isActive
                    ? 'text-[var(--tac-accent-cyan)] bg-[var(--tac-bg-tertiary)] border-l-2 border-[var(--tac-accent-cyan)]'
                    : 'text-[var(--tac-text-dim)] hover:text-[var(--tac-text-primary)] hover:bg-[var(--tac-bg-tertiary)]/50 border-l-2 border-transparent'
                  }
                `}
              >
                <IconComponent className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                  {item.name}
                </span>
                {isActive && (
                  <span className="absolute right-1 w-1 h-1 rounded-full bg-[var(--tac-accent-cyan)] animate-pulse opacity-0 lg:group-hover:opacity-100" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-1.5 py-3 border-t border-[var(--tac-border)] space-y-1">
          <button
            onClick={() => {
              localStorage.setItem('bandes_ui_mode', 'classic');
              router.push('/dashboard');
            }}
            className="flex items-center gap-2.5 w-full px-2 py-2 text-[9px] font-mono text-[var(--tac-text-dim)] hover:text-[var(--tac-accent-amber)] active:scale-95 transition-all"
            title="Modo Clásico"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
              CLÁSICO
            </span>
          </button>
          <button className="flex items-center gap-2.5 w-full px-2 py-2 text-[9px] font-mono text-[var(--tac-text-dim)] hover:text-[var(--tac-accent-red)] active:scale-95 transition-all">
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
              SALIR
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

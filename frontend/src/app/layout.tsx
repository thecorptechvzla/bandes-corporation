import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Gold Command Center',
  description: 'Tactical Gold Inventory System',
};

const navItems = [
  { href: '/dashboard', label: 'DASHBOARD' },
  { href: '/ingreso', label: 'INGRESO' },
  { href: '/egreso', label: 'EGRESO' },
  { href: '/reportes', label: 'REPORTES' },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full bg-hud-dark text-hud-text font-mono antialiased">
        <div className="flex h-screen">
          <aside className="w-56 border-r border-hud-border bg-hud-surface flex flex-col">
            <div className="p-4 border-b border-hud-border">
              <h1 className="text-hud-gold text-sm font-bold tracking-wider">
                GOLD CMD CTR
              </h1>
              <p className="text-hud-muted text-[10px] mt-1">v1.0 // SYSTEM</p>
            </div>
            <nav className="flex-1 p-2 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 text-xs tracking-wider text-hud-muted hover:text-hud-gold hover:bg-hud-dark/50 rounded transition-colors"
                >
                  [{item.label}]
                </a>
              ))}
            </nav>
            <div className="p-3 border-t border-hud-border">
              <p className="text-[10px] text-hud-muted tracking-wider">
                STATUS: OPERATIONAL
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-hud-success animate-pulse" />
                <span className="text-[10px] text-hud-success">DB CONNECTED</span>
              </div>
            </div>
          </aside>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}

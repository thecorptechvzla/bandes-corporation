import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { NavSidebar } from '@/components/layout/nav-sidebar';

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Gold Command Center',
  description: 'Tactical Gold Inventory System',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full bg-hud-dark text-hud-text font-mono antialiased">
        <div id="scanlines-overlay" />
        <div className="flex h-screen">
          <NavSidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}

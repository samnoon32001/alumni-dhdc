import type { Metadata, Viewport } from 'next';
import './globals.css';
import React from 'react';

export const viewport: Viewport = {
  themeColor: '#117980',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "FALAH DHDC | Alumni of Darul Hidaya Da'wa College, Manoor",
  description:
    "Official Alumni Network Portal of Darul Hidaya Da'wa College, Manoor (FALAH DHDC). Connect with classmates, explore the alumni directory, track IFLAH Fund collection, and receive official circulars.",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-[#117980] selection:text-white">
        {children}
      </body>
    </html>
  );
}

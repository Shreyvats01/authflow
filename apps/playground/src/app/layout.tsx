'use client';

import React from 'react';
import { BolkAuthProvider } from '@bolkauth/react';
import './globals.css';
import { cn } from "@/lib/utils";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-sans">
      <body className="m-0 font-sans bg-slate-900 text-slate-50 antialiased min-h-screen">
        <BolkAuthProvider config={{ baseURL: '/api/auth' }}>
          {children}
        </BolkAuthProvider>
      </body>
    </html>
  );
}

'use client';

import React from 'react';
import { BolkAuthProvider } from '@bolkauth/react';
import './globals.css';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className="m-0 font-sans bg-slate-900 text-slate-50 antialiased min-h-screen">
        <BolkAuthProvider config={{ baseURL: '/api/auth' }}>
          {children}
        </BolkAuthProvider>
      </body>
    </html>
  );
}

import { RootProvider } from 'fumadocs-ui/provider';
import { DocsLayout } from 'fumadocs-ui/layout';
import { source } from '@/lib/source';
import 'fumadocs-ui/style.css';
import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: {
    default: 'BolkAuth Docs',
    template: '%s — BolkAuth',
  },
  description:
    'High-performance, self-hosted, type-safe authentication for TypeScript & Next.js.',
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen font-sans">
        <RootProvider>
          <DocsLayout
            tree={source.pageTree}
            nav={{
              title: (
                <span className="flex items-center gap-2 font-bold text-base">
                  <span className="text-xl">⚡</span> BolkAuth
                </span>
              ),
            }}
            links={[
              {
                text: 'GitHub',
                url: 'https://github.com/Shreyvats01/bolkauth',
                external: true,
              },
              {
                text: 'npm',
                url: 'https://www.npmjs.com/package/@bolkauth/core',
                external: true,
              },
            ]}
          >
            {children}
          </DocsLayout>
        </RootProvider>
      </body>
    </html>
  );
}

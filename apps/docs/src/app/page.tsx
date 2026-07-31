import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex-1 bg-slate-950 text-slate-50 flex flex-col items-center justify-between selection:bg-blue-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-3xl opacity-70" />
      </div>

      {/* Header Bar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-blue-500/30">
            B
          </div>
          <span className="font-bold text-xl tracking-tight text-white">BolkAuth</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
            v0.1.0 Open Source
          </span>
        </div>

        <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link href="/docs" className="hover:text-white transition-colors">
            Documentation
          </Link>
          <a
            href="https://github.com/Shreyvats01/authflow"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-4xl mx-auto px-6 pt-16 pb-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 mb-8 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Clerk-like DX &bull; Fully Self-Hosted &bull; Zero Lock-in
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15] mb-6">
          High-performance, type-safe <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">authentication for TypeScript</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10">
          BolkAuth gives you headless React hooks, Next.js App Router & Edge Middleware integrations, and ORM adapters while keeping full ownership of your database.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <Link
            href="/docs"
            className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
          >
            Get Started Docs &rarr;
          </Link>
          <a
            href="https://github.com/Shreyvats01/authflow"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold border border-slate-800 transition-all"
          >
            GitHub Repository
          </a>
        </div>

        {/* Quick CLI Banner */}
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3 flex items-center justify-between text-left font-mono text-xs text-slate-300 shadow-inner">
          <span className="text-slate-500">$</span>
          <span className="flex-1 ml-2 text-slate-200">npx @bolkauth/cli init</span>
          <span className="text-blue-400 text-[11px] font-sans font-medium px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
            Interactive CLI
          </span>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="w-full max-w-6xl mx-auto px-6 py-16 border-t border-slate-800/60">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-12">
          Everything you need for modern app authentication
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg mb-4">
              🔐
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Password Auth</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Salted PBKDF2 password hashing powered by standard Web Crypto APIs with zero native C++ dependencies.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg mb-4">
              🌐
            </div>
            <h3 className="text-lg font-bold text-white mb-2">OAuth 2.0 Social Login</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Built-in GitHub and Google OAuth 2.0 integration with automatic account linking and state CSRF cookie protection.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg mb-4">
              🔗
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Magic Links</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Passwordless authentication via single-use SHA-256 hashed verification tokens with configurable expiration.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
              🧭
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Onboarding State Machine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Multi-step onboarding engine tracking user progress, saving metadata, and enforcing automatic access redirects.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg mb-4">
              🗄️
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Drizzle & Prisma Adapters</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              First-class ORM adapters for Drizzle and Prisma with pre-built database table definitions and schema exports.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg mb-4">
              ⚡
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Next.js & React Hooks</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Next.js 14 App Router handlers, Edge Middleware protection, and headless React hooks (`useSignIn`, `useOAuth`, `useUser`).
            </p>
          </div>
        </div>
      </section>

      {/* Code Snippet */}
      <section className="w-full max-w-4xl mx-auto px-6 py-16">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="font-mono text-xs text-slate-400">lib/auth.ts</span>
          </div>

          <div className="p-6 overflow-x-auto font-mono text-sm leading-relaxed text-slate-300">
            <pre>
              <code>{`import { createBolkAuth } from "@bolkauth/core";
import { createDrizzleAdapter } from "@bolkauth/adapter-drizzle";
import { db } from "./db";

export const auth = createBolkAuth({
  adapter: createDrizzleAdapter(db),
  secret: process.env.BOLKAUTH_SECRET!,
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  onboarding: { enabled: true, requiredForAccess: true },
});`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>Released under the MIT License. &copy; BolkAuth</p>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="hover:text-slate-300 transition-colors">
              Docs
            </Link>
            <a
              href="https://github.com/Shreyvats01/authflow"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/org/bolkauth"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              npm
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

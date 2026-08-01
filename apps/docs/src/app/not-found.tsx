import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-fd-background text-fd-foreground p-8 text-center">
      <h1 className="text-6xl font-extrabold text-fd-primary mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-fd-muted-foreground max-w-md mb-8">
        The documentation page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-fd-primary hover:opacity-90 text-fd-primary-foreground font-semibold transition-all"
      >
        Back to Documentation →
      </Link>
    </div>
  );
}

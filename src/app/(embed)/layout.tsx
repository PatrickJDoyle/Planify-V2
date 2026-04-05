/** Public embed surface: avoid SSG so production build does not require Clerk at compile time. */
export const dynamic = 'force-dynamic';

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-transparent antialiased">{children}</div>;
}

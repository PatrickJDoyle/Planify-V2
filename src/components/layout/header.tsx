'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Moon, Sun, PanelLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/lib/stores/ui-store';

const routeLabels: Record<string, string> = {
  '/dashboard': 'Search',
  '/saved': 'Saved Projects',
  '/alerts': 'Alerts',
  '/alerts/inbox': 'Inbox',
  '/reports/pre-planning': 'Pre-Planning Report',
  '/heatmap': 'Heatmap',
  '/billing': 'Billing',
  '/settings': 'Settings',
};

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  // Check for application detail page
  const appMatch = pathname.match(/^\/applications\/(\d+)/);
  if (appMatch) {
    return [
      { label: 'Search', href: '/dashboard' },
      { label: `Application ${appMatch[1]}` },
    ];
  }

  const label = routeLabels[pathname];
  if (label) return [{ label }];

  // Fallback: use pathname segments
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    href: i < segments.length - 1 ? '/' + segments.slice(0, i + 1).join('/') : undefined,
  }));
}

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useUIStore();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggleSidebar}
        className="lg:hidden"
      >
        <PanelLeft className="h-4 w-4" />
      </Button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <span className="text-foreground-subtle">/</span>
            )}
            {crumb.href ? (
              <a
                href={crumb.href}
                className="text-foreground-muted transition-colors hover:text-foreground"
              >
                {crumb.label}
              </a>
            ) : (
              <span className="font-medium text-foreground">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-foreground-muted hover:text-foreground"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}

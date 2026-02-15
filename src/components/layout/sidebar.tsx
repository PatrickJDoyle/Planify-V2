'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Star,
  Bell,
  Inbox,
  BarChart3,
  Map,
  MessageSquare,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/lib/stores/ui-store';
import { useUnreadCount } from '@/lib/queries/alerts';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const baseMainNav: Omit<NavItem, 'badge'>[] = [
  { label: 'Search', href: '/dashboard', icon: Search },
  { label: 'Saved Projects', href: '/saved', icon: Star },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'Inbox', href: '/alerts/inbox', icon: Inbox },
  { label: 'Reports', href: '/reports/pre-planning', icon: BarChart3 },
  { label: 'Heatmap', href: '/heatmap', icon: Map },
];

const secondaryNav: NavItem[] = [
  { label: 'Feedback', href: '#feedback', icon: MessageSquare },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { data: unreadCount } = useUnreadCount();

  const mainNav: NavItem[] = baseMainNav.map((item) => ({
    ...item,
    badge: item.href === '/alerts/inbox' ? unreadCount : undefined,
  }));

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`
    : 'U';

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar-bg transition-all duration-200',
        sidebarCollapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex h-14 items-center border-b border-sidebar-border px-4',
        sidebarCollapsed && 'justify-center px-0',
      )}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            P
          </div>
          {!sidebarCollapsed && (
            <span className="text-lg font-semibold text-white">Planify</span>
          )}
        </Link>
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="flex flex-col gap-0.5 px-2">
          {mainNav.map((item) => {
            const active = isActive(item.href);
            const content = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-500/10 text-white'
                    : 'text-sidebar-fg hover:bg-white/5 hover:text-white',
                  sidebarCollapsed && 'justify-center px-0',
                )}
              >
                <div className="relative">
                  <item.icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0',
                      active ? 'text-brand-400' : 'text-sidebar-muted group-hover:text-sidebar-fg',
                    )}
                  />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <>
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {active && (
                  <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-500" />
                )}
              </Link>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{content}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return content;
          })}
        </nav>
      </ScrollArea>

      {/* Secondary Nav + User */}
      <div className="mt-auto border-t border-sidebar-border">
        <nav className="flex flex-col gap-0.5 px-2 py-2">
          {secondaryNav.map((item) => {
            const content = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-fg transition-colors hover:bg-white/5 hover:text-white',
                  sidebarCollapsed && 'justify-center px-0',
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0 text-sidebar-muted group-hover:text-sidebar-fg" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{content}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return content;
          })}
        </nav>

        <Separator className="bg-sidebar-border" />

        {/* User Footer */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-3',
          sidebarCollapsed && 'justify-center px-2',
        )}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? 'User'} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-white">
                {user?.fullName ?? 'User'}
              </p>
              <p className="truncate text-xs text-sidebar-muted">
                {user?.primaryEmailAddress?.emailAddress ?? ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggleSidebar}
        className="absolute -right-3 top-[18px] z-50 hidden h-6 w-6 rounded-full border border-border bg-surface text-foreground-muted shadow-sm hover:bg-background-subtle hover:text-foreground lg:flex"
      >
        {sidebarCollapsed ? (
          <PanelLeft className="h-3.5 w-3.5" />
        ) : (
          <PanelLeftClose className="h-3.5 w-3.5" />
        )}
      </Button>
    </aside>
  );
}

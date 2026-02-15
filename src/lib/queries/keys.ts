import type { DashboardFilters } from '@/lib/types/filters';
import type { InboxFilters } from '@/lib/types/alerts';
import type { MapBounds } from '@/lib/types/api';

export const queryKeys = {
  applications: {
    all: ['applications'] as const,
    list: (filters: DashboardFilters, page: number, pageSize: number) =>
      ['applications', 'list', { filters, page, pageSize }] as const,
    detail: (id: number) => ['applications', 'detail', id] as const,
    map: (bounds: MapBounds) => ['applications', 'map', bounds] as const,
    related: (id: number) => ['applications', 'related', id] as const,
  },
  favorites: {
    all: ['favorites'] as const,
    list: (page: number) => ['favorites', 'list', page] as const,
    check: (appId: number) => ['favorites', 'check', appId] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    inbox: (filters: InboxFilters) =>
      ['alerts', 'inbox', filters] as const,
    unreadCount: ['alerts', 'unread-count'] as const,
  },
  bcms: {
    byApplication: (appId: number) => ['bcms', 'application', appId] as const,
    nearby: (appId: number) => ['bcms', 'nearby', appId] as const,
  },
  property: {
    nearbySales: (lat: number, lng: number) =>
      ['property', 'nearby-sales', { lat, lng }] as const,
    history: (appId: number) => ['property', 'history', appId] as const,
  },
  zoning: {
    atPoint: (lat: number, lng: number) =>
      ['zoning', 'point', { lat, lng }] as const,
  },
  user: {
    profile: ['user', 'profile'] as const,
  },
} as const;

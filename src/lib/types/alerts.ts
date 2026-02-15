export type AlertScope = 'radius' | 'authority' | 'nationwide';
export type AlertType = 'new_application' | 'status_update';

export interface Alert {
  id: number;
  alertType: AlertType;
  scope?: AlertScope;
  planningAuthority?: string;
  applicationId?: number;
  radius?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  keywordIds?: number[];
  createdAt?: string;
}

export interface InboxAlert {
  id: number;
  applicationId: number;
  ApplicationNumber: string;
  DevelopmentAddress: string;
  ApplicationStatus: string;
  alertScope: AlertScope;
  planningAuthority: string | null;
  matchedKeywords: string[];
  distance: number;
  read: boolean;
  starred: boolean;
  archived: boolean;
  sentAt: string;
  applications: {
    DevelopmentDescription: string;
    Decision: string | null;
    DecisionDate: string | null;
  };
}

export interface InboxStats {
  total: number;
  unread: number;
  starred: number;
  archived: number;
  byScope: {
    radius: number;
    authority: number;
    nationwide: number;
  };
  byAuthority: Array<{ authority: string; count: number }>;
  byKeyword: Array<{ keyword: string; count: number }>;
}

export interface InboxFilters {
  page?: number;
  pageSize?: number;
  scope?: AlertScope | '';
  planningAuthority?: string;
  keywords?: string[];
  read?: boolean;
  starred?: boolean;
  archived?: boolean;
  sortBy?: 'date' | 'distance';
  sortOrder?: 'asc' | 'desc';
}

export interface InboxResponse {
  alerts: InboxAlert[];
  totalPages: number;
}

export type BulkAction = 'read' | 'unread' | 'star' | 'unstar' | 'archive' | 'unarchive';

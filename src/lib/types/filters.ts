import type { Application } from './application';

export type SortOption =
  | 'received_newest'
  | 'decision_due_soonest'
  | 'decision_made_newest'
  | 'distance_nearest'
  | 'distance_farthest';

export type SubmissionDeadlineRange = 'all' | '7' | '14' | '21' | '28' | '35';

export interface DashboardFilters {
  planningAuthority?: string;
  size?: string;
  sector?: string;
  applicationType?: string;
  submissionDeadline?: SubmissionDeadlineRange;
  decision?: string;
  applicationNumber?: string;
  sortBy?: SortOption;
  latitude?: string;
  longitude?: string;
  radius?: number | string;
  receivedDateFrom?: Date;
  receivedDateTo?: Date;
  descriptionSearch?: string;
  developmentDescription?: string;
  [key: string]: unknown;
}

export interface FilterChangePayload {
  searchMode: 'address' | 'authority';
  filters: DashboardFilters;
  filteredData?: Application[];
  totalResults?: number;
  useServerFilter: boolean;
  developmentDescription?: string;
}

export type ViewMode = 'table' | 'grid' | 'map' | 'statistics';

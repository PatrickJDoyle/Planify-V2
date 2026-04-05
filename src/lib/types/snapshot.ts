export interface SnapshotPolicy {
  reference: string;
  title: string;
  relevance_score: number;
  excerpt: string;
}

export interface SnapshotRateLimit {
  remaining: number;
  reset_at: string;
  used: number;
}

export interface SnapshotResult {
  snapshot_id: string;
  verdict: string;
  confidence: 'high' | 'medium' | 'low';
  council: string;
  council_display_name: string;
  policies: SnapshotPolicy[];
  approval_rate: number | null;
  sample_size: number;
  rate_limit: SnapshotRateLimit;
}

export interface SnapshotRateLimitError {
  error: 'rate_limit_exceeded';
  message: string;
  rate_limit: SnapshotRateLimit;
  upsell: {
    headline: string;
    cta_label: string;
    cta_url: string;
  };
}

export interface SnapshotValidationError {
  error: 'unresolvable_address' | 'country_not_supported' | 'no_regulations_found';
  message: string;
  supported_councils?: string[];
}

export interface SnapshotRequest {
  address: string;
  development_type: string;
}

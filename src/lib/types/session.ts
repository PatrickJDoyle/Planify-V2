// ─── Session Status ───────────────────────────────────────────────────────────

export type SessionStatus =
  | 'created'
  | 'intake_processing'
  | 'research_running'
  | 'research_complete'
  | 'failed';

// ─── Sub-Agent Result Types ───────────────────────────────────────────────────

export interface RegulationChunk {
  id: string;
  council_id: string;
  development_type: string;
  title: string;
  reference: string;
  excerpt: string;
  relevance_score: number;
  source_url?: string;
}

export interface PrecedentStats {
  approval_rate: number | null;
  sample_size: number;
  common_conditions: string[];
  common_refusal_reasons: string[];
}

export interface WebSource {
  title: string;
  url: string;
  excerpt: string;
  published_at?: string;
}

export interface WebResearchResult {
  sources: WebSource[];
  supplementary_context: string;
}

export interface SiteAnalysis {
  lat: number;
  lng: number;
  zoning_class: string;
  site_area_estimate?: number;
  constraints: string[];
}

export type SubAgentStatus = 'success' | 'timeout' | 'error';

export interface SubAgentOutcome<T> {
  status: SubAgentStatus;
  data?: T;
  partial?: boolean;
  error?: string;
}

// ─── Research Results ─────────────────────────────────────────────────────────

export interface ResearchResults {
  regulations: SubAgentOutcome<RegulationChunk[]>;
  precedent: SubAgentOutcome<PrecedentStats>;
  web: SubAgentOutcome<WebResearchResult>;
  site: SubAgentOutcome<SiteAnalysis>;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface ResearchSession {
  id: string;
  address: string;
  council_id: string;
  development_type: string;
  description?: string;
  status: SessionStatus;
  intake_data?: {
    council_id: string;
    lat?: number;
    lng?: number;
    zoning_class?: string;
  };
  research_results?: ResearchResults;
  is_partial: boolean;
  created_at: string;
  expires_at: string;
}

// ─── Request / Response ───────────────────────────────────────────────────────

export interface CreateSessionRequest {
  address: string;
  development_type: string;
  description?: string;
}

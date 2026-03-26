import { apiClient } from './client';
import type { Application } from '@/lib/types/application';

export interface ConversationalSearchRequest {
  query: string;
  includeExtendedData?: boolean;
  maxResults?: number;
}

export interface ConversationalSearchResponse {
  success: boolean;
  results?: Application[];
  metadata?: {
    totalCount: number;
    returned: number;
    query: {
      original: string;
      understood?: {
        filters?: string[];
        includesJoins?: string[];
      };
      prismaQuery?: unknown;
    };
    executionTime: number;
  };
  error?: {
    code: 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'EXECUTION_ERROR' | 'RATE_LIMIT';
    message: string;
    suggestions?: string[];
  };
  clarificationNeeded?: boolean;
  clarificationQuestion?: string;
  clarificationOptions?: Array<{ label: string; value: string }>;
}

export const conversationalSearchApi = {
  search: async (
    payload: ConversationalSearchRequest,
  ): Promise<ConversationalSearchResponse> => {
    const { data } = await apiClient.post<ConversationalSearchResponse>(
      '/applications/conversational',
      payload,
    );
    return data;
  },
};

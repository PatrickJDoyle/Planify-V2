import { apiClient } from './client';

export interface IntelligenceProgress {
  stage: string;
  message: string;
  progress: number;
  currentDocument?: string;
  documentsTotal: number;
  documentsComplete: number;
}

export interface KeyFact {
  label: string;
  value: string;
  importance: 'high' | 'medium' | 'low';
}

export interface DocumentAnalysisResult {
  fileName: string;
  documentType: string;
  summary: string;
  keyFacts: KeyFact[];
  confidence: number;
  processingTimeMs: number;
  storedImages?: StoredDrawingImage[];
}

export interface KeyFinding {
  category: string;
  label: string;
  value: string;
  source: string;
  confidence: number;
}

export interface IntelligenceResult {
  applicationId: number;
  applicationNumber: string;
  documentsFound: number;
  documentsAnalyzed: number;
  analyses: DocumentAnalysisResult[];
  overallSummary: string;
  keyFindings: KeyFinding[];
  processingTimeMs: number;
  cached: boolean;
}

export interface StoredDrawingImage {
  imageUrl: string;
  drawingType: string;
  pageNumber: number;
  documentName: string;
}

export interface StoredDrawingImageRecord extends StoredDrawingImage {
  id: number;
  architectName?: string;
  agentName?: string;
  createdAt: string;
}

export interface DrawingsResponse {
  applicationNumber: string;
  images: StoredDrawingImageRecord[];
  total: number;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    if (token) headers.Authorization = `Bearer ${token}`;
    if (userId) headers['x-user-id'] = userId;
  }

  return headers;
}

function absoluteImageUrl(url: string): string {
  if (!url.startsWith('/')) return url;
  const base = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://backend-api.plannify.org';
  return `${base}${url}`;
}

export const documentIntelligenceApi = {
  getStoredDrawings: async (applicationNumber: string, drawingType?: string): Promise<DrawingsResponse> => {
    const { data } = await apiClient.get<DrawingsResponse>('/document-intelligence/drawings', {
      params: {
        applicationNumber,
        ...(drawingType ? { drawingType } : {}),
      },
    });

    return {
      ...data,
      images: (data.images || []).map((img) => ({
        ...img,
        imageUrl: absoluteImageUrl(img.imageUrl),
      })),
    };
  },

  analyzeDocumentsStreaming: async (
    params: {
      applicationNumber: string;
      maxDocuments?: number;
      priorityOnly?: boolean;
      includeDrawings?: boolean;
      skipCache?: boolean;
    },
    callbacks: {
      onProgress?: (progress: IntelligenceProgress) => void;
      onComplete: (result: IntelligenceResult) => void;
      onError: (error: Error) => void;
    },
    signal?: AbortSignal,
  ): Promise<void> => {
    const base = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://backend-api.plannify.org';
    const query = new URLSearchParams({
      applicationNumber: params.applicationNumber,
      maxDocuments: String(params.maxDocuments ?? 50),
      priorityOnly: String(params.priorityOnly ?? false),
      includeDrawings: String(params.includeDrawings ?? true),
      skipCache: String(params.skipCache ?? false),
    });

    const response = await fetch(`${base}/document-intelligence/analyze?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Analysis failed (${response.status})`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Streaming response is not readable.');

    const decoder = new TextDecoder();
    let buffer = '';
    let eventType = '';

    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim();
          continue;
        }

        if (!line.startsWith('data: ')) continue;

        const payload = line.slice(6).trim();
        if (!payload) continue;

        try {
          const data = JSON.parse(payload);

          if (eventType === 'progress' || data?.progress != null || data?.stage === 'connecting' || data?.stage === 'retrieving' || data?.stage === 'downloading' || data?.stage === 'analyzing' || data?.stage === 'summarizing' || data?.stage === 'complete') {
            callbacks.onProgress?.(data as IntelligenceProgress);
          }

          if (eventType === 'complete' || Array.isArray(data?.analyses)) {
            const result = data as IntelligenceResult;
            callbacks.onComplete(result);
            return;
          }

          if (eventType === 'error' || data?.error || data?.stage === 'error') {
            callbacks.onError(new Error(data?.message || data?.error || 'Unknown analysis error'));
            return;
          }
        } catch {
          // Ignore partial lines and keep reading.
        } finally {
          eventType = '';
        }
      }
    }
  },
};

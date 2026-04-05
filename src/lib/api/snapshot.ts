import axios from 'axios';
import { apiClient } from './client';
import type {
  SnapshotRequest,
  SnapshotResult,
  SnapshotRateLimitError,
  SnapshotValidationError,
} from '@/lib/types/snapshot';

export type SnapshotResponse =
  | { kind: 'result'; data: SnapshotResult }
  | { kind: 'rate_limited'; data: SnapshotRateLimitError }
  | { kind: 'validation_error'; data: SnapshotValidationError }
  | { kind: 'error'; message: string };

export async function postSnapshot(req: SnapshotRequest): Promise<SnapshotResponse> {
  try {
    const response = await apiClient.post<SnapshotResult>('/api/snapshot', req);
    return { kind: 'result', data: response.data };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const body = err.response?.data;

      if (status === 429) {
        return { kind: 'rate_limited', data: body as SnapshotRateLimitError };
      }
      if (status === 422) {
        return { kind: 'validation_error', data: body as SnapshotValidationError };
      }
      return {
        kind: 'error',
        message: body?.message ?? err.message ?? 'Something went wrong. Please try again.',
      };
    }
    return { kind: 'error', message: 'Something went wrong. Please try again.' };
  }
}

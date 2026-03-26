'use client';

import { useMutation } from '@tanstack/react-query';
import {
  conversationalSearchApi,
  type ConversationalSearchRequest,
} from '@/lib/api/conversational-search';

function getErrorMessage(error: unknown, fallback: string): string {
  const message = (error as any)?.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.trim().length > 0) return message;
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return fallback;
}

export function useConversationalSearch() {
  return useMutation({
    mutationFn: async (payload: ConversationalSearchRequest) => {
      try {
        return await conversationalSearchApi.search(payload);
      } catch (error) {
        throw new Error(
          getErrorMessage(error, 'Failed to run conversational search.'),
        );
      }
    },
  });
}

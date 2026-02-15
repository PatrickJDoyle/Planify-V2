'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesApi } from '@/lib/api/favorites';
import { queryKeys } from './keys';

export function useFavorites(page = 1, pageSize = 16) {
  return useQuery({
    queryKey: queryKeys.favorites.list(page),
    queryFn: () => favoritesApi.list(page, pageSize),
    staleTime: 30_000,
  });
}

export function useCheckFavorite(applicationId: number) {
  return useQuery({
    queryKey: queryKeys.favorites.check(applicationId),
    queryFn: () => favoritesApi.check(applicationId),
    staleTime: 30_000,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      userId,
      isFavorited,
    }: {
      applicationId: number;
      userId: string;
      isFavorited: boolean;
    }) => {
      if (isFavorited) {
        await favoritesApi.remove(applicationId, userId);
      } else {
        await favoritesApi.add(applicationId, userId);
      }
    },
    onMutate: async ({ applicationId, isFavorited }) => {
      // Optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.favorites.check(applicationId),
      });
      queryClient.setQueryData(
        queryKeys.favorites.check(applicationId),
        !isFavorited,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });
}

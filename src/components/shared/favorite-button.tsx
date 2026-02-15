'use client';

import React from 'react';
import { Bookmark } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCheckFavorite, useToggleFavorite } from '@/lib/queries/favorites';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FavoriteButtonProps {
  applicationId: number;
  size?: 'sm' | 'default';
  className?: string;
}

export function FavoriteButton({ applicationId, size = 'sm', className }: FavoriteButtonProps) {
  const { user } = useUser();
  const { data: isFavorited = false } = useCheckFavorite(applicationId);
  const { mutate: toggle, isPending } = useToggleFavorite();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) return;
    toggle({ applicationId, userId: user.id, isFavorited });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={size === 'sm' ? 'icon-sm' : 'icon'}
          onClick={handleClick}
          disabled={isPending || !user}
          className={cn('text-foreground-subtle hover:text-primary', className)}
        >
          <Bookmark
            className={cn(
              'h-4 w-4 transition-colors',
              isFavorited && 'fill-primary text-primary',
            )}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isFavorited ? 'Remove from saved' : 'Save to projects'}
      </TooltipContent>
    </Tooltip>
  );
}

'use client';

import React from 'react';
import { Lock, ArrowRight, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  description?: string;
}

const UPGRADE_HIGHLIGHTS = [
  'Nationwide planning coverage',
  'Unlimited alerts & saved projects',
  'Pre-planning intelligence reports',
  'Document AI & entity extraction',
  'Export to PDF & CSV',
  'Priority email support',
];

export function PaywallModal({
  open,
  onOpenChange,
  feature = 'This feature',
  description,
}: PaywallModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onOpenChange(false);
    router.push('/billing');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10">
              <Lock className="h-4.5 w-4.5 text-brand-500" />
            </div>
            <Badge className="bg-brand-500/10 text-brand-500 hover:bg-brand-500/10">
              Enterprise feature
            </Badge>
          </div>
          <DialogTitle className="text-left text-lg">
            {feature} requires an upgrade
          </DialogTitle>
          <DialogDescription className="text-left">
            {description ??
              'Unlock the full power of Planify with an enterprise subscription. Get nationwide coverage, unlimited alerts, AI-powered document intelligence, and more.'}
          </DialogDescription>
        </DialogHeader>

        <ul className="my-4 space-y-2">
          {UPGRADE_HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-sm text-foreground-muted">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-500/10">
                <Zap className="h-2.5 w-2.5 text-brand-500" />
              </div>
              {item}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2">
          <Button onClick={handleUpgrade} className="w-full gap-2 bg-brand-500 hover:bg-brand-600">
            View Plans & Pricing
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full text-foreground-muted">
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

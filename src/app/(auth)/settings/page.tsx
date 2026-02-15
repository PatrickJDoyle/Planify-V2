'use client';

import { useUser } from '@clerk/nextjs';
import { User } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserProfile } from '@/lib/queries/user';

export default function SettingsPage() {
  const { user } = useUser();
  const { data: profile } = useUserProfile();

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold text-foreground">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-foreground-muted">Name</p>
            <p className="text-sm text-foreground">
              {user?.fullName ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground-muted">Email</p>
            <p className="text-sm text-foreground">
              {user?.primaryEmailAddress?.emailAddress ?? profile?.email ?? '—'}
            </p>
          </div>
          {profile?.subscriptionTier && (
            <div>
              <p className="text-xs font-medium text-foreground-muted">Plan</p>
              <p className="text-sm text-foreground capitalize">
                {profile.subscriptionTier}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

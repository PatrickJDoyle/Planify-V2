'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, CreditCard, MapPinned, UserCog } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/lib/queries/user';

export default function SettingsPage() {
  const { profile } = useUserProfile();

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Manage account, billing, locations, and notification preferences.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserCog className="h-4 w-4" /> Account</CardTitle>
            <CardDescription>Profile and organization details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-foreground-muted">Email:</span> {profile?.email ?? 'N/A'}</p>
            <p><span className="text-foreground-muted">Tier:</span> {profile?.subscriptionTier ?? 'free'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Billing</CardTitle>
            <CardDescription>Upgrade and manage subscription.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/billing">Open Billing</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPinned className="h-4 w-4" /> Location Preferences</CardTitle>
            <CardDescription>Saved locations and radius defaults.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-foreground-muted">
            Location preference editor is scheduled for the next pass.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle>
            <CardDescription>Alert and inbox preference controls.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-foreground-muted">
            Notification preference controls are scheduled for the next pass.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

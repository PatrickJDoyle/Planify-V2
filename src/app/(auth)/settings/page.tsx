'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  UserCog,
  CreditCard,
  Bell,
  Building2,
  Shield,
  ExternalLink,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserProfile } from '@/lib/queries/user';
import { billingApi } from '@/lib/api/billing';
import { cn } from '@/lib/utils';

const TIER_LABELS = { free: 'Free', personal: 'Personal (Free)', enterprise: 'Enterprise' } as const;
const TIER_COLORS = {
  free: 'bg-background-muted text-foreground-muted',
  personal: 'bg-blue-500/10 text-blue-600',
  enterprise: 'bg-brand-500/10 text-brand-500',
} as const;

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start gap-3 p-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background-muted">
          <Icon className="h-4 w-4 text-foreground-muted" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description && (
            <p className="mt-0.5 text-xs text-foreground-muted">{description}</p>
          )}
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </Card>
  );
}

function SettingsRow({
  label,
  value,
  action,
}: {
  label: string;
  value?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-foreground-muted">{label}</span>
      <div className="flex items-center gap-3">
        {value && <span className="text-sm font-medium text-foreground">{value}</span>}
        {action}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { profile, tier } = useUserProfile();
  const [managingBilling, setManagingBilling] = useState(false);
  const isPaidTier = tier === 'enterprise';

  // Notification preferences (local state only — extend to API when backend ready)
  const [notifNew, setNotifNew] = useState(true);
  const [notifStatus, setNotifStatus] = useState(true);
  const [notifInbox, setNotifInbox] = useState(false);

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`
    : 'U';

  const handleManageBilling = async () => {
    setManagingBilling(true);
    try {
      const { url } = await billingApi.getEntrypoint(window.location.href);
      window.location.href = url;
    } finally {
      setManagingBilling(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Manage your account, billing, and notification preferences
        </p>
      </div>

      {/* Profile */}
      <SettingsSection icon={UserCog} title="Account" description="Your identity and profile">
        <div className="flex items-center gap-4 rounded-lg bg-background-subtle p-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? 'User'} />
            <AvatarFallback className="text-base font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">{user?.fullName ?? '—'}</p>
            <p className="text-sm text-foreground-muted">
              {user?.primaryEmailAddress?.emailAddress ?? '—'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://accounts.planify.ie', '_blank')}
            className="gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Edit profile
          </Button>
        </div>

        <div className="mt-3 divide-y">
          <SettingsRow
            label="Organisation"
            value={profile?.organisationName ?? 'Not set'}
          />
          <SettingsRow
            label="User type"
            value={profile?.userType ?? 'Not set'}
          />
          <SettingsRow
            label="Industry"
            value={profile?.industry ?? 'Not set'}
          />
          <SettingsRow
            label="Member since"
            value={
              profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString('en-IE', {
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'
            }
          />
        </div>
      </SettingsSection>

      {/* Billing */}
      <SettingsSection icon={CreditCard} title="Billing & Subscription" description="Plan, payment, and invoices">
        <div className="divide-y">
          <SettingsRow
            label="Current plan"
            value={
              <span className="flex items-center gap-2">
                {TIER_LABELS[tier as keyof typeof TIER_LABELS] ?? 'Free'}
                  <Badge className={cn('text-[10px]', TIER_COLORS[tier as keyof typeof TIER_COLORS] ?? TIER_COLORS.free)}>
                  {isPaidTier ? 'Active' : 'Free plan'}
                </Badge>
              </span>
            }
            action={
              isPaidTier ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManageBilling}
                  disabled={managingBilling}
                  className="gap-1 text-xs text-foreground-muted"
                >
                  Manage <ChevronRight className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="gap-1.5 bg-brand-500 text-xs hover:bg-brand-600"
                  onClick={() => router.push('/billing/plans')}
                >
                  Upgrade
                </Button>
              )
            }
          />
          <SettingsRow
            label="Billing portal"
            action={
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs text-foreground-muted"
                onClick={() => router.push('/billing')}
              >
                View details <ChevronRight className="h-3 w-3" />
              </Button>
            }
          />
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection icon={Bell} title="Notifications" description="Email and in-app alert preferences">
        <div className="divide-y">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-foreground">New application alerts</p>
              <p className="text-xs text-foreground-muted">Email me when new matches arrive</p>
            </div>
            <Switch checked={notifNew} onCheckedChange={setNotifNew} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-foreground">Status update alerts</p>
              <p className="text-xs text-foreground-muted">Email me when a tracked application changes status</p>
            </div>
            <Switch checked={notifStatus} onCheckedChange={setNotifStatus} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-foreground">Inbox digest</p>
              <p className="text-xs text-foreground-muted">Daily summary of inbox activity</p>
            </div>
            <Switch checked={notifInbox} onCheckedChange={setNotifInbox} />
          </div>
        </div>
        <p className="mt-3 text-xs text-foreground-subtle">
          Detailed notification scheduling will be available in a future release.
        </p>
      </SettingsSection>

      {/* Organisation */}
      <SettingsSection
        icon={Building2}
        title="Organisation"
        description="Team and workspace settings (Enterprise)"
      >
        {tier === 'enterprise' ? (
          <div className="space-y-2 text-sm text-foreground-muted">
            <p>Organisation management panel coming in next release.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-brand-500/20 bg-brand-500/5 p-4">
            <p className="text-sm font-medium text-foreground">Enterprise feature</p>
            <p className="mt-1 text-xs text-foreground-muted">
              Team management and organisation profiles are available on the Enterprise plan.
            </p>
            <Button
              size="sm"
              className="mt-3 gap-1.5 bg-brand-500 hover:bg-brand-600"
              onClick={() => router.push('/billing/plans')}
            >
              View Enterprise Plans
            </Button>
          </div>
        )}
      </SettingsSection>

      {/* Security */}
      <SettingsSection icon={Shield} title="Security" description="Password, 2FA, and sessions">
        <div className="divide-y">
          <SettingsRow
            label="Password"
            action={
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs text-foreground-muted"
                onClick={() => window.open('https://accounts.planify.ie', '_blank')}
              >
                Change <ExternalLink className="h-3 w-3" />
              </Button>
            }
          />
          <SettingsRow
            label="Two-factor authentication"
            action={
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs text-foreground-muted"
                onClick={() => window.open('https://accounts.planify.ie', '_blank')}
              >
                Configure <ExternalLink className="h-3 w-3" />
              </Button>
            }
          />
        </div>
        <p className="mt-2 text-xs text-foreground-subtle">
          Security settings are managed via Clerk. Click above to open your account portal.
        </p>
      </SettingsSection>
    </div>
  );
}

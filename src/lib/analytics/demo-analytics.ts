import posthog from 'posthog-js';

/** Named in [GST-94#document-cto-handoff] for demo funnel measurement. */
export const DEMO_EVENT = {
  DEMO_REPORT_GENERATED: 'demo_report_generated',
  REPORT_METRIC_INTERACTION: 'report_metric_interaction',
  APPLICATION_OPENED_FROM_REPORT: 'application_opened_from_report',
  ALERT_CREATED_POST_REPORT: 'alert_created_post_report',
  REPORT_EXPORTED: 'report_exported',
} as const;

export type DemoAnalyticsEvent = (typeof DEMO_EVENT)[keyof typeof DEMO_EVENT];

const REPORT_SESSION_KEY = 'planify_demo_post_report_session';
const REPORT_NAV_PENDING_KEY = 'planify_demo_pending_app_from_report';

let demoAnalyticsInited = false;

export function initDemoAnalytics(): void {
  if (demoAnalyticsInited || typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  demoAnalyticsInited = true;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';
  posthog.init(key, {
    api_host: host,
    persistence: 'localStorage',
    autocapture: false,
    capture_pageview: false,
    disable_session_recording: true,
  });
}

export function captureDemoEvent(
  event: DemoAnalyticsEvent,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(event, properties);
}

export function markPostReportSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(REPORT_SESSION_KEY, '1');
    sessionStorage.setItem(REPORT_NAV_PENDING_KEY, '1');
  } catch {
    /* ignore quota / private mode */
  }
}

export function hasPostReportSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(REPORT_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/** First dashboard navigation to an application after a completed pre-planning report. */
export function consumePendingAppNavigationFromReport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(REPORT_NAV_PENDING_KEY) !== '1') return false;
    sessionStorage.removeItem(REPORT_NAV_PENDING_KEY);
    return true;
  } catch {
    return false;
  }
}

export function consumePostReportSessionForAlert(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(REPORT_SESSION_KEY) !== '1') return false;
    sessionStorage.removeItem(REPORT_SESSION_KEY);
    return true;
  } catch {
    return false;
  }
}

export function applicationCountBand(count: number): string {
  if (count < 15) return '0-14';
  if (count < 50) return '15-49';
  return '50+';
}

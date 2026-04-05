import { SnapshotWidget } from '@/components/snapshot/snapshot-widget';

/**
 * Embeddable snapshot widget page.
 *
 * Embed via iframe:
 *   <iframe src="https://app.planify.ie/snapshot" width="480" height="600" frameborder="0" />
 *
 * Or load as a web component: `<script src=".../snapshot-embed.js"></script>`
 * then `<planify-snapshot base-url="https://your-app"></planify-snapshot>`.
 */
export default function EmbedSnapshotPage() {
  return (
    <main className="flex min-h-screen items-start justify-center p-4 pt-8">
      <SnapshotWidget embedded />
    </main>
  );
}

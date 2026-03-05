'use client';

import React, { useRef, useState } from 'react';
import {
  Brain,
  Loader2,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  documentIntelligenceApi,
  type IntelligenceResult,
  type IntelligenceProgress,
  type DocumentAnalysisResult,
  type KeyFinding,
} from '@/lib/api/document-intelligence';

// ─── Types & helpers ────────────────────────────────────────────────

const IMPORTANCE_COLORS = {
  high: 'bg-red-500/10 text-red-600',
  medium: 'bg-amber-500/10 text-amber-600',
  low: 'bg-background-muted text-foreground-muted',
} as const;

const CONFIDENCE_LABEL = (n: number) =>
  n >= 0.8 ? 'High' : n >= 0.5 ? 'Medium' : 'Low';

const CONFIDENCE_COLOR = (n: number) =>
  n >= 0.8 ? 'text-status-granted' : n >= 0.5 ? 'text-amber-500' : 'text-foreground-muted';

// ─── Sub-components ────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-background-muted">
      <div
        className="h-full rounded-full bg-brand-500 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.round(value * 100))}%` }}
      />
    </div>
  );
}

function KeyFindingRow({ finding }: { finding: KeyFinding }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2.5">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
          {finding.category}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">{finding.label}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-medium text-foreground">{finding.value}</span>
        <span className={cn('text-[10px]', CONFIDENCE_COLOR(finding.confidence))}>
          {CONFIDENCE_LABEL(finding.confidence)} confidence · {finding.source}
        </span>
      </div>
    </div>
  );
}

function DocumentCard({ doc }: { doc: DocumentAnalysisResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-background">
      <button
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background-muted">
            <FileText className="h-3.5 w-3.5 text-foreground-muted" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-snug">{doc.fileName}</p>
            <p className="mt-0.5 text-xs text-foreground-muted">{doc.documentType}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn('text-[10px] font-medium', CONFIDENCE_COLOR(doc.confidence))}>
            {Math.round(doc.confidence * 100)}% confidence
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-foreground-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-foreground-muted" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <p className="text-sm text-foreground-muted">{doc.summary}</p>
          {doc.keyFacts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {doc.keyFacts.map((fact, i) => (
                <div
                  key={i}
                  className={cn('rounded-full px-2.5 py-1 text-xs font-medium', IMPORTANCE_COLORS[fact.importance])}
                >
                  {fact.label}: {fact.value}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────

interface DocumentIntelligencePanelProps {
  applicationNumber: string;
}

export function DocumentIntelligencePanel({ applicationNumber }: DocumentIntelligencePanelProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState<IntelligenceProgress | null>(null);
  const [result, setResult] = useState<IntelligenceResult | null>(null);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const start = async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setStatus('running');
    setProgress(null);
    setError('');

    await documentIntelligenceApi.analyzeDocumentsStreaming(
      { applicationNumber, maxDocuments: 50, priorityOnly: false, includeDrawings: true },
      {
        onProgress: (p) => setProgress(p),
        onComplete: (r) => {
          setResult(r);
          setStatus('done');
        },
        onError: (err) => {
          setError(err.message);
          setStatus('error');
        },
      },
      abortRef.current.signal,
    );
  };

  const reset = () => {
    abortRef.current?.abort();
    setStatus('idle');
    setProgress(null);
    setResult(null);
    setError('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10">
            <Brain className="h-4 w-4 text-brand-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Document Intelligence</p>
            <p className="text-xs text-foreground-muted">AI-powered analysis of all planning documents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === 'done' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="gap-1.5 text-xs text-foreground-muted"
            >
              <RefreshCw className="h-3 w-3" />
              Re-analyse
            </Button>
          )}
          {status === 'idle' && (
            <Button
              size="sm"
              className="gap-1.5 bg-brand-500 hover:bg-brand-600"
              onClick={start}
            >
              <Zap className="h-3.5 w-3.5" />
              Analyse Documents
            </Button>
          )}
          {status === 'running' && (
            <Button size="sm" variant="outline" onClick={reset} className="gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Stop
            </Button>
          )}
        </div>
      </div>

      {/* Running state */}
      {status === 'running' && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">
                {progress?.message ?? 'Connecting to analysis service…'}
              </span>
              <span className="font-medium text-foreground">
                {progress?.documentsComplete ?? 0} / {progress?.documentsTotal ?? '?'}
              </span>
            </div>
            <ProgressBar value={progress?.progress ?? 0} />
            {progress?.currentDocument && (
              <p className="truncate text-xs text-foreground-subtle">
                Processing: {progress.currentDocument}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Analysis failed</p>
            <p className="mt-0.5 text-xs text-foreground-muted">{error}</p>
          </div>
          <Button size="sm" variant="outline" onClick={start} className="ml-auto shrink-0 gap-1.5">
            Retry
          </Button>
        </div>
      )}

      {/* Results */}
      {status === 'done' && result && (
        <div className="space-y-4">
          {/* Summary header */}
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-status-granted" />
                  <span className="text-sm font-semibold text-foreground">Analysis complete</span>
                  {result.cached && (
                    <Badge variant="outline" className="text-[10px] text-foreground-muted">Cached</Badge>
                  )}
                </div>
                <div className="ml-auto flex gap-3 text-xs text-foreground-muted">
                  <span>{result.documentsAnalyzed}/{result.documentsFound} documents</span>
                  <span>{(result.processingTimeMs / 1000).toFixed(1)}s</span>
                </div>
              </div>
              <p className="text-sm text-foreground-muted leading-relaxed">{result.overallSummary}</p>
            </CardContent>
          </Card>

          {/* Key findings */}
          {result.keyFindings.length > 0 && (
            <Card>
              <div className="px-5 py-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Key Findings
                </h3>
              </div>
              <Separator />
              <CardContent className="divide-y p-0">
                {result.keyFindings.map((f, i) => (
                  <div key={i} className="px-5">
                    <KeyFindingRow finding={f} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Per-document cards */}
          {result.analyses.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Document Summaries ({result.analyses.length})
              </p>
              <div className="space-y-2">
                {result.analyses.map((doc, i) => (
                  <DocumentCard key={i} doc={doc} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink,
  FileSearch,
  FileText,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Application } from '@/lib/types/application';
import {
  documentIntelligenceApi,
  type IntelligenceProgress,
  type IntelligenceResult,
  type StoredDrawingImageRecord,
} from '@/lib/api/document-intelligence';

interface DocumentsSectionProps {
  application: Application;
}

const DRAWING_TYPE_LABELS: Record<string, string> = {
  elevation: 'Elevations',
  'floor-plan': 'Floor Plans',
  'site-plan': 'Site Plans',
  section: 'Sections',
  other: 'Other Drawings',
};

function absoluteMaybe(url: string): string {
  if (!url.startsWith('/')) return url;
  const base = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://backend-api.plannify.org';
  return `${base}${url}`;
}

export function DocumentsSection({ application: app }: DocumentsSectionProps) {
  const { getToken } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<IntelligenceProgress | null>(null);
  const [analysis, setAnalysis] = useState<IntelligenceResult | null>(null);
  const [storedImages, setStoredImages] = useState<StoredDrawingImageRecord[]>([]);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [errorText, setErrorText] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refreshStoredImages = useCallback(async () => {
    if (!app.applicationNumber) return;

    try {
      const token = await getToken();
      const response = await documentIntelligenceApi.getStoredDrawings(
        app.applicationNumber,
        undefined,
        token || undefined,
      );
      setStoredImages(response.images ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load stored drawing images.';
      setErrorText(message);
    }
  }, [app.applicationNumber, getToken]);

  useEffect(() => {
    refreshStoredImages();
  }, [refreshStoredImages]);

  const runAnalysis = async () => {
    if (!app.applicationNumber || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      setErrorText('');
      setAnalysis(null);
      setProgress({
        stage: 'connecting',
        message: 'Connecting to intelligence service...',
        progress: 0,
        documentsTotal: 0,
        documentsComplete: 0,
      });

      const controller = new AbortController();
      abortRef.current = controller;

      await documentIntelligenceApi.analyzeDocumentsStreaming(
        {
          applicationNumber: app.applicationNumber,
          maxDocuments: 50,
          includeDrawings: true,
          priorityOnly: false,
          skipCache: false,
          token: (await getToken()) || undefined,
        },
        {
          onProgress: (p) => setProgress(p),
          onComplete: (result) => {
            setAnalysis(result);
            setProgress({
              stage: 'complete',
              message: 'Document analysis complete.',
              progress: 100,
              documentsTotal: result.documentsAnalyzed,
              documentsComplete: result.documentsAnalyzed,
            });
          },
          onError: (error) => {
            setErrorText(error.message || 'Document analysis failed.');
          },
        },
        controller.signal,
      );

      await refreshStoredImages();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Document analysis failed.';
      setErrorText(message);
    } finally {
      setIsAnalyzing(false);
      abortRef.current = null;
    }
  };

  const cancelAnalysis = () => {
    abortRef.current?.abort();
    setIsAnalyzing(false);
    setProgress(null);
  };

  const allDisplayImages = useMemo(() => {
    const analysisImages = (analysis?.analyses || []).flatMap((doc) =>
      (doc.storedImages || []).map((img) => ({
        id: -1,
        imageUrl: absoluteMaybe(img.imageUrl),
        drawingType: img.drawingType,
        pageNumber: img.pageNumber,
        documentName: img.documentName,
        createdAt: new Date().toISOString(),
      })),
    );

    const merged = [...storedImages, ...analysisImages];
    const seen = new Set<string>();
    return merged.filter((img) => {
      const key = `${img.documentName}|${img.pageNumber}|${img.drawingType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [analysis?.analyses, storedImages]);

  const toggleDocExpanded = (fileName: string) => {
    setExpandedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(fileName)) {
        next.delete(fileName);
      } else {
        next.add(fileName);
      }
      return next;
    });
  };

  const groupedImages = useMemo(() => {
    const groups = new Map<string, typeof allDisplayImages>();
    allDisplayImages.forEach((img) => {
      const type = img.drawingType || 'other';
      const current = groups.get(type) || [];
      groups.set(type, [...current, img]);
    });
    return groups;
  }, [allDisplayImages]);

  const selectedImage = selectedImageIndex != null ? allDisplayImages[selectedImageIndex] : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSearch className="h-4 w-4 text-primary" />
            Document Intelligence
          </CardTitle>
          <CardDescription>
            Crawl, analyse, and persist planning documents and drawing renders for {app.applicationNumber}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={runAnalysis} disabled={isAnalyzing || !app.applicationNumber}>
              {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Analyze Documents
            </Button>
            {isAnalyzing ? (
              <Button variant="outline" onClick={cancelAnalysis}>Cancel</Button>
            ) : null}
            <Button variant="outline" onClick={refreshStoredImages} disabled={isAnalyzing}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Drawing Library
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-md border border-border bg-background-subtle p-3 text-sm">
              <p className="text-xs text-foreground-muted">Stored drawing images</p>
              <p className="mt-1 font-semibold">{allDisplayImages.length}</p>
            </div>
            <div className="rounded-md border border-border bg-background-subtle p-3 text-sm">
              <p className="text-xs text-foreground-muted">Analysis status</p>
              <p className="mt-1 font-semibold">{isAnalyzing ? 'Running' : analysis ? 'Complete' : 'Not started'}</p>
            </div>
            <div className="rounded-md border border-border bg-background-subtle p-3 text-sm">
              <p className="text-xs text-foreground-muted">Documents analyzed</p>
              <p className="mt-1 font-semibold">{analysis?.documentsAnalyzed ?? 0}</p>
            </div>
          </div>

          {progress ? (
            <div className="space-y-2 rounded-md border border-border bg-background-subtle p-3">
              <div className="flex items-center justify-between text-xs text-foreground-muted">
                <span>{progress.message}</span>
                <span>{progress.progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-[#1270AF] transition-all duration-500"
                  style={{ width: `${Math.max(0, Math.min(progress.progress || 0, 100))}%` }}
                />
              </div>
              <p className="text-xs text-foreground-muted">
                {progress.documentsComplete}/{progress.documentsTotal} documents
                {progress.currentDocument ? ` • ${progress.currentDocument}` : ''}
              </p>
            </div>
          ) : null}

          {errorText ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <span>{errorText}</span>
              </p>
            </div>
          ) : null}

          {analysis ? (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
              <p className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Analysis complete in {(analysis.processingTimeMs / 1000).toFixed(1)}s
              </p>
              <p className="mt-1 text-xs text-green-800">{analysis.overallSummary}</p>
              <p className="mt-1 text-xs text-green-800">
                Analyzed {analysis.documentsAnalyzed} of {analysis.documentsFound} documents
              </p>
              {analysis.keyFindings?.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {analysis.keyFindings.slice(0, 6).map((finding) => (
                    <Badge key={`${finding.category}-${finding.label}`} variant="outline" className="text-[11px]">
                      {finding.label}: {finding.value}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {analysis?.keyFindings?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Structured Key Findings</CardTitle>
            <CardDescription>Deterministic extraction from analyzed documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.keyFindings.map((finding) => (
              <div
                key={`${finding.category}-${finding.label}-${finding.source}`}
                className="grid gap-2 rounded-md border border-border bg-background-subtle p-3 sm:grid-cols-[180px_1fr]"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{finding.label}</p>
                <p className="text-sm text-foreground">{finding.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Council Documents</h3>
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-xs text-foreground-muted">
              View all planning documents, drawings, reports, and decisions from {app.planningAuthority}
            </p>
            {app.linkApplicationDetails && (
              <Button
                size="sm"
                className="mt-3 w-full gap-1.5"
                onClick={() => window.open(app.linkApplicationDetails, '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on Council Website
              </Button>
            )}
          </CardContent>
        </Card>

        {app.appealRefNumber ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Appeal Documents</h3>
                <FileText className="h-4 w-4 text-red-500" />
              </div>
              <p className="mt-2 text-xs text-foreground-muted">
                View appeal submissions, inspector reports, and decisions from An Bord Pleanala.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-3 w-full gap-1.5"
                onClick={() =>
                  window.open(
                    `https://www.pleanala.ie/en-ie/case/${app.appealRefNumber?.split('-')[1]}`,
                    '_blank',
                  )
                }
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on ABP Website
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4 text-primary" />
            Persisted Drawing Library
            <Badge variant="secondary" className="ml-auto">{allDisplayImages.length}</Badge>
          </CardTitle>
          <CardDescription>
            Drawings are retrieved from persistent storage and remain available on refresh.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {allDisplayImages.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              No drawing images stored yet for this application. Run Analyze Documents to fetch and persist them.
            </p>
          ) : (
            Array.from(groupedImages.entries()).map(([type, images]) => (
              <div key={type}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  {DRAWING_TYPE_LABELS[type] || type}
                </p>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                  {images.map((img) => {
                    const absoluteIndex = allDisplayImages.findIndex(
                      (a) => a.imageUrl === img.imageUrl && a.documentName === img.documentName && a.pageNumber === img.pageNumber,
                    );
                    return (
                      <button
                        type="button"
                        key={`${img.documentName}-${img.pageNumber}-${img.imageUrl}`}
                        className="group overflow-hidden rounded-md border border-border bg-background-subtle text-left"
                        onClick={() => setSelectedImageIndex(absoluteIndex)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.imageUrl}
                          alt={`${img.documentName} page ${img.pageNumber}`}
                          loading="lazy"
                          className="h-32 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                        />
                        <div className="p-2">
                          <p className="truncate text-xs font-medium text-foreground">{img.documentName}</p>
                          <p className="text-xs text-foreground-muted">Page {img.pageNumber}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {analysis?.analyses?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Document Analysis Register</CardTitle>
            <CardDescription>Per-document summaries and extracted key facts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.analyses.map((doc) => (
              <div key={doc.fileName} className="overflow-hidden rounded-md border border-border bg-background-subtle">
                <button
                  type="button"
                  onClick={() => toggleDocExpanded(doc.fileName)}
                  className="flex w-full items-center justify-between p-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{doc.fileName}</p>
                    <p className="text-xs text-foreground-muted">
                      {(doc.documentType || 'other').replace('_', ' ')} • Confidence {(doc.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  {expandedDocs.has(doc.fileName) ? (
                    <ChevronUp className="h-4 w-4 text-foreground-muted" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-foreground-muted" />
                  )}
                </button>

                {expandedDocs.has(doc.fileName) ? (
                  <div className="border-t border-border bg-surface p-3">
                    <p className="text-sm text-foreground">{doc.summary}</p>
                    {doc.keyFacts?.length ? (
                      <div className="mt-3 space-y-2">
                        {doc.keyFacts.map((fact) => (
                          <div
                            key={`${doc.fileName}-${fact.label}-${fact.value}`}
                            className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-xs"
                          >
                            <span className="text-foreground-muted">{fact.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{fact.value}</span>
                              <Badge variant="outline" className="text-[10px] capitalize">
                                {fact.importance}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {selectedImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setSelectedImageIndex(null)}
            aria-label="Close viewer"
          />

          <div className="absolute right-4 top-4 z-10 flex gap-2">
            <Button size="icon" variant="secondary" onClick={() => setSelectedImageIndex(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {selectedImageIndex != null && selectedImageIndex > 0 ? (
            <Button
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2"
              variant="secondary"
              size="icon"
              onClick={() => setSelectedImageIndex((i) => (i == null ? i : Math.max(0, i - 1)))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : null}

          {selectedImageIndex != null && selectedImageIndex < allDisplayImages.length - 1 ? (
            <Button
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2"
              variant="secondary"
              size="icon"
              onClick={() => setSelectedImageIndex((i) => (i == null ? i : Math.min(allDisplayImages.length - 1, i + 1)))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : null}

          <div className="relative z-10 max-h-[90vh] max-w-[92vw]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage.imageUrl}
              alt={`${selectedImage.documentName} page ${selectedImage.pageNumber}`}
              className="max-h-[82vh] max-w-full rounded-md bg-white object-contain"
            />
            <div className="mt-2 text-center text-sm text-white">
              {selectedImage.documentName} • Page {selectedImage.pageNumber} • {(selectedImageIndex ?? 0) + 1}/{allDisplayImages.length}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

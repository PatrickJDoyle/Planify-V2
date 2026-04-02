'use client';

import React from 'react';
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  Download,
  PackageCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  ResearchRequirement,
  GeneratedDocument,
  AgentStatus,
} from '@/lib/queries/planify';

// ─── Status Icon Mapping ─────────────────────────────────────────────────────

function StatusIcon({ status }: { status: AgentStatus | 'user_provides' }) {
  switch (status) {
    case 'complete':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'running':
      return <Loader2 className="h-4 w-4 animate-spin text-amber-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'user_provides':
      return <Circle className="h-4 w-4 text-neutral-300" />;
    default:
      return <Circle className="h-4 w-4 text-neutral-300" />;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDocumentForRequirement(
  requirement: ResearchRequirement,
  documents: GeneratedDocument[],
): GeneratedDocument | undefined {
  // Match by requirementId if set, otherwise match by name similarity
  const byId = documents.find((doc) => doc.requirementId === requirement.id);
  if (byId) return byId;

  // Normalize names for matching: "Planning Statement" matches document named "Planning Statement"
  const reqNameLower = requirement.name.toLowerCase().replace(/\s+/g, '_');
  return documents.find((doc) => {
    const docNameLower = doc.name.toLowerCase().replace(/\s+/g, '_');
    return docNameLower.includes(reqNameLower) || reqNameLower.includes(docNameLower);
  });
}

function getRowStatus(
  requirement: ResearchRequirement,
  document?: GeneratedDocument,
): AgentStatus | 'user_provides' {
  if (!requirement.isGenerated) return 'user_provides';
  if (!document) return 'idle';
  return document.status;
}

// ─── Success Banner ──────────────────────────────────────────────────────────

function SuccessBanner({
  completedCount,
  onDownloadAll,
}: {
  completedCount: number;
  onDownloadAll?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2.5">
            <PackageCheck className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Your application package is ready
              </p>
              <p className="text-xs text-emerald-700">
                {completedCount} document{completedCount !== 1 ? 's' : ''} generated
              </p>
            </div>
          </div>
          {onDownloadAll && (
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              onClick={onDownloadAll}
            >
              <Download className="h-3.5 w-3.5" />
              Download All
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface ApplicationPackageProps {
  requirements: ResearchRequirement[];
  documents: GeneratedDocument[];
  onDownloadAll?: () => void;
}

export function ApplicationPackage({
  requirements,
  documents,
  onDownloadAll,
}: ApplicationPackageProps) {
  const generatedDocs = documents.filter((d) => d.status === 'complete');
  const allGeneratedComplete = requirements
    .filter((r) => r.isGenerated)
    .every((r) => {
      const doc = getDocumentForRequirement(r, documents);
      return doc?.status === 'complete';
    });
  const hasAnyGenerated = requirements.some((r) => r.isGenerated);
  const showSuccessBanner = hasAnyGenerated && allGeneratedComplete && generatedDocs.length > 0;

  return (
    <div className="space-y-4">
      {showSuccessBanner && (
        <SuccessBanner
          completedCount={generatedDocs.length}
          onDownloadAll={onDownloadAll}
        />
      )}

      <Card>
        <CardHeader className="pb-2">
          <p className="text-sm font-semibold text-foreground">Application Package Checklist</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="w-10 pb-2 pr-3 text-xs font-medium text-foreground-muted">
                    Status
                  </th>
                  <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">
                    Document
                  </th>
                  <th className="w-32 pb-2 text-right text-xs font-medium text-foreground-muted">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((requirement) => {
                  const doc = getDocumentForRequirement(requirement, documents);
                  const rowStatus = getRowStatus(requirement, doc);

                  return (
                    <tr
                      key={requirement.id}
                      className="border-b border-border-muted last:border-b-0"
                    >
                      <td className="py-2.5 pr-3">
                        <StatusIcon status={rowStatus} />
                      </td>
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-foreground">{requirement.name}</p>
                        {requirement.description && (
                          <p className="mt-0.5 text-xs text-foreground-muted">
                            {requirement.description}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        {rowStatus === 'complete' && doc?.downloadUrl ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={async () => {
                              try {
                                const { apiClient } = await import('@/lib/api/client');
                                const response = await apiClient.get(
                                  `/planify/documents/${doc.id}/download`,
                                  { responseType: 'blob' },
                                );
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${doc.name.replace(/\s+/g, '-').toLowerCase()}.docx`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                a.remove();
                              } catch (err) {
                                console.error('Download failed:', err);
                              }
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </Button>
                        ) : rowStatus === 'running' ? (
                          <span className="text-xs text-amber-600">Generating...</span>
                        ) : rowStatus === 'failed' ? (
                          <span className="text-xs text-red-600">
                            {doc?.error || 'Failed'}
                          </span>
                        ) : rowStatus === 'user_provides' ? (
                          <span className="text-xs text-foreground-muted">You provide</span>
                        ) : (
                          <span className="text-xs text-foreground-subtle">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

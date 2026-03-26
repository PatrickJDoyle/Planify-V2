'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Send,
  Loader2,
  Search,
  AlertCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/shared/status-badge';
import { useConversationalSearch } from '@/lib/queries/conversational-search';
import type { ConversationalSearchResponse } from '@/lib/api/conversational-search';
import type { Application } from '@/lib/types/application';
import { formatAddress } from '@/lib/utils/formatting';
import { formatDate } from '@/lib/utils/dates';

interface ResearchAssistantProps {
  title?: string;
  description?: string;
  suggestions?: string[];
  contextPrefix?: string;
  maxResults?: number;
}

interface SearchTurn {
  id: string;
  query: string;
  response: ConversationalSearchResponse;
  createdAt: string;
}

function buildId() {
  return `turn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatExecutionTime(ms?: number) {
  if (typeof ms !== 'number') return null;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function deriveDecision(application: Application) {
  return (
    application.displayDecision ||
    application.decision ||
    application.displayStatus ||
    application.applicationStatus ||
    'Unknown'
  );
}

export function ResearchAssistant({
  title = 'AI Research Assistant',
  description = 'Ask natural-language questions about Irish planning activity and get grounded results from your dataset.',
  suggestions = [],
  contextPrefix,
  maxResults = 100,
}: ResearchAssistantProps) {
  const router = useRouter();
  const searchMutation = useConversationalSearch();

  const [query, setQuery] = useState('');
  const [turns, setTurns] = useState<SearchTurn[]>([]);

  const lastTurn = turns[0] ?? null;
  const pending = searchMutation.isPending;

  const canSubmit = query.trim().length > 2 && !pending;

  const contextLabel = useMemo(() => {
    if (!contextPrefix) return null;
    return contextPrefix.length > 140
      ? `${contextPrefix.slice(0, 137)}...`
      : contextPrefix;
  }, [contextPrefix]);

  const runQuery = async (rawQuery: string) => {
    const trimmedQuery = rawQuery.trim();
    if (trimmedQuery.length < 3) return;

    const contextualQuery = contextPrefix
      ? `${trimmedQuery}\n\nContext: ${contextPrefix}`
      : trimmedQuery;

    try {
      const response = await searchMutation.mutateAsync({
        query: contextualQuery,
        includeExtendedData: true,
        maxResults,
      });

      const turn: SearchTurn = {
        id: buildId(),
        query: trimmedQuery,
        response,
        createdAt: new Date().toISOString(),
      };

      setTurns((current) => [turn, ...current].slice(0, 8));
      setQuery('');
    } catch {
      // Error is surfaced via searchMutation.error
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-brand-500" />
                <p className="text-sm font-semibold text-foreground">{title}</p>
              </div>
              <p className="mt-1 text-xs text-foreground-muted">{description}</p>
            </div>
            <Badge className="bg-brand-500/10 text-brand-500">Grounded Search</Badge>
          </div>
          {contextLabel && (
            <p className="mt-3 rounded-md border border-border bg-background-subtle px-3 py-2 text-xs text-foreground-subtle">
              Context: {contextLabel}
            </p>
          )}
        </CardHeader>
        <Separator />
        <CardContent className="space-y-3 pt-4">
          <textarea
            className="min-h-[90px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="e.g. Show me granted residential extensions in this area in the last 2 years"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 4).map((suggestion) => (
              <Button
                key={suggestion}
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs"
                disabled={pending}
                onClick={() => {
                  setQuery(suggestion);
                  void runQuery(suggestion);
                }}
              >
                <Sparkles className="h-3 w-3" />
                {suggestion.length > 64 ? `${suggestion.slice(0, 61)}...` : suggestion}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-foreground-subtle">
              Up to {maxResults} results per query. Rate-limited by backend.
            </p>
            <Button
              size="sm"
              className="gap-1.5 bg-brand-500 hover:bg-brand-600"
              onClick={() => void runQuery(query)}
              disabled={!canSubmit}
            >
              {pending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Searching…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Ask Assistant
                </>
              )}
            </Button>
          </div>

          {searchMutation.error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {(searchMutation.error as Error).message || 'Failed to run conversational search.'}
            </div>
          )}
        </CardContent>
      </Card>

      {lastTurn && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">Latest Response</p>
              <span className="text-[11px] text-foreground-subtle">
                {new Date(lastTurn.createdAt).toLocaleTimeString('en-IE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-xs text-foreground-muted">“{lastTurn.query}”</p>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-3 pt-4">
            {lastTurn.response.success ? (
              <>
                <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                  <Badge variant="outline">
                    {lastTurn.response.metadata?.returned ?? 0} returned
                  </Badge>
                  <Badge variant="outline">
                    {lastTurn.response.metadata?.totalCount ?? 0} total
                  </Badge>
                  {formatExecutionTime(lastTurn.response.metadata?.executionTime) && (
                    <Badge variant="outline">
                      {formatExecutionTime(lastTurn.response.metadata?.executionTime)}
                    </Badge>
                  )}
                </div>

                {lastTurn.response.metadata?.query?.understood?.filters?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {lastTurn.response.metadata.query.understood.filters.slice(0, 6).map((filter) => (
                      <Badge key={filter} className="bg-brand-500/10 text-[10px] text-brand-500">
                        {filter}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                {(lastTurn.response.results ?? []).length === 0 ? (
                  <p className="text-sm text-foreground-muted">No matching applications were found for this query.</p>
                ) : (
                  <div className="space-y-2">
                    {(lastTurn.response.results ?? []).slice(0, 6).map((application) => (
                      <div key={application.applicationId} className="rounded-md border border-border px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => router.push(`/applications/${application.applicationId}`)}
                            className="text-left text-sm font-semibold text-foreground hover:text-brand-500"
                          >
                            {application.applicationNumber}
                          </button>
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              displayStatus={deriveDecision(application)}
                              statusCategory={application.decisionCategory}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 gap-1 px-2 text-xs"
                              onClick={() => router.push(`/applications/${application.applicationId}`)}
                            >
                              Open
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-foreground-muted">
                          {formatAddress(
                            application.formattedAddress ?? application.developmentAddress,
                            96,
                          )}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-foreground-subtle">
                          <span>{application.planningAuthority || 'Authority unknown'}</span>
                          <span>Received {formatDate(application.receivedDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-destructive">
                      {lastTurn.response.error?.message || 'The assistant could not process this query.'}
                    </p>
                    {lastTurn.response.error?.suggestions?.length ? (
                      <ul className="list-disc pl-4 text-xs text-destructive">
                        {lastTurn.response.error.suggestions.slice(0, 3).map((suggestion) => (
                          <li key={suggestion}>{suggestion}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {turns.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-semibold text-foreground">Recent Queries</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {turns.slice(1).map((turn) => (
              <button
                key={turn.id}
                className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left hover:bg-background-subtle"
                onClick={() => setQuery(turn.query)}
              >
                <span className="line-clamp-1 text-xs text-foreground">{turn.query}</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-foreground-subtle">
                  <Search className="h-3 w-3" />
                  {turn.response.metadata?.returned ?? 0}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

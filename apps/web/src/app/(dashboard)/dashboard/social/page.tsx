"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Clock,
  ExternalLink,
  Eye,
  Loader2,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ThumbsUp,
  X,
} from "lucide-react";
import type {
  BrandEvidenceAudit,
  FindingRecord,
  FindingSource,
  FindingStatus,
  FindingTaskRecord,
  SignalInboxResponse,
  SourceCoverageRecord,
} from "@mentionpilot/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { useProject } from "@/lib/use-project";

type StatusFilter = "all" | FindingStatus;
type SourceFilter = "all" | FindingSource;

interface EvidenceAuditResponse {
  audit: BrandEvidenceAudit;
  audited_url: string;
  checked_at: string;
  limitation: string;
}

const SOURCE_STYLES: Record<FindingSource, string> = {
  hackernews: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  reddit_insights: "bg-primary/10 text-primary",
};

const STATUS_STYLES: Record<FindingStatus, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  reviewed: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  dismissed: "bg-muted text-muted-foreground",
};

function formatDate(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : "Not available";
}

function coverageTone(status: SourceCoverageRecord["status"]) {
  if (status === "ok") return "default" as const;
  if (status === "failed") return "destructive" as const;
  return "secondary" as const;
}

export default function SignalInboxPage() {
  const { projectId, loading: projectLoading } = useProject();
  const [inbox, setInbox] = useState<SignalInboxResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [source, setSource] = useState<SourceFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [audit, setAudit] = useState<EvidenceAuditResponse | null>(null);
  const [auditing, setAuditing] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (source !== "all") params.set("source", source);
      const query = params.size ? `?${params}` : "";
      setInbox(await apiFetch<SignalInboxResponse>(`/v1/intelligence/${projectId}/inbox${query}`));
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId, source, status]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    if (!projectId) return;
    setRefreshing(true);
    setError(null);
    try {
      await apiFetch(`/v1/intelligence/${projectId}/refresh`, {
        method: "POST",
        body: JSON.stringify({ days: 90 }),
      });
      await load();
    } catch (refreshError) {
      setError((refreshError as Error).message);
    } finally {
      setRefreshing(false);
    }
  };

  const updateStatus = async (finding: FindingRecord, nextStatus: FindingStatus) => {
    if (!projectId) return;
    setError(null);
    try {
      await apiFetch(`/v1/intelligence/${projectId}/findings/${finding.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await load();
    } catch (updateError) {
      setError((updateError as Error).message);
    }
  };

  const runAudit = async () => {
    if (!projectId) return;
    setAuditing(true);
    setError(null);
    try {
      setAudit(await apiFetch<EvidenceAuditResponse>(
        `/v1/intelligence/${projectId}/evidence-audit`,
        { method: "POST", body: "{}" }
      ));
    } catch (auditError) {
      setError((auditError as Error).message);
    } finally {
      setAuditing(false);
    }
  };

  const createTask = async (finding: FindingRecord) => {
    if (!projectId) return;
    setError(null);
    try {
      await apiFetch(`/v1/intelligence/${projectId}/findings/${finding.id}/tasks`, {
        method: "POST",
        body: JSON.stringify({ title: `Follow up: ${finding.title}` }),
      });
      await load();
    } catch (taskError) {
      setError((taskError as Error).message);
    }
  };

  const updateTask = async (task: FindingTaskRecord, nextStatus: "open" | "completed") => {
    if (!projectId) return;
    setError(null);
    try {
      await apiFetch(`/v1/intelligence/${projectId}/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await load();
    } catch (taskError) {
      setError((taskError as Error).message);
    }
  };

  const summary = inbox?.summary;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Signal Inbox</h1>
          <p className="text-muted-foreground">
            Review prioritized, source-linked brand and competitor findings without automatic replies.
          </p>
        </div>
        <Button onClick={refresh} disabled={refreshing || projectLoading}>
          {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh 90 days
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-5">
        {[
          ["Total", summary?.total ?? 0],
          ["New", summary?.new ?? 0],
          ["Reviewed", summary?.reviewed ?? 0],
          ["Resolved", summary?.resolved ?? 0],
          ["Dismissed", summary?.dismissed ?? 0],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold">{value}</div>
              <p className="text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Source coverage</CardTitle>
          <CardDescription>
            Freshness and limitations are shown per source. A successful request is not presented as complete coverage.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {(inbox?.coverage ?? []).map((item) => (
            <div key={item.source} className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{item.label}</p>
                <Badge variant={coverageTone(item.status)}>{item.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.message}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{item.records_seen} inspected</span>
                <span>{item.records_matched} matched</span>
                <span>Source date: {formatDate(item.source_updated_at)}</span>
                <span>Checked: {formatDate(item.checked_at)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Prioritized findings</CardTitle>
                <CardDescription>Repeated refreshes update existing source records instead of duplicating them.</CardDescription>
              </div>
              <div className="flex gap-2">
                <select
                  aria-label="Filter by status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as StatusFilter)}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="all">All statuses</option>
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
                <select
                  aria-label="Filter by source"
                  value={source}
                  onChange={(event) => setSource(event.target.value as SourceFilter)}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="all">All sources</option>
                  <option value="hackernews">Hacker News</option>
                  <option value="reddit_insights">Reddit Insights</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {projectLoading || loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : !inbox?.findings.length ? (
              <div className="py-12 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 font-medium">No findings in this view</p>
                <p className="mt-1 text-sm text-muted-foreground">Configure keywords and Reddit communities, then refresh the inbox.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inbox.findings.map((finding) => (
                  <article key={finding.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={SOURCE_STYLES[finding.source]}>{finding.source_name}</Badge>
                      <Badge className={STATUS_STYLES[finding.status]}>{finding.status}</Badge>
                      <Badge variant="outline">{finding.intent.replaceAll("_", " ")}</Badge>
                      <span className="ml-auto text-xs font-semibold">Relevance {finding.relevance_score}</span>
                    </div>
                    <h2 className="mt-3 font-semibold leading-snug">{finding.title}</h2>
                    {finding.content && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{finding.content}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(finding.published_at)}</span>
                      <span>Observed: {formatDate(finding.last_seen_at)}</span>
                      {finding.engagement_score !== null && <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{finding.engagement_score}</span>}
                      {finding.comment_count !== null && <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{finding.comment_count}</span>}
                      {finding.matched_keywords.length > 0 && <span>Matched: {finding.matched_keywords.join(", ")}</span>}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a href={finding.url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline"><ExternalLink className="mr-2 h-4 w-4" />Open evidence</Button>
                      </a>
                      {finding.status === "new" && (
                        <Button size="sm" variant="secondary" onClick={() => updateStatus(finding, "reviewed")}>
                          <Eye className="mr-2 h-4 w-4" />Mark reviewed
                        </Button>
                      )}
                      {finding.status !== "resolved" && finding.status !== "dismissed" && (
                        <Button size="sm" onClick={() => updateStatus(finding, "resolved")}>
                          <Check className="mr-2 h-4 w-4" />Resolve
                        </Button>
                      )}
                      {finding.status !== "dismissed" && finding.status !== "resolved" && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(finding, "dismissed")}>
                          <X className="mr-2 h-4 w-4" />Dismiss
                        </Button>
                      )}
                      {!inbox.tasks.some((task) => task.finding_id === finding.id && task.status === "open") && (
                        <Button size="sm" variant="outline" onClick={() => createTask(finding)}>
                          Create task
                        </Button>
                      )}
                      {(finding.status === "dismissed" || finding.status === "resolved") && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(finding, "new")}>
                          <RotateCcw className="mr-2 h-4 w-4" />Reopen
                        </Button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Perception clusters</CardTitle>
              <CardDescription>Deterministic labels over the visible source text.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-4 text-sm">
                <span>{inbox?.perception.ownedMentions ?? 0} brand</span>
                <span>{inbox?.perception.competitorMentions ?? 0} competitor</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-md border p-2">
                  <strong className="block text-lg">{inbox?.metrics.actionable_findings ?? 0}</strong>
                  actionable
                </div>
                <div className="rounded-md border p-2">
                  <strong className="block text-lg">
                    {inbox?.metrics.useful_finding_rate == null ? "—" : `${Math.round(inbox.metrics.useful_finding_rate * 100)}%`}
                  </strong>
                  useful rate
                </div>
                <div className="rounded-md border p-2">
                  <strong className="block text-lg">
                    {inbox?.metrics.resolution_rate == null ? "—" : `${Math.round(inbox.metrics.resolution_rate * 100)}%`}
                  </strong>
                  resolution rate
                </div>
                <div className="rounded-md border p-2">
                  <strong className="block text-lg">{inbox?.metrics.refresh_count ?? 0}</strong>
                  refreshes
                </div>
              </div>
              {(inbox?.perception.clusters ?? []).map((cluster) => (
                <div key={cluster.bucket} className="rounded-md border px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>{cluster.bucket.replaceAll("_", " ")}</span>
                    <Badge variant="secondary">{cluster.mentions.length}</Badge>
                  </div>
                  <a
                    href={cluster.mentions[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block line-clamp-2 text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    {cluster.mentions[0].text}
                  </a>
                </div>
              ))}
              {!inbox?.perception.clusters.length && <p className="text-sm text-muted-foreground">No findings to cluster yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow-up tasks</CardTitle>
              <CardDescription>Private tasks created from findings; no public reply is sent.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(inbox?.tasks ?? []).slice(0, 10).map((task) => (
                <div key={task.id} className="rounded-md border p-3 text-sm">
                  <p className={task.status === "completed" ? "text-muted-foreground line-through" : "font-medium"}>{task.title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant={task.status === "completed" ? "secondary" : "default"}>{task.status}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateTask(task, task.status === "open" ? "completed" : "open")}
                    >
                      {task.status === "open" ? "Complete" : "Reopen"}
                    </Button>
                  </div>
                </div>
              ))}
              {!inbox?.tasks.length && <p className="text-sm text-muted-foreground">Create a task from any finding that needs follow-up.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Evidence readiness</CardTitle>
              <CardDescription>Heuristic audit of the configured public homepage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={runAudit} disabled={auditing} className="w-full">
                {auditing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Run evidence audit
              </Button>
              {audit && (
                <div className="space-y-3">
                  <div className="text-center"><span className="text-4xl font-bold">{audit.audit.overallScore}</span><span className="text-muted-foreground">/100</span></div>
                  <p className="text-sm">{audit.audit.recommendationSummary}</p>
                  <div className="space-y-2">
                    {audit.audit.tasks.slice(0, 4).map((task) => (
                      <div key={task.area} className="rounded-md border p-3 text-sm">
                        <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>{task.priority}</Badge>
                        <p className="mt-2">{task.title}</p>
                      </div>
                    ))}
                  </div>
                  <a
                    href={audit.audited_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-all text-xs text-primary underline-offset-2 hover:underline"
                  >
                    Audited {audit.audited_url} on {formatDate(audit.checked_at)}
                  </a>
                  <p className="text-xs text-muted-foreground">{audit.limitation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Finding history</CardTitle>
              <CardDescription>Ingestion and review actions retained for this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(inbox?.history ?? []).slice(0, 10).map((event) => (
                <div key={event.id} className="border-l-2 pl-3 text-sm">
                  <p><span className="font-medium capitalize">{event.action}</span> {event.finding_title || "finding"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(event.created_at)}</p>
                </div>
              ))}
              {!inbox?.history.length && <p className="text-sm text-muted-foreground">History appears after the first refresh.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

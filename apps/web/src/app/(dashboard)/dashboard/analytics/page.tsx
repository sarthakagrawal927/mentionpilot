"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, TrendingUp, Users, BarChart3, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import { useProject } from "@/lib/use-project";

function Bar({
  value,
  max,
  label,
  color = "bg-primary",
}: {
  value: number;
  max: number;
  label: string;
  color?: string;
}) {
  const width = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-24 truncate text-muted-foreground">
        {label}
      </span>
      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-sm font-medium w-12 text-right">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

interface TrendCheck {
  id: string;
  status: string;
  brand_mention_rate: number | null;
  total_queries: number;
  completed_queries: number;
  created_at: string;
}

interface ShareOfVoice {
  brand: number;
  competitors: Record<string, number>;
  total: number;
}

interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
}

interface CitationEntry {
  domain: string;
  count: number;
}

export default function AnalyticsPage() {
  const { projectId, loading: projectLoading } = useProject();
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<TrendCheck[]>([]);
  const [sov, setSov] = useState<ShareOfVoice | null>(null);
  const [platforms, setPlatforms] = useState<Record<string, number>>({});
  const [sentiment, setSentiment] = useState<SentimentData>({
    positive: 0,
    neutral: 0,
    negative: 0,
  });
  const [citations, setCitations] = useState<CitationEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const [t, s, p, se, ci] = await Promise.all([
        apiFetch<{ checks: TrendCheck[] }>(
          `/v1/analytics/${projectId}/trends`
        ),
        apiFetch<ShareOfVoice>(
          `/v1/analytics/${projectId}/share-of-voice`
        ),
        apiFetch<{ platforms: Record<string, number> }>(
          `/v1/analytics/${projectId}/platform-breakdown`
        ),
        apiFetch<SentimentData>(
          `/v1/analytics/${projectId}/sentiment-breakdown`
        ),
        apiFetch<{ citations: CitationEntry[] }>(
          `/v1/analytics/${projectId}/citations`
        ),
      ]);
      setTrends(t.checks);
      setSov(s);
      setPlatforms(p.platforms);
      setSentiment(se);
      setCitations(ci.citations);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  if (projectLoading || loading)
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  const totalSentiment =
    sentiment.positive + sentiment.neutral + sentiment.negative;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          AI visibility trends and competitive intelligence.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Mention Rate Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trends.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Run some checks to see trends.
            </p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {trends
                .slice()
                .reverse()
                .map((check, i) => {
                  const rate = check.brand_mention_rate ?? 0;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-full bg-primary rounded-t"
                        style={{
                          height: `${rate * 100}%`,
                          minHeight: rate > 0 ? "4px" : "0",
                        }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {Math.round(rate * 100)}%
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Share of Voice */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Share of Voice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sov && sov.total > 0 ? (
              <>
                <Bar value={sov.brand} max={1} label="You" color="bg-primary" />
                {Object.entries(sov.competitors).map(([name, rate]) => (
                  <Bar
                    key={name}
                    value={rate}
                    max={1}
                    label={name}
                    color="bg-muted-foreground/50"
                  />
                ))}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No data yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              By Platform
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(platforms).length > 0 ? (
              Object.entries(platforms).map(([name, rate]) => (
                <Bar key={name} value={rate} max={1} label={name} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No data yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Sentiment */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            {totalSentiment > 0 ? (
              <div className="flex gap-2 h-8 rounded-full overflow-hidden">
                {sentiment.positive > 0 && (
                  <div
                    className="bg-green-500"
                    style={{ flex: sentiment.positive }}
                  />
                )}
                {sentiment.neutral > 0 && (
                  <div
                    className="bg-yellow-500"
                    style={{ flex: sentiment.neutral }}
                  />
                )}
                {sentiment.negative > 0 && (
                  <div
                    className="bg-red-500"
                    style={{ flex: sentiment.negative }}
                  />
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No data yet.
              </p>
            )}
            <div className="flex justify-between mt-3 text-sm">
              <span className="text-green-500">
                Positive: {sentiment.positive}
              </span>
              <span className="text-yellow-500">
                Neutral: {sentiment.neutral}
              </span>
              <span className="text-red-500">
                Negative: {sentiment.negative}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Citations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Top Cited Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            {citations.length > 0 ? (
              <div className="space-y-2">
                {citations.slice(0, 10).map((c) => (
                  <div
                    key={c.domain}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate text-muted-foreground">
                      {c.domain}
                    </span>
                    <Badge variant="secondary">{c.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No citations found yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

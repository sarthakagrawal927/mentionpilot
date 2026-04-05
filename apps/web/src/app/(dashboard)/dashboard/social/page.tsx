"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, ExternalLink, MessageSquare, ThumbsUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { useProject } from "@/lib/use-project";

type Source = "all" | "hackernews" | "reddit" | "producthunt";

interface FeedItem {
  id: string;
  source: "hackernews" | "reddit" | "producthunt";
  title: string;
  content: string | null;
  url: string;
  author: string | null;
  score: number | null;
  comments: number | null;
  created_at: string;
}

interface FeedResponse {
  feed: FeedItem[];
  total: number;
  sources: {
    hackernews: number;
    reddit: number;
    producthunt: number;
  };
}

const SOURCE_CONFIG: Record<
  "hackernews" | "reddit" | "producthunt",
  { label: string; color: string; bgColor: string }
> = {
  hackernews: {
    label: "Hacker News",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  reddit: {
    label: "Reddit",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  producthunt: {
    label: "Product Hunt",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
};

export default function SocialPage() {
  const { projectId, loading: projectLoading } = useProject();
  const [loading, setLoading] = useState(true);
  const [feedData, setFeedData] = useState<FeedResponse | null>(null);
  const [competitorData, setCompetitorData] = useState<
    Record<string, { mentions: number }>
  >({});
  const [days, setDays] = useState(30);
  const [activeSource, setActiveSource] = useState<Source>("all");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [feed, comp] = await Promise.all([
        apiFetch<FeedResponse>(`/v1/social/${projectId}/feed?days=${days}`),
        apiFetch<{ competitors: Record<string, { mentions: number }> }>(
          `/v1/social/${projectId}/hn/competitors?days=${days}`
        ),
      ]);
      setFeedData(feed);
      setCompetitorData(comp.competitors);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId, days]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredFeed =
    feedData?.feed.filter(
      (item) => activeSource === "all" || item.source === activeSource
    ) || [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Social Monitoring
        </h1>
        <p className="text-muted-foreground">
          Track brand mentions across Hacker News, Reddit, and Product Hunt.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Time filter */}
      <div className="flex gap-2">
        {[7, 30, 90].map((d) => (
          <Button
            key={d}
            variant={days === d ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(d)}
          >
            {d}d
          </Button>
        ))}
      </div>

      {projectLoading || loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Source stats cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card
              className={`cursor-pointer transition-shadow ${activeSource === "all" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
              onClick={() => setActiveSource("all")}
            >
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">
                  {feedData?.total || 0}
                </div>
                <p className="text-sm text-muted-foreground">All Mentions</p>
              </CardContent>
            </Card>
            {(
              ["hackernews", "reddit", "producthunt"] as const
            ).map((source) => (
              <Card
                key={source}
                className={`cursor-pointer transition-shadow ${activeSource === source ? "ring-2 ring-primary" : "hover:shadow-md"}`}
                onClick={() => setActiveSource(source)}
              >
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold">
                    {feedData?.sources[source] || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span
                      className={`inline-flex items-center gap-1.5 ${SOURCE_CONFIG[source].color}`}
                    >
                      {SOURCE_CONFIG[source].label}
                    </span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Competitor comparison */}
          {Object.keys(competitorData).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Competitor HN Mentions ({days}d)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm w-32 truncate font-medium">You</span>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          ((feedData?.sources.hackernews || 0) /
                            Math.max(
                              feedData?.sources.hackernews || 0,
                              ...Object.values(competitorData).map(
                                (c) => c.mentions
                              )
                            )) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">
                    {feedData?.sources.hackernews || 0}
                  </span>
                </div>
                {Object.entries(competitorData).map(([name, data]) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-sm w-32 truncate text-muted-foreground">
                      {name}
                    </span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-muted-foreground/40 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (data.mentions /
                              Math.max(
                                feedData?.sources.hackernews || 0,
                                ...Object.values(competitorData).map(
                                  (c) => c.mentions
                                )
                              )) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm w-8 text-right">
                      {data.mentions}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Source tabs */}
          <div className="flex gap-2 border-b pb-2">
            {(
              [
                { key: "all", label: "All Sources" },
                { key: "hackernews", label: "Hacker News" },
                { key: "reddit", label: "Reddit" },
                { key: "producthunt", label: "Product Hunt" },
              ] as const
            ).map((tab) => (
              <Button
                key={tab.key}
                variant={activeSource === tab.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveSource(tab.key)}
              >
                {tab.label}
                {tab.key !== "all" && feedData?.sources[tab.key] != null && (
                  <span className="ml-1.5 text-xs opacity-70">
                    ({feedData.sources[tab.key]})
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Unified feed */}
          <Card>
            <CardHeader>
              <CardTitle>
                {activeSource === "all"
                  ? "All Mentions"
                  : SOURCE_CONFIG[activeSource]?.label + " Mentions"}
              </CardTitle>
              <CardDescription>
                {activeSource === "all"
                  ? "Brand mentions across all monitored platforms"
                  : `Brand mentions on ${SOURCE_CONFIG[activeSource]?.label}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFeed.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No mentions found in the last {days} days.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredFeed.slice(0, 50).map((item) => {
                    const cfg = SOURCE_CONFIG[item.source];
                    return (
                      <div
                        key={item.id}
                        className="rounded-md border p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${cfg.bgColor} ${cfg.color} border-0`}
                              >
                                {cfg.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {item.author ? `by ${item.author}` : ""}
                                {item.author ? " \u00B7 " : ""}
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{item.title}</p>
                            {item.content && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {item.content}
                              </p>
                            )}
                          </div>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          {item.score !== null && (
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" /> {item.score}
                            </span>
                          )}
                          {item.comments !== null && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />{" "}
                              {item.comments}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Settings2,
  RefreshCw,
  Trash2,
  Pencil,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Bot,
  FileCode,
  BarChart3,
  Globe,
  Zap,
  FileText,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
const DEMO_TOKEN = "";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
      ...(DEMO_TOKEN ? { Authorization: `Bearer ${DEMO_TOKEN}` } : {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AXPConfig {
  origin_url: string;
  deploy_type: "cloudflare" | "vercel";
  deploy_key?: string;
}

interface AXPPage {
  id: string;
  path: string;
  title: string;
  source_tokens: number;
  optimized_tokens: number;
  reduction_pct: number;
  last_crawled: string;
  optimized_content?: string;
}

interface AXPStats {
  total_pages: number;
  total_source_tokens: number;
  total_optimized_tokens: number;
  reduction_pct: number;
}

interface BotVisit {
  bot: string;
  count: number;
}

interface PageVisit {
  path: string;
  count: number;
}

interface DailyVisit {
  date: string;
  count: number;
}

interface AXPAnalytics {
  total_visits: number;
  by_bot: BotVisit[];
  top_pages: PageVisit[];
  over_time: DailyVisit[];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AXPPage() {
  const [projectId] = useState("demo");
  const [loading, setLoading] = useState(true);

  // Config
  const [originUrl, setOriginUrl] = useState("");
  const [deployType, setDeployType] = useState<"cloudflare" | "vercel">(
    "cloudflare"
  );
  const [deployKey, setDeployKey] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  // Crawl
  const [maxPages, setMaxPages] = useState("20");
  const [crawling, setCrawling] = useState(false);
  const [crawlStatus, setCrawlStatus] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState<AXPStats | null>(null);

  // Pages
  const [pages, setPages] = useState<AXPPage[]>([]);
  const [expandedPage, setExpandedPage] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [savingPage, setSavingPage] = useState(false);

  // Middleware
  const [middlewareTab, setMiddlewareTab] = useState<"cloudflare" | "vercel">(
    "cloudflare"
  );
  const [middlewareCode, setMiddlewareCode] = useState("");
  const [loadingMiddleware, setLoadingMiddleware] = useState(false);
  const [copiedMiddleware, setCopiedMiddleware] = useState(false);

  // Analytics
  const [analyticsRange, setAnalyticsRange] = useState<"7d" | "30d" | "90d">(
    "7d"
  );
  const [analytics, setAnalytics] = useState<AXPAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  const loadConfig = useCallback(async () => {
    try {
      const cfg = await api<AXPConfig>(
        `/v1/axp/${projectId}/config`
      );
      setOriginUrl(cfg.origin_url || "");
      setDeployType(cfg.deploy_type || "cloudflare");
      setDeployKey(cfg.deploy_key || null);
    } catch {
      // No config yet
    }
  }, [projectId]);

  const loadStats = useCallback(async () => {
    try {
      const s = await api<AXPStats>(`/v1/axp/${projectId}/stats`);
      setStats(s);
    } catch {
      // No stats yet
    }
  }, [projectId]);

  const loadPages = useCallback(async () => {
    try {
      const data = await api<{ pages: AXPPage[] }>(
        `/v1/axp/${projectId}/pages`
      );
      setPages(data.pages || []);
    } catch {
      // No pages yet
    }
  }, [projectId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadConfig(), loadStats(), loadPages()]);
    setLoading(false);
  }, [loadConfig, loadStats, loadPages]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ---------------------------------------------------------------------------
  // Middleware code
  // ---------------------------------------------------------------------------

  const loadMiddleware = useCallback(
    async (type: "cloudflare" | "vercel") => {
      setLoadingMiddleware(true);
      try {
        const data = await api<{ code: string }>(
          `/v1/axp/${projectId}/middleware-code?type=${type}`
        );
        setMiddlewareCode(data.code || "");
      } catch {
        setMiddlewareCode("// Failed to load middleware code");
      } finally {
        setLoadingMiddleware(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    loadMiddleware(middlewareTab);
  }, [middlewareTab, loadMiddleware]);

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------

  const loadAnalytics = useCallback(
    async (range: string) => {
      setLoadingAnalytics(true);
      try {
        const data = await api<AXPAnalytics>(
          `/v1/axp/${projectId}/analytics?range=${range}`
        );
        setAnalytics(data);
      } catch {
        setAnalytics(null);
      } finally {
        setLoadingAnalytics(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    loadAnalytics(analyticsRange);
  }, [analyticsRange, loadAnalytics]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      const result = await api<AXPConfig>(
        `/v1/axp/${projectId}/config`,
        {
          method: "POST",
          body: JSON.stringify({
            origin_url: originUrl,
            deploy_type: deployType,
          }),
        }
      );
      setDeployKey(result.deploy_key || null);
    } catch {
      // Error saving
    } finally {
      setSavingConfig(false);
    }
  };

  const triggerCrawl = async () => {
    setCrawling(true);
    setCrawlStatus("Crawling...");
    try {
      const data = await api<{ status: string; pages_found?: number }>(
        `/v1/axp/${projectId}/crawl`,
        {
          method: "POST",
          body: JSON.stringify({ max_pages: parseInt(maxPages) || 20 }),
        }
      );
      setCrawlStatus(
        `Done — ${data.pages_found ?? 0} pages found`
      );
      await Promise.all([loadStats(), loadPages()]);
    } catch {
      setCrawlStatus("Crawl failed");
    } finally {
      setCrawling(false);
    }
  };

  const expandPage = async (pageId: string) => {
    if (expandedPage === pageId) {
      setExpandedPage(null);
      setEditingPage(null);
      return;
    }
    setExpandedPage(pageId);
    setEditingPage(null);
    // Load full content if not already present
    const existing = pages.find((p) => p.id === pageId);
    if (existing && !existing.optimized_content) {
      try {
        const full = await api<AXPPage>(
          `/v1/axp/${projectId}/pages/${pageId}`
        );
        setPages((prev) =>
          prev.map((p) => (p.id === pageId ? { ...p, ...full } : p))
        );
      } catch {
        // Failed to load content
      }
    }
  };

  const startEditing = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    setEditingPage(pageId);
    setEditContent(page?.optimized_content || "");
  };

  const savePageContent = async (pageId: string) => {
    setSavingPage(true);
    try {
      const updated = await api<AXPPage>(
        `/v1/axp/${projectId}/pages/${pageId}`,
        {
          method: "PUT",
          body: JSON.stringify({ optimized_content: editContent }),
        }
      );
      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, ...updated } : p))
      );
      setEditingPage(null);
    } catch {
      // Error saving
    } finally {
      setSavingPage(false);
    }
  };

  const deletePage = async (pageId: string) => {
    try {
      await api(`/v1/axp/${projectId}/pages/${pageId}`, {
        method: "DELETE",
      });
      setPages((prev) => prev.filter((p) => p.id !== pageId));
      if (expandedPage === pageId) setExpandedPage(null);
    } catch {
      // Error deleting
    }
  };

  const copyMiddleware = async () => {
    await navigator.clipboard.writeText(middlewareCode);
    setCopiedMiddleware(true);
    setTimeout(() => setCopiedMiddleware(false), 2000);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const maxBotCount =
    analytics?.by_bot.reduce((max, b) => Math.max(max, b.count), 0) || 1;
  const maxTimeCount =
    analytics?.over_time.reduce((max, d) => Math.max(max, d.count), 0) || 1;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AXP Shadow Site</h1>
        <p className="text-muted-foreground">
          Serve AI-optimized content to AI bots visiting your site. Reduce token
          usage and improve how AI agents understand your pages.
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 1. Setup Card                                                     */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Setup
          </CardTitle>
          <CardDescription>
            Configure your origin URL and deployment method.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="origin-url">Origin URL</Label>
              <Input
                id="origin-url"
                placeholder="https://yoursite.com"
                value={originUrl}
                onChange={(e) => setOriginUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Deploy Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={
                    deployType === "cloudflare" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setDeployType("cloudflare")}
                >
                  Cloudflare Worker
                </Button>
                <Button
                  variant={deployType === "vercel" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDeployType("vercel")}
                >
                  Vercel Middleware
                </Button>
              </div>
            </div>
          </div>

          {deployKey && (
            <div className="rounded-md border bg-muted/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Deploy Key</p>
                  <code className="text-xs text-muted-foreground break-all">
                    {deployKey}
                  </code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(deployKey);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={saveConfig}
              disabled={savingConfig || !originUrl.trim()}
            >
              {savingConfig && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Save &amp; Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Crawl Card                                                     */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Crawl Site
          </CardTitle>
          <CardDescription>
            Crawl your origin URL to discover and optimize pages for AI bots.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-pages">Max Pages</Label>
              <Input
                id="max-pages"
                type="number"
                min="1"
                max="200"
                value={maxPages}
                onChange={(e) => setMaxPages(e.target.value)}
                className="w-28"
              />
            </div>
            <Button
              onClick={triggerCrawl}
              disabled={crawling || !originUrl.trim()}
            >
              {crawling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Crawling...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Crawl Site
                </>
              )}
            </Button>
          </div>
          {crawlStatus && (
            <p className="text-sm text-muted-foreground">{crawlStatus}</p>
          )}
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Token Savings Stats                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pages Optimized</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-3xl font-bold">
                {stats?.total_pages ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Token Usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-lg font-bold">
                  {(stats?.total_source_tokens ?? 0).toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  source → {(stats?.total_optimized_tokens ?? 0).toLocaleString()}{" "}
                  optimized
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Token Reduction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-500" />
              <span className="text-4xl font-bold text-green-500">
                {stats?.reduction_pct ?? 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Pages List                                                     */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Optimized Pages
          </CardTitle>
          <CardDescription>
            {pages.length} page{pages.length !== 1 ? "s" : ""} optimized for AI
            consumption.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No pages yet. Crawl your site to get started.
            </p>
          ) : (
            <div className="space-y-1">
              {/* Header row */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_80px_80px_60px_100px_40px_40px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                <span>Path</span>
                <span>Title</span>
                <span className="text-right">Source</span>
                <span className="text-right">Optimized</span>
                <span className="text-right">%</span>
                <span className="text-right">Last Crawled</span>
                <span />
                <span />
              </div>

              {pages.map((page) => {
                const isExpanded = expandedPage === page.id;
                const isEditing = editingPage === page.id;
                return (
                  <div key={page.id} className="rounded-md border">
                    <button
                      className="flex w-full items-center justify-between px-3 py-3 text-sm text-left hover:bg-muted/50 transition-colors"
                      onClick={() => expandPage(page.id)}
                    >
                      <div className="flex-1 grid sm:grid-cols-[1fr_1fr_80px_80px_60px_100px_40px_40px] gap-2 items-center">
                        <span className="font-medium truncate">
                          {page.path}
                        </span>
                        <span className="text-muted-foreground truncate hidden sm:block">
                          {page.title}
                        </span>
                        <span className="text-right text-muted-foreground hidden sm:block">
                          {page.source_tokens.toLocaleString()}
                        </span>
                        <span className="text-right text-muted-foreground hidden sm:block">
                          {page.optimized_tokens.toLocaleString()}
                        </span>
                        <span className="text-right font-medium text-green-500 hidden sm:block">
                          {page.reduction_pct}%
                        </span>
                        <span className="text-right text-xs text-muted-foreground hidden sm:block">
                          {new Date(page.last_crawled).toLocaleDateString()}
                        </span>
                        <span
                          className="flex justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(page.id);
                            if (!isExpanded) expandPage(page.id);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </span>
                        <span
                          className="flex justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePage(page.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </span>
                      </div>
                      <div className="ml-2 shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t px-4 py-3 space-y-3">
                        {/* Mobile-only meta */}
                        <div className="flex flex-wrap gap-2 sm:hidden text-xs">
                          <Badge variant="outline">{page.title}</Badge>
                          <Badge variant="secondary">
                            {page.source_tokens} → {page.optimized_tokens}{" "}
                            tokens
                          </Badge>
                          <Badge variant="default">
                            {page.reduction_pct}% saved
                          </Badge>
                        </div>

                        {isEditing ? (
                          <div className="space-y-3">
                            <textarea
                              className="w-full min-h-[200px] rounded-md border bg-muted/50 p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingPage(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => savePageContent(page.id)}
                                disabled={savingPage}
                              >
                                {savingPage && (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                )}
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <pre className="max-h-64 overflow-auto rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap">
                            {page.optimized_content || "Loading..."}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 5. Middleware Code                                                 */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Middleware Code
          </CardTitle>
          <CardDescription>
            Deploy this code to intercept AI bot traffic and serve optimized
            content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={middlewareTab === "cloudflare" ? "default" : "outline"}
                size="sm"
                onClick={() => setMiddlewareTab("cloudflare")}
              >
                Cloudflare Worker
              </Button>
              <Button
                variant={middlewareTab === "vercel" ? "default" : "outline"}
                size="sm"
                onClick={() => setMiddlewareTab("vercel")}
              >
                Vercel Middleware
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyMiddleware}
              disabled={!middlewareCode}
            >
              {copiedMiddleware ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              {copiedMiddleware ? "Copied" : "Copy"}
            </Button>
          </div>

          {loadingMiddleware ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-sm whitespace-pre-wrap font-mono">
              {middlewareCode || "// No code generated yet. Save your config first."}
            </pre>
          )}

          <Separator />

          <div className="text-sm text-muted-foreground space-y-2">
            {middlewareTab === "cloudflare" ? (
              <>
                <p className="font-medium text-foreground">
                  Cloudflare Worker Setup
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Copy the code above into your Cloudflare Worker.</li>
                  <li>
                    Set the <code className="text-xs bg-muted px-1 rounded">AXP_DEPLOY_KEY</code> environment
                    variable to your deploy key.
                  </li>
                  <li>
                    Add a route that matches your domain (e.g.{" "}
                    <code className="text-xs bg-muted px-1 rounded">yoursite.com/*</code>).
                  </li>
                  <li>Deploy the worker. AI bots will receive optimized content.</li>
                </ol>
              </>
            ) : (
              <>
                <p className="font-medium text-foreground">
                  Vercel Middleware Setup
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Copy the code above into{" "}
                    <code className="text-xs bg-muted px-1 rounded">middleware.ts</code> at the root of
                    your Next.js project.
                  </li>
                  <li>
                    Set the <code className="text-xs bg-muted px-1 rounded">AXP_DEPLOY_KEY</code> environment
                    variable in your Vercel dashboard.
                  </li>
                  <li>
                    Redeploy. The middleware will intercept AI bot requests
                    automatically.
                  </li>
                </ol>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 6. Bot Analytics                                                  */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Bot Analytics
          </CardTitle>
          <CardDescription>
            See which AI bots are visiting your site and what they are reading.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time range selector */}
          <div className="flex gap-2">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <Button
                key={range}
                variant={analyticsRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setAnalyticsRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>

          {loadingAnalytics ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !analytics ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No analytics data yet. Deploy your middleware to start tracking.
            </p>
          ) : (
            <>
              {/* Total visits */}
              <div className="rounded-md border px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Total Bot Visits
                </p>
                <p className="text-3xl font-bold">
                  {analytics.total_visits.toLocaleString()}
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Visits by bot */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Visits by Bot
                  </h4>
                  {analytics.by_bot.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No bot visits recorded.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {analytics.by_bot.map((b) => (
                        <div key={b.bot} className="flex items-center gap-3">
                          <span className="text-sm w-28 truncate text-muted-foreground">
                            {b.bot}
                          </span>
                          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{
                                width: `${(b.count / maxBotCount) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">
                            {b.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Most visited pages */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Most Visited Pages
                  </h4>
                  {analytics.top_pages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No page visits recorded.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {analytics.top_pages.map((p) => (
                        <div
                          key={p.path}
                          className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <span className="truncate text-muted-foreground">
                            {p.path}
                          </span>
                          <Badge variant="secondary">{p.count}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Visits over time */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Visits Over Time</h4>
                {analytics.over_time.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No timeline data yet.
                  </p>
                ) : (
                  <div className="flex items-end gap-1 h-32">
                    {analytics.over_time.map((d, i) => {
                      const height =
                        maxTimeCount > 0
                          ? (d.count / maxTimeCount) * 100
                          : 0;
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-1"
                          title={`${d.date}: ${d.count} visits`}
                        >
                          <div
                            className="w-full bg-primary rounded-t transition-all"
                            style={{
                              height: `${height}%`,
                              minHeight: d.count > 0 ? "4px" : "0",
                            }}
                          />
                          {/* Show date labels sparsely to avoid clutter */}
                          {(i === 0 ||
                            i === analytics.over_time.length - 1 ||
                            i ===
                              Math.floor(
                                analytics.over_time.length / 2
                              )) && (
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {new Date(d.date).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

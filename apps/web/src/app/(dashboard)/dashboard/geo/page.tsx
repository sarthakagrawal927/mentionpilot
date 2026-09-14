"use client";

import { useState } from "react";
import { Loader2, Copy, Check, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { API_BASE } from "@/lib/api-base";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GEOScore {
  overall: number;
  authority: number;
  readability: number;
  structure: number;
  recommendations: string[];
}

interface CrawlabilityResult {
  overall_accessible: boolean;
  bots: {
    name: string;
    user_agent: string;
    allowed: boolean;
    blocked_by: string | null;
  }[];
  robots_txt_found: boolean;
  robots_txt_content: string | null;
  llms_txt_found: boolean;
  recommendations: string[];
}

interface SchemaAnalysis {
  found: { type: string; count: number }[];
  missing: { type: string; importance: string; description: string }[];
  total_schemas: number;
  recommendations: string[];
}

interface LlmsTxtResult {
  content: string;
  sections: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function geoApi<T>(endpoint: string, url: string): Promise<T> {
  const res = await fetch(`${API_BASE}/v1/geo/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error || "Request failed");
  }
  return res.json() as Promise<T>;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 70
      ? "bg-green-500"
      : value >= 40
        ? "bg-yellow-500"
        : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/100</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function OverallScore({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-green-500"
      : score >= 40
        ? "text-yellow-500"
        : "text-red-500";
  const label =
    score >= 70
      ? "Good"
      : score >= 40
        ? "Needs Work"
        : "Poor";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-5xl font-bold ${color}`}>{score}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GEOToolsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">GEO Tools</h1>
        <p className="text-muted-foreground">
          Optimize your site for Generative Engine Optimization. Analyze how AI
          crawlers see your content.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GEOScoreCard />
        <CrawlabilityCard />
        <SchemaCard />
        <LlmsTxtCard />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. GEO Score Checker
// ---------------------------------------------------------------------------

function GEOScoreCard() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GEOScore | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await geoApi<GEOScore>("geo-score", url);
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          GEO Score
        </CardTitle>
        <CardDescription>
          Analyze how well your page is optimized for AI citations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyze()}
          />
          <Button onClick={analyze} disabled={loading || !url.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Analyze"
            )}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-start gap-6">
              <OverallScore score={result.overall} />
              <div className="flex-1 space-y-3">
                <ScoreBar label="Authority" value={result.authority} />
                <ScoreBar label="Readability" value={result.readability} />
                <ScoreBar label="Structure" value={result.structure} />
              </div>
            </div>

            {result.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recommendations</h4>
                <ul className="space-y-1">
                  {result.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 2. AI Crawlability Checker
// ---------------------------------------------------------------------------

function CrawlabilityCard() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CrawlabilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await geoApi<CrawlabilityResult>("crawlability", url);
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          AI Crawlability
        </CardTitle>
        <CardDescription>
          Check if AI bots can access your site via robots.txt and llms.txt.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
          />
          <Button onClick={check} disabled={loading || !url.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Check"
            )}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {result && (
          <div className="space-y-4">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={result.robots_txt_found ? "default" : "destructive"}>
                robots.txt {result.robots_txt_found ? "found" : "missing"}
              </Badge>
              <Badge variant={result.llms_txt_found ? "default" : "destructive"}>
                llms.txt {result.llms_txt_found ? "found" : "missing"}
              </Badge>
              <Badge variant={result.overall_accessible ? "default" : "destructive"}>
                {result.overall_accessible ? "Accessible" : "Blocked"}
              </Badge>
            </div>

            {/* Bot-by-bot results */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Bot Access</h4>
              <div className="space-y-1">
                {result.bots.map((bot) => (
                  <div
                    key={bot.user_agent}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span>{bot.name}</span>
                    <div className="flex items-center gap-2">
                      {bot.blocked_by && (
                        <span className="text-xs text-muted-foreground">
                          {bot.blocked_by}
                        </span>
                      )}
                      {bot.allowed ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recommendations</h4>
                <ul className="space-y-1">
                  {result.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 3. Schema Markup Analyzer
// ---------------------------------------------------------------------------

function SchemaCard() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SchemaAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await geoApi<SchemaAnalysis>("schema", url);
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Schema Analyzer
        </CardTitle>
        <CardDescription>
          Find and evaluate Schema.org structured data on your page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyze()}
          />
          <Button onClick={analyze} disabled={loading || !url.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Analyze"
            )}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {result && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {result.total_schemas} schema{result.total_schemas !== 1 ? "s" : ""}{" "}
              found
            </div>

            {/* Found schemas */}
            {result.found.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Found</h4>
                <div className="flex flex-wrap gap-2">
                  {result.found.map((s) => (
                    <Badge key={s.type} variant="default">
                      {s.type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Missing schemas */}
            {result.missing.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Missing</h4>
                <div className="space-y-1">
                  {result.missing.map((s) => (
                    <div
                      key={s.type}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Badge
                        variant={
                          s.importance === "high"
                            ? "destructive"
                            : s.importance === "medium"
                              ? "secondary"
                              : "outline"
                        }
                        className="shrink-0"
                      >
                        {s.type}
                      </Badge>
                      <span className="text-muted-foreground">
                        {s.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recommendations</h4>
                <ul className="space-y-1">
                  {result.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 4. llms.txt Generator
// ---------------------------------------------------------------------------

function LlmsTxtCard() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LlmsTxtResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await geoApi<LlmsTxtResult>("llms-txt", url);
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          llms.txt Generator
        </CardTitle>
        <CardDescription>
          Generate an llms.txt file to help AI crawlers understand your site.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
          />
          <Button onClick={generate} disabled={loading || !url.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Generate"
            )}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {result.sections.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <pre className="max-h-64 overflow-auto rounded-md bg-muted p-4 text-sm whitespace-pre-wrap">
              {result.content}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

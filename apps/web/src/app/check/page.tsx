"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Loader2, Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface FreeCheckResult {
  prompt: string;
  platform: string;
  model: string;
  brand_mentioned: boolean;
  brand_sentiment: string | null;
  brand_position: number | null;
  brand_cited: boolean;
  response_preview: string;
  latency_ms: number | null;
}

export default function FreeCheckPage() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [brandName, setBrandName] = useState<string | null>(null);
  const [results, setResults] = useState<FreeCheckResult[]>([]);
  const [mentionRate, setMentionRate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const runCheck = async () => {
    if (!domain.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setMentionRate(null);

    try {
      const startRes = await fetch(`${API_BASE}/v1/free-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      });

      if (!startRes.ok) {
        const err = await startRes.json();
        throw new Error((err as Record<string, string>).error || "Check failed");
      }

      const startData = (await startRes.json()) as { id: string; brand_name: string };
      setBrandName(startData.brand_name);

      let completed = false;
      while (!completed) {
        await new Promise((r) => setTimeout(r, 2000));
        const pollRes = await fetch(`${API_BASE}/v1/free-check/${startData.id}`);
        const data = (await pollRes.json()) as { status: string; results?: any[]; mention_rate?: number };

        if (data.status !== "running") {
          completed = true;
          setResults(data.results || []);
          setMentionRate(data.mention_rate ?? null);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="text-center space-y-4 mb-12">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            MentionPilot
          </Link>
          <h1 className="text-4xl font-bold tracking-tight">
            Free AI Brand Check
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Paste your domain to see if ChatGPT, Gemini, and other AI
            assistants know about your product. No signup required.
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          <Input
            placeholder="yourproduct.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runCheck()}
            className="text-lg h-12"
            disabled={loading}
          />
          <Button
            size="lg"
            onClick={runCheck}
            disabled={loading || !domain.trim()}
            className="h-12 px-6"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </div>

        {error && (
          <p className="text-destructive text-sm text-center mb-4">{error}</p>
        )}

        {loading && (
          <div className="text-center py-12 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              Querying AI platforms about{" "}
              <span className="font-medium text-foreground">
                {brandName || domain}
              </span>
              ...
            </p>
            <p className="text-xs text-muted-foreground">
              This takes 15-30 seconds
            </p>
          </div>
        )}

        {mentionRate !== null && (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="text-5xl font-bold">
                    {Math.round(mentionRate * 100)}%
                  </div>
                  <p className="text-muted-foreground">
                    AI Mention Rate for{" "}
                    <span className="font-medium text-foreground">
                      {brandName}
                    </span>
                  </p>
                  <Badge
                    variant={
                      mentionRate > 0.5
                        ? "default"
                        : mentionRate > 0
                          ? "secondary"
                          : "destructive"
                    }
                    className="text-sm"
                  >
                    {mentionRate > 0.5
                      ? "Good visibility"
                      : mentionRate > 0
                        ? "Low visibility"
                        : "Not mentioned"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Results by Query</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.map((r, i) => (
                    <div key={i} className="rounded-md border">
                      <button
                        className="flex w-full items-center justify-between px-4 py-3 text-sm text-left hover:bg-muted/50 transition-colors"
                        onClick={() =>
                          setExpandedIdx(expandedIdx === i ? null : i)
                        }
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {r.brand_mentioned ? (
                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-red-500 shrink-0" />
                          )}
                          <Badge variant="outline" className="shrink-0">
                            {r.platform}
                          </Badge>
                          <span className="truncate text-muted-foreground">
                            {r.prompt}
                          </span>
                        </div>
                        {r.brand_position && (
                          <Badge variant="secondary">
                            #{r.brand_position}
                          </Badge>
                        )}
                      </button>
                      {expandedIdx === i && (
                        <div className="border-t px-4 py-3">
                          <div className="text-sm whitespace-pre-wrap bg-muted/50 rounded-md p-3 max-h-48 overflow-y-auto">
                            {r.response_preview}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/50">
              <CardContent className="pt-6 text-center space-y-3">
                <p className="font-medium">
                  Want to track this over time and improve your AI visibility?
                </p>
                <Link href="/dashboard">
                  <Button size="lg">
                    Get Started Free
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

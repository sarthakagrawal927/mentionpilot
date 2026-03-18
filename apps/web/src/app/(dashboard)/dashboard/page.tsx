"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, TrendingUp, Award, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
const DEMO_TOKEN = "";

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(DEMO_TOKEN ? { Authorization: `Bearer ${DEMO_TOKEN}` } : {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

interface VisibilityScore {
  score: number;
  grade: string;
  breakdown: { mention: number; sentiment: number; position: number; citation: number; reach: number };
  max: { mention: number; sentiment: number; position: number; citation: number; reach: number };
}

interface SuggestedPrompt {
  text: string;
  category: string;
  reason: string;
}

export default function DashboardPage() {
  const [projectId] = useState("demo");
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<VisibilityScore | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedPrompt[]>([]);

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.allSettled([
        api<VisibilityScore>(`/v1/analytics/${projectId}/visibility-score`),
        api<{ suggestions: SuggestedPrompt[] }>(`/v1/analytics/${projectId}/discover-prompts`),
      ]);
      if (s.status === 'fulfilled') setScore(s.value);
      if (p.status === 'fulfilled') setSuggestions(p.value.suggestions);
    } catch { /* Error */ }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  const gradeColor = score?.grade === 'A' ? 'text-green-500' : score?.grade === 'B' ? 'text-blue-500' : score?.grade === 'C' ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your AI visibility at a glance.</p>
      </div>

      {/* Visibility Score */}
      {score && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className={`text-6xl font-bold ${gradeColor}`}>{score.score}</div>
                <p className="text-sm text-muted-foreground mt-1">AI Visibility Score</p>
                <Badge variant={score.score >= 50 ? "default" : "secondary"} className="mt-2">Grade: {score.grade}</Badge>
              </div>
              <div className="flex-1 space-y-2">
                {Object.entries(score.breakdown).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm w-20 capitalize text-muted-foreground">{key}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(value / (score.max as any)[key]) * 100}%` }} />
                    </div>
                    <span className="text-xs w-10 text-right">{value}/{(score.max as any)[key]}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/mentions">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Run AI Check</p>
              <p className="text-xs text-muted-foreground">Check mentions across AI platforms</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/geo">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">GEO Score</p>
              <p className="text-xs text-muted-foreground">Check content optimization</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/social">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Social Monitor</p>
              <p className="text-xs text-muted-foreground">Track HN & Reddit mentions</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Prompt Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Suggested Prompts
            </CardTitle>
            <CardDescription>
              AI-generated prompts based on your brand. Add them to your mentions check.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestions.slice(0, 10).map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div className="flex-1">
                    <span>{s.text}</span>
                    <Badge variant="outline" className="ml-2 text-xs">{s.category}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">{s.reason}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

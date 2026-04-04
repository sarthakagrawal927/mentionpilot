"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, TrendingUp, Award, Sparkles, Search, MessageSquare, Layers, FileCode, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useProject } from "@/lib/use-project";

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
  const { projectId, loading: projectLoading } = useProject();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<VisibilityScore | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedPrompt[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const [s, p] = await Promise.allSettled([
        apiFetch<VisibilityScore>(`/v1/analytics/${projectId}/visibility-score`),
        apiFetch<{ suggestions: SuggestedPrompt[] }>(`/v1/analytics/${projectId}/discover-prompts`),
      ]);
      if (s.status === 'fulfilled') setScore(s.value);
      if (p.status === 'fulfilled') setSuggestions(p.value.suggestions);
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  if (projectLoading || loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const gradeColor = score?.grade === 'A' ? 'text-green-500' : score?.grade === 'B' ? 'text-primary' : score?.grade === 'C' ? 'text-accent' : 'text-destructive';

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground font-medium mt-1">Real-time AI visibility and social signals.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-4 text-sm font-bold text-destructive shadow-sm">
          {error}
        </div>
      )}

      {/* Visibility Score */}
      {score && (
        <Card className="border-border/40 bg-card/50 backdrop-blur shadow-2xl shadow-primary/5 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-10 pb-10 relative">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="text-center md:border-r border-border/40 md:pr-12">
                <div className={`text-8xl font-black leading-none ${gradeColor} drop-shadow-sm`}>{score.score}</div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mt-4">Visibility Score</p>
                <Badge variant="outline" className={`mt-4 border-current font-black ${gradeColor} bg-current/5 px-4 py-1`}>Grade: {score.grade}</Badge>
              </div>
              <div className="flex-1 w-full space-y-5">
                {Object.entries(score.breakdown).map(([key, value]) => (
                  <div key={key} className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{key}</span>
                      <span className="text-xs font-bold">{value}/{score.max[key as keyof typeof score.max]}</span>
                    </div>
                    <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden border border-border/10">
                      <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.3)]" style={{ width: `${(value / score.max[key as keyof typeof score.max]) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-6 sm:grid-cols-3">
        {[
          { href: "/dashboard/mentions", icon: Search, title: "Run AI Check", desc: "Check platform mentions", color: "text-primary", bg: "bg-primary/5" },
          { href: "/dashboard/geo", icon: FileCode, title: "GEO Score", desc: "Optimization check", color: "text-accent", bg: "bg-accent/5" },
          { href: "/dashboard/social", icon: MessageSquare, title: "Social Monitor", desc: "Track HN & Reddit", color: "text-primary", bg: "bg-primary/5" }
        ].map((action, i) => (
          <Link key={i} href={action.href}>
            <Card className="hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all group cursor-pointer border-border/40 bg-card/50">
              <CardContent className="pt-8 pb-8 text-center">
                <div className={`w-14 h-14 rounded-2xl ${action.bg} flex items-center justify-center mx-auto mb-4 ${action.color} group-hover:scale-110 transition-transform shadow-sm`}>
                  <action.icon className="h-7 w-7" />
                </div>
                <p className="font-black text-lg">{action.title}</p>
                <p className="text-xs font-medium text-muted-foreground mt-1">{action.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Prompt Suggestions */}
      {suggestions.length > 0 && (
        <Card className="border-border/40 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <Sparkles className="h-6 w-6 text-accent" />
              Suggested Prompts
            </CardTitle>
            <CardDescription className="font-medium">
              AI-generated prompts tailored to your brand strategy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {suggestions.slice(0, 6).map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-border/40 bg-background/50 px-5 py-4 text-sm group hover:border-primary/30 transition-colors">
                  <div className="flex-1 flex items-center gap-4">
                    <span className="font-bold text-foreground">{s.text}</span>
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter bg-primary/5 text-primary border-primary/10">{s.category}</Badge>
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{s.reason}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

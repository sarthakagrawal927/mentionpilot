"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Plus,
  Trash2,
  Play,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Key,
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
import { apiFetch } from "@/lib/api-client";
import { useProject } from "@/lib/use-project";
import type {
  BrandConfigRecord,
  PromptRecord,
  CheckRecord,
  ResultRecord,
  DashboardData,
} from "@mentionpilot/shared";

export default function MentionsPage() {
  const { projectId, loading: projectLoading } = useProject();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<BrandConfigRecord | null>(null);
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [checks, setChecks] = useState<CheckRecord[]>([]);
  const [latestResults, setLatestResults] = useState<ResultRecord[]>([]);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  // Config form
  const [brandName, setBrandName] = useState("");
  const [brandAliases, setBrandAliases] = useState("");
  const [brandUrl, setBrandUrl] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [perplexityKey, setPerplexityKey] = useState("");
  const [saving, setSaving] = useState(false);

  // Prompt form
  const [newPrompt, setNewPrompt] = useState("");
  const [promptCategory, setPromptCategory] = useState("");
  const [addingPrompt, setAddingPrompt] = useState(false);

  // Check state
  const [runningCheck, setRunningCheck] = useState(false);
  const [pollingCheck, setPollingCheck] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await apiFetch<DashboardData>(
        `/v1/checks/${projectId}/dashboard`
      );
      setConfig(data.config);
      setPrompts(data.prompts);
      setChecks(data.recent_checks);
      setLatestResults(data.latest_results);

      if (data.config) {
        setBrandName(data.config.brand_name);
        setBrandAliases(data.config.brand_aliases.join(", "));
        setBrandUrl(data.config.brand_url || "");
        setCompetitors(
          data.config.competitors.map((c) => c.name).join(", ")
        );
      }
    } catch {
      // Loading failed — likely no auth yet
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Poll for running check
  useEffect(() => {
    if (!pollingCheck) return;
    const interval = setInterval(async () => {
      try {
        const check = await apiFetch<
          CheckRecord & { results: ResultRecord[] }
        >(`/v1/checks/${projectId}/${pollingCheck}`);
        if (check.status !== "running") {
          setPollingCheck(null);
          setRunningCheck(false);
          loadDashboard();
        }
      } catch {
        setPollingCheck(null);
        setRunningCheck(false);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pollingCheck, projectId, loadDashboard]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        brand_name: brandName,
        brand_aliases: brandAliases
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        brand_url: brandUrl || undefined,
        competitors: competitors
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({ name })),
      };
      if (openaiKey) payload.openai_api_key = openaiKey;
      if (anthropicKey) payload.anthropic_api_key = anthropicKey;
      if (googleKey) payload.google_api_key = googleKey;
      if (perplexityKey) payload.perplexity_api_key = perplexityKey;

      const updated = await apiFetch<BrandConfigRecord>(
        `/v1/brands/${projectId}/config`,
        { method: "POST", body: JSON.stringify(payload) }
      );
      setConfig(updated);
      setOpenaiKey("");
      setAnthropicKey("");
      setGoogleKey("");
      setPerplexityKey("");
    } catch {
      // Error
    } finally {
      setSaving(false);
    }
  };

  const addPrompt = async () => {
    if (!newPrompt.trim()) return;
    setAddingPrompt(true);
    try {
      const prompt = await apiFetch<PromptRecord>(
        `/v1/prompts/${projectId}`,
        {
          method: "POST",
          body: JSON.stringify({
            prompt_text: newPrompt,
            category: promptCategory || undefined,
          }),
        }
      );
      setPrompts((prev) => [...prev, prompt]);
      setNewPrompt("");
      setPromptCategory("");
    } catch {
      // Error
    } finally {
      setAddingPrompt(false);
    }
  };

  const deletePrompt = async (id: string) => {
    try {
      await apiFetch(`/v1/prompts/${projectId}/${id}`, { method: "DELETE" });
      setPrompts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // Error
    }
  };

  const runCheck = async () => {
    setRunningCheck(true);
    try {
      const check = await apiFetch<CheckRecord>(
        `/v1/checks/${projectId}`,
        { method: "POST" }
      );
      setPollingCheck(check.id);
      setChecks((prev) => [check, ...prev]);
    } catch {
      setRunningCheck(false);
    }
  };

  const viewCheck = async (checkId: string) => {
    try {
      const check = await apiFetch<
        CheckRecord & { results: ResultRecord[] }
      >(`/v1/checks/${projectId}/${checkId}`);
      setLatestResults(check.results);
    } catch {
      // Error
    }
  };

  if (projectLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          AI Mention Check
        </h1>
        <p className="text-muted-foreground">
          Check if AI assistants mention your product when users ask relevant
          questions.
        </p>
      </div>

      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Brand Configuration
          </CardTitle>
          <CardDescription>
            Set up your brand details and API keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Brand Name *</Label>
              <Input
                id="brand-name"
                placeholder="Your Product"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-url">Brand URL</Label>
              <Input
                id="brand-url"
                placeholder="https://yourproduct.com"
                value={brandUrl}
                onChange={(e) => setBrandUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Aliases (comma-separated)</Label>
              <Input
                placeholder="Alias 1, Alias 2"
                value={brandAliases}
                onChange={(e) => setBrandAliases(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Competitors (comma-separated, max 5)</Label>
              <Input
                placeholder="Competitor A, Competitor B"
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <h4 className="text-sm font-medium flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys (BYOK)
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                OpenAI
                {config?.has_openai_key && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    saved
                  </Badge>
                )}
              </Label>
              <Input
                type="password"
                placeholder={
                  config?.has_openai_key ? "\u2022\u2022\u2022\u2022" : "sk-..."
                }
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Anthropic
                {config?.has_anthropic_key && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    saved
                  </Badge>
                )}
              </Label>
              <Input
                type="password"
                placeholder={
                  config?.has_anthropic_key
                    ? "\u2022\u2022\u2022\u2022"
                    : "sk-ant-..."
                }
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Google AI
                {config?.has_google_key && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    saved
                  </Badge>
                )}
              </Label>
              <Input
                type="password"
                placeholder={
                  config?.has_google_key ? "\u2022\u2022\u2022\u2022" : "AI..."
                }
                value={googleKey}
                onChange={(e) => setGoogleKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Perplexity
                {config?.has_perplexity_key && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    saved
                  </Badge>
                )}
              </Label>
              <Input
                type="password"
                placeholder={
                  config?.has_perplexity_key
                    ? "\u2022\u2022\u2022\u2022"
                    : "pplx-..."
                }
                value={perplexityKey}
                onChange={(e) => setPerplexityKey(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={saveConfig}
              disabled={saving || !brandName.trim()}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prompts */}
      <Card>
        <CardHeader>
          <CardTitle>Prompts</CardTitle>
          <CardDescription>
            Questions users might ask AI about your product category. Max 20.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {prompts.length > 0 && (
            <div className="space-y-2">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex-1">
                    <span>{prompt.prompt_text}</span>
                    {prompt.category && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {prompt.category}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePrompt(prompt.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {prompts.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No prompts yet. Add prompts like &quot;What&apos;s the best
              feedback tool for SaaS?&quot;
            </p>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="What's the best [category] tool?"
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPrompt()}
              className="flex-1"
            />
            <Input
              placeholder="Category"
              value={promptCategory}
              onChange={(e) => setPromptCategory(e.target.value)}
              className="w-32"
            />
            <Button
              onClick={addPrompt}
              disabled={addingPrompt || !newPrompt.trim()}
              size="sm"
            >
              {addingPrompt ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Run Check */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={runCheck}
          disabled={runningCheck || !config || prompts.length === 0}
          className="px-8"
        >
          {runningCheck ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Running Check...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run AI Mention Check
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {latestResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Results</span>
              {checks.length > 0 &&
                checks[0].brand_mention_rate !== null && (
                  <Badge
                    variant={
                      checks[0].brand_mention_rate > 0.5
                        ? "default"
                        : "secondary"
                    }
                  >
                    {Math.round(checks[0].brand_mention_rate * 100)}% mention
                    rate
                  </Badge>
                )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {latestResults.map((result) => {
                const isExpanded = expandedResult === result.id;
                return (
                  <div key={result.id} className="rounded-md border">
                    <button
                      className="flex w-full items-center justify-between px-4 py-3 text-sm text-left hover:bg-muted/50 transition-colors"
                      onClick={() =>
                        setExpandedResult(isExpanded ? null : result.id)
                      }
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {result.brand_mentioned ? (
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                        <Badge variant="outline" className="shrink-0">
                          {result.platform}
                        </Badge>
                        <span className="truncate text-muted-foreground">
                          {prompts.find((p) => p.id === result.prompt_id)
                            ?.prompt_text || result.prompt_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {result.brand_position && (
                          <Badge variant="secondary">
                            #{result.brand_position}
                          </Badge>
                        )}
                        {result.brand_sentiment && (
                          <Badge
                            variant={
                              result.brand_sentiment === "positive"
                                ? "default"
                                : result.brand_sentiment === "negative"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {result.brand_sentiment}
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t px-4 py-3 space-y-3">
                        <div className="text-sm whitespace-pre-wrap bg-muted/50 rounded-md p-3 max-h-64 overflow-y-auto">
                          {result.response_text}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="text-muted-foreground">
                            Model: {result.model}
                          </span>
                          {result.latency_ms && (
                            <span className="text-muted-foreground">
                              {result.latency_ms}ms
                            </span>
                          )}
                          {result.brand_cited && (
                            <Badge variant="outline" className="text-xs">
                              Cited
                            </Badge>
                          )}
                          {result.competitors_mentioned.filter(
                            (cm) => cm.mentioned
                          ).length > 0 && (
                            <span className="text-muted-foreground">
                              Competitors:{" "}
                              {result.competitors_mentioned
                                .filter((cm) => cm.mentioned)
                                .map((cm) => cm.name)
                                .join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {checks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Check History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checks.map((check) => (
                <button
                  key={check.id}
                  className="flex w-full items-center justify-between rounded-md border px-4 py-3 text-sm hover:bg-muted/50 transition-colors text-left"
                  onClick={() => viewCheck(check.id)}
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        check.status === "completed"
                          ? "default"
                          : check.status === "running"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {check.status}
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(check.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {check.brand_mention_rate !== null && (
                      <span className="font-medium">
                        {Math.round(check.brand_mention_rate * 100)}%
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {check.completed_queries}/{check.total_queries}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

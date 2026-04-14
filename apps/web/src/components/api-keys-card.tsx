"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Loader2, Copy, Check, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api-client";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

interface CreatedKey extends ApiKey {
  key: string;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function ApiKeysCard() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newScopes, setNewScopes] = useState<string[]>(["read"]);
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ keys: ApiKey[] }>("/v1/api-keys");
      setKeys(res.keys);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await apiFetch<CreatedKey>("/v1/api-keys", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim(), scopes: newScopes }),
      });
      setCreatedKey(res);
      setNewName("");
      setNewScopes(["read"]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this key? Callers using it will immediately lose access.")) return;
    try {
      await apiFetch(`/v1/api-keys/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke");
    }
  }

  function toggleScope(scope: string) {
    setNewScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  }

  function copyCreated() {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeKeys = keys.filter((k) => !k.revoked_at);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          API Keys
        </CardTitle>
        <CardDescription>
          Authenticate programmatic callers with <code>Authorization: Bearer mp_live_…</code>.
          Raw keys are shown once at creation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {createdKey && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Your new key — copy it now</p>
                <p className="text-xs text-muted-foreground">
                  This is the only time you'll see the full key.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={copyCreated} className="gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <pre className="rounded bg-muted p-2.5 text-xs font-mono break-all whitespace-pre-wrap">
              {createdKey.key}
            </pre>
            <Button size="sm" variant="outline" onClick={() => setCreatedKey(null)}>
              I've saved it
            </Button>
          </div>
        )}

        {/* Create form */}
        <form onSubmit={createKey} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="new-key-name">New key name</Label>
              <Input
                id="new-key-name"
                placeholder="e.g. zapier-integration"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={80}
              />
            </div>
            <Button type="submit" disabled={creating || !newName.trim()}>
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Key
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Scopes:</Label>
            {(["read", "write"] as const).map((s) => (
              <Button
                key={s}
                type="button"
                variant={newScopes.includes(s) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleScope(s)}
                className="capitalize h-7 text-xs"
              >
                {s}
              </Button>
            ))}
          </div>
        </form>

        <Separator />

        {/* List */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading keys…
            </div>
          ) : activeKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active keys. Create one above to get started.
            </p>
          ) : (
            activeKeys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between rounded-lg border p-3 gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{k.name}</p>
                    {k.scopes.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs capitalize">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {k.key_prefix}… · last used {relativeTime(k.last_used_at)} · created {relativeTime(k.created_at)}
                    {k.expires_at ? ` · expires ${new Date(k.expires_at).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revoke(k.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

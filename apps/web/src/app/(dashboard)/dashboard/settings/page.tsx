"use client";

import { useState, useMemo } from "react";
import { Settings, Bell, Clock, Trash2, Loader2, Code2, Check, Copy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProject } from "@/lib/use-project";
import { apiFetch } from "@/lib/api-client";

const WIDGET_BASE = process.env.NEXT_PUBLIC_API_URL || "https://mentionpilot-api.sarthakagrawal927.workers.dev";

export default function SettingsPage() {
  const { projectId } = useProject();
  const [schedule, setSchedule] = useState<string | null>(null);
  const [slackWebhook, setSlackWebhook] = useState("");
  const [alertEmail, setAlertEmail] = useState("");
  const [mentionThreshold, setMentionThreshold] = useState("20");
  const [saving, setSaving] = useState(false);

  // Badge settings
  const [badgeEnabled, setBadgeEnabled] = useState(false);
  const [badgeTheme, setBadgeTheme] = useState<"auto" | "light" | "dark">("auto");
  const [badgePosition, setBadgePosition] = useState<"inline" | "bottom-right" | "bottom-left">("inline");
  const [badgeSize, setBadgeSize] = useState<"sm" | "md">("sm");
  const [badgeToggling, setBadgeToggling] = useState(false);
  const [copied, setCopied] = useState(false);

  const snippetCode = useMemo(() => {
    const attrs = [`data-project-id="${projectId || "YOUR_PROJECT_ID"}"`];
    if (badgeTheme !== "auto") attrs.push(`data-theme="${badgeTheme}"`);
    if (badgePosition !== "inline") attrs.push(`data-position="${badgePosition}"`);
    if (badgeSize !== "sm") attrs.push(`data-size="${badgeSize}"`);
    return `<script\n  src="${WIDGET_BASE}/v1/badge/widget.js"\n  ${attrs.join("\n  ")}\n  async\n></script>`;
  }, [projectId, badgeTheme, badgePosition, badgeSize]);

  async function toggleBadge() {
    if (!projectId) return;
    setBadgeToggling(true);
    try {
      await apiFetch(`/v1/brands/${projectId}/badge`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !badgeEnabled }),
      });
      setBadgeEnabled(!badgeEnabled);
    } catch {
      // silently fail
    } finally {
      setBadgeToggling(false);
    }
  }

  function copySnippet() {
    navigator.clipboard.writeText(snippetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure scheduled checks, alerts, and notifications.
        </p>
      </div>

      {/* Embeddable Badge */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Embeddable Badge
          </CardTitle>
          <CardDescription>
            Add an AI visibility badge to your website. Shows visitors how your brand performs across AI assistants.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable public badge</p>
              <p className="text-sm text-muted-foreground">
                Makes your visibility score publicly accessible via the badge API.
              </p>
            </div>
            <Button
              variant={badgeEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleBadge}
              disabled={badgeToggling}
            >
              {badgeToggling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {badgeEnabled ? "Enabled" : "Disabled"}
            </Button>
          </div>

          {badgeEnabled && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label>Customize</Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Theme</Label>
                    <div className="flex gap-1.5">
                      {(["auto", "light", "dark"] as const).map((t) => (
                        <Button
                          key={t}
                          variant={badgeTheme === t ? "default" : "outline"}
                          size="sm"
                          onClick={() => setBadgeTheme(t)}
                          className="capitalize flex-1"
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Position</Label>
                    <div className="flex gap-1.5">
                      {([
                        { value: "inline" as const, label: "Inline" },
                        { value: "bottom-right" as const, label: "BR" },
                        { value: "bottom-left" as const, label: "BL" },
                      ]).map((opt) => (
                        <Button
                          key={opt.value}
                          variant={badgePosition === opt.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setBadgePosition(opt.value)}
                          className="flex-1"
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Size</Label>
                    <div className="flex gap-1.5">
                      {(["sm", "md"] as const).map((s) => (
                        <Button
                          key={s}
                          variant={badgeSize === s ? "default" : "outline"}
                          size="sm"
                          onClick={() => setBadgeSize(s)}
                          className="uppercase flex-1"
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Live Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className={`rounded-lg border p-6 flex items-center justify-center ${badgeTheme === "dark" ? "bg-card/50" : "bg-muted/30"}`}>
                  <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border shadow-sm text-sm ${
                    badgeTheme === "dark"
                      ? "bg-primary/10 text-primary-foreground border-primary/20"
                      : "bg-card text-foreground border-border"
                  }`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                      <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.2"/>
                      <circle cx="5.5" cy="6" r="1.2" fill="currentColor"/>
                      <circle cx="10.5" cy="6" r="1.2" fill="currentColor"/>
                      <path d="M5 10.5c0-1 1.5-1.8 3-1.8s3 .8 3 1.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                    </svg>
                    <span>Mentioned by 3/4 AI assistants</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Code Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Embed Code</Label>
                  <Button variant="ghost" size="sm" onClick={copySnippet} className="h-7 gap-1.5 text-xs">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <pre className="rounded-lg bg-muted p-4 text-xs overflow-x-auto whitespace-pre font-mono">
                  {snippetCode}
                </pre>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Scheduled Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Checks
          </CardTitle>
          <CardDescription>
            Automatically run AI mention checks on a schedule. Uses your configured API keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {[
              { value: null, label: "Off" },
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
            ].map((opt) => (
              <Button
                key={opt.label}
                variant={schedule === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSchedule(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          {schedule && (
            <p className="text-sm text-muted-foreground">
              Checks will run {schedule === "daily" ? "every day" : "every Monday"} at 6:00 AM UTC.
              Estimated cost: ~$0.03 per check with your API keys.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alerts
          </CardTitle>
          <CardDescription>
            Get notified when your AI visibility changes significantly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Alert Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Slack Webhook URL</Label>
              <Input
                placeholder="https://hooks.slack.com/..."
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Alert when mention rate drops below (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={mentionThreshold}
              onChange={(e) => setMentionThreshold(e.target.value)}
              className="w-24"
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete all check history</p>
              <p className="text-sm text-muted-foreground">
                Remove all past checks and results. This cannot be undone.
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete History
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete project</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this project and all associated data.
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Project
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}

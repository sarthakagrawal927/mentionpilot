"use client";

import { useState } from "react";
import { Settings, Bell, Clock, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const [schedule, setSchedule] = useState<string | null>(null);
  const [slackWebhook, setSlackWebhook] = useState("");
  const [alertEmail, setAlertEmail] = useState("");
  const [mentionThreshold, setMentionThreshold] = useState("20");
  const [saving, setSaving] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure scheduled checks, alerts, and notifications.
        </p>
      </div>

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

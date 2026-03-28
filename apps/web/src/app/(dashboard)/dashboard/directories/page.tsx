"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Search,
  Send,
  ChevronDown,
  StickyNote,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

import { apiFetch } from "@/lib/api-client";
import { useProject } from "@/lib/use-project";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Category =
  | "all"
  | "ai-tools"
  | "product"
  | "startup"
  | "developer"
  | "seo"
  | "social"
  | "review"
  | "free-listing";

type Status = "pending" | "submitted" | "approved" | "rejected" | "skipped";

interface DirectoryEntry {
  slug: string;
  name: string;
  url: string;
  category: string;
  description: string;
  has_api: boolean;
  difficulty: "easy" | "medium" | "hard";
  estimated_monthly_traffic: string;
  free_tier: boolean;
  tags: string[];
  submission: {
    id: string;
    status: Status;
    submitted_at: string | null;
    notes: string | null;
    listing_url: string | null;
  } | null;
}

interface Stats {
  total: number;
  submitted: number;
  approved: number;
  pending: number;
  skipped: number;
}

interface AutoFillData {
  name: string;
  url: string;
  tagline: string;
  description: string;
  category: string;
  tags: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  "ai-tools": "AI Tools",
  product: "Product",
  startup: "Startup",
  developer: "Developer",
  seo: "SEO",
  social: "Social",
  review: "Review",
  "free-listing": "Free Listing",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_COLORS: Record<string, string> = {
  pending:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  submitted:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  approved:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  skipped:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DirectoriesPage() {
  const { projectId, loading: projectLoading } = useProject();
  const [loading, setLoading] = useState(true);

  // Data
  const [directories, setDirectories] = useState<DirectoryEntry[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    submitted: 0,
    approved: 0,
    pending: 0,
    skipped: 0,
  });
  const [autoFill, setAutoFill] = useState<AutoFillData | null>(null);
  const [autoFillError, setAutoFillError] = useState<string | null>(null);

  // Filters
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Copy state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Expanding notes for a directory
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [urlInput, setUrlInput] = useState("");

  // Saving
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  const loadAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [statusRes, autoFillRes] = await Promise.allSettled([
        apiFetch<{ directories: DirectoryEntry[]; stats: Stats; total: number }>(
          `/v1/directories/${projectId}/status`
        ),
        apiFetch<AutoFillData>(`/v1/directories/${projectId}/auto-fill`),
      ]);

      if (statusRes.status === "fulfilled") {
        setDirectories(statusRes.value.directories);
        setStats(statusRes.value.stats);
      }

      if (autoFillRes.status === "fulfilled") {
        setAutoFill(autoFillRes.value);
        setAutoFillError(null);
      } else {
        setAutoFillError("Configure your brand first to auto-fill submission data.");
      }
    } catch {
      // Error loading
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ---------------------------------------------------------------------------
  // Filtered directories
  // ---------------------------------------------------------------------------

  const filteredDirectories = useMemo(() => {
    let list = directories;

    if (activeCategory !== "all") {
      list = list.filter((d) => d.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [directories, activeCategory, searchQuery]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const updateStatus = async (slug: string, status: Status) => {
    setSavingSlug(slug);
    try {
      const existing = directories.find((d) => d.slug === slug);
      await apiFetch(`/v1/directories/${projectId}/submit`, {
        method: "POST",
        body: JSON.stringify({
          directory_slug: slug,
          status,
          notes: existing?.submission?.notes || null,
          listing_url: existing?.submission?.listing_url || null,
        }),
      });

      // Update local state
      setDirectories((prev) =>
        prev.map((d) =>
          d.slug === slug
            ? {
                ...d,
                submission: {
                  id: d.submission?.id || "",
                  status,
                  submitted_at:
                    status === "submitted" ? new Date().toISOString() : null,
                  notes: d.submission?.notes || null,
                  listing_url: d.submission?.listing_url || null,
                },
              }
            : d
        )
      );

      // Update stats
      setStats((prev) => {
        const oldStatus = directories.find((d) => d.slug === slug)?.submission
          ?.status;
        const newStats = { ...prev };
        if (oldStatus && oldStatus in newStats) {
          newStats[oldStatus as keyof Stats] = Math.max(
            0,
            (newStats[oldStatus as keyof Stats] as number) - 1
          );
        } else if (!oldStatus) {
          // Was not tracked before
        }
        if (status in newStats) {
          newStats[status as keyof Stats] =
            (newStats[status as keyof Stats] as number) + 1;
        }
        if (!oldStatus) {
          newStats.total += 1;
        }
        return newStats;
      });
    } catch {
      // Error updating
    } finally {
      setSavingSlug(null);
    }
  };

  const saveNotes = async (slug: string) => {
    setSavingSlug(slug);
    try {
      const existing = directories.find((d) => d.slug === slug);
      await apiFetch(`/v1/directories/${projectId}/submit`, {
        method: "POST",
        body: JSON.stringify({
          directory_slug: slug,
          status: existing?.submission?.status || "pending",
          notes: notesInput || null,
          listing_url: urlInput || null,
        }),
      });

      setDirectories((prev) =>
        prev.map((d) =>
          d.slug === slug
            ? {
                ...d,
                submission: {
                  id: d.submission?.id || "",
                  status: d.submission?.status || ("pending" as Status),
                  submitted_at: d.submission?.submitted_at || null,
                  notes: notesInput || null,
                  listing_url: urlInput || null,
                },
              }
            : d
        )
      );

      setExpandedSlug(null);
    } catch {
      // Error saving
    } finally {
      setSavingSlug(null);
    }
  };

  const copyField = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleExpanded = (slug: string) => {
    if (expandedSlug === slug) {
      setExpandedSlug(null);
    } else {
      const dir = directories.find((d) => d.slug === slug);
      setNotesInput(dir?.submission?.notes || "");
      setUrlInput(dir?.submission?.listing_url || "");
      setExpandedSlug(slug);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (projectLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalDirectories = directories.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Submit Everywhere
        </h1>
        <p className="text-muted-foreground">
          {totalDirectories} directories to submit your product. Track progress
          and auto-fill submission forms.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid gap-4 sm:grid-cols-5">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{totalDirectories}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {stats.submitted}
            </div>
            <p className="text-sm text-muted-foreground">Submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {stats.approved}
            </div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-gray-500">
              {stats.pending}
            </div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-orange-500">
              {stats.skipped}
            </div>
            <p className="text-sm text-muted-foreground">Skipped</p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-fill card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Auto-Fill Submission Data
          </CardTitle>
          <CardDescription>
            {autoFillError
              ? autoFillError
              : "Copy these fields when filling out directory submission forms."}
          </CardDescription>
        </CardHeader>
        {autoFill && (
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Name", value: autoFill.name, key: "name" },
                { label: "URL", value: autoFill.url, key: "url" },
                { label: "Tagline", value: autoFill.tagline, key: "tagline" },
                { label: "Category", value: autoFill.category, key: "category" },
              ].map((field) => (
                <div key={field.key} className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {field.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm break-all">
                      {field.value}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyField(field.value, field.key)}
                      className="shrink-0"
                    >
                      {copiedField === field.key ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}

              {/* Description - full width */}
              <div className="sm:col-span-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Description
                </p>
                <div className="flex items-start gap-2">
                  <code className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm break-all">
                    {autoFill.description}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyField(autoFill.description, "description")}
                    className="shrink-0 mt-1"
                  >
                    {copiedField === "description" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Tags */}
              <div className="sm:col-span-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Tags
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-1 flex-1">
                    {autoFill.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyField(autoFill.tags.join(", "), "tags")
                    }
                    className="shrink-0"
                  >
                    {copiedField === "tags" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Separator />

      {/* Search and category filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search directories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <Button
              key={key}
              variant={activeCategory === key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(key as Category)}
            >
              {label}
              {key !== "all" && (
                <span className="ml-1.5 text-xs opacity-70">
                  (
                  {key === "all"
                    ? directories.length
                    : directories.filter((d) => d.category === key).length}
                  )
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Directory list */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeCategory === "all"
              ? "All Directories"
              : CATEGORY_LABELS[activeCategory]}{" "}
            ({filteredDirectories.length})
          </CardTitle>
          <CardDescription>
            Click the submit button to open the directory, then update the status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDirectories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No directories match your search.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredDirectories.map((dir) => {
                const isExpanded = expandedSlug === dir.slug;
                const isSaving = savingSlug === dir.slug;
                const currentStatus = dir.submission?.status;

                return (
                  <div
                    key={dir.slug}
                    className={`rounded-md border transition-colors ${
                      currentStatus === "approved"
                        ? "border-green-200 dark:border-green-900/50"
                        : currentStatus === "submitted"
                          ? "border-blue-200 dark:border-blue-900/50"
                          : currentStatus === "skipped"
                            ? "border-orange-200 dark:border-orange-900/50 opacity-60"
                            : ""
                    }`}
                  >
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                      {/* Left: Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {dir.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-xs border-0 ${DIFFICULTY_COLORS[dir.difficulty]}`}
                          >
                            {dir.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {CATEGORY_LABELS[dir.category] || dir.category}
                          </Badge>
                          {dir.estimated_monthly_traffic && (
                            <span className="text-xs text-muted-foreground">
                              ~{dir.estimated_monthly_traffic}/mo
                            </span>
                          )}
                          {currentStatus && (
                            <Badge
                              variant="secondary"
                              className={`text-xs border-0 ${STATUS_COLORS[currentStatus]}`}
                            >
                              {currentStatus}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {dir.description}
                        </p>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Notes toggle */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(dir.slug)}
                          title="Notes & listing URL"
                        >
                          <StickyNote className="h-4 w-4" />
                          {dir.submission?.notes && (
                            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                          )}
                        </Button>

                        {/* Status selector */}
                        <div className="relative">
                          <select
                            className="appearance-none rounded-md border bg-background px-3 py-1.5 pr-8 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                            value={currentStatus || ""}
                            disabled={isSaving}
                            onChange={(e) => {
                              if (e.target.value) {
                                updateStatus(
                                  dir.slug,
                                  e.target.value as Status
                                );
                              }
                            }}
                          >
                            <option value="">Set status</option>
                            <option value="pending">Pending</option>
                            <option value="submitted">Submitted</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="skipped">Skip</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                        </div>

                        {/* Submit link */}
                        <a
                          href={dir.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-4 w-4 mr-1.5" />
                            Submit
                          </Button>
                        </a>
                      </div>
                    </div>

                    {/* Expanded: notes + listing URL */}
                    {isExpanded && (
                      <div className="border-t px-4 py-3 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Notes
                            </label>
                            <Input
                              placeholder="e.g. Submitted on Monday, waiting for review..."
                              value={notesInput}
                              onChange={(e) => setNotesInput(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Listing URL
                            </label>
                            <Input
                              placeholder="https://directory.com/your-listing"
                              value={urlInput}
                              onChange={(e) => setUrlInput(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedSlug(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveNotes(dir.slug)}
                            disabled={isSaving}
                          >
                            {isSaving && (
                              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                            )}
                            Save
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

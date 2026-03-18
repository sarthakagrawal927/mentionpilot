import Link from "next/link";
import {
  Eye,
  Search,
  BarChart3,
  Shield,
  FileCode,
  MessageSquare,
  Layers,
  Send,
  Zap,
  Check,
  ArrowRight,
  Globe,
  TrendingUp,
  Award,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    icon: Eye,
    title: "AI Mention Check",
    description: "Query ChatGPT, Claude, Gemini, and Perplexity to see if they recommend your product. BYOK — your keys, your cost (~$0.03/check).",
  },
  {
    icon: Layers,
    title: "AXP Shadow Site",
    description: "Serve AI-optimized content to AI crawlers. Reduce token count by 90%+. Humans see your normal site. Bots see the optimized version.",
  },
  {
    icon: BarChart3,
    title: "Visibility Analytics",
    description: "Track mention rate, sentiment, position, and citations over time. See share of voice vs competitors across all AI platforms.",
  },
  {
    icon: FileCode,
    title: "GEO Optimization",
    description: "Score your pages for AI citation readiness. Check crawlability, schema markup, and generate llms.txt files automatically.",
  },
  {
    icon: MessageSquare,
    title: "Social Monitoring",
    description: "Unified feed of brand mentions across Hacker News, Reddit, and Product Hunt. Know when people talk about you — instantly.",
  },
  {
    icon: Send,
    title: "Submit Everywhere",
    description: "87+ curated directories with submission links, auto-fill from your brand profile, and a tracker so you never lose progress.",
  },
];

const freeTools = [
  { title: "AI Brand Check", description: "See if AI knows your product. No signup.", href: "/check" },
  { title: "GEO Score", description: "Rate your page's AI-readiness 0-100.", href: "/dashboard/geo" },
  { title: "Crawlability Check", description: "Can GPTBot and ClaudeBot reach your site?", href: "/dashboard/geo" },
  { title: "llms.txt Generator", description: "Auto-generate an AI-readable site summary.", href: "/dashboard/geo" },
];

const competitors = [
  { name: "Peec AI", price: "$103/mo", prompts: "25", note: "Enterprise focused" },
  { name: "Gauge", price: "$100/mo", prompts: "100/day", note: "Content creation at $599" },
  { name: "Otterly", price: "$29/mo", prompts: "15", note: "Gartner Cool Vendor" },
  { name: "Scrunch AI", price: "$250/mo", prompts: "350", note: "AXP pioneer" },
  { name: "MentionPilot", price: "Free", prompts: "20", note: "BYOK + all features", highlight: true },
];

const stats = [
  { value: "4", label: "AI Platforms" },
  { value: "87+", label: "Directories" },
  { value: "3", label: "Social Sources" },
  { value: "$0", label: "Platform Cost" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold">
            MentionPilot
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#tools" className="text-muted-foreground hover:text-foreground transition-colors">Free Tools</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/check">
              <Button size="sm">Free Brand Check</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-24 pb-16 text-center">
        <Badge variant="secondary" className="mb-6 text-sm px-4 py-1">
          AI Visibility Platform for Startups
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Do AI assistants<br />
          <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
            know your product?
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Check if ChatGPT, Claude, Gemini, and Perplexity recommend your product.
          Track mentions, optimize your content, and monitor social buzz — all in one platform.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/check">
            <Button size="lg" className="px-8 text-base">
              <Search className="mr-2 h-5 w-5" />
              Free AI Brand Check
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="px-8 text-base">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          No credit card required. BYOK — bring your own API keys.
        </p>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-4 py-12 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need for AI visibility
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Monitor, optimize, and improve how AI assistants talk about your product.
            What Scrunch AI charges $250/mo for, we give you for free.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50">
              <CardHeader>
                <feature.icon className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y bg-muted/30 py-24">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl mb-16">
            How it works
          </h2>
          <div className="grid gap-12 sm:grid-cols-3">
            {[
              { step: "1", title: "Configure", description: "Add your brand name, URL, competitors, and API keys. We support OpenAI, Anthropic, Google, and Perplexity." },
              { step: "2", title: "Check", description: "Add prompts users might ask AI, or let us auto-generate them. Click Run — we query all platforms in parallel." },
              { step: "3", title: "Optimize", description: "See which platforms mention you, your sentiment and position. Use GEO tools and AXP to improve your visibility." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AXP Section */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <Badge variant="outline" className="mb-4">AXP Shadow Site</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Serve AI-optimized content to bots
            </h2>
            <p className="mt-4 text-muted-foreground">
              Your pages have 124K tokens of navigation, scripts, styles, and noise.
              AI bots waste context parsing all of it. AXP strips it down to ~1.2K tokens
              of pure signal — a 99% reduction.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Crawl your site and auto-generate optimized versions",
                "Deploy as Cloudflare Worker or Vercel middleware",
                "Humans see your normal site, bots see the optimized version",
                "Track which AI bots visit and how often",
                "Edit optimized content from the dashboard",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/login">
                <Button>Set Up AXP <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="pt-6 font-mono text-xs leading-relaxed text-muted-foreground">
              <div className="text-foreground mb-2"># YourProduct</div>
              <div className="mb-2 text-muted-foreground/70">URL: https://yourproduct.com</div>
              <div className="mb-4">&gt; The all-in-one platform for...</div>
              <div className="text-foreground mb-1">## Key Features</div>
              <div>- Real-time analytics dashboard</div>
              <div>- Team collaboration tools</div>
              <div>- API with 99.9% uptime</div>
              <div className="mt-4 text-foreground mb-1">## Pricing</div>
              <div>- Free tier: up to 1,000 events</div>
              <div>- Pro: $29/mo unlimited</div>
              <div className="mt-4 text-foreground mb-1">## FAQ</div>
              <div>Q: How does it compare to X?</div>
              <div>A: We focus on simplicity and...</div>
              <div className="mt-4 pt-4 border-t border-dashed text-green-500">
                124K tokens → 1.2K tokens (99% reduction)
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Free Tools */}
      <section id="tools" className="border-y bg-muted/30 py-24">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Free tools. No signup.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Check your AI visibility right now. Zero commitment.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {freeTools.map((tool) => (
              <Link key={tool.title} href={tool.href}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{tool.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Comparison */}
      <section id="pricing" className="mx-auto max-w-4xl px-4 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Why pay $100+/mo?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Competitors charge $29-599/mo for limited prompts. We&apos;re free — you only pay for your own API keys (~$0.03/check).
          </p>
        </div>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Tool</th>
                <th className="px-4 py-3 text-left font-medium">Price</th>
                <th className="px-4 py-3 text-left font-medium">Prompts</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Note</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((c) => (
                <tr
                  key={c.name}
                  className={`border-b ${c.highlight ? "bg-primary/5 font-medium" : ""}`}
                >
                  <td className="px-4 py-3">
                    {c.name}
                    {c.highlight && <Badge className="ml-2 text-xs">You</Badge>}
                  </td>
                  <td className="px-4 py-3">{c.price}</td>
                  <td className="px-4 py-3">{c.prompts}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-24">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to check your AI visibility?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start with a free brand check — no account required.
            Or sign up for the full dashboard with trending, optimization, and monitoring.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/check">
              <Button size="lg" className="px-8">
                <Search className="mr-2 h-5 w-5" />
                Free Brand Check
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">MentionPilot</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/tools" className="hover:text-foreground transition-colors">Free Tools</Link>
            <Link href="/check" className="hover:text-foreground transition-colors">Brand Check</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

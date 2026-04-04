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
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight text-primary flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm shadow-lg shadow-primary/20">M</div>
            <span>MentionPilot</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a>
            <a href="#tools" className="text-muted-foreground hover:text-primary transition-colors">Free Tools</a>
            <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a>
            <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-medium">Sign In</Button>
            </Link>
            <Link href="/check">
              <Button size="sm" className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-transform font-bold">
                Free Brand Check
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-28 pb-20 px-4">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,var(--primary)_0%,transparent_100%)] opacity-[0.05]" />
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-8 border-accent/20 bg-accent/5 text-accent px-4 py-1.5 font-bold tracking-wide uppercase text-[10px]">
              <Zap className="w-3 h-3 mr-2 fill-current" />
              AI Visibility Platform for Startups
            </Badge>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-8">
              Do AI assistants<br />
              <span className="bg-gradient-to-br from-primary via-primary to-accent bg-clip-text text-transparent italic">
                know your product?
              </span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
              Check if ChatGPT, Claude, Gemini, and Perplexity recommend your product.
              Track mentions, optimize your content, and monitor social buzz — all in one platform.
            </p>
            <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/check">
                <Button size="lg" className="h-14 px-10 text-base font-bold shadow-2xl shadow-primary/30">
                  <Search className="mr-2 h-5 w-5" />
                  Free AI Brand Check
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-10 text-base font-bold border-primary/20 hover:bg-primary/5">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground font-medium">
              No credit card required. BYOK — bring your own API keys.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-border bg-muted/20 backdrop-blur-sm">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-4 py-16 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="text-4xl font-black text-primary group-hover:scale-110 transition-transform">{stat.value}</div>
                <div className="mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-32">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Everything you need for AI visibility
            </h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Monitor, optimize, and improve how AI assistants talk about your product.
              What competitors charge $250/mo for, we give you for free.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/40 bg-card/50 backdrop-blur hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all group">
                <CardHeader>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="border-y border-border bg-muted/20 py-32">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-center text-4xl font-black tracking-tight sm:text-5xl mb-24">
              How it works
            </h2>
            <div className="grid gap-12 sm:grid-cols-3">
              {[
                { step: "1", title: "Configure", description: "Add your brand name, URL, competitors, and API keys. We support OpenAI, Anthropic, Google, and Perplexity." },
                { step: "2", title: "Check", description: "Add prompts users might ask AI, or let us auto-generate them. Click Run — we query all platforms in parallel." },
                { step: "3", title: "Optimize", description: "See which platforms mention you, your sentiment and position. Use GEO tools and AXP to improve your visibility." },
              ].map((item) => (
                <div key={item.step} className="text-center group">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-black shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AXP Section */}
        <section className="mx-auto max-w-6xl px-4 py-32">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div>
              <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary">AXP Shadow Site</Badge>
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl leading-tight">
                Serve AI-optimized content to bots
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Your pages have 124K tokens of navigation, scripts, styles, and noise.
                AI bots waste context parsing all of it. AXP strips it down to ~1.2K tokens
                of pure signal — a 99% reduction.
              </p>
              <ul className="mt-10 space-y-4">
                {[
                  "Crawl your site and auto-generate optimized versions",
                  "Deploy as Cloudflare Worker or Vercel middleware",
                  "Humans see your normal site, bots see the optimized version",
                  "Track which AI bots visit and how often",
                  "Edit optimized content from the dashboard",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 font-medium">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="h-3 w-3 text-green-500" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-12">
                <Link href="/login">
                  <Button size="lg" className="h-14 px-10 font-bold shadow-xl shadow-primary/20">
                    Set Up AXP <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <Card className="bg-muted/30 border-dashed border-border p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-0 font-mono text-[13px] leading-relaxed text-muted-foreground relative">
                <div className="text-primary font-bold mb-4"># YourProduct</div>
                <div className="mb-2 opacity-60">URL: https://yourproduct.com</div>
                <div className="mb-6 text-foreground font-medium">&gt; The all-in-one platform for...</div>
                <div className="text-primary font-bold mb-2">## Key Features</div>
                <div className="space-y-1">
                  <div>- Real-time analytics dashboard</div>
                  <div>- Team collaboration tools</div>
                  <div>- API with 99.9% uptime</div>
                </div>
                <div className="mt-6 text-primary font-bold mb-2">## Pricing</div>
                <div className="space-y-1">
                  <div>- Free tier: up to 1,000 events</div>
                  <div>- Pro: $29/mo unlimited</div>
                </div>
                <div className="mt-8 pt-8 border-t border-dashed border-border flex items-center justify-between">
                  <div className="text-green-500 font-bold animate-pulse">124K tokens → 1.2K tokens</div>
                  <div className="text-xs font-bold bg-green-500/10 text-green-500 px-3 py-1 rounded-full">99% reduction</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20 py-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <Link href="/" className="text-xl font-bold tracking-tight text-primary mb-8 block">
            MentionPilot
          </Link>
          <div className="flex justify-center gap-8 mb-8 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">GitHub</a>
            <a href="#" className="hover:text-primary transition-colors">Discord</a>
          </div>
          <p className="text-xs text-muted-foreground opacity-60">
            &copy; {new Date().getFullYear()} MentionPilot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

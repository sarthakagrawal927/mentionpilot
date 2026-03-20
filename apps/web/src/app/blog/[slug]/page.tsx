import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { posts } from "#site/content";
import { MDXContent } from "@/components/mdx-content";

interface Props {
  params: Promise<{ slug: string }>;
}

function getPostBySlug(slug: string) {
  return posts.find((p) => p.slug === slug);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function readTime(content: string) {
  const words = content.split(/\s+/).length;
  return `${Math.ceil(words / 200)} min read`;
}

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} | MentionPilot Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold">
            MentionPilot
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="/#tools" className="text-muted-foreground hover:text-foreground transition-colors">Free Tools</Link>
            <Link href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/blog" className="text-foreground font-medium transition-colors">Blog</Link>
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

      {/* Article */}
      <article className="mx-auto max-w-3xl px-4 pt-16 pb-24">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to blog
        </Link>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl leading-tight">
            {post.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {readTime(post.content)}
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none prose-headings:tracking-tight prose-a:text-primary prose-a:underline-offset-4 prose-th:text-left prose-table:border prose-table:border-border prose-th:border-b prose-th:border-border prose-th:px-4 prose-th:py-3 prose-td:border-b prose-td:border-border/50 prose-td:px-4 prose-td:py-3">
          <MDXContent code={post.content} />
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-lg border bg-muted/30 p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Check your AI visibility
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            See if ChatGPT, Claude, Gemini, and Perplexity recommend your brand.
            Free, instant, no signup required.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/check">
              <Button size="lg" className="px-8">
                <Search className="mr-2 h-5 w-5" />
                Free Brand Check
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">MentionPilot</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/tools" className="hover:text-foreground transition-colors">Free Tools</Link>
            <Link href="/check" className="hover:text-foreground transition-colors">Brand Check</Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

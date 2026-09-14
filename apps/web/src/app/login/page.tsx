"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { CircleCheckBig, Eye, MessageSquare, Radar, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-6 sm:px-6">
      <div className="signal-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -left-24 top-20 h-80 w-80 rounded-full bg-signal-cyan/10 blur-[130px]" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-signal-violet/10 blur-[130px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col">
        <Link href="/" className="flex w-fit items-center gap-3 text-sm font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-signal-cyan to-signal-violet text-primary-foreground">
            <Radar className="h-[18px] w-[18px]" />
          </span>
          MentionPilot
        </Link>

        <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1fr_0.8fr] lg:gap-20">
          <section className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal-cyan">Your AI visibility workspace</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">
              Keep every answer, source, and next move connected.
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Sign in to monitor how assistants describe your product and turn observed gaps into accountable work.
            </p>
            <div className="mt-9 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { icon: Eye, title: "Answer evidence", copy: "Retain prompts, responses, citations, and position.", tone: "text-signal-cyan", surface: "bg-signal-cyan/10" },
                { icon: MessageSquare, title: "Source-aware signals", copy: "Bring AI and community evidence into one workspace.", tone: "text-signal-amber", surface: "bg-signal-amber/10" },
                { icon: CircleCheckBig, title: "Visible follow-through", copy: "Attach findings to tasks and compare later scans.", tone: "text-signal-emerald", surface: "bg-signal-emerald/10" },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 rounded-2xl border border-border/60 bg-card/35 p-4">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.surface} ${item.tone}`}>
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Card className="signal-panel w-full rounded-[26px] border-border/75 p-2 shadow-none">
            <div className="rounded-[20px] border border-border/65 bg-[#11161e]">
              <CardHeader className="space-y-3 p-7 pb-5 sm:p-9 sm:pb-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-signal-violet/10 text-signal-violet">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle className="pt-3 text-2xl font-semibold">Enter your workspace</CardTitle>
                <CardDescription className="text-sm leading-6">
                  Continue with Google to access your MentionPilot projects.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-7 pt-0 sm:p-9 sm:pt-0">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-xl border-input bg-background/45 text-sm hover:bg-surface-raised"
                  size="lg"
                  onClick={() =>
                    authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })
                  }
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </Button>
                <p className="mt-5 text-center text-[11px] leading-5 text-muted-foreground">
                  Your provider credentials stay in your own workspace.
                </p>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

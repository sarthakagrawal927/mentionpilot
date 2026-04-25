import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  LayoutDashboard,
  Search,
  BarChart3,
  Settings,
  Menu,
  FileCode,
  MessageSquare,
  Layers,
  Send,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/mentions", label: "AI Mentions", icon: Search },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/axp", label: "AXP Shadow Site", icon: Layers },
  { href: "/dashboard/geo", label: "GEO Tools", icon: FileCode },
  { href: "/dashboard/social", label: "Social Monitor", icon: MessageSquare },
  { href: "/dashboard/directories", label: "Submit Everywhere", icon: Send },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-72 shrink-0 border-r border-border bg-card md:block">
        <div className="flex h-16 items-center px-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-black tracking-tight text-primary">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm shadow-lg shadow-primary/20">M</div>
            MentionPilot
          </Link>
        </div>
        <div className="px-4 py-2">
          <Separator className="opacity-50" />
        </div>
        <nav className="flex flex-col gap-1.5 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary active:scale-95"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-border p-6 bg-muted/20">
          <div className="flex items-center gap-4 mb-4">
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                className="h-10 w-10 rounded-full border-2 border-primary/20 p-0.5 shadow-sm"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                {session.user.name}
              </p>
              <p className="truncate text-[11px] font-medium text-muted-foreground opacity-70">
                {session.user.email}
              </p>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await auth.api.signOut({ headers: await headers() });
              redirect("/");
            }}
          >
            <Button
              variant="outline"
              size="sm"
              type="submit"
              className="w-full justify-start border-primary/10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 font-bold"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-6 md:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <span className="text-xl font-black tracking-tight text-primary">MentionPilot</span>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

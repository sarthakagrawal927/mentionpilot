import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
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
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar-background md:block">
        <div className="flex h-14 items-center px-6">
          <Link href="/dashboard" className="text-lg font-semibold">
            MentionPilot
          </Link>
        </div>
        <Separator />
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t p-4">
          <div className="flex items-center gap-3 mb-3">
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {session.user.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="w-full justify-start"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b px-4 md:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <span className="text-lg font-semibold">MentionPilot</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

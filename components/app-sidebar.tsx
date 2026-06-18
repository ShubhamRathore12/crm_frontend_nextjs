"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  MessageSquare,
  GitBranch,
  BarChart3,
  Megaphone,
  Settings,
  Shield,
  Target,
  Inbox as InboxIcon,
  Calendar as CalendarIcon,
  LogOut,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: InboxIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/leads", label: "Leads", icon: UserPlus },
  { href: "/opportunities", label: "Opportunities", icon: Target },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/interactions", label: "Interactions", icon: MessageSquare },
  { href: "/workflows", label: "Workflows", icon: GitBranch },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/sales-marketing", label: "Sales & Marketing", icon: Target },
  { href: "/admin", label: "Admin", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Detail pages (e.g. /leads/<id>) need the room — auto-collapse the rail there.
function isDetailRoute(pathname: string) {
  return (
    /^\/(leads|opportunities|contacts|interactions)\/[^/]+$/.test(pathname) &&
    !pathname.endsWith("/new")
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Close mobile menu + sync collapse state to the current route.
  useEffect(() => {
    setMobileOpen(false);
    setHovered(false);
    setCollapsed(isDetailRoute(pathname));
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  // showLabels = true → full rail (logo text, labels). false → icon-only rail.
  const renderContent = (showLabels: boolean) => (
    <>
      <div className="h-[57px] px-3 border-b border-border flex items-center justify-between shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden font-semibold text-lg text-primary"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            C
          </span>
          {showLabels && <span className="whitespace-nowrap">CRM</span>}
        </Link>
        {showLabels && (
          <div className="flex items-center">
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1 rounded-md hover:bg-secondary"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                setCollapsed((c) => !c);
                setHovered(false);
              }}
              className="hidden md:flex p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title={collapsed ? "Pin open" : "Collapse sidebar"}
              aria-label="Toggle sidebar"
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {nav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onMouseEnter={() => router.prefetch(item.href)}
              title={!showLabels ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md py-2 text-sm transition-colors",
                showLabels ? "px-3" : "justify-center px-0",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {showLabels && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-border space-y-0.5">
        <ThemeToggle compact={!showLabels} />
        <button
          onClick={handleLogout}
          title={!showLabels ? "Logout" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors w-full",
            showLabels ? "px-3" : "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {showLabels && "Logout"}
        </button>
      </div>
    </>
  );

  const expanded = !collapsed || hovered;

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-border bg-card flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-md hover:bg-secondary"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/dashboard" className="font-semibold text-lg text-primary">
          CRM
        </Link>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "md:hidden fixed top-0 left-0 z-50 h-full w-64 bg-card flex flex-col transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {renderContent(true)}
      </aside>

      {/* Desktop sidebar — outer reserves width in flow; inner is fixed so the
          hover-expanded rail floats over content instead of shifting layout. */}
      <aside
        className={cn(
          "hidden md:block shrink-0 transition-[width] duration-200 ease-out",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <div
          onMouseEnter={() => collapsed && setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={cn(
            "fixed top-0 left-0 z-30 h-screen bg-card border-r border-border flex flex-col transition-[width] duration-200 ease-out",
            expanded ? "w-56" : "w-16",
            collapsed && hovered && "shadow-2xl shadow-black/25"
          )}
        >
          {renderContent(expanded)}
        </div>
      </aside>
    </>
  );
}

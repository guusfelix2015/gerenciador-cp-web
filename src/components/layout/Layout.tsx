import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  LogOut,
  Shield,
  Menu,
  X,
  Crown,
  Heart,
  Wallet,
  ScrollText,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const adminNav = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Meus Ganhos", href: "/my-dashboard", icon: TrendingUp },
  { name: "Usuários", href: "/users", icon: Users },
  { name: "Itens", href: "/items", icon: Package },
  { name: "Drops", href: "/drops", icon: Boxes },
  { name: "Pagamentos", href: "/payments", icon: Wallet },
  { name: "Logs", href: "/audit-logs", icon: ScrollText },
  { name: "Doação", href: "/donation", icon: Heart },
];

const memberNav = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Meus Drops", href: "/drops", icon: Boxes },
  { name: "Itens", href: "/items", icon: Package },
  { name: "Doação", href: "/donation", icon: Heart },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, workspace, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const superAdminNav = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Admin", href: "/admin", icon: Crown },
    { name: "Doação", href: "/donation", icon: Heart },
  ];

  const nav =
    user?.role === "SUPER_ADMIN"
      ? superAdminNav
      : user?.role === "ADMIN"
      ? adminNav
      : memberNav;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Drop CP</span>
          </div>
          {workspace && (
            <div className="mt-1 text-xs text-muted-foreground truncate">
              {workspace.name}
            </div>
          )}
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <span className="font-bold block truncate">Drop CP</span>
            {workspace && (
              <span className="text-[10px] text-muted-foreground block truncate">{workspace.name}</span>
            )}
          </div>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div className="absolute right-0 top-14 bottom-0 w-64 bg-card border-l p-4" onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 md:p-8 pt-16 px-4 pb-4 overflow-auto">
        {children}
      </main>
    </div>
  );
}

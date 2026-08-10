import { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  FileSearch,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Switch } from "@/components/ui/switch";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem("sentinel-notifications-enabled");

    return saved !== "false";
  });

  const [compactMode, setCompactMode] = useState(() => {
    const saved = localStorage.getItem("sentinel-compact-mode");

    return saved === "true";
  });

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem(
      "sentinel-notifications-enabled",
      String(notificationsEnabled),
    );
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem("sentinel-compact-mode", String(compactMode));
  }, [compactMode]);

  const isInvestigation = location.pathname.startsWith("/investigate");

  const isIncidents = location.pathname.startsWith("/incidents");

  const isTrash = location.pathname.startsWith("/trash");

  const isOverview = location.pathname === "/";

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(39,198,255,0.055),transparent_30%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        {/* SIDEBAR */}

        <aside className="hidden w-[248px] shrink-0 border-r border-white/[0.07] bg-[#091524] px-5 py-7 lg:block">
          {/* LOGO */}

          <Link to="/" className="mb-12 flex items-center gap-3 px-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-[#06111e] shadow-[0_0_28px_rgba(34,211,238,0.28)]">
              <ShieldCheck className="h-5 w-5" />
            </span>

            <span>
              <span className="block text-[15px] font-bold tracking-tight text-white">
                Sentinel
              </span>

              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                SOC workspace
              </span>
            </span>
          </Link>

          {/* NAVIGATION */}

          <nav className="space-y-1.5">
            <Link
              to="/"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition",
                isOverview
                  ? "bg-cyan-400/10 text-cyan-300"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
              )}
            >
              <LayoutDashboard className="h-[18px] w-[18px]" />
              Overview
            </Link>

            <Link
              to="/investigate"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition",
                isInvestigation
                  ? "bg-cyan-400/10 text-cyan-300"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
              )}
            >
              <FileSearch className="h-[18px] w-[18px]" />
              Investigations
            </Link>

            <Link
              to="/incidents"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition",
                isIncidents
                  ? "bg-cyan-400/10 text-cyan-300"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
              )}
            >
              <ShieldCheck className="h-[18px] w-[18px]" />
              Incidents
            </Link>

            <Link
              to="/trash"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition",
                isTrash
                  ? "bg-red-400/10 text-red-300"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
              )}
            >
              <Trash2 className="h-[18px] w-[18px]" />
              Trash
            </Link>
          </nav>

          {/* WORKSPACE */}

          <div className="mt-auto pt-12">
            <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
              Workspace
            </div>

            <button
              onClick={() => setSettingsOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200"
            >
              <Settings className="h-[18px] w-[18px]" />
              Settings
            </button>
          </div>
        </aside>

        {/* MAIN */}

        <main className="min-w-0 flex-1">
          <header className="flex h-[76px] items-center justify-between border-b border-white/[0.07] px-5 sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400 text-[#06111e]">
                <ShieldCheck className="h-4 w-4" />
              </span>

              <span className="text-sm font-bold text-white">Sentinel</span>
            </div>

            <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              Workspace active
            </div>

            <div className="ml-auto flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen((open) => !open)}
                  className={cn(
                    "relative rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.05] hover:text-slate-200",
                    notificationsOpen && "bg-white/[0.05] text-cyan-300",
                  )}
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                >
                  <Bell className="h-[18px] w-[18px]" />
                </button>

                {notificationsOpen && (
                  <div
                    role="dialog"
                    aria-label="Notifications"
                    className="absolute right-0 top-12 z-50 w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-white/[0.1] bg-[#0d1d30] p-4 shadow-2xl shadow-black/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Notifications
                        </div>

                        <div className="mt-1 text-[11px] text-slate-500">
                          Workspace activity
                        </div>
                      </div>

                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-200"
                      >
                        Close
                      </button>
                    </div>

                    <div className="mt-4 rounded-xl border border-dashed border-white/[0.1] px-4 py-8 text-center">
                      <Bell className="mx-auto h-5 w-5 text-slate-600" />

                      <div className="mt-3 text-xs font-semibold text-slate-300">
                        No new notifications
                      </div>

                      <div className="mt-1 text-[11px] leading-5 text-slate-500">
                        Backend events will appear here when available.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="h-7 w-px bg-white/[0.08]" />

              <div className="hidden text-right sm:block">
                <div className="text-xs font-semibold text-slate-200">
                  Analyst workspace
                </div>

                <div className="text-[10px] text-slate-500">Local session</div>
              </div>
            </div>
          </header>

          <div
            className={cn(
              "px-5 sm:px-8 lg:px-10",
              compactMode ? "py-6" : "py-7 lg:py-9",
            )}
          >
            {children}
          </div>
        </main>
      </div>

      {/* SETTINGS */}

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent
          side="right"
          className="w-full border-white/[0.08] bg-[#0b1929] text-slate-100 sm:max-w-md"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="text-white">Workspace settings</SheetTitle>

            <SheetDescription className="text-slate-500">
              Control how this Sentinel workspace behaves on this device.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between gap-5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div>
                <div className="text-sm font-semibold text-slate-200">
                  Notifications
                </div>

                <div className="mt-1 text-xs leading-5 text-slate-500">
                  Show workspace notifications when backend events arrive.
                </div>
              </div>

              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                aria-label="Toggle notifications"
                className="data-[state=checked]:bg-cyan-300"
              />
            </div>

            <div className="flex items-center justify-between gap-5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div>
                <div className="text-sm font-semibold text-slate-200">
                  Compact layout
                </div>

                <div className="mt-1 text-xs leading-5 text-slate-500">
                  Reduce vertical spacing across the workspace.
                </div>
              </div>

              <Switch
                checked={compactMode}
                onCheckedChange={setCompactMode}
                aria-label="Toggle compact layout"
                className="data-[state=checked]:bg-cyan-300"
              />
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4 text-xs leading-5 text-slate-400">
            Preferences are saved locally in this browser and do not change
            backend data.
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

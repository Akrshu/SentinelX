import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Trash2,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";

interface TrashIncident {
  id: string;
  title: string;
  severity: string;
  risk_score: number;
  status: string;

  findings?: string[];

  iocs?: {
    type: string;
    value: string;
  }[];

  mitre?: string[];

  created_at: string;
  updated_at: string;

  deleted_at?: string;
  trash_at?: string;
  purge_at?: string;
  expires_at?: string;

  retention_days?: number;
}

interface TrashResponse {
  status: string;
  count: number;
  incidents: TrashIncident[];
}

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Trash() {
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<TrashIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [workingId, setWorkingId] = useState<string | null>(null);

  // ============================================================
  // LOAD TRASH
  // ============================================================

  async function loadTrash(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(`${API}/api/incidents/trash/list`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: TrashResponse = await response.json();

      setIncidents(data.incidents ?? []);
    } catch (err) {
      console.error("Failed to load trash:", err);

      setError(err instanceof Error ? err.message : "Unable to load Trash.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadTrash();
  }, []);

  // ============================================================
  // RESTORE
  // ============================================================

  async function restoreIncident(id: string) {
    try {
      setWorkingId(id);
      setError("");

      const response = await fetch(
        `${API}/api/incidents/${encodeURIComponent(id)}/restore`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const body = await response.text();

        let message = `HTTP ${response.status}`;

        try {
          const parsed = JSON.parse(body);

          if (parsed.detail) {
            message = parsed.detail;
          }
        } catch {
          // Keep HTTP message.
        }

        throw new Error(message);
      }

      await loadTrash();
    } catch (err) {
      console.error("Failed to restore incident:", err);

      setError(
        err instanceof Error ? err.message : "Unable to restore incident.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  // ============================================================
  // PERMANENT DELETE
  // ============================================================

  async function permanentlyDelete(id: string) {
    const confirmed = window.confirm(
      "This will permanently delete the incident and all stored investigation data. This action cannot be undone. Continue?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setWorkingId(id);
      setError("");

      const response = await fetch(
        `${API}/api/incidents/${encodeURIComponent(id)}/permanent`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const body = await response.text();

        let message = `HTTP ${response.status}`;

        try {
          const parsed = JSON.parse(body);

          if (parsed.detail) {
            message = parsed.detail;
          }
        } catch {
          // Keep HTTP message.
        }

        throw new Error(message);
      }

      await loadTrash();
    } catch (err) {
      console.error("Failed to permanently delete incident:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to permanently delete incident.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  function severityClass(value: string) {
    switch (value.toLowerCase()) {
      case "critical":
        return {
          badge: "border-red-400/20 bg-red-400/10 text-red-300",
          dot: "bg-red-300",
        };

      case "high":
        return {
          badge: "border-orange-400/20 bg-orange-400/10 text-orange-300",
          dot: "bg-orange-300",
        };

      case "medium":
        return {
          badge: "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
          dot: "bg-yellow-300",
        };

      default:
        return {
          badge: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
          dot: "bg-cyan-300",
        };
    }
  }

  function riskClass(score: number) {
    if (score >= 80) {
      return "text-red-300";
    }

    if (score >= 60) {
      return "text-orange-300";
    }

    if (score >= 30) {
      return "text-yellow-300";
    }

    return "text-cyan-300";
  }

  function formatDate(value?: string) {
    if (!value) {
      return "Unknown";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }

  function getDeletedAt(incident: TrashIncident) {
    return incident.deleted_at || incident.trash_at || incident.updated_at;
  }

  function getExpiry(incident: TrashIncident) {
    const value = incident.expires_at || incident.purge_at;

    if (!value) {
      return "Managed by backend";
    }

    return formatDate(value);
  }

  const stats = useMemo(() => {
    const critical = incidents.filter(
      (incident) => incident.severity.toLowerCase() === "critical",
    ).length;

    const high = incidents.filter(
      (incident) => incident.severity.toLowerCase() === "high",
    ).length;

    return {
      total: incidents.length,
      critical,
      high,
    };
  }, [incidents]);

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 px-6 py-7 lg:px-8 xl:px-10">
      {/* ====================================================== */}
      {/* TOP NAVIGATION */}
      {/* ====================================================== */}

      <div>
        <button
          type="button"
          onClick={() => navigate("/incidents")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to incidents
        </button>
      </div>

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <section>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-300/70">
              <Trash2 className="h-4 w-4" />
              Security Operations
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white lg:text-4xl">
              Trash
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Recover deleted security incidents before their retention period
              expires.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadTrash(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.04] hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      {/* ====================================================== */}
      {/* STATS */}
      {/* ====================================================== */}

      {!loading && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* TOTAL */}

          <div className="rounded-2xl border border-white/[0.07] bg-[#0b1929] p-5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                Items in Trash
              </div>

              <Trash2 className="h-4 w-4 text-red-300" />
            </div>

            <div className="mt-3 text-3xl font-bold text-white">
              {stats.total}
            </div>

            <p className="mt-1 text-xs text-slate-600">Recoverable incidents</p>
          </div>

          {/* CRITICAL */}

          <div className="rounded-2xl border border-white/[0.07] bg-[#0b1929] p-5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                Critical
              </div>

              <AlertTriangle className="h-4 w-4 text-red-300" />
            </div>

            <div className="mt-3 text-3xl font-bold text-red-300">
              {stats.critical}
            </div>

            <p className="mt-1 text-xs text-slate-600">
              Critical incidents awaiting expiry
            </p>
          </div>

          {/* HIGH */}

          <div className="rounded-2xl border border-white/[0.07] bg-[#0b1929] p-5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                High severity
              </div>

              <ShieldAlert className="h-4 w-4 text-orange-300" />
            </div>

            <div className="mt-3 text-3xl font-bold text-orange-300">
              {stats.high}
            </div>

            <p className="mt-1 text-xs text-slate-600">
              High-risk deleted incidents
            </p>
          </div>
        </section>
      )}

      {/* ====================================================== */}
      {/* RETENTION INFO */}
      {/* ====================================================== */}

      {!loading && (
        <div className="flex items-start gap-3 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.03] px-5 py-4">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />

          <div>
            <p className="text-sm font-medium text-slate-300">
              Retention policy
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              Incidents in Trash remain recoverable until the backend retention
              period expires. After expiry, they may be permanently removed.
            </p>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* ERROR */}
      {/* ====================================================== */}

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm text-red-300">
            <AlertTriangle className="h-4 w-4" />

            {error}
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* LOADING */}
      {/* ====================================================== */}

      {loading && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#0b1929] px-6 py-16 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-300" />

          <p className="mt-4 text-sm text-slate-500">Loading Trash...</p>
        </div>
      )}

      {/* ====================================================== */}
      {/* EMPTY STATE */}
      {/* ====================================================== */}

      {!loading && !error && incidents.length === 0 && (
        <section className="rounded-2xl border border-dashed border-white/[0.1] bg-[#0b1929] px-6 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <Trash2 className="h-7 w-7 text-slate-600" />
          </div>

          <h2 className="mt-5 text-base font-semibold text-slate-300">
            Trash is empty
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Incidents moved to Trash will appear here. You can restore them or
            permanently delete them before the retention period expires.
          </p>

          <button
            type="button"
            onClick={() => navigate("/incidents")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.04] hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to incidents
          </button>
        </section>
      )}

      {/* ====================================================== */}
      {/* TRASH LIST */}
      {/* ====================================================== */}

      {!loading && incidents.length > 0 && (
        <section className="space-y-4">
          {/* SECTION HEADER */}

          <div className="flex items-end justify-between px-1">
            <div>
              <h2 className="text-sm font-semibold text-slate-300">
                Deleted incidents
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                These incidents are recoverable until their retention period
                expires.
              </p>
            </div>

            <span className="text-xs text-slate-600">
              {incidents.length} {incidents.length === 1 ? "item" : "items"}
            </span>
          </div>

          {/* INCIDENT CARDS */}

          <div className="space-y-3">
            {incidents.map((incident) => {
              const severity = severityClass(incident.severity);

              const isWorking = workingId === incident.id;

              return (
                <article
                  key={incident.id}
                  className="rounded-2xl border border-white/[0.07] bg-[#0b1929] p-5 transition hover:border-white/[0.1]"
                >
                  {/* TOP ROW */}

                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    {/* LEFT */}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* ID */}

                        <span className="rounded-md border border-white/[0.07] bg-white/[0.015] px-2.5 py-1 font-mono text-[10px] text-slate-500">
                          {incident.id}
                        </span>

                        {/* SEVERITY */}

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${severity.badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${severity.dot}`}
                          />

                          {incident.severity}
                        </span>

                        {/* TRASH STATUS */}

                        <span className="rounded-md border border-red-400/10 bg-red-400/[0.05] px-2.5 py-1 text-[10px] font-semibold text-red-300">
                          In Trash
                        </span>
                      </div>

                      {/* TITLE */}

                      <h3 className="mt-3 text-base font-semibold text-white lg:text-lg">
                        {incident.title}
                      </h3>

                      {/* META */}

                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <ShieldAlert
                            className={`h-3.5 w-3.5 ${riskClass(
                              incident.risk_score,
                            )}`}
                          />
                          Risk{" "}
                          <span
                            className={`font-semibold ${riskClass(
                              incident.risk_score,
                            )}`}
                          >
                            {incident.risk_score}
                          </span>
                        </span>

                        <span className="flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" />
                          Deleted {formatDate(getDeletedAt(incident))}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5" />
                          Expires {getExpiry(incident)}
                        </span>
                      </div>
                    </div>

                    {/* RIGHT METRICS */}

                    <div className="flex flex-wrap items-center gap-6 border-t border-white/[0.05] pt-4 xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                          Findings
                        </div>

                        <div className="mt-1 text-lg font-bold text-white">
                          {incident.findings?.length ?? 0}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                          IOCs
                        </div>

                        <div className="mt-1 text-lg font-bold text-white">
                          {incident.iocs?.length ?? 0}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                          Retention
                        </div>

                        <div className="mt-1 text-lg font-bold text-cyan-300">
                          {incident.retention_days
                            ? `${incident.retention_days}d`
                            : "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DIVIDER */}

                  <div className="my-5 h-px bg-white/[0.05]" />

                  {/* ACTION BAR */}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-600">
                      Restoring returns this incident to the active incident
                      queue.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {/* VIEW */}

                      <Link
                        to={`/incidents/${incident.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm font-semibold text-slate-400 transition hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-slate-200"
                      >
                        View incident
                      </Link>

                      {/* RESTORE */}

                      <button
                        type="button"
                        onClick={() => void restoreIncident(incident.id)}
                        disabled={isWorking}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-[#04111d] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />

                        {isWorking ? "Working..." : "Restore"}
                      </button>

                      {/* PERMANENT DELETE */}

                      <button
                        type="button"
                        onClick={() => void permanentlyDelete(incident.id)}
                        disabled={isWorking}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.08] px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/[0.13] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete permanently
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}


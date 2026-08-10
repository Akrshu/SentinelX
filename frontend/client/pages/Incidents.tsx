import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ChevronRight,
  Clock3,
  RefreshCw,
  Search,
  ShieldAlert,
  User,
  CheckCircle2,
  CircleAlert,
  Activity,
  SlidersHorizontal,
} from "lucide-react";

interface Incident {
  id: string;
  title: string;
  severity: string;
  risk_score: number;
  status: string;
  findings: string[];
  timeline: unknown[];
  mitre: string[];
  iocs: {
    type: string;
    value: string;
  }[];
  recommendations: string[];
  notes: {
    text: string;
    created_at: string;
  }[];
  created_at: string;
  updated_at: string;
}

interface IncidentResponse {
  status: string;
  count: number;
  incidents: Incident[];
}

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  async function loadIncidents(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(`${API}/api/incidents`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: IncidentResponse = await response.json();

      setIncidents(data.incidents ?? []);
    } catch (err) {
      console.error("Failed to load incidents:", err);
      setError("Unable to load incidents from SentinelX backend.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadIncidents();
  }, []);

  const stats = useMemo(() => {
    const active = incidents.filter(
      (incident) =>
        incident.status !== "Closed" && incident.status !== "Resolved",
    ).length;

    const critical = incidents.filter(
      (incident) => incident.severity.toLowerCase() === "critical",
    ).length;

    const resolved = incidents.filter(
      (incident) =>
        incident.status.toLowerCase() === "resolved" ||
        incident.status.toLowerCase() === "closed",
    ).length;

    return {
      total: incidents.length,
      active,
      critical,
      resolved,
    };
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return incidents.filter((incident) => {
      const matchesSearch =
        !query ||
        incident.id.toLowerCase().includes(query) ||
        incident.title.toLowerCase().includes(query) ||
        incident.severity.toLowerCase().includes(query) ||
        incident.status.toLowerCase().includes(query);

      const matchesSeverity =
        severityFilter === "All" ||
        incident.severity.toLowerCase() === severityFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "All" ||
        incident.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [incidents, search, severityFilter, statusFilter]);

  function severityClass(severity: string) {
    switch (severity.toLowerCase()) {
      case "critical":
        return {
          badge: "border-red-400/20 bg-red-400/10 text-red-300",
          icon: "text-red-300",
        };

      case "high":
        return {
          badge: "border-orange-400/20 bg-orange-400/10 text-orange-300",
          icon: "text-orange-300",
        };

      case "medium":
        return {
          badge: "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
          icon: "text-yellow-300",
        };

      default:
        return {
          badge: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
          icon: "text-cyan-300",
        };
    }
  }

  function statusClass(status: string) {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-red-400/10 text-red-300 border-red-400/20";

      case "investigating":
        return "bg-yellow-400/10 text-yellow-300 border-yellow-400/20";

      case "contained":
        return "bg-cyan-400/10 text-cyan-300 border-cyan-400/20";

      case "resolved":
        return "bg-emerald-400/10 text-emerald-300 border-emerald-400/20";

      case "closed":
        return "bg-slate-400/10 text-slate-400 border-slate-400/20";

      default:
        return "bg-slate-400/10 text-slate-400 border-slate-400/20";
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

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 px-6 py-7 lg:px-8 xl:px-10">
      {/* ========================================================= */}
      {/* HEADER */}
      {/* ========================================================= */}

      <section>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-300/70">
          <ShieldAlert className="h-4 w-4" />
          Security Operations
        </div>

        <div className="mt-3 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
              Incidents
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage, investigate and track security incidents detected across
              your SentinelX environment.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadIncidents(true)}
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

      {/* ========================================================= */}
      {/* STAT CARDS */}
      {/* ========================================================= */}

      {!loading && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/[0.07] bg-[#0b1929] p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Total incidents
              </div>

              <Activity className="h-4 w-4 text-cyan-300" />
            </div>

            <div className="mt-3 text-3xl font-bold text-white">
              {stats.total}
            </div>

            <p className="mt-1 text-xs text-slate-600">
              All persisted incidents
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#0b1929] p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Active
              </div>

              <CircleAlert className="h-4 w-4 text-orange-300" />
            </div>

            <div className="mt-3 text-3xl font-bold text-orange-300">
              {stats.active}
            </div>

            <p className="mt-1 text-xs text-slate-600">
              Require analyst attention
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#0b1929] p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Critical
              </div>

              <AlertTriangle className="h-4 w-4 text-red-300" />
            </div>

            <div className="mt-3 text-3xl font-bold text-red-300">
              {stats.critical}
            </div>

            <p className="mt-1 text-xs text-slate-600">
              Highest severity incidents
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#0b1929] p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Resolved
              </div>

              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            </div>

            <div className="mt-3 text-3xl font-bold text-emerald-300">
              {stats.resolved}
            </div>

            <p className="mt-1 text-xs text-slate-600">Closed or resolved</p>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* SEARCH / FILTER */}
      {/* ========================================================= */}

      <section className="rounded-2xl border border-white/[0.07] bg-[#0b1929] p-4">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search incidents, IDs, severity or status..."
              className="w-full rounded-xl border border-white/[0.07] bg-[#07111f] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/30"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <select
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value)}
                className="w-full appearance-none rounded-xl border border-white/[0.07] bg-[#07111f] py-3 pl-10 pr-10 text-sm text-slate-300 outline-none focus:border-cyan-300/30 sm:w-44"
              >
                <option value="All">All severity</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-white/[0.07] bg-[#07111f] px-4 py-3 text-sm text-slate-300 outline-none focus:border-cyan-300/30 sm:w-44"
            >
              <option value="All">All status</option>
              <option value="Open">Open</option>
              <option value="Investigating">Investigating</option>
              <option value="Contained">Contained</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing {filteredIncidents.length} of {incidents.length} incidents
          </span>

          {(search || severityFilter !== "All" || statusFilter !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSeverityFilter("All");
                setStatusFilter("All");
              }}
              className="text-cyan-300 transition hover:text-cyan-200"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* ERROR */}
      {/* ========================================================= */}

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-4 text-sm text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* LOADING */}
      {/* ========================================================= */}

      {loading && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#0b1929] p-14 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-300" />

          <p className="mt-4 text-sm text-slate-500">Loading incidents...</p>
        </div>
      )}

      {/* ========================================================= */}
      {/* EMPTY */}
      {/* ========================================================= */}

      {!loading && !error && filteredIncidents.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/[0.1] bg-[#0b1929] px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <AlertTriangle className="h-6 w-6 text-slate-600" />
          </div>

          <h2 className="mt-5 text-base font-semibold text-slate-300">
            No matching incidents
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Try changing your search or filter criteria.
          </p>
        </div>
      )}

      {/* ========================================================= */}
      {/* INCIDENT LIST */}
      {/* ========================================================= */}

      {!loading && filteredIncidents.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-semibold text-slate-300">
                Incident queue
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Select an incident to review its full investigation.
              </p>
            </div>
          </div>

          {filteredIncidents.map((incident) => {
            const severity = severityClass(incident.severity);

            return (
              <Link
                key={incident.id}
                to={`/incidents/${incident.id}`}
                className="group block rounded-2xl border border-white/[0.07] bg-[#0b1929] p-5 transition duration-200 hover:border-cyan-300/20 hover:bg-[#0d1d30]"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                  {/* LEFT */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-white/[0.07] bg-white/[0.015] px-2.5 py-1 font-mono text-[10px] text-slate-500">
                        {incident.id}
                      </span>

                      <span
                        className={`rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${severity.badge}`}
                      >
                        {incident.severity}
                      </span>

                      <span
                        className={`rounded-md border px-2.5 py-1 text-[10px] font-semibold ${statusClass(
                          incident.status,
                        )}`}
                      >
                        {incident.status}
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-semibold text-white transition group-hover:text-cyan-200 lg:text-lg">
                      {incident.title}
                    </h3>

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <ShieldAlert
                          className={`h-3.5 w-3.5 ${severity.icon}`}
                        />
                        <span className="text-slate-600">Risk</span>
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
                        {new Date(incident.created_at).toLocaleString()}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {
                          incident.iocs.filter(
                            (ioc) => ioc.type.toLowerCase() === "user",
                          ).length
                        }{" "}
                        user IOC
                      </span>
                    </div>
                  </div>

                  {/* RIGHT METRICS */}
                  <div className="flex items-center justify-between gap-8 border-t border-white/[0.05] pt-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                          Findings
                        </div>

                        <div className="mt-1 text-lg font-bold text-white">
                          {incident.findings.length}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                          IOCs
                        </div>

                        <div className="mt-1 text-lg font-bold text-white">
                          {incident.iocs.length}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                          MITRE
                        </div>

                        <div className="mt-1 text-lg font-bold text-white">
                          {incident.mitre.length}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}


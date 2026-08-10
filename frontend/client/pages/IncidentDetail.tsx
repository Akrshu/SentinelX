import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Target,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

/* ============================================================
   TYPES
============================================================ */

interface IOC {
  id?: string;
  type?: string;
  value?: string;
  confidence?: string | number;
}

interface MITRETechnique {
  id: string;
  name?: string;
  tactic?: string;
  description?: string;
}

interface TimelineEvent {
  id?: string | number;

  title?: string;
  type?: string;
  event_type?: string;
  name?: string;

  description?: string;
  message?: string;

  user?: string;
  username?: string;

  source_ip?: string;
  ip?: string;

  timestamp?: string;
  time?: string;
  created_at?: string;

  [key: string]: unknown;
}

interface AnalystNote {
  text?: string;
  created_at?: string;
}

/*
 * IMPORTANT:
 * Backend recommendations are OBJECTS.
 */
interface Recommendation {
  id?: string;
  title?: string;
  description?: string;
}

interface Incident {
  id: string;

  title?: string;
  severity?: string;
  risk_score?: number;
  status?: string;

  findings?: string[];

  timeline?: TimelineEvent[];

  mitre?: MITRETechnique[];

  iocs?: IOC[];

  recommendations?: Recommendation[];

  notes?: AnalystNote[];

  events?: unknown[];

  created_at?: string;
  updated_at?: string;

  is_deleted?: boolean;
  deleted_at?: string | null;
  trash_until?: string | null;
  deleted_retention_days?: number | null;
}

interface ApiResponse {
  status?: string;
  incident?: Incident;
}

/* ============================================================
   HELPERS
============================================================ */

function formatDate(value?: string | null) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function severityClasses(severity?: string) {
  switch ((severity ?? "").toLowerCase()) {
    case "critical":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "high":
      return "border-orange-400/20 bg-orange-400/10 text-orange-300";

    case "medium":
      return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";

    default:
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
  }
}

function statusClasses(status?: string) {
  switch ((status ?? "").toLowerCase()) {
    case "open":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "investigating":
      return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";

    case "contained":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

    case "resolved":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "closed":
      return "border-slate-400/20 bg-slate-400/10 text-slate-400";

    default:
      return "border-white/[0.08] bg-white/[0.03] text-slate-400";
  }
}

function getTimelineTitle(event: TimelineEvent) {
  return (
    event.title ||
    event.event_type ||
    event.type ||
    event.name ||
    "Security Event"
  );
}

function getTimelineDescription(event: TimelineEvent) {
  if (event.description) {
    return event.description;
  }

  if (event.message) {
    return event.message;
  }

  const parts: string[] = [];

  if (event.user || event.username) {
    parts.push(`User: ${event.user || event.username}`);
  }

  if (event.source_ip || event.ip) {
    parts.push(`Source: ${event.source_ip || event.ip}`);
  }

  if (parts.length > 0) {
    return parts.join(" · ");
  }

  return "Security event observed during this investigation.";
}

function getTimelineTime(event: TimelineEvent) {
  return event.timestamp || event.time || event.created_at;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function IncidentDetail() {
  const { incidentId } = useParams<{
    incidentId: string;
  }>();

  const [incident, setIncident] = useState<Incident | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* ==========================================================
     LOAD INCIDENT
  ========================================================== */

  async function loadIncident() {
    if (!incidentId) {
      setError("Incident ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("[SentinelX] Loading incident:", incidentId);

      const response = await fetch(
        `${API}/api/incidents/${encodeURIComponent(incidentId)}`,
      );

      console.log("[SentinelX] Response status:", response.status);

      if (!response.ok) {
        let message = `Backend returned HTTP ${response.status}`;

        try {
          const errorData = await response.json();

          if (errorData?.detail) {
            message = errorData.detail;
          }
        } catch {
          // Ignore invalid JSON error response.
        }

        throw new Error(message);
      }

      const data: ApiResponse = await response.json();

      console.log("[SentinelX] Incident response:", data);

      if (!data.incident) {
        throw new Error("Backend response does not contain an incident.");
      }

      setIncident(data.incident);
    } catch (err) {
      console.error("[SentinelX] Failed to load incident:", err);

      setError(err instanceof Error ? err.message : "Unable to load incident.");

      setIncident(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadIncident();
  }, [incidentId]);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
        <Link
          to="/incidents"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to incidents
        </Link>

        <div className="rounded-2xl border border-white/[0.07] bg-[#091524] p-16 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-300" />

          <p className="mt-4 text-sm text-slate-500">Loading incident...</p>
        </div>
      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error || !incident) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
        <Link
          to="/incidents"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to incidents
        </Link>

        <div className="rounded-2xl border border-red-400/20 bg-[#091524] p-12 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-300" />

          <h1 className="mt-5 text-xl font-bold text-white">
            Unable to open incident
          </h1>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            {error || "The requested incident could not be found."}
          </p>

          <button
            type="button"
            onClick={() => void loadIncident()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-200"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ==========================================================
     SAFE ARRAYS
  ========================================================== */

  const findings = Array.isArray(incident.findings) ? incident.findings : [];

  const timeline = Array.isArray(incident.timeline) ? incident.timeline : [];

  const mitre = Array.isArray(incident.mitre) ? incident.mitre : [];

  const iocs = Array.isArray(incident.iocs) ? incident.iocs : [];

  const recommendations = Array.isArray(incident.recommendations)
    ? incident.recommendations
    : [];

  const notes = Array.isArray(incident.notes) ? incident.notes : [];

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8 lg:px-8">
      {/* BACK */}

      <Link
        to="/incidents"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-cyan-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to incidents
      </Link>

      {/* ======================================================
          INCIDENT HEADER
      ====================================================== */}

      <section className="rounded-2xl border border-white/[0.07] bg-[#091524] p-6 lg:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* LEFT */}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-white/[0.08] px-2.5 py-1 font-mono text-[10px] text-slate-500">
                {incident.id}
              </span>

              <span
                className={`rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${severityClasses(
                  incident.severity,
                )}`}
              >
                {incident.severity || "UNKNOWN"}
              </span>

              <span
                className={`rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusClasses(
                  incident.status,
                )}`}
              >
                {incident.status || "OPEN"}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white lg:text-3xl">
              {incident.title || "Untitled Security Incident"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Security incident detected and managed by SentinelX.
            </p>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Risk{" "}
                <strong className="text-white">
                  {incident.risk_score ?? 0}
                </strong>
              </span>

              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />

                {formatDate(incident.created_at)}
              </span>
            </div>
          </div>

          {/* SUMMARY */}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[430px]">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                Findings
              </div>

              <div className="mt-2 text-xl font-bold text-white">
                {findings.length}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                IOCs
              </div>

              <div className="mt-2 text-xl font-bold text-white">
                {iocs.length}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                MITRE
              </div>

              <div className="mt-2 text-xl font-bold text-white">
                {mitre.length}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                Events
              </div>

              <div className="mt-2 text-xl font-bold text-white">
                {timeline.length}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          FINDINGS + RECOMMENDATIONS
      ====================================================== */}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* FINDINGS */}

        <section className="rounded-2xl border border-white/[0.07] bg-[#091524] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-400/[0.08]">
              <AlertTriangle className="h-4 w-4 text-red-300" />
            </div>

            <div>
              <h2 className="font-semibold text-white">Findings</h2>

              <p className="text-xs text-slate-600">Security observations</p>
            </div>
          </div>

          {findings.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-white/[0.08] p-8 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-300/70" />

              <p className="mt-3 text-sm text-slate-500">
                No findings recorded.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {findings.map((finding, index) => (
                <div
                  key={`${finding}-${index}`}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 text-sm leading-6 text-slate-300"
                >
                  {finding}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RECOMMENDATIONS */}

        <section className="rounded-2xl border border-white/[0.07] bg-[#091524] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/[0.08]">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                Analyst Recommendations
              </h2>

              <p className="text-xs text-slate-600">
                Suggested response actions
              </p>
            </div>
          </div>

          {recommendations.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-white/[0.08] p-8 text-center">
              <p className="text-sm text-slate-500">
                No recommendations recorded.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {recommendations.map((recommendation, index) => (
                <div
                  key={recommendation.id ?? `recommendation-${index}`}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4"
                >
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-300/[0.08] text-xs font-bold text-cyan-300">
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-200">
                        {recommendation.title || "Recommended Action"}
                      </h3>

                      {recommendation.description && (
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {recommendation.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ======================================================
          EVENT TIMELINE
      ====================================================== */}

      <section className="rounded-2xl border border-white/[0.07] bg-[#091524] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/[0.08]">
            <Activity className="h-4 w-4 text-cyan-300" />
          </div>

          <div>
            <h2 className="font-semibold text-white">Event Timeline</h2>

            <p className="text-xs text-slate-600">Correlated security events</p>
          </div>
        </div>

        {timeline.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-white/[0.08] p-10 text-center">
            <Activity className="mx-auto h-7 w-7 text-slate-700" />

            <p className="mt-3 text-sm text-slate-500">
              No timeline events recorded.
            </p>
          </div>
        ) : (
          <div className="mt-7 space-y-4">
            {timeline.map((event, index) => (
              <div key={event.id ?? index} className="flex gap-4">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/[0.06]">
                  <span className="h-2 w-2 rounded-full bg-cyan-300" />
                </div>

                <div className="min-w-0 flex-1 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">
                        {getTimelineTitle(event)}
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {getTimelineDescription(event)}
                      </p>
                    </div>

                    <span className="shrink-0 text-[10px] text-slate-600">
                      {formatDate(getTimelineTime(event))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ======================================================
          MITRE ATT&CK
      ====================================================== */}

      <section className="rounded-2xl border border-white/[0.07] bg-[#091524] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-400/[0.08]">
            <Target className="h-4 w-4 text-orange-300" />
          </div>

          <div>
            <h2 className="font-semibold text-white">
              MITRE ATT&CK Techniques
            </h2>

            <p className="text-xs text-slate-600">
              Techniques observed in this incident
            </p>
          </div>
        </div>

        {mitre.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-white/[0.08] p-8 text-center">
            <p className="text-sm text-slate-600">
              No MITRE techniques recorded.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {mitre.map((technique, index) => (
              <div
                key={technique.id || `mitre-${index}`}
                className="rounded-xl border border-orange-400/15 bg-orange-400/[0.03] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-orange-400/20 bg-orange-400/[0.05] px-2 py-1 font-mono text-[10px] font-bold text-orange-300">
                        {technique.id}
                      </span>

                      <h3 className="text-sm font-semibold text-slate-200">
                        {technique.name || "Unknown Technique"}
                      </h3>
                    </div>

                    {technique.tactic && (
                      <p className="mt-2 text-xs text-slate-500">
                        Tactic:{" "}
                        <span className="text-slate-400">
                          {technique.tactic}
                        </span>
                      </p>
                    )}

                    {technique.description && (
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {technique.description}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="hidden h-4 w-4 shrink-0 text-slate-700 sm:block" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ======================================================
          IOC
      ====================================================== */}

      <section className="rounded-2xl border border-white/[0.07] bg-[#091524] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-400/[0.08]">
            <Database className="h-4 w-4 text-red-300" />
          </div>

          <div>
            <h2 className="font-semibold text-white">
              Indicators of Compromise
            </h2>

            <p className="text-xs text-slate-600">
              Extracted investigation indicators
            </p>
          </div>
        </div>

        {iocs.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-white/[0.08] p-8 text-center">
            <p className="text-sm text-slate-600">No IOCs recorded.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {iocs.map((ioc, index) => (
              <div
                key={ioc.id || `${ioc.type}-${ioc.value}-${index}`}
                className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                    {ioc.type || "Indicator"}
                  </span>

                  {ioc.confidence !== undefined && (
                    <span className="text-[10px] text-slate-600">
                      {ioc.confidence}
                    </span>
                  )}
                </div>

                <div className="mt-2 break-all font-mono text-sm text-slate-300">
                  {ioc.value || "Unknown"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ======================================================
          ANALYST NOTES
      ====================================================== */}

      <section className="rounded-2xl border border-white/[0.07] bg-[#091524] p-6">
        <div>
          <h2 className="font-semibold text-white">Analyst Notes</h2>

          <p className="mt-1 text-xs text-slate-600">
            Investigation notes associated with this incident.
          </p>
        </div>

        {notes.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-white/[0.08] p-8 text-center">
            <p className="text-sm text-slate-600">No analyst notes recorded.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {notes.map((note, index) => (
              <div
                key={`${note.created_at}-${index}`}
                className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">
                    Analyst
                  </span>

                  <span className="text-[10px] text-slate-600">
                    {formatDate(note.created_at)}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {note.text || ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <div className="flex items-center justify-between border-t border-white/[0.06] pt-5 text-xs text-slate-600">
        <span>SentinelX · {incident.id}</span>

        <span>Last updated {formatDate(incident.updated_at)}</span>
      </div>
    </div>
  );
}

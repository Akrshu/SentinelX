import {
  FileText,
  Fingerprint,
  GitBranch,
  ScanSearch,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { LogUpload } from "@/components/LogUpload";
import { useInvestigation } from "@/hooks/useInvestigation";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SOCCopilot from "@/components/SOCCopilot";

function InvestigationSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="h-64 animate-pulse rounded-2xl bg-white/[0.04]" />
      <div className="h-64 animate-pulse rounded-2xl bg-white/[0.04]" />
    </div>
  );
}

export default function Investigation() {
  const { investigation, setInvestigation, isLoading, error } =
    useInvestigation();

  return (
    <AppShell>
      <div className="mx-auto max-w-[1320px]">
        {/* ========================================================= */}
        {/* HEADER */}
        {/* ========================================================= */}

        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">
              <ScanSearch className="h-3.5 w-3.5" />
              Investigation lab
            </div>

            <h1 className="text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">
              Turn raw logs into context.
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Upload a log file to send it to your connected analysis backend.
              Results will appear here as one investigation.
            </p>
          </div>

          {/* ========================================================= */}
          {/* LOG UPLOAD */}
          {/* ========================================================= */}

          <LogUpload
            onUploaded={(response) => {
              /*
               * Backend can return either:
               *
               * OLD:
               * {
               *   id,
               *   report,
               *   timeline,
               *   ...
               * }
               *
               * NEW:
               * {
               *   status: "success",
               *   result: {
               *     id,
               *     report,
               *     timeline,
               *     ...
               *   },
               *   incident: {
               *     id,
               *     ...
               *   }
               * }
               *
               * So we support both formats.
               */

              const investigationData = response?.result ?? response;

              setInvestigation({
                ...investigationData,

                /*
                 * Prefer persisted incident ID.
                 * If not available, use investigation ID.
                 */
                id: response?.incident?.id ?? investigationData?.id ?? "",

                /*
                 * Keep incident information available
                 * for future UI functionality.
                 */
                incident: response?.incident ?? null,

                /*
                 * Safety defaults.
                 * These prevent React from crashing if any
                 * array is missing from the backend response.
                 */
                timeline: investigationData?.timeline ?? [],
                techniques: investigationData?.techniques ?? [],
                iocs: investigationData?.iocs ?? [],
                recommendations: investigationData?.recommendations ?? [],
              });
            }}
          />
        </div>

        {/* ========================================================= */}
        {/* ERROR */}
        {/* ========================================================= */}

        {error && (
          <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-xs text-rose-200">
            Investigation data could not be loaded. {error}
          </div>
        )}

        {/* ========================================================= */}
        {/* LOADING */}
        {/* ========================================================= */}

        {isLoading ? (
          <InvestigationSkeleton />
        ) : (
          <>
            {/* ===================================================== */}
            {/* EMPTY STATE */}
            {/* ===================================================== */}

            {!investigation.id && (
              <div className="mb-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
                    <Sparkles className="h-5 w-5" />
                  </span>

                  <div>
                    <h2 className="text-sm font-semibold text-cyan-100">
                      No investigation loaded
                    </h2>

                    <p className="mt-1.5 text-xs leading-5 text-slate-400">
                      Choose a supported log file to begin. The backend response
                      will populate the report, timeline, techniques, and
                      indicators below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================== */}
            {/* REPORT + THREAT ASSESSMENT */}
            {/* ===================================================== */}

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              {/* =================================================== */}
              {/* INVESTIGATION REPORT */}
              {/* =================================================== */}

              <section className="rounded-2xl border border-white/[0.08] bg-[#0c1b2c]/80 p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  <FileText className="h-3.5 w-3.5 text-cyan-300" />
                  Investigation report
                </div>

                {/* Summary */}

                {investigation.summary && (
                  <div className="mb-5 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4 text-sm leading-6 text-slate-300">
                    {investigation.summary}
                  </div>
                )}

                {/* Report */}

                {investigation.report ? (
                  <div className="prose prose-invert max-w-none prose-headings:text-cyan-300 prose-strong:text-white prose-p:text-slate-300 prose-li:text-slate-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {investigation.report}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <EmptyState
                    title="No report available"
                    description="The investigation report will be rendered from the uploaded log response."
                  />
                )}
              </section>

              {/* =================================================== */}
              {/* THREAT ASSESSMENT */}
              {/* =================================================== */}

              <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#12253a] to-[#0c1b2c] p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-300" />
                  Threat assessment
                </div>

                {investigation.threatScore ? (
                  <div>
                    <div className="text-4xl font-bold tracking-tight text-white">
                      {investigation.threatScore.value}
                    </div>

                    <div className="mt-2 text-sm font-semibold text-rose-200">
                      {investigation.threatScore.label}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="No assessment available"
                    description="Threat scoring will be shown when the backend returns an assessment."
                  />
                )}

                {/* Source file */}

                {investigation.filename && (
                  <div className="mt-7 border-t border-white/[0.07] pt-4 text-xs text-slate-500">
                    Source file{" "}
                    <span className="ml-1 text-slate-300">
                      {investigation.filename}
                    </span>
                  </div>
                )}

                {/* Incident ID */}

                {investigation.incident?.id && (
                  <div className="mt-3 text-xs text-slate-500">
                    Incident{" "}
                    <span className="ml-1 font-medium text-cyan-300">
                      {investigation.incident.id}
                    </span>
                  </div>
                )}
              </section>
            </div>

            {/* ===================================================== */}
            {/* TIMELINE + MITRE */}
            {/* ===================================================== */}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* =================================================== */}
              {/* TIMELINE */}
              {/* =================================================== */}

              <section className="rounded-2xl border border-white/[0.08] bg-[#0c1b2c]/80 p-5 sm:p-6">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  <GitBranch className="h-3.5 w-3.5 text-violet-300" />
                  Event chain
                </div>

                <h2 className="text-lg font-semibold text-white">Timeline</h2>

                {(investigation.timeline ?? []).length === 0 ? (
                  <EmptyState
                    compact
                    title="No timeline events"
                    description="Event sequencing will appear from the investigation response."
                  />
                ) : (
                  <div className="mt-5 space-y-4">
                    {(investigation.timeline ?? []).map((event) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-violet-300/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-slate-200">
                            {event.title}
                          </div>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {event.description}
                          </p>

                          <div className="mt-1 text-[10px] text-slate-600">
                            {event.timestamp}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* =================================================== */}
              {/* MITRE */}
              {/* =================================================== */}

              <section className="rounded-2xl border border-white/[0.08] bg-[#0c1b2c]/80 p-5 sm:p-6">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  <Fingerprint className="h-3.5 w-3.5 text-amber-300" />
                  ATT&CK mapping
                </div>

                <h2 className="text-lg font-semibold text-white">
                  MITRE techniques
                </h2>

                {(investigation.techniques ?? []).length === 0 ? (
                  <EmptyState
                    compact
                    title="No techniques mapped"
                    description="Technique mappings will be provided by the investigation backend."
                  />
                ) : (
                  <div className="mt-5 space-y-3">
                    {(investigation.techniques ?? []).map((technique) => (
                      <div
                        key={technique.id}
                        className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold text-cyan-200">
                            {technique.id}
                          </span>

                          <span className="text-[10px] uppercase tracking-wider text-slate-500">
                            {technique.tactic}
                          </span>
                        </div>

                        <div className="mt-2 text-sm font-semibold text-slate-200">
                          {technique.name}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {technique.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* ===================================================== */}
            {/* IOCs + RECOMMENDATIONS */}
            {/* ===================================================== */}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* =================================================== */}
              {/* IOCs */}
              {/* =================================================== */}

              <section className="rounded-2xl border border-white/[0.08] bg-[#0c1b2c]/80 p-5 sm:p-6">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Indicators of compromise
                </div>

                <h2 className="text-lg font-semibold text-white">
                  Extracted IOCs
                </h2>

                {(investigation.iocs ?? []).length === 0 ? (
                  <EmptyState
                    compact
                    title="No indicators found"
                    description="Extracted indicators will appear when the backend returns them."
                  />
                ) : (
                  <div className="mt-5 space-y-2">
                    {(investigation.iocs ?? []).map((ioc) => (
                      <div
                        key={ioc.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] px-3 py-2.5"
                      >
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-600">
                            {ioc.type}
                          </div>

                          <div className="mt-1 break-all text-xs text-slate-300">
                            {ioc.value}
                          </div>
                        </div>

                        <span className="shrink-0 text-[10px] text-slate-500">
                          {ioc.confidence}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* =================================================== */}
              {/* RECOMMENDATIONS */}
              {/* =================================================== */}

              <section className="rounded-2xl border border-white/[0.08] bg-[#0c1b2c]/80 p-5 sm:p-6">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Analyst guidance
                </div>

                <h2 className="text-lg font-semibold text-white">
                  Recommendations
                </h2>

                {(investigation.recommendations ?? []).length === 0 ? (
                  <EmptyState
                    compact
                    title="No recommendations"
                    description="Recommended actions will be generated from the investigation response."
                  />
                ) : (
                  <div className="mt-5 space-y-3">
                    {(investigation.recommendations ?? []).map(
                      (recommendation) => (
                        <div
                          key={recommendation.id}
                          className="rounded-xl border border-white/[0.07] p-4"
                        >
                          <div className="text-sm font-semibold text-slate-200">
                            {recommendation.title}
                          </div>

                          <p className="mt-1.5 text-xs leading-5 text-slate-500">
                            {recommendation.description}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>

      {/* =========================================================== */}
      {/* SOC COPILOT */}
      {/* =========================================================== */}

      <div className="mt-6">
        <SOCCopilot investigation={investigation} />
      </div>
    </AppShell>
  );
}

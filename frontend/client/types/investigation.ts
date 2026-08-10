import type {
  Alert,
  MITRETechnique,
  Recommendation,
  ThreatScore,
  TimelineEvent,
} from "./dashboard";

/* ============================================================
   INVESTIGATION IOC
   ============================================================ */

export interface InvestigationIOC {
  id: string;
  type: string;
  value: string;

  /*
   * Backend may provide confidence as:
   * - number: 0.95
   * - number: 95
   * - string: "High"
   * - undefined
   *
   * Therefore this is intentionally flexible.
   */
  confidence?: number | string;

  severity?: string;

  source?: string;

  description?: string;
}

/* ============================================================
   INCIDENT REFERENCE
   ============================================================ */

export interface IncidentReference {
  id: string;

  title?: string;

  severity?: string;

  risk_score?: number;

  status?: string;

  findings?: string[];

  timeline?: unknown[];

  mitre?: string[];

  iocs?: {
    type: string;
    value: string;
    id?: string;
    confidence?: number | string;
    severity?: string;
  }[];

  recommendations?: string[];

  events?: unknown[];

  notes?: {
    text: string;
    created_at: string;
  }[];

  created_at?: string;

  updated_at?: string;
}

/* ============================================================
   INVESTIGATION RESULT
   ============================================================ */

export interface InvestigationResult {
  /*
   * Investigation identity
   */

  id: string | null;

  filename: string | null;

  /*
   * Investigation report
   */

  report: string | null;

  summary: string | null;

  /*
   * Threat assessment
   */

  threatScore: ThreatScore | null;

  /*
   * Alerts generated during investigation
   */

  alerts: Alert[];

  /*
   * Event timeline
   */

  timeline: TimelineEvent[];

  /*
   * MITRE ATT&CK techniques
   */

  techniques: MITRETechnique[];

  /*
   * Analyst recommendations
   */

  recommendations: Recommendation[];

  /*
   * Indicators of Compromise
   *
   * IMPORTANT:
   * Investigation uses InvestigationIOC instead of
   * the generic dashboard IOC type because the
   * investigation UI uses id/confidence.
   */

  iocs: InvestigationIOC[];

  /*
   * Creation timestamp
   */

  createdAt: string | null;

  /*
   * Persisted incident created by SentinelX
   */

  incident?: IncidentReference | null;
}

/* ============================================================
   UPLOAD LOG RESPONSE
   ============================================================ */

export interface UploadLogResponse extends InvestigationResult {
  /*
   * Backend response status
   */

  status?: string;

  /*
   * New backend response format:
   *
   * {
   *   status: "success",
   *   result: {...},
   *   incident: {...}
   * }
   */

  result?: InvestigationResult;

  /*
   * Persisted incident reference
   */

  incident?: IncidentReference | null;
}

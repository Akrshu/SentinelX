export interface ThreatScore {
  value: number;
  label: string;
  reasons?: string[];
}

export interface Alert {
  id?: string;
  title: string;
  severity: string;
  description?: string;
  timestamp?: string;
}

export interface IOC {
  type: string;
  value: string;
  severity?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface MITRETechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
}

export interface Recommendation {
  id?: string;
  title?: string;
  description?: string;
  text?: string;
}

export interface RecentIncident {
  id: string;
  title: string;
  severity: string;
  status: string;
  risk_score: number;
  findings_count: number;
  ioc_count: number;
  created_at: string | null;
}

export interface DashboardActivity {
  type: string;
  incidentId: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface DashboardSystemStatus {
  backend: string;
  incidentStore: string;
  investigationEngine: string;
  copilot: string;
}

export interface DashboardSummary {
  totalIncidents: number;
  activeIncidents: number;
  criticalIncidents: number;
  highIncidents: number;
  averageRisk: number;
}

export interface DashboardData {
  /*
   * New real dashboard data
   */

  status?: string;

  summary: DashboardSummary;

  threatPosture: ThreatScore;

  recentIncidents: RecentIncident[];

  activity: DashboardActivity[];

  system: DashboardSystemStatus;

  updatedAt: string | null;

  /*
   * Legacy fields retained so existing
   * investigation/dashboard imports don't break.
   */

  totalAlerts: number | null;

  activeIncidents: number | null;

  meanTimeToRespond: string | null;

  coverage: number | null;

  threatScore: ThreatScore | null;

  alerts: Alert[];

  timeline: TimelineEvent[];

  recommendations: Recommendation[];

  iocs: IOC[];
}

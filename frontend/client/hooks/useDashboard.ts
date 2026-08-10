import { useCallback, useEffect, useState } from "react";

import { fetchDashboard } from "@/api/sentinelApi";

import type { DashboardData } from "@/types/dashboard";

const emptyDashboard: DashboardData = {
  status: "success",

  summary: {
    totalIncidents: 0,
    activeIncidents: 0,
    criticalIncidents: 0,
    highIncidents: 0,
    averageRisk: 0,
  },

  threatPosture: {
    value: 0,
    label: "No active risk",
    reasons: [],
  },

  recentIncidents: [],

  activity: [],

  system: {
    backend: "unknown",
    incidentStore: "unknown",
    investigationEngine: "unknown",
    copilot: "unknown",
  },

  updatedAt: null,

  /*
   * Legacy compatibility
   */

  totalAlerts: null,

  activeIncidents: null,

  meanTimeToRespond: null,

  coverage: null,

  threatScore: null,

  alerts: [],

  timeline: [],

  recommendations: [],

  iocs: [],
};

export function useDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchDashboard();

      setDashboard(response);
    } catch (requestError) {
      console.error("Failed to load dashboard:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load dashboard data",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return {
    dashboard,
    setDashboard,
    isLoading,
    error,
    reload: loadDashboard,
  };
}

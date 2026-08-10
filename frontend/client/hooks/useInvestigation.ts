/// <reference types="react" />
import { useCallback, useState } from "react";
import { fetchInvestigation, uploadLog } from "@/api/sentinelApi";
import type { InvestigationResult } from "@/types/investigation";

const emptyInvestigation: InvestigationResult = {
  id: null,
  filename: null,
  report: null,
  summary: null,
  threatScore: null,
  alerts: [],
  timeline: [],
  techniques: [],
  recommendations: [],
  iocs: [],
  createdAt: null,
};

export function useInvestigation(investigationId?: string) {
  const [investigation, setInvestigation] =
    useState<InvestigationResult>(emptyInvestigation);
  const [isLoading, setIsLoading] = useState(Boolean(investigationId));
  const [error, setError] = useState<string | null>(null);

  const loadInvestigation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchInvestigation(id);
      setInvestigation(response);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load investigation",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeLog = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await uploadLog(file);
      setInvestigation(response);
      return response;
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to analyze log file";
      setError(message);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    investigation,
    setInvestigation,
    isLoading,
    error,
    analyzeLog,
    loadInvestigation,
  };
}

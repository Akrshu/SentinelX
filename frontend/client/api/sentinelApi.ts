import type { DashboardData } from "@/types/dashboard";
import type { InvestigationResult, UploadLogResponse } from "@/types/investigation";
const API = "http://127.0.0.1:8000";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchDashboard(): Promise<DashboardData> {
  const response = await fetch(`${API}/api/dashboard`);
  return parseResponse<DashboardData>(response);
}

export async function fetchInvestigation(
  investigationId: string,
): Promise<InvestigationResult> {
 const response = await fetch(
  `${API}/api/investigate/${encodeURIComponent(investigationId)}`,
);
  return parseResponse<InvestigationResult>(response);
}

export async function uploadLog(file: File): Promise<UploadLogResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API}/api/upload-log`, {
    method: "POST",
    body: formData,
  });

  return parseResponse<UploadLogResponse>(response);
}

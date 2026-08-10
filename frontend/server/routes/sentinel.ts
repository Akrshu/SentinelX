import type { RequestHandler } from "express";

const emptyInvestigation = {
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

const emptyDashboard = {
  totalAlerts: null,
  activeIncidents: null,
  meanTimeToRespond: null,
  coverage: null,
  threatScore: null,
  alerts: [],
  timeline: [],
  recommendations: [],
  iocs: [],
  updatedAt: null,
};

export const handleDashboard: RequestHandler = (_req, res) => {
  res.json(emptyDashboard);
};

export const handleInvestigation: RequestHandler = (_req, res) => {
  res.json(emptyInvestigation);
};

export const handleUpload: RequestHandler = (_req, res) => {
  res.json(emptyInvestigation);
};

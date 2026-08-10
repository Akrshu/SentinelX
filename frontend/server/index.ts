import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  handleDashboard,
  handleInvestigation,
  handleUpload,
} from "./routes/sentinel";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/sentinel/dashboard", handleDashboard);
  app.get("/api/sentinel/investigations/:investigationId", handleInvestigation);
  app.post("/api/sentinel/investigate", handleUpload);

  return app;
}

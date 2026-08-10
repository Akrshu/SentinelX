from pathlib import Path

readme = """# 🛡️ SentinelX

<div align="center">

### AI-Powered Security Operations Platform

**Detect • Investigate • Assess • Respond**

[![Live Demo](https://img.shields.io/badge/Live-Demo-00C7B7?style=for-the-badge&logo=render)](https://sentinelx-frontend-2g5e.onrender.com/)
[![GitHub](https://img.shields.io/badge/GitHub-SentinelX-181717?style=for-the-badge&logo=github)](https://github.com/Akrshu/SentinelX)

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Render](https://img.shields.io/badge/Deployed-Render-46E3B7?style=flat-square&logo=render&logoColor=black)

</div>

---

## ✨ What is SentinelX?

**SentinelX** is a full-stack SOC-style platform that turns security logs into actionable investigations, incidents, risk insights, and AI-assisted analysis.

```text
📥 Security Logs
      ↓
🔎 Parsing & Detection
      ↓
🧠 Investigation
      ↓
⚠️ Risk Assessment
      ↓
🚨 Incident Management
      ↓
🤖 AI-Assisted Analysis
      ↓
📊 SOC Dashboard

🎯 Core Capabilities
Capability	Description
📂 Log Ingestion	Upload security log files
🔎 Detection & Parsing	Extract meaningful security activity
🧠 Investigation	Build investigation context from events
⚠️ Risk Assessment	Evaluate security risk
🚨 Incident Management	Track security incidents
🤖 SOC Copilot	AI-assisted investigation and analysis
📊 Operations Dashboard	Monitor incidents and security posture
🗑️ Incident Lifecycle	Manage incident workflow
🖥️ Platform
📊 Operations Overview

Centralized security dashboard with:

Total incidents
Active incidents
Critical incidents
Average risk
Threat posture
Recent incidents
🔍 Investigation Workflow
Upload Log
   ↓
Parse Events
   ↓
Detect Suspicious Activity
   ↓
Correlate Evidence
   ↓
Generate Investigation
   ↓
Assess Risk
   ↓
Persist Incident
🤖 AI-Assisted SOC Analysis

SentinelX supports AI-assisted investigation through configured providers such as Google Gemini and OpenAI.

🏗️ Architecture
                  ┌──────────────────────┐
                  │     SentinelX UI     │
                  │ React + TypeScript   │
                  └──────────┬───────────┘
                             │ REST / HTTP
                             ▼
                  ┌──────────────────────┐
                  │   FastAPI Backend    │
                  │       Python         │
                  └──────────┬───────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
   ┌────────────┐     ┌────────────┐     ┌────────────┐
   │ Log Parser │     │ Detection  │     │Investigator│
   │            │     │ Correlation│     │  Services  │
   └────────────┘     └────────────┘     └─────┬──────┘
                                                │
                           ┌────────────────────┤
                           ▼                    ▼
                    ┌────────────┐      ┌─────────────┐
                    │   SQLite   │      │ AI Providers│
                    │  Database  │      │Gemini/OpenAI│
                    └────────────┘      └─────────────┘
🧩 Project Structure
SentinelX/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   ├── api/
│   │   ├── correlation/
│   │   ├── database/
│   │   ├── detection/
│   │   ├── incidents/
│   │   ├── parser/
│   │   ├── risk/
│   │   └── services/
│   └── main.py
│
├── frontend/
│   ├── client/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── types/
│   └── package.json
│
├── requirements.txt
└── README.md
🛠️ Tech Stack

Frontend: React • TypeScript • Vite • Tailwind CSS • Radix UI • Recharts

Backend: Python • FastAPI • SQLAlchemy • SQLite

AI: Google Gemini • OpenAI

Deployment: GitHub • Render

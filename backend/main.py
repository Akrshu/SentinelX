from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.upload import router as upload_router
from app.api.investigate import router as investigate_router
from app.api.dashboard import router as dashboard_router
from app.api.copilot import router as copilot_router
from app.api.incidents import router as incidents_router


app = FastAPI(
    title="SentinelX API",
    version="1.0.0",
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local development
        "http://localhost:8081",
        "http://127.0.0.1:8081",

        # Production frontend
        "https://sentinelx-frontend-2g5e.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REGISTER API ROUTERS
# ============================================================

app.include_router(upload_router)
app.include_router(investigate_router)
app.include_router(copilot_router)
app.include_router(incidents_router)
app.include_router(dashboard_router)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def home():
    return {
        "message": "SentinelX Backend Running 🚀"
    }
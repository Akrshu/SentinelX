from datetime import datetime
from typing import Any

from fastapi import APIRouter

from app.incidents.manager import incident_manager


router = APIRouter(
    prefix="/api",
    tags=["Dashboard"],
)


def calculate_threat_posture(
    incidents: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Calculate the current SentinelX threat posture from
    persisted incident data.

    This deliberately uses incident risk scores instead of
    inventing telemetry metrics.
    """

    if not incidents:
        return {
            "value": 0,
            "label": "No active risk",
            "reasons": [],
        }

    active_incidents = [
        incident
        for incident in incidents
        if incident.get("status")
        not in {"Resolved", "Closed"}
    ]

    if not active_incidents:
        return {
            "value": 0,
            "label": "No active risk",
            "reasons": [],
        }

    risk_scores = [
        int(incident.get("risk_score", 0))
        for incident in active_incidents
    ]

    score = round(sum(risk_scores) / len(risk_scores))

    if score >= 80:
        label = "Critical"
    elif score >= 60:
        label = "High"
    elif score >= 30:
        label = "Medium"
    else:
        label = "Low"

    reasons: list[str] = []

    critical_count = sum(
        1
        for incident in active_incidents
        if str(incident.get("severity", "")).lower()
        == "critical"
    )

    high_count = sum(
        1
        for incident in active_incidents
        if str(incident.get("severity", "")).lower()
        == "high"
    )

    if critical_count:
        reasons.append(
            f"{critical_count} active critical incident"
            f"{'s' if critical_count != 1 else ''}"
        )

    if high_count:
        reasons.append(
            f"{high_count} active high-severity incident"
            f"{'s' if high_count != 1 else ''}"
        )

    if not reasons:
        reasons.append(
            f"{len(active_incidents)} active incident"
            f"{'s' if len(active_incidents) != 1 else ''}"
        )

    return {
        "value": score,
        "label": label,
        "reasons": reasons,
    }


def severity_rank(severity: str) -> int:
    values = {
        "critical": 4,
        "high": 3,
        "medium": 2,
        "low": 1,
    }

    return values.get(
        severity.lower(),
        0,
    )


def build_activity(
    incidents: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Build a lightweight activity feed from persisted
    incident creation/update information.
    """

    activity: list[dict[str, Any]] = []

    for incident in incidents:
        incident_id = incident.get("id", "Unknown")
        title = incident.get(
            "title",
            "Security incident",
        )
        status = incident.get(
            "status",
            "Unknown",
        )

        created_at = incident.get(
            "created_at"
        )

        updated_at = incident.get(
            "updated_at"
        )

        if created_at:
            activity.append(
                {
                    "type": "incident_created",
                    "incidentId": incident_id,
                    "title": "Incident created",
                    "description": title,
                    "timestamp": created_at,
                }
            )

        if (
            updated_at
            and updated_at != created_at
        ):
            activity.append(
                {
                    "type": "incident_updated",
                    "incidentId": incident_id,
                    "title": f"Incident {status.lower()}",
                    "description": title,
                    "timestamp": updated_at,
                }
            )

        notes = incident.get(
            "notes",
            [],
        )

        for note in notes:
            note_timestamp = note.get(
                "created_at"
            )

            if note_timestamp:
                activity.append(
                    {
                        "type": "analyst_note",
                        "incidentId": incident_id,
                        "title": "Analyst note added",
                        "description": title,
                        "timestamp": note_timestamp,
                    }
                )

    activity.sort(
        key=lambda item: item.get(
            "timestamp",
            "",
        ),
        reverse=True,
    )

    return activity[:10]


def build_system_status() -> dict[str, str]:
    """
    SentinelX currently has a local backend,
    persisted incident store and investigation engine.
    """

    return {
        "backend": "online",
        "incidentStore": "available",
        "investigationEngine": "ready",
        "copilot": "available",
    }


@router.get("/dashboard")
def dashboard():
    """
    SentinelX SOC operations overview.

    The dashboard is derived from persisted incidents.
    No fake alert counts or fake threat scores are returned.
    """

    incidents = incident_manager.list_incidents()

    # ---------------------------------------------------------
    # SUMMARY
    # ---------------------------------------------------------

    total_incidents = len(incidents)

    active_incidents = [
        incident
        for incident in incidents
        if incident.get("status")
        not in {"Resolved", "Closed"}
    ]

    critical_incidents = [
        incident
        for incident in incidents
        if str(incident.get("severity", "")).lower()
        == "critical"
    ]

    high_incidents = [
        incident
        for incident in incidents
        if str(incident.get("severity", "")).lower()
        == "high"
    ]

    if incidents:
        average_risk = round(
            sum(
                int(
                    incident.get(
                        "risk_score",
                        0,
                    )
                )
                for incident in incidents
            )
            / len(incidents)
        )
    else:
        average_risk = 0

    # ---------------------------------------------------------
    # RECENT INCIDENTS
    # ---------------------------------------------------------

    recent_incidents = sorted(
        incidents,
        key=lambda incident: incident.get(
            "created_at",
            "",
        ),
        reverse=True,
    )[:6]

    recent_incident_data = []

    for incident in recent_incidents:
        recent_incident_data.append(
            {
                "id": incident.get(
                    "id"
                ),
                "title": incident.get(
                    "title",
                    "Security incident",
                ),
                "severity": incident.get(
                    "severity",
                    "Low",
                ),
                "status": incident.get(
                    "status",
                    "Open",
                ),
                "risk_score": int(
                    incident.get(
                        "risk_score",
                        0,
                    )
                ),
                "findings_count": len(
                    incident.get(
                        "findings",
                        [],
                    )
                ),
                "ioc_count": len(
                    incident.get(
                        "iocs",
                        [],
                    )
                ),
                "created_at": incident.get(
                    "created_at"
                ),
            }
        )

    # ---------------------------------------------------------
    # THREAT POSTURE
    # ---------------------------------------------------------

    threat_posture = calculate_threat_posture(
        incidents
    )

    # ---------------------------------------------------------
    # ACTIVITY
    # ---------------------------------------------------------

    activity = build_activity(
        incidents
    )

    # ---------------------------------------------------------
    # UPDATED TIME
    # ---------------------------------------------------------

    now = datetime.utcnow().isoformat()

    # ---------------------------------------------------------
    # RESPONSE
    # ---------------------------------------------------------

    return {
        "status": "success",

        "summary": {
            "totalIncidents": total_incidents,
            "activeIncidents": len(
                active_incidents
            ),
            "criticalIncidents": len(
                critical_incidents
            ),
            "highIncidents": len(
                high_incidents
            ),
            "averageRisk": average_risk,
        },

        "threatPosture": threat_posture,

        "recentIncidents": recent_incident_data,

        "activity": activity,

        "system": build_system_status(),

        "updatedAt": now,
    }
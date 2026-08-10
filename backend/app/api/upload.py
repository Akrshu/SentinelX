from typing import Any

from fastapi import APIRouter, File, UploadFile

from app.incidents.manager import incident_manager
from app.services.investigation_service import investigate_log


router = APIRouter(
    prefix="/api",
    tags=["Upload"],
)


# ============================================================
# HELPERS
# ============================================================

def _get_risk_score(result: dict[str, Any]) -> int:
    """
    Extract risk score from different possible investigation
    response formats.
    """

    possible_values = [
        result.get("risk_score"),
        result.get("riskScore"),
    ]

    threat_score = result.get("threat_score")
    if threat_score is None:
        threat_score = result.get("threatScore")

    if isinstance(threat_score, dict):

        possible_values.extend(
            [
                threat_score.get("score"),
                threat_score.get("value"),
                threat_score.get("risk_score"),
                threat_score.get("riskScore"),
            ]
        )

    elif isinstance(threat_score, (int, float)):
        possible_values.append(threat_score)

    for value in possible_values:

        if isinstance(value, (int, float)):
            return max(
                0,
                min(
                    100,
                    int(value),
                ),
            )

    return 0


def _get_severity(
    result: dict[str, Any],
    risk_score: int,
) -> str:
    """
    Extract severity from investigation result.
    Falls back to risk score.
    """

    possible_values = [
        result.get("severity"),
    ]

    threat_score = result.get("threat_score")

    if threat_score is None:
        threat_score = result.get("threatScore")

    if isinstance(threat_score, dict):
        possible_values.extend(
            [
                threat_score.get("severity"),
                threat_score.get("level"),
            ]
        )

    for value in possible_values:

        if isinstance(value, str) and value.strip():
            return value.strip()

    if risk_score >= 80:
        return "Critical"

    if risk_score >= 60:
        return "High"

    if risk_score >= 40:
        return "Medium"

    return "Low"


def _get_findings(
    result: dict[str, Any],
) -> list[Any]:

    findings = result.get("findings")

    if isinstance(findings, list):
        return findings

    if findings is None:
        return []

    return [findings]


def _get_timeline(
    result: dict[str, Any],
) -> list[Any]:

    timeline = result.get("timeline")

    if isinstance(timeline, list):
        return timeline

    return []


def _get_mitre(
    result: dict[str, Any],
) -> list[Any]:

    mitre = result.get("mitre")

    if mitre is None:
        mitre = result.get("mitre_techniques")

    if mitre is None:
        mitre = result.get("techniques")

    if isinstance(mitre, list):
        return mitre

    return []


def _get_iocs(
    result: dict[str, Any],
) -> list[Any]:

    iocs = result.get("iocs")

    if isinstance(iocs, list):
        return iocs

    return []


def _get_recommendations(
    result: dict[str, Any],
) -> list[Any]:

    recommendations = result.get("recommendations")

    if isinstance(recommendations, list):
        return recommendations

    return []


def _get_events(
    result: dict[str, Any],
) -> list[Any]:

    events = result.get("events")

    if isinstance(events, list):
        return events

    return []


def _build_incident_title(
    result: dict[str, Any],
) -> str:
    """
    Build a human-readable incident title.
    """

    title = result.get("title")

    if isinstance(title, str) and title.strip():
        return title.strip()

    summary = result.get("summary")

    if isinstance(summary, str) and summary.strip():
        return summary.strip().split("\n")[0][:200]

    findings = _get_findings(result)

    if findings:

        first = findings[0]

        if isinstance(first, str):
            return first[:200]

        if isinstance(first, dict):

            name = (
                first.get("title")
                or first.get("name")
                or first.get("finding")
            )

            if isinstance(name, str):
                return name[:200]

    return "Security Investigation"


# ============================================================
# UPLOAD LOG
# ============================================================

@router.post("/upload-log")
async def upload_log(
    file: UploadFile = File(...),
):

    # --------------------------------------------------------
    # Read uploaded file
    # --------------------------------------------------------

    content = await file.read()

    text = content.decode(
        "utf-8",
        errors="replace",
    )

    # --------------------------------------------------------
    # Run SentinelX investigation pipeline
    # --------------------------------------------------------

    result = investigate_log(text)

    # Safety: make sure result is a dictionary
    if not isinstance(result, dict):

        return {
            "status": "success",
            "result": result,
            "incident": None,
        }

    # --------------------------------------------------------
    # Extract investigation information
    # --------------------------------------------------------

    risk_score = _get_risk_score(result)

    severity = _get_severity(
        result,
        risk_score,
    )

    title = _build_incident_title(result)

    findings = _get_findings(result)

    timeline = _get_timeline(result)

    mitre = _get_mitre(result)

    iocs = _get_iocs(result)

    recommendations = _get_recommendations(result)

    events = _get_events(result)

    # --------------------------------------------------------
    # CREATE PERSISTENT INCIDENT
    # --------------------------------------------------------

    incident = incident_manager.create_incident(
        title=title,
        severity=severity,
        risk_score=risk_score,
        investigation={
            "findings": findings,
            "timeline": timeline,
            "mitre": mitre,
            "iocs": iocs,
            "recommendations": recommendations,
            "events": events,
        },
    )

    # --------------------------------------------------------
    # Return both investigation + incident
    # --------------------------------------------------------

    return {
        "status": "success",

        "result": result,

        "incident": incident,
    }
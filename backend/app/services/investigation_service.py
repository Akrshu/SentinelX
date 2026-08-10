from app.parser.parser import parse_log
from app.detection.engine import detect
from app.correlation.engine import correlate
from app.ai.investigator import investigate
from app.risk.risk_engine import calculate_risk

import uuid


def investigate_log(text: str):

    # --------------------------------------------------
    # 1. Parse raw log
    # --------------------------------------------------

    parsed = parse_log(text)

    # --------------------------------------------------
    # 2. Detect suspicious events
    # --------------------------------------------------

    detected = detect(parsed)

    # --------------------------------------------------
    # 3. Correlate events into findings
    # --------------------------------------------------

    correlation = correlate(detected)

    findings = correlation["findings"]

    # --------------------------------------------------
    # 4. Generate AI investigation report
    # --------------------------------------------------

    report = investigate(
        findings,
        detected
    )

    # --------------------------------------------------
    # 5. Timeline
    # --------------------------------------------------

    timeline = []

    for index, event in enumerate(
        correlation["timeline"]
    ):

        timeline.append({
            "id": str(index),

            "title": event["event_name"],

            "description": (
                f'{event.get("user", "Unknown")} '
                f'from {event.get("ip", "Unknown")}'
            ),

            "timestamp": event.get(
                "time",
                "Unknown"
            ),
        })

    # --------------------------------------------------
    # 6. MITRE ATT&CK techniques
    # --------------------------------------------------

    techniques = []

    for technique in correlation["techniques"]:

        techniques.append({
            "id": technique["id"],

            "name": technique["name"],

            "tactic": technique["tactic"],

            "description": technique["description"],
        })

    # --------------------------------------------------
    # 7. Recommendations
    # --------------------------------------------------

    recommendations = []

    recommendation_map = {

        "Possible Brute Force Attack": (
            "Review authentication attempts, "
            "reset affected credentials if compromise "
            "is suspected, and enforce MFA / "
            "account lockout controls."
        ),

        "Possible Password Spraying": (
            "Investigate the source IP and targeted "
            "accounts, verify whether the activity "
            "was authorized, and enforce MFA."
        ),

        "Suspicious Process Execution": (
            "Investigate the process creation event, "
            "identify the executed process and command "
            "line, and isolate the host if malicious "
            "activity is confirmed."
        ),

        "Process Creation Requiring Investigation": (
            "Investigate the process creation event, "
            "identify the executed process and command "
            "line, and isolate the host if malicious "
            "activity is confirmed."
        ),
    }

    for index, finding in enumerate(findings):

        attack = finding.get(
            "attack",
            "Security Finding"
        )

        recommendations.append({

            "id": str(index),

            "title": attack,

            "description": recommendation_map.get(
                attack,
                "Investigate the finding and "
                "validate the associated evidence."
            ),
        })

    # --------------------------------------------------
    # 8. Indicators of Compromise
    # --------------------------------------------------

    iocs = []

    for index, ioc in enumerate(
        correlation["iocs"]
    ):

        iocs.append({

            "id": str(index),

            "type": ioc["type"],

            "value": ioc["value"],

            "confidence": ioc["confidence"],
        })

    # --------------------------------------------------
    # 9. Dynamic Threat Score
    # --------------------------------------------------

    threat_score = calculate_risk(
        detected,
        findings
    )

    # --------------------------------------------------
    # 10. Summary
    # --------------------------------------------------

    if findings:

        summary = findings[0].get(
            "attack",
            "Security findings detected"
        )

    else:

        summary = "No significant threats detected"

    # --------------------------------------------------
    # 11. Final investigation object
    # --------------------------------------------------

    return {

        "id": str(uuid.uuid4()),

        "summary": summary,

        "filename": None,

        "report": report,

        "threatScore": threat_score,

        "alerts": findings,

        "timeline": timeline,

        "techniques": techniques,

        "recommendations": recommendations,

        "iocs": iocs,

        "createdAt": None,
    }
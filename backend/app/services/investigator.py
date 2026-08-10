def generate_investigation(findings):

    if not findings:
        return {
            "summary": "No suspicious activity detected.",
            "root_cause": "No attack pattern matched.",
            "impact": "None",
            "recommendations": [
                "Continue monitoring."
            ]
        }

    attacks = [f["attack"] for f in findings]

    summary = (
        f"SentinelX detected {len(attacks)} suspicious finding(s): "
        + ", ".join(attacks)
    )

    root_cause = (
        "Correlation rules identified attack patterns based on uploaded log events."
    )

    impact = (
        "The detected activity may indicate unauthorized access or malicious execution."
    )

    recommendations = [
        "Investigate affected account.",
        "Review source IP activity.",
        "Check endpoint for malicious processes.",
        "Reset compromised credentials if required."
    ]

    return {
        "summary": summary,
        "root_cause": root_cause,
        "impact": impact,
        "recommendations": recommendations
    }
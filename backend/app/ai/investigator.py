from app.ai.ai_orchestrator import generate_ai_report


# ============================================================
# GENERATE INVESTIGATION PROMPT
# ============================================================

def generate_prompt(findings, events):
    """
    Build a strict, evidence-based investigation prompt.

    The AI must analyze only the telemetry and findings
    produced by SentinelX.

    The AI must clearly separate:
        - observed evidence
        - security interpretation
        - possible hypotheses

    The AI must never present an unproven hypothesis
    as a confirmed fact.
    """

    return f"""
You are an expert SOC Analyst working inside SentinelX.

Your task is to analyze the security investigation using
ONLY the evidence provided by SentinelX below.

============================================================
CORE INVESTIGATION RULES
============================================================

1. EVIDENCE FIRST

Use only the EVENTS and FINDINGS supplied below.

Do not invent:

- attackers
- malware
- payloads
- commands
- IP reputation
- geolocation
- compromised hosts
- compromised accounts
- attack tools
- techniques not supported by the evidence
- root causes not supported by the evidence
- actions that were not observed

If information is not available, explicitly say:

"Not available in the provided telemetry."

------------------------------------------------------------

2. OBSERVED EVIDENCE ≠ CONFIRMED ATTACK
------------------------------------------------------------

Always distinguish between:

OBSERVED:
What the logs directly show.

INTERPRETATION:
What the observed activity may indicate.

HYPOTHESIS:
A possible explanation that requires additional verification.

Never present an interpretation or hypothesis as a confirmed fact.

For example:

BAD:
"The administrator account was compromised."

GOOD:
"A successful login to the administrator account was observed
after multiple failed authentication attempts. This is
consistent with a possible credential compromise, but the
provided telemetry does not independently confirm compromise."

------------------------------------------------------------

3. SUCCESSFUL LOGIN ≠ ACCOUNT COMPROMISE
------------------------------------------------------------

Event ID 4624 only proves that authentication succeeded.

Do NOT automatically state:

"The account was compromised."

Instead say:

"A successful authentication was observed."

Account compromise may be considered a possibility only when
the surrounding evidence supports that hypothesis.

------------------------------------------------------------

4. VALID ACCOUNTS / T1078
------------------------------------------------------------

A successful login may be mapped to:

T1078 - Valid Accounts

However:

T1078 mapping does NOT prove that the account was stolen,
compromised, or maliciously used.

Describe it as observed valid-account authentication unless
additional evidence supports compromise.

------------------------------------------------------------

5. FAILED LOGIN / BRUTE FORCE
------------------------------------------------------------

Event ID 4625 represents a failed authentication attempt.

Multiple failed attempts may support:

T1110 - Brute Force

However, failed authentication alone does not prove that an
attack was successful.

Only describe successful compromise if the evidence actually
supports that conclusion.

------------------------------------------------------------

6. PASSWORD SPRAYING
------------------------------------------------------------

If multiple different accounts receive failed authentication
attempts from the same source in a short period, this may
support:

T1110.003 - Password Spraying

Describe it as "possible" or "suspected" unless stronger
evidence exists.

------------------------------------------------------------

7. PROCESS CREATION
------------------------------------------------------------

Event ID 4688 means process creation was observed.

Process creation alone is NOT malicious.

Do NOT describe every process as suspicious.

Normal processes such as:

- explorer.exe
- userinit.exe

should be treated as normal when no suspicious indicators
are present.

High-interest processes or suspicious command-line indicators
should only be described as suspicious when SentinelX has
actually flagged them.

------------------------------------------------------------

8. POWERSHELL
------------------------------------------------------------

If SentinelX identifies:

powershell.exe
pwsh.exe
or a suspicious PowerShell command-line indicator such as:

- -enc
- -encodedcommand
- invoke-expression
- downloadstring
- frombase64string

the activity may be described as suspicious execution.

However, suspicious PowerShell execution does NOT automatically
prove malware or compromise.

------------------------------------------------------------

9. PRIVILEGED ACTIVITY
------------------------------------------------------------

Event ID 4672 indicates special privilege assignment.

This may be legitimate for privileged accounts.

Do NOT automatically classify Event ID 4672 as malicious.

Explain that additional context is required to determine
whether the privileged activity was authorized.

------------------------------------------------------------

10. NORMAL / BENIGN ACTIVITY
------------------------------------------------------------

If the evidence represents normal activity, clearly state:

"No significant threats were identified in the provided
telemetry."

Do not create an artificial attack narrative.

Do not recommend unnecessary containment actions for clearly
benign activity.

============================================================
EVIDENCE
============================================================

EVENTS:
{events}

FINDINGS:
{findings}

============================================================
REPORT FORMAT
============================================================

Generate a professional SOC investigation report containing:

1. Executive Summary

2. Attack / Activity Narrative

3. Root Cause / Possible Root Cause

4. MITRE ATT&CK Mapping

5. Business Impact

6. Recommendations

============================================================
REPORT REQUIREMENTS
============================================================

EXECUTIVE SUMMARY:

- Summarize only what was observed.
- State the overall security assessment.
- Use "possible" or "suspected" when appropriate.
- Do not claim confirmed compromise unless supported by evidence.

ATTACK / ACTIVITY NARRATIVE:

- Present events chronologically when useful.
- Reference relevant Event IDs.
- Include users, IP addresses and timestamps when available.
- Explain meaningful correlations between events.

ROOT CAUSE:

Clearly separate:

Observed Evidence
from
Possible Root Cause.

If the root cause cannot be determined from the logs, say so.

MITRE ATT&CK:

Only include techniques supported by the provided events
or findings.

Do not invent MITRE techniques.

For each technique, explain the exact evidence supporting it.

BUSINESS IMPACT:

Distinguish between:

Observed Impact
and
Potential Impact.

Do not claim actual damage, data theft, persistence,
lateral movement or system compromise unless supported
by telemetry.

RECOMMENDATIONS:

Recommendations must match the severity and evidence.

For clearly benign activity:

- avoid unnecessary containment
- avoid unnecessary credential resets
- avoid unnecessary host isolation

For suspicious or high-confidence activity:

provide appropriate investigation and containment guidance.

============================================================
LANGUAGE AND CONFIDENCE
============================================================

Use precise SOC terminology.

Prefer:

- observed
- detected
- consistent with
- possible
- suspected
- may indicate
- requires verification

Avoid unsupported statements such as:

- definitely compromised
- confirmed attacker
- definitely malicious
- malware was executed
- credentials were stolen

unless the provided evidence explicitly proves them.

============================================================
FINAL RULE
============================================================

Your report must remain faithful to the SentinelX telemetry.

Do not make the incident more severe merely to sound impressive.

Accuracy is more important than dramatic language.
"""


# ============================================================
# INVESTIGATION
# ============================================================

def investigate(findings, events):
    """
    Generate an AI investigation report.

    The actual AI provider is handled by the AI orchestrator.

    Provider priority:

        Gemini
          ↓
        OpenAI
          ↓
        Local fallback
    """

    print(
        "\n========== BUILDING PROMPT ==========\n"
    )

    # --------------------------------------------------------
    # Build evidence-based prompt
    # --------------------------------------------------------

    prompt = generate_prompt(
        findings,
        events
    )

    # --------------------------------------------------------
    # Send prompt to AI orchestrator
    # --------------------------------------------------------

    report = generate_ai_report(
        prompt
    )

    # --------------------------------------------------------
    # Report received
    # --------------------------------------------------------

    print(
        "\n========== REPORT RECEIVED ==========\n"
    )

    print(report)

    print(
        "\n=====================================\n"
    )

    return report
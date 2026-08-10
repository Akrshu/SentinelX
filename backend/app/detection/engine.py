# =========================================================
# EVENT MAP
# =========================================================

EVENT_MAP = {
    "4625": {
        "name": "Failed Login",
        "severity": "Medium",
        "mitre_id": "T1110",
        "mitre_name": "Brute Force",
        "tactic": "Credential Access",
    },

    "4624": {
        "name": "Successful Login",
        "severity": "Low",
        "mitre_id": "T1078",
        "mitre_name": "Valid Accounts",
        "tactic": "Defense Evasion / Persistence",
    },

    "4688": {
        "name": "Process Creation",
        "severity": "Medium",
        "mitre_id": None,
        "mitre_name": None,
        "tactic": "Execution",
    },

    "4672": {
        "name": "Special Privilege Assignment",
        "severity": "High",
        "mitre_id": None,
        "mitre_name": None,
        "tactic": "Privilege Escalation",
    },
}


# =========================================================
# SUSPICIOUS PROCESS INDICATORS
# =========================================================

SUSPICIOUS_PROCESSES = {
    "powershell.exe",
    "pwsh.exe",
    "cmd.exe",
    "wscript.exe",
    "cscript.exe",
    "mshta.exe",
    "rundll32.exe",
    "regsvr32.exe",
    "certutil.exe",
}


# =========================================================
# SUSPICIOUS COMMAND-LINE INDICATORS
# =========================================================

SUSPICIOUS_COMMAND_INDICATORS = {
    "-enc",
    "-encodedcommand",
    "invoke-expression",
    "iex ",
    "downloadstring",
    "frombase64string",
}


# =========================================================
# NORMALIZE PROCESS NAME
# =========================================================

def normalize_process_name(process_name):
    """
    Normalize a process name so comparisons are reliable.
    """

    if not process_name:
        return ""

    process_name = process_name.strip().lower()

    # Handle Windows paths such as:
    # C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe

    process_name = process_name.replace("\\", "/")

    return process_name.split("/")[-1]


# =========================================================
# ANALYZE PROCESS
# =========================================================

def analyze_process(event):
    """
    Analyze Event ID 4688 process creation information.

    Process creation alone does NOT mean malicious activity.

    The analysis checks:
    - High-interest process names
    - Suspicious command-line indicators
    - MITRE ATT&CK mapping
    """

    process_name = event.get(
        "process_name",
        ""
    )

    command_line = event.get(
        "command_line",
        ""
    )

    parent_process = event.get(
        "parent_process",
        ""
    )

    normalized_name = normalize_process_name(
        process_name
    )

    normalized_command = (
        command_line.strip().lower()
    )

    # =====================================================
    # Process name detection
    # =====================================================

    suspicious_process = (
        normalized_name
        in SUSPICIOUS_PROCESSES
    )

    # =====================================================
    # Command-line detection
    # =====================================================

    matched_indicators = []

    for indicator in SUSPICIOUS_COMMAND_INDICATORS:

        if indicator in normalized_command:

            matched_indicators.append(
                indicator
            )

    suspicious_command = (
        len(matched_indicators) > 0
    )

    # =====================================================
    # Overall process assessment
    # =====================================================

    process_suspicious = (
        suspicious_process
        or suspicious_command
    )

    # =====================================================
    # MITRE ATT&CK mapping
    # =====================================================

    process_mitre_id = None
    process_mitre_name = None
    process_mitre_tactic = None

    # -----------------------------------------------------
    # PowerShell
    # -----------------------------------------------------

    if normalized_name in {
        "powershell.exe",
        "pwsh.exe",
    }:

        process_mitre_id = "T1059.001"
        process_mitre_name = "PowerShell"
        process_mitre_tactic = "Execution"

    # -----------------------------------------------------
    # Windows Command Shell
    # -----------------------------------------------------

    elif normalized_name == "cmd.exe":

        process_mitre_id = "T1059.003"
        process_mitre_name = "Windows Command Shell"
        process_mitre_tactic = "Execution"

    # =====================================================
    # Store process information
    # =====================================================

    event["process_name"] = process_name

    event["command_line"] = command_line

    event["parent_process"] = parent_process

    event["process_suspicious"] = (
        process_suspicious
    )

    event["suspicious_command_indicators"] = (
        matched_indicators
    )

    event["process_mitre_id"] = (
        process_mitre_id
    )

    event["process_mitre_name"] = (
        process_mitre_name
    )

    event["process_mitre_tactic"] = (
        process_mitre_tactic
    )

    # =====================================================
    # Build analysis message
    # =====================================================

    analysis_parts = []

    # -----------------------------------------------------
    # Suspicious process
    # -----------------------------------------------------

    if suspicious_process:

        analysis_parts.append(
            f"High-interest process detected: "
            f"{normalized_name}"
        )

    # -----------------------------------------------------
    # Suspicious command
    # -----------------------------------------------------

    if suspicious_command:

        analysis_parts.append(
            "Suspicious command-line indicator(s): "
            + ", ".join(
                matched_indicators
            )
        )

    # -----------------------------------------------------
    # MITRE information
    # -----------------------------------------------------

    if process_mitre_id:

        analysis_parts.append(
            f"MITRE ATT&CK: "
            f"{process_mitre_id} "
            f"({process_mitre_name})"
        )

    # =====================================================
    # Final process analysis
    # =====================================================

    if analysis_parts:

        event["process_analysis"] = (
            " | ".join(
                analysis_parts
            )
        )

    else:

        event["process_analysis"] = (
            "Process creation observed; "
            "no high-interest process or "
            "command-line indicator matched."
        )

    return event


# =========================================================
# DETECT
# =========================================================

def detect(events):
    """
    Enrich parsed security events with detection metadata.

    Also performs process analysis for Event ID 4688.
    """

    detected = []

    for event in events:

        event_id = str(
            event.get("event_id")
        )

        rule = EVENT_MAP.get(
            event_id
        )

        # =================================================
        # Known event
        # =================================================

        if rule:

            enriched_event = {
                **event,

                "event_name": rule["name"],
                "severity": rule["severity"],

                "mitre_id": rule["mitre_id"],
                "mitre_name": rule["mitre_name"],
                "tactic": rule["tactic"],
            }

        # =================================================
        # Unknown event
        # =================================================

        else:

            enriched_event = {
                **event,

                "event_name": "Unknown Event",
                "severity": "Unknown",

                "mitre_id": None,
                "mitre_name": None,
                "tactic": "Unknown",
            }

        # =================================================
        # Process analysis
        # =================================================

        if event_id == "4688":

            enriched_event = analyze_process(
                enriched_event
            )

        # =================================================
        # Store detected event
        # =================================================

        detected.append(
            enriched_event
        )

    return detected
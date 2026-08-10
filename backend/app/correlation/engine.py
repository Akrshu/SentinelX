from collections import defaultdict
from datetime import datetime


# ============================================================
# TIME HELPERS
# ============================================================

def parse_time(value):
    """
    Convert common timestamp formats into datetime.

    Returns None if the timestamp cannot be parsed.
    """

    if not value:
        return None

    value = str(value).strip()

    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%d %H:%M:%S.%f",
    ]

    for fmt in formats:

        try:
            return datetime.strptime(
                value,
                fmt
            )

        except ValueError:
            continue

    return None


# ============================================================
# TIMELINE
# ============================================================

def build_timeline(events):

    timeline = []

    for event in events:

        timeline.append({
            "time": event.get("time"),
            "event_id": event.get("event_id"),
            "event_name": event.get("event_name"),
            "user": event.get("user"),
            "ip": event.get("ip"),
            "severity": event.get("severity"),
        })

    return timeline


# ============================================================
# IOC EXTRACTION
# ============================================================

def build_iocs(events):

    iocs = []
    seen = set()

    for event in events:

        ip = event.get("ip")

        if ip and ip not in seen:

            seen.add(ip)

            iocs.append({
                "type": "IP",
                "value": ip,
                "confidence": "High",
            })

        user = event.get("user")

        if user:

            key = f"user:{user}"

            if key not in seen:

                seen.add(key)

                iocs.append({
                    "type": "User",
                    "value": user,
                    "confidence": "High",
                })

    return iocs


# ============================================================
# MITRE TECHNIQUES
# ============================================================

def build_techniques(events, findings):
    """
    Build unique MITRE ATT&CK techniques.

    Includes:

    1. Finding-level techniques
       - Password Spraying
       - Brute Force

    2. Event-level techniques
       - Valid Accounts

    3. Process-specific techniques
       - PowerShell
       - Windows Command Shell
    """

    techniques = []
    seen = set()

    # ========================================================
    # 1. FINDING-LEVEL TECHNIQUES
    # ========================================================

    for finding in findings:

        attack = finding.get("attack")

        # ----------------------------------------------------
        # Password Spraying
        # ----------------------------------------------------

        if attack == "Possible Password Spraying":

            technique = {
                "id": "T1110.003",
                "name": "Password Spraying",
                "tactic": "Credential Access",
                "description": (
                    "Multiple failed authentication attempts "
                    "targeting different accounts from the same "
                    "source within a short time window."
                ),
            }

            if technique["id"] not in seen:

                techniques.append(
                    technique
                )

                seen.add(
                    technique["id"]
                )

        # ----------------------------------------------------
        # Brute Force
        # ----------------------------------------------------

        elif attack == "Possible Brute Force Attack":

            technique = {
                "id": "T1110",
                "name": "Brute Force",
                "tactic": "Credential Access",
                "description": (
                    "Repeated failed authentication attempts "
                    "targeting the same account from the same source."
                ),
            }

            if technique["id"] not in seen:

                techniques.append(
                    technique
                )

                seen.add(
                    technique["id"]
                )

    # ========================================================
    # 2. EVENT-LEVEL TECHNIQUES
    # ========================================================

    for event in events:

        mitre_id = event.get(
            "mitre_id"
        )

        mitre_name = event.get(
            "mitre_name"
        )

        tactic = event.get(
            "tactic"
        )

        if mitre_id:

            if mitre_id not in seen:

                seen.add(
                    mitre_id
                )

                techniques.append({
                    "id": mitre_id,

                    "name": mitre_name,

                    "tactic": tactic,

                    "description": (
                        f"Observed through "
                        f"{event.get('event_name')} "
                        f"(Event ID "
                        f"{event.get('event_id')})."
                    ),
                })

    # ========================================================
    # 3. PROCESS-SPECIFIC TECHNIQUES
    # ========================================================

    for event in events:

        process_mitre_id = event.get(
            "process_mitre_id"
        )

        process_mitre_name = event.get(
            "process_mitre_name"
        )

        process_mitre_tactic = event.get(
            "process_mitre_tactic"
        )

        process_name = event.get(
            "process_name",
            "process"
        )

        if not process_mitre_id:
            continue

        if process_mitre_id in seen:
            continue

        seen.add(
            process_mitre_id
        )

        techniques.append({

            "id": process_mitre_id,

            "name": process_mitre_name,

            "tactic": process_mitre_tactic,

            "description": (
                f"Observed through "
                f"{process_name} "
                f"process execution "
                f"(Event ID 4688)."
            ),
        })

    return techniques


# ============================================================
# FAILED LOGIN GROUPING
# ============================================================

def group_failed_logins(events):

    groups = defaultdict(list)

    for event in events:

        if str(
            event.get("event_id")
        ) != "4625":

            continue

        user = event.get(
            "user",
            "Unknown"
        )

        ip = event.get(
            "ip",
            "Unknown"
        )

        key = (
            ip,
            user
        )

        groups[key].append(
            event
        )

    return groups


# ============================================================
# BRUTE FORCE DETECTION
# ============================================================

def detect_brute_force(events):

    """
    Detect repeated failed logins against the same account.

    Rule:

        >= 3 failed attempts
        SAME IP
        SAME USER
    """

    groups = group_failed_logins(
        events
    )

    detections = []

    for (
        ip,
        user
    ), failed_events in groups.items():

        failed_count = len(
            failed_events
        )

        if failed_count < 3:
            continue

        # ----------------------------------------------------
        # Check whether authentication eventually succeeded
        # ----------------------------------------------------

        successful_login = any(

            str(
                event.get("event_id")
            ) == "4624"

            and event.get("ip") == ip

            and event.get("user") == user

            for event in events
        )

        if successful_login:

            severity = "High"
            confidence = "High"

            success_evidence = (
                "Successful login followed "
                "the failed attempts"
            )

        else:

            severity = "Medium"
            confidence = "Medium"

            success_evidence = (
                "No successful login observed"
            )

        detections.append({

            "attack": "Possible Brute Force Attack",

            "severity": severity,

            "confidence": confidence,

            "affected_users": [
                user
            ],

            "source_ips": [
                ip
            ],

            "evidence": [

                f"{failed_count} "
                "failed login attempts",

                f"Same source IP: {ip}",

                f"Target account: {user}",

                success_evidence,
            ],
        })

    return detections


# ============================================================
# PASSWORD SPRAY DETECTION
# ============================================================

def detect_password_spraying(events):

    """
    Detect password spraying.

    Rule:

        >= 3 failed logins
        >= 3 distinct users
        SAME IP
        events occur within 5 minutes
    """

    ip_events = defaultdict(list)

    for event in events:

        if str(
            event.get("event_id")
        ) != "4625":

            continue

        ip = event.get(
            "ip",
            "Unknown"
        )

        ip_events[ip].append(
            event
        )

    detections = []

    for ip, failed_events in ip_events.items():

        if len(failed_events) < 3:
            continue

        users = sorted({

            event.get(
                "user",
                "Unknown"
            )

            for event in failed_events
        })

        if len(users) < 3:
            continue

        # ----------------------------------------------------
        # Time-window validation
        # ----------------------------------------------------

        parsed_times = []

        for event in failed_events:

            parsed = parse_time(
                event.get("time")
            )

            if parsed:

                parsed_times.append(
                    parsed
                )

        within_window = True

        if len(parsed_times) >= 2:

            earliest = min(
                parsed_times
            )

            latest = max(
                parsed_times
            )

            duration_seconds = (
                latest - earliest
            ).total_seconds()

            within_window = (
                duration_seconds <= 300
            )

        if not within_window:
            continue

        detections.append({

            "attack": "Possible Password Spraying",

            "severity": "Medium",

            "confidence": "High",

            "affected_users": users,

            "source_ips": [
                ip
            ],

            "evidence": [

                f"{len(failed_events)} "
                "failed login attempts",

                f"{len(users)} "
                "different accounts targeted",

                f"Source IP: {ip}",

                "Multiple accounts targeted "
                "within a 5-minute window",
            ],
        })

    return detections


# ============================================================
# PRIVILEGED ACTIVITY
# ============================================================

def detect_privileged_activity(events):

    """
    Detect Event ID 4672.

    4672 alone does NOT prove malicious activity.
    """

    privileged_events = [

        event

        for event in events

        if str(
            event.get("event_id")
        ) == "4672"
    ]

    if not privileged_events:
        return []

    users = sorted({

        event.get(
            "user",
            "Unknown"
        )

        for event in privileged_events
    })

    ips = sorted({

        event.get("ip")

        for event in privileged_events

        if event.get("ip")
    })

    return [{

        "attack": "Special Privilege Assignment",

        "severity": "Medium",

        "confidence": "Medium",

        "affected_users": users,

        "source_ips": ips,

        "evidence": [

            f"{len(privileged_events)} "
            "special privilege assignment event(s)",

            "Event ID 4672 observed",

        ],
    }]


# ============================================================
# PROCESS EXECUTION
# ============================================================

# ============================================================
# PROCESS EXECUTION
# ============================================================

def detect_process_execution(events):
    """
    Analyze Event ID 4688 process creation events.

    Process creation alone is NOT malicious.

    A finding is generated only when:
    - a high-interest process is detected, OR
    - suspicious command-line indicators are detected.

    Normal processes such as explorer.exe should not
    create a security finding.
    """

    process_events = [
        event
        for event in events
        if str(event.get("event_id")) == "4688"
    ]

    if not process_events:
        return []

    findings = []

    for event in process_events:

        user = event.get(
            "user",
            "Unknown"
        )

        ip = event.get(
            "ip",
            "Unknown"
        )

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

        process_suspicious = event.get(
            "process_suspicious",
            False
        )

        process_analysis = event.get(
            "process_analysis",
            ""
        )

        suspicious_indicators = event.get(
            "suspicious_command_indicators",
            []
        )

        # ----------------------------------------------------
        # Evidence
        # ----------------------------------------------------

        evidence = [
            "Event ID 4688 observed"
        ]

        if process_name:
            evidence.append(
                f"Process: {process_name}"
            )

        if command_line:
            evidence.append(
                f"Command line: {command_line}"
            )

        if parent_process:
            evidence.append(
                f"Parent process: {parent_process}"
            )

        if suspicious_indicators:
            evidence.append(
                "Suspicious command indicators: "
                + ", ".join(
                    suspicious_indicators
                )
            )

        if process_analysis:
            evidence.append(
                process_analysis
            )

        # ----------------------------------------------------
        # ONLY create a finding when suspicious
        # ----------------------------------------------------

        if not process_suspicious:
            continue

        # ----------------------------------------------------
        # Suspicious process execution
        # ----------------------------------------------------

        findings.append({
            "attack": "Suspicious Process Execution",

            "severity": "High",

            "confidence": "Medium",

            "affected_users": [
                user
            ],

            "source_ips": (
                [ip]
                if ip != "Unknown"
                else []
            ),

            "evidence": evidence,
        })

    return findings

# ============================================================
# ACCOUNT COMPROMISE CORRELATION
# ============================================================

def detect_account_compromise(events):

    """
    Detect a stronger attack chain:

        Failed Logins
             ↓
        Successful Login
             ↓
        Privileged Activity / Process Creation

    This does not prove compromise, but represents
    a high-risk authentication-to-execution chain.
    """

    findings = []

    failed_events = [

        event

        for event in events

        if str(
            event.get("event_id")
        ) == "4625"
    ]

    successful_events = [

        event

        for event in events

        if str(
            event.get("event_id")
        ) == "4624"
    ]

    privileged_events = [

        event

        for event in events

        if str(
            event.get("event_id")
        ) == "4672"
    ]

    process_events = [

        event

        for event in events

        if str(
            event.get("event_id")
        ) == "4688"
    ]

    if not failed_events:
        return findings

    if not successful_events:
        return findings

    # --------------------------------------------------------
    # Check whether successful login shares
    # user/IP with failed authentication
    # --------------------------------------------------------

    correlated_success = False

    affected_users = set()

    source_ips = set()

    for success in successful_events:

        success_user = success.get(
            "user",
            "Unknown"
        )

        success_ip = success.get(
            "ip",
            "Unknown"
        )

        matching_failed = any(

            failed.get("user")
            == success_user

            and failed.get("ip")
            == success_ip

            for failed in failed_events
        )

        if matching_failed:

            correlated_success = True

            affected_users.add(
                success_user
            )

            if success_ip:

                source_ips.add(
                    success_ip
                )

    if not correlated_success:
        return findings

    # --------------------------------------------------------
    # Determine post-authentication activity
    # --------------------------------------------------------

    post_auth_activity = []

    if privileged_events:

        post_auth_activity.append(
            "Special privilege assignment observed"
        )

    if process_events:

        post_auth_activity.append(
            "Process creation observed"
        )

    # --------------------------------------------------------
    # Stronger finding only when post-auth activity exists
    # --------------------------------------------------------

    if post_auth_activity:

        evidence = [

            "Multiple failed authentication attempts",

            "Successful authentication using the same "
            "user/source context",

        ]

        evidence.extend(
            post_auth_activity
        )

        findings.append({

            "attack":
                "Potential Account Compromise",

            "severity":
                "Critical",

            "confidence":
                "High",

            "affected_users":
                sorted(
                    affected_users
                ),

            "source_ips":
                sorted(
                    source_ips
                ),

            "evidence":
                evidence,
        })

    return findings


# ============================================================
# MAIN CORRELATION ENGINE
# ============================================================

def correlate(events):

    if not events:

        return {

            "findings": [],

            "timeline": [],

            "techniques": [],

            "iocs": [],
        }

    # ========================================================
    # Timeline
    # ========================================================

    timeline = build_timeline(
        events
    )

    # ========================================================
    # Findings
    # ========================================================

    findings = []

    # --------------------------------------------------------
    # Authentication detections
    # --------------------------------------------------------

    findings.extend(
        detect_brute_force(
            events
        )
    )

    findings.extend(
        detect_password_spraying(
            events
        )
    )

    # --------------------------------------------------------
    # Privilege detections
    # --------------------------------------------------------

    findings.extend(
        detect_privileged_activity(
            events
        )
    )

    # --------------------------------------------------------
    # Execution observations
    # --------------------------------------------------------

    findings.extend(
        detect_process_execution(
            events
        )
    )

    # --------------------------------------------------------
    # Higher-level attack chain
    # --------------------------------------------------------

    findings.extend(
        detect_account_compromise(
            events
        )
    )

    # ========================================================
    # MITRE techniques
    # ========================================================

    techniques = build_techniques(
        events,
        findings
    )

    # ========================================================
    # IOCs
    # ========================================================

    iocs = build_iocs(
        events
    )

    # ========================================================
    # Final result
    # ========================================================

    return {

        "findings":
            findings,

        "timeline":
            timeline,

        "techniques":
            techniques,

        "iocs":
            iocs,
    }
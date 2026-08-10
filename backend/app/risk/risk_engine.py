from datetime import datetime


# ============================================================
# TIME PARSER
# ============================================================

def parse_time(value):
    """
    Convert common timestamp formats into datetime.

    Supports:
    - Full timestamps
    - ISO timestamps
    - Time-only values
    """

    if not value:
        return None

    value = str(value).strip()

    formats = [
        # Full timestamps
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%d %H:%M:%S.%f",

        # Time-only timestamps
        "%H:%M:%S",
        "%H:%M",
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
# HELPER FUNCTIONS
# ============================================================

def get_event_ids(events):
    """
    Return normalized Event IDs.
    """

    return [
        str(event.get("event_id"))
        for event in events
    ]


def get_finding_text(finding):
    """
    Extract searchable text from a finding.

    Findings can have different structures depending
    on the detection engine.
    """

    if isinstance(finding, str):
        return finding.lower()

    if not isinstance(finding, dict):
        return ""

    values = []

    for key in [
        "title",
        "name",
        "finding",
        "description",
        "event_name",
        "message",
    ]:

        value = finding.get(key)

        if value:
            values.append(
                str(value)
            )

    return " ".join(values).lower()


def get_finding_severity(finding):
    """
    Extract finding severity.
    """

    if not isinstance(finding, dict):
        return ""

    severity = finding.get(
        "severity",
        ""
    )

    return str(
        severity
    ).strip().lower()


def has_finding(findings, keywords):
    """
    Check whether any finding contains one of
    the supplied keywords.
    """

    for finding in findings:

        text = get_finding_text(
            finding
        )

        if any(
            keyword.lower() in text
            for keyword in keywords
        ):

            return True

    return False


def finding_severity_score(findings):
    """
    Convert the strongest detection finding into
    a bounded risk contribution.

    This prevents multiple findings describing
    the same activity from endlessly increasing
    the score.
    """

    severity_weights = {
        "critical": 35,
        "high": 25,
        "medium": 12,
        "low": 3,
    }

    strongest = 0
    strongest_label = None

    for finding in findings:

        severity = get_finding_severity(
            finding
        )

        weight = severity_weights.get(
            severity,
            0
        )

        if weight > strongest:

            strongest = weight
            strongest_label = severity

    return strongest, strongest_label


# ============================================================
# RISK CALCULATION
# ============================================================

def calculate_risk(events, findings):
    """
    Calculate an evidence-weighted risk score.

    Risk is based on:

    - Authentication failures
    - Multiple accounts targeted
    - Successful authentication after failures
    - Suspicious process execution
    - Suspicious command-line indicators
    - Privileged activity
    - Privileged account involvement
    - Correlated attack chains
    - Detection findings

    Important:

    The existence of an event does NOT automatically
    make the activity malicious.

    Examples:

        4624 + explorer.exe
            -> Low

        4624 + 4672
            -> Low

        4624 + powershell.exe -enc
            -> Higher risk

        4625 x3 + 4624 + 4672 + powershell -enc
            -> Critical
    """

    # ========================================================
    # INITIAL STATE
    # ========================================================

    score = 0

    reasons = []

    # Normalize inputs

    if events is None:
        events = []

    if findings is None:
        findings = []

    # ========================================================
    # BASIC EVENT INFORMATION
    # ========================================================

    event_ids = get_event_ids(
        events
    )

    failed_logins = event_ids.count(
        "4625"
    )

    successful_logins = event_ids.count(
        "4624"
    )

    process_creations = event_ids.count(
        "4688"
    )

    privileged_events = event_ids.count(
        "4672"
    )

    # ========================================================
    # USERS / IPs
    # ========================================================

    users = {
        event.get("user")
        for event in events
        if event.get("user")
    }

    ips = {
        event.get("ip")
        for event in events
        if event.get("ip")
    }

    # ========================================================
    # FAILED LOGIN USERS
    # ========================================================

    failed_users = {
        event.get("user")
        for event in events
        if (
            str(event.get("event_id")) == "4625"
            and event.get("user")
        )
    }

    # ========================================================
    # 1. FAILED AUTHENTICATION
    # ========================================================

    if failed_logins >= 3:

        score += 20

        reasons.append(
            f"{failed_logins} failed login "
            "attempts detected"
        )

    elif failed_logins >= 1:

        score += 5

        reasons.append(
            f"{failed_logins} failed login "
            "attempt(s) detected"
        )

    # ========================================================
    # 2. PASSWORD SPRAYING
    # ========================================================

    password_spraying = (
        failed_logins >= 3
        and len(failed_users) >= 3
    )

    if password_spraying:

        score += 25

        reasons.append(
            f"{len(failed_users)} different accounts "
            "targeted by failed authentication attempts"
        )

    # ========================================================
    # 3. FAILED -> SUCCESS CORRELATION
    # ========================================================

    failed_pairs = set()

    for event in events:

        if (
            str(event.get("event_id"))
            != "4625"
        ):
            continue

        user = event.get(
            "user"
        )

        ip = event.get(
            "ip"
        )

        if user or ip:

            failed_pairs.add(
                (
                    user,
                    ip
                )
            )

    successful_after_failures = False

    successful_correlations = []

    for success_event in events:

        if (
            str(success_event.get("event_id"))
            != "4624"
        ):
            continue

        success_user = success_event.get(
            "user"
        )

        success_ip = success_event.get(
            "ip"
        )

        success_time = parse_time(
            success_event.get("time")
        )

        # Same user + same source IP

        if (
            success_user,
            success_ip
        ) not in failed_pairs:

            continue

        matching_failures = []

        for failed_event in events:

            if (
                str(
                    failed_event.get(
                        "event_id"
                    )
                )
                != "4625"
            ):
                continue

            if (
                failed_event.get("user")
                != success_user
            ):
                continue

            if (
                failed_event.get("ip")
                != success_ip
            ):
                continue

            failed_time = parse_time(
                failed_event.get("time")
            )

            if (
                failed_time
                and success_time
                and failed_time <= success_time
            ):

                matching_failures.append(
                    failed_event
                )

        if matching_failures:

            successful_after_failures = True

            successful_correlations.append(
                {
                    "user": success_user,
                    "ip": success_ip,
                    "failed_count": len(
                        matching_failures
                    ),
                }
            )

    if successful_after_failures:

        score += 25

        reasons.append(
            "Successful login occurred after "
            "failed authentication attempts for "
            "the same user and source IP"
        )

    # ========================================================
    # 4. PROCESS ANALYSIS
    # ========================================================

    suspicious_process = False
    suspicious_command = False

    suspicious_process_names = []
    suspicious_command_indicators = []

    for event in events:

        if (
            str(event.get("event_id"))
            != "4688"
        ):
            continue

        # ----------------------------------------------------
        # Detection engine process flag
        # ----------------------------------------------------

        if event.get(
            "process_suspicious",
            False
        ):

            suspicious_process = True

        # ----------------------------------------------------
        # Process name
        # ----------------------------------------------------

        process_name = str(
            event.get(
                "process_name",
                ""
            )
        ).strip().lower()

        if process_name:

            process_name = (
                process_name
                .replace("\\", "/")
                .split("/")[-1]
            )

        high_interest_processes = {
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

        if (
            process_name
            in high_interest_processes
        ):

            suspicious_process = True

            if (
                process_name
                not in suspicious_process_names
            ):

                suspicious_process_names.append(
                    process_name
                )

        # ----------------------------------------------------
        # Suspicious command-line indicators
        # ----------------------------------------------------

        command_line = str(
            event.get(
                "command_line",
                ""
            )
        ).lower()

        command_indicators = {
            "-enc",
            "-encodedcommand",
            "invoke-expression",
            "iex ",
            "downloadstring",
            "frombase64string",
        }

        for indicator in command_indicators:

            if indicator in command_line:

                suspicious_command = True

                if (
                    indicator
                    not in suspicious_command_indicators
                ):

                    suspicious_command_indicators.append(
                        indicator
                    )

        # ----------------------------------------------------
        # Detection engine indicators
        # ----------------------------------------------------

        event_indicators = event.get(
            "suspicious_command_indicators",
            []
        )

        if event_indicators:

            suspicious_command = True

            for indicator in event_indicators:

                indicator = str(
                    indicator
                )

                if (
                    indicator
                    not in suspicious_command_indicators
                ):

                    suspicious_command_indicators.append(
                        indicator
                    )

    # ========================================================
    # 5. PROCESS CREATION BASE SCORE
    # ========================================================

    if process_creations >= 1:

        # Normal process creation such as
        # explorer.exe should have only a small
        # risk contribution.

        if not suspicious_process:

            score += 3

            reasons.append(
                f"{process_creations} process creation "
                "event observed without suspicious indicators"
            )

        else:

            score += 15

            reasons.append(
                "High-interest process execution detected"
            )

    # ========================================================
    # 6. SUSPICIOUS COMMAND LINE
    # ========================================================

    if suspicious_command:

        score += 20

        reasons.append(
            "Suspicious command-line indicator(s) "
            "detected: "
            + ", ".join(
                suspicious_command_indicators
            )
        )

    # ========================================================
    # 7. SPECIAL PRIVILEGE ASSIGNMENT
    # ========================================================

    if privileged_events >= 1:

        # IMPORTANT:
        #
        # Event 4672 alone is NOT malicious.
        #
        # Windows commonly generates 4672 when an
        # administrator logs in.
        #
        # Therefore:
        #
        # 4624 + 4672
        #     -> very small contribution
        #
        # 4625 -> 4624 -> 4672
        #     -> stronger contribution

        if successful_after_failures:

            score += 10

            reasons.append(
                f"{privileged_events} special privilege "
                "assignment event(s) observed after "
                "authentication failures"
            )

        else:

            score += 2

            reasons.append(
                f"{privileged_events} special privilege "
                "assignment event(s) observed; "
                "no preceding authentication anomaly"
            )

    # ========================================================
    # 8. PRIVILEGED ACCOUNT
    # ========================================================

    privileged_users = {
        "administrator",
        "admin",
        "root",
    }

    privileged_accounts = {
        user.lower()
        for user in users
        if (
            isinstance(user, str)
            and user.lower()
            in privileged_users
        )
    }

    if privileged_accounts:

        # Privileged account alone is not enough
        # to classify the activity as malicious.

        if (
            failed_logins > 0
            or suspicious_process
            or suspicious_command
        ):

            score += 10

            reasons.append(
                "Privileged account involved: "
                + ", ".join(
                    sorted(
                        privileged_accounts
                    )
                )
            )

        else:

            score += 2

            reasons.append(
                "Privileged account involved in "
                "otherwise normal authentication"
            )

    # ========================================================
    # 9. SINGLE SOURCE IP
    # ========================================================

    if (
        len(ips) == 1
        and len(events) >= 3
    ):

        score += 5

        reasons.append(
            "Multiple events originated from "
            "a single source IP"
        )

    # ========================================================
    # 10. STRONG AUTHENTICATION -> EXECUTION CHAIN
    # ========================================================

    if (
        failed_logins >= 3
        and successful_after_failures
        and process_creations >= 1
    ):

        score += 10

        reasons.append(
            "Failed authentication was followed by "
            "successful access and process execution"
        )

    # ========================================================
    # 11. PRIVILEGED POST-AUTHENTICATION ACTIVITY
    # ========================================================

    if (
        successful_after_failures
        and (
            privileged_events >= 1
            or suspicious_process
        )
    ):

        score += 10

        reasons.append(
            "Post-authentication privileged or "
            "suspicious execution activity observed"
        )

    # ========================================================
    # 12. FULL ATTACK CHAIN
    #
    # Failed login
    #       ↓
    # Successful login
    #       ↓
    # Privilege / suspicious execution
    # ========================================================

    full_attack_chain = (
        failed_logins >= 3
        and successful_after_failures
        and (
            privileged_events >= 1
            or suspicious_process
            or suspicious_command
        )
    )

    if full_attack_chain:

        score += 10

        reasons.append(
            "Strong post-authentication attack chain "
            "observed"
        )

    # ========================================================
    # 13. DETECTION FINDING SEVERITY
    # ========================================================

    finding_score, strongest_finding = (
        finding_severity_score(
            findings
        )
    )

    if finding_score:

        # Finding severity is supporting evidence.
        # It should NOT override clear benign context.

        score += finding_score

        reasons.append(
            f"Detection engine produced a "
            f"{strongest_finding} severity finding"
        )

    # ========================================================
    # 14. CONTEXTUAL ADJUSTMENTS
    # ========================================================

    # --------------------------------------------------------
    # Benign process creation
    #
    # Example:
    #
    # 4624
    #   ↓
    # userinit.exe
    #   ↓
    # explorer.exe
    #
    # This should remain Low.
    # --------------------------------------------------------

    benign_process_only = (
        process_creations >= 1
        and not suspicious_process
        and not suspicious_command
        and failed_logins == 0
        and privileged_events == 0
    )

    if benign_process_only:

        score = min(
            score,
            20
        )

    # --------------------------------------------------------
    # NORMAL PRIVILEGED LOGIN
    #
    # Example:
    #
    # 4624 administrator
    #       ↓
    # 4672
    #
    # This is commonly normal Windows behavior.
    #
    # It should NOT become Medium/High merely because
    # the account is privileged.
    # --------------------------------------------------------

    normal_privileged_login = (
        successful_logins >= 1
        and failed_logins == 0
        and privileged_events >= 1
        and not suspicious_process
        and not suspicious_command
    )

    if normal_privileged_login:

        score = min(
            score,
            15
        )

    # --------------------------------------------------------
    # NORMAL LOGIN ONLY
    # --------------------------------------------------------

    normal_login_only = (
        successful_logins >= 1
        and failed_logins == 0
        and process_creations == 0
        and privileged_events == 0
        and not suspicious_process
        and not suspicious_command
    )

    if normal_login_only:

        score = min(
            score,
            10
        )

    # --------------------------------------------------------
    # NORMAL LOGIN + NORMAL PROCESS
    #
    # 4624 + explorer.exe
    #
    # Keep this Low even if a generic finding has
    # Medium severity metadata.
    # --------------------------------------------------------

    normal_windows_login = (
        successful_logins >= 1
        and failed_logins == 0
        and process_creations >= 1
        and privileged_events == 0
        and not suspicious_process
        and not suspicious_command
    )

    if normal_windows_login:

        score = min(
            score,
            20
        )

    # ========================================================
    # 15. FINAL BENIGN ADMINISTRATIVE SESSION PROTECTION
    # ========================================================

    # If the only evidence is:
    #
    # 4624
    # 4672
    #
    # then the activity is not enough to justify
    # Medium/High severity.

    if (
        successful_logins >= 1
        and failed_logins == 0
        and process_creations == 0
        and privileged_events >= 1
        and not suspicious_process
        and not suspicious_command
    ):

        score = min(
            score,
            15
        )

    # ========================================================
    # 16. CAP SCORE
    # ========================================================

    score = min(
        max(score, 0),
        100
    )

    # ========================================================
    # 17. SEVERITY LABEL
    # ========================================================

    if score >= 80:

        label = "Critical"

    elif score >= 60:

        label = "High"

    elif score >= 30:

        label = "Medium"

    else:

        label = "Low"

    # ========================================================
    # 18. REMOVE DUPLICATE REASONS
    # ========================================================

    unique_reasons = []

    for reason in reasons:

        if reason not in unique_reasons:

            unique_reasons.append(
                reason
            )

    # ========================================================
    # 19. RETURN RISK ASSESSMENT
    # ========================================================

    return {
        "value": score,
        "label": label,
        "reasons": unique_reasons,
    }
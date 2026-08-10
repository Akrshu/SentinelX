import re


def parse_log(content: str):
    """
    Parse raw security logs into structured events.

    Supported formats:

    1. Key-value format:

       EventID:4625 User:alice IP:10.0.0.50 Time:10:30

    2. Key-value format with process details:

       EventID:4688 User:Administrator IP:192.168.1.10
       Time:10:34 ProcessName:powershell.exe
       CommandLine:powershell.exe -enc ABC123
       ParentProcess:cmd.exe

    3. Pipe-separated format:

       2023-10-24 11:00:00 | 4625 | alice | 10.0.0.50

    4. Pipe-separated format with process details:

       2023-10-24 10:34:00 | 4688 | Administrator | 192.168.1.10 |
       powershell.exe | powershell.exe -enc ABC123 | cmd.exe

    Pipe format fields:

       timestamp | event_id | user | ip | process_name |
       command_line | parent_process

    Returns:
        List of structured security events.
    """

    events = []

    lines = content.splitlines()

    for line in lines:

        line = line.strip()

        if not line:
            continue

        event = {}

        # ==================================================
        # FORMAT 1 / 2
        # KEY-VALUE FORMAT
        # ==================================================

        event_id = re.search(
            r"EventID[:=]\s*(\d+)",
            line,
            re.IGNORECASE,
        )

        user = re.search(
            r"User[:=]\s*([A-Za-z0-9._\\-]+)",
            line,
            re.IGNORECASE,
        )

        ip = re.search(
            r"IP[:=]\s*([\d.]+)",
            line,
            re.IGNORECASE,
        )

        time = re.search(
            r"Time[:=]\s*(.*?)(?=\s+(?:ProcessName|CommandLine|ParentProcess)[:=]|$)",
            line,
            re.IGNORECASE,
        )

        process_name = re.search(
            r"ProcessName[:=]\s*(.*?)(?=\s+(?:CommandLine|ParentProcess)[:=]|$)",
            line,
            re.IGNORECASE,
        )

        command_line = re.search(
            r"CommandLine[:=]\s*(.*?)(?=\s+ParentProcess[:=]|$)",
            line,
            re.IGNORECASE,
        )

        parent_process = re.search(
            r"ParentProcess[:=]\s*(.*?)$",
            line,
            re.IGNORECASE,
        )

        if event_id:

            event["event_id"] = event_id.group(1)

            if user:
                event["user"] = user.group(1)

            if ip:
                event["ip"] = ip.group(1)

            if time:
                event["time"] = time.group(1).strip()

            # --------------------------------------------------
            # Process information
            # --------------------------------------------------

            if process_name:
                event["process_name"] = (
                    process_name.group(1).strip()
                )

            if command_line:
                event["command_line"] = (
                    command_line.group(1).strip()
                )

            if parent_process:
                event["parent_process"] = (
                    parent_process.group(1).strip()
                )

        # ==================================================
        # FORMAT 3 / 4
        # PIPE-SEPARATED FORMAT
        # ==================================================

        else:

            parts = [
                part.strip()
                for part in line.split("|")
            ]

            # ----------------------------------------------
            # Basic format
            #
            # timestamp | event_id | user | ip
            # ----------------------------------------------

            if len(parts) >= 4:

                timestamp = parts[0]
                pipe_event_id = parts[1]
                pipe_user = parts[2]
                pipe_ip = parts[3]

                if re.fullmatch(
                    r"\d+",
                    pipe_event_id,
                ):

                    event["time"] = timestamp
                    event["event_id"] = pipe_event_id
                    event["user"] = pipe_user
                    event["ip"] = pipe_ip

                    # ------------------------------------------
                    # Optional process information
                    #
                    # timestamp | event_id | user | ip |
                    # process_name | command_line | parent_process
                    # ------------------------------------------

                    if len(parts) >= 5:

                        process_name = parts[4]

                        if process_name:
                            event["process_name"] = process_name

                    if len(parts) >= 6:

                        command_line = parts[5]

                        if command_line:
                            event["command_line"] = command_line

                    if len(parts) >= 7:

                        parent_process = parts[6]

                        if parent_process:
                            event["parent_process"] = parent_process

        # ==================================================
        # ADD VALID EVENT
        # ==================================================

        if event:
            events.append(event)

    return events
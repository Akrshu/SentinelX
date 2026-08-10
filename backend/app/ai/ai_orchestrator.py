from app.ai.providers.gemini_provider import (
    generate_report as generate_gemini_report
)

from app.ai.providers.openai_provider import (
    generate_report as generate_openai_report
)


# ============================================================
# AI ORCHESTRATOR
# ============================================================

def generate_ai_report(prompt: str) -> str:
    """
    Generate an AI investigation report using provider failover.

    Provider priority:

        1. Gemini
        2. OpenAI
        3. Local fallback

    The SentinelX detection and correlation engines remain
    completely independent from AI provider availability.

    If one AI provider fails, the next provider is attempted.
    If all providers fail, a safe local fallback message is
    returned.
    """

    # ========================================================
    # 1. GEMINI
    # ========================================================

    print(
        "\n================================================"
    )

    print(
        "[AI ORCHESTRATOR] Trying Gemini..."
    )

    print(
        "================================================\n"
    )

    try:

        gemini_result = generate_gemini_report(
            prompt
        )

        if is_valid_ai_response(
            gemini_result
        ):

            print(
                "[AI ORCHESTRATOR] Gemini succeeded."
            )

            return gemini_result

        print(
            "[AI ORCHESTRATOR] Gemini unavailable."
        )

    except Exception as error:

        print(
            f"[AI ORCHESTRATOR] Gemini failed: {error}"
        )


    # ========================================================
    # 2. OPENAI FALLBACK
    # ========================================================

    print(
        "\n================================================"
    )

    print(
        "[AI ORCHESTRATOR] Trying OpenAI fallback..."
    )

    print(
        "================================================\n"
    )

    try:

        openai_result = generate_openai_report(
            prompt
        )

        if is_valid_ai_response(
            openai_result
        ):

            print(
                "[AI ORCHESTRATOR] OpenAI succeeded."
            )

            return openai_result

        print(
            "[AI ORCHESTRATOR] OpenAI unavailable."
        )

    except Exception as error:

        print(
            f"[AI ORCHESTRATOR] OpenAI failed: {error}"
        )


    # ========================================================
    # 3. LOCAL FALLBACK
    # ========================================================

    print(
        "\n================================================"
    )

    print(
        "[AI ORCHESTRATOR] All AI providers unavailable."
    )

    print(
        "[AI ORCHESTRATOR] Using local fallback."
    )

    print(
        "================================================\n"
    )

    return build_local_fallback()


# ============================================================
# AI RESPONSE VALIDATION
# ============================================================

def is_valid_ai_response(response) -> bool:
    """
    Determine whether an AI provider returned a usable
    investigation report.

    Provider errors and temporary-unavailable messages
    must never be treated as successful AI responses.
    """

    if not response:
        return False

    if not isinstance(
        response,
        str
    ):
        return False

    response = response.strip()

    if not response:
        return False

    # --------------------------------------------------------
    # Known provider failure messages
    # --------------------------------------------------------

    failure_messages = [
        "AI analysis is temporarily unavailable",
        "AI analysis could not be completed",
        "Gemini Error:",
        "OpenAI Error:",
        "RESOURCE_EXHAUSTED",
        "quota exceeded",
        "rate limit",
        "429",
        "API error",
        "authentication error",
    ]

    response_lower = response.lower()

    for failure_message in failure_messages:

        if failure_message.lower() in response_lower:

            return False

    return True


# ============================================================
# LOCAL FALLBACK
# ============================================================

def build_local_fallback() -> str:
    """
    Safe fallback message when all AI providers are unavailable.

    Important:

    The local SentinelX detection, correlation, risk,
    MITRE mapping and IOC extraction engines continue
    to operate independently.
    """

    return (
        "AI analysis is temporarily unavailable.\n\n"

        "SentinelX completed the investigation using "
        "its local security detection and correlation "
        "engines.\n\n"

        "The investigation results remain available "
        "including:\n\n"

        "- Threat assessment\n"
        "- Detected findings\n"
        "- Event timeline\n"
        "- MITRE ATT&CK techniques\n"
        "- Indicators of compromise (IOCs)\n"
        "- Analyst recommendations\n\n"

        "No AI-generated conclusion is being provided "
        "because the configured AI providers are "
        "currently unavailable."
    )
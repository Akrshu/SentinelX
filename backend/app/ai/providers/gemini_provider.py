import os
import traceback

from dotenv import load_dotenv
from google import genai


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError(
        "GEMINI_API_KEY not found in .env"
    )


# ============================================================
# GEMINI CLIENT
# ============================================================

client = genai.Client(
    api_key=API_KEY
)


# ============================================================
# AI REPORT GENERATOR
# ============================================================

def generate_report(prompt: str) -> str:
    """
    Generate an investigation report using Gemini.

    If Gemini is unavailable, the function returns a
    clean fallback message instead of exposing raw API errors.
    """

    try:

        print(
            "\n================ GEMINI REQUEST ================\n"
        )

        print(prompt)

        print(
            "\n===============================================\n"
        )

        # ----------------------------------------------------
        # Gemini request
        # ----------------------------------------------------

        response = client.models.generate_content(

            model="gemini-3.5-flash",

            contents=prompt
        )

        # ----------------------------------------------------
        # Validate response
        # ----------------------------------------------------

        if not response:

            print(
                "\nGemini returned an empty response."
            )

            return (
                "AI analysis is temporarily unavailable.\n\n"
                "The local Sentinel detection engine "
                "completed the investigation successfully. "
                "Review the findings, timeline, MITRE "
                "techniques, risk score and IOCs."
            )

        # ----------------------------------------------------
        # Extract text
        # ----------------------------------------------------

        answer = getattr(
            response,
            "text",
            None
        )

        if not answer:

            print(
                "\nGemini returned no text."
            )

            return (
                "AI analysis is temporarily unavailable.\n\n"
                "The local Sentinel detection engine "
                "completed the investigation successfully. "
                "Review the findings, timeline, MITRE "
                "techniques, risk score and IOCs."
            )

        # ----------------------------------------------------
        # Log successful response
        # ----------------------------------------------------

        print(
            "\n================ GEMINI RESPONSE ================\n"
        )

        print(answer)

        print(
            "\n================================================\n"
        )

        return answer

    # ========================================================
    # GEMINI QUOTA / RATE LIMIT
    # ========================================================

    except Exception as e:

        error_message = str(e)

        print(
            "\n============= GEMINI ERROR ============="
        )

        traceback.print_exc()

        print(
            "========================================\n"
        )

        # ----------------------------------------------------
        # Detect quota / rate-limit errors
        # ----------------------------------------------------

        if (
            "429" in error_message
            or "RESOURCE_EXHAUSTED" in error_message
            or "quota" in error_message.lower()
            or "rate limit" in error_message.lower()
        ):

            return (
                "AI analysis is temporarily unavailable "
                "because the Gemini API quota has been "
                "exhausted.\n\n"
                "The local Sentinel detection engine "
                "completed the investigation successfully. "
                "Your timeline, risk score, MITRE techniques, "
                "findings and IOCs are still available.\n\n"
                "Please retry the AI analysis after the "
                "Gemini quota resets."
            )

        # ----------------------------------------------------
        # Authentication error
        # ----------------------------------------------------

        if (
            "401" in error_message
            or "403" in error_message
            or "API key" in error_message.lower()
            or "authentication" in error_message.lower()
        ):

            return (
                "AI analysis is unavailable because "
                "the Gemini API authentication failed.\n\n"
                "The local Sentinel detection engine "
                "completed the investigation successfully. "
                "Check the GEMINI_API_KEY configuration."
            )

        # ----------------------------------------------------
        # Network / connection error
        # ----------------------------------------------------

        if (
            "timeout" in error_message.lower()
            or "connection" in error_message.lower()
            or "network" in error_message.lower()
        ):

            return (
                "AI analysis is temporarily unavailable "
                "because the Gemini service could not be reached.\n\n"
                "The local Sentinel detection engine "
                "completed the investigation successfully. "
                "Your investigation data is still available."
            )

        # ----------------------------------------------------
        # Generic AI failure
        # ----------------------------------------------------

        return (
            "AI analysis could not be completed at this time.\n\n"
            "The local Sentinel detection engine "
            "completed the investigation successfully. "
            "Your findings, timeline, risk score, MITRE "
            "techniques and IOCs are still available."
        )
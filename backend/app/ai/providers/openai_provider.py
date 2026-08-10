import os
import traceback

from dotenv import load_dotenv
from openai import OpenAI


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

API_KEY = os.getenv("OPENAI_API_KEY")


# ============================================================
# CLIENT
# ============================================================

client = None

if API_KEY:
    client = OpenAI(
        api_key=API_KEY
    )


# ============================================================
# OPENAI REPORT GENERATOR
# ============================================================

def generate_report(prompt: str) -> str:
    """
    Generate an investigation report using OpenAI.

    Returns:
        str | None

    None means that OpenAI was unavailable and the
    orchestrator should try the next provider.
    """

    # --------------------------------------------------------
    # API key unavailable
    # --------------------------------------------------------

    if not API_KEY:

        print(
            "\n[OpenAI] API key not configured."
        )

        return None

    try:

        print(
            "\n================ OPENAI REQUEST ================\n"
        )

        # ----------------------------------------------------
        # OpenAI request
        # ----------------------------------------------------

        response = client.responses.create(

            model="gpt-4.1-mini",

            input=prompt
        )

        # ----------------------------------------------------
        # Extract response
        # ----------------------------------------------------

        answer = response.output_text

        if not answer:

            print(
                "\n[OpenAI] Empty response."
            )

            return None

        print(
            "\n================ OPENAI RESPONSE ================\n"
        )

        print(answer)

        print(
            "\n=================================================\n"
        )

        return answer

    except Exception:

        print(
            "\n============= OPENAI ERROR ============="
        )

        traceback.print_exc()

        print(
            "========================================\n"
        )

        # ----------------------------------------------------
        # IMPORTANT
        #
        # Do NOT return the raw error to the frontend.
        #
        # Returning None tells the orchestrator:
        #
        # "OpenAI failed, try another provider."
        # ----------------------------------------------------

        return None
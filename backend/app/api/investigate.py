from fastapi import APIRouter
from pydantic import BaseModel

from app.ai.investigator import generate_prompt

router = APIRouter(
    prefix="/api",
    tags=["Investigation"]
)

class InvestigationRequest(BaseModel):
    findings: list
    events: list


@router.post("/investigate")
def investigate(data: InvestigationRequest):

    prompt = generate_prompt(
        data.findings,
        data.events
    )

    return {
        "prompt": prompt
    }
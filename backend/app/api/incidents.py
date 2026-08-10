from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, model_validator

from app.incidents.manager import incident_manager


router = APIRouter(
    prefix="/api/incidents",
    tags=["Incidents"],
)


# ============================================================
# REQUEST MODELS
# ============================================================


class CreateIncidentRequest(BaseModel):

    title: str = Field(
        min_length=1,
        max_length=200,
    )

    severity: str = Field(
        default="Low",
    )

    risk_score: int = Field(
        default=0,
        ge=0,
        le=100,
    )

    investigation: dict[str, Any] | None = None


class UpdateStatusRequest(BaseModel):

    status: str = Field(
        min_length=1,
        max_length=50,
    )


class AddNoteRequest(BaseModel):
    """
    Accept both:

        {"note": "Analyst observation"}

    and:

        {"text": "Analyst observation"}
    """

    note: str | None = Field(
        default=None,
        min_length=1,
        max_length=5000,
    )

    text: str | None = Field(
        default=None,
        min_length=1,
        max_length=5000,
    )

    @model_validator(mode="after")
    def validate_note(self):

        if not self.note and not self.text:
            raise ValueError(
                "A note must be provided."
            )

        if not self.note and self.text:
            self.note = self.text

        return self


class MoveToTrashRequest(BaseModel):

    retention_days: int = Field(
        default=90,
        description=(
            "How many days the incident should remain "
            "recoverable in Trash."
        ),
    )


# ============================================================
# CREATE INCIDENT
# ============================================================


@router.post("")
def create_incident(
    data: CreateIncidentRequest,
):

    incident = incident_manager.create_incident(
        title=data.title,
        severity=data.severity,
        risk_score=data.risk_score,
        investigation=data.investigation,
    )

    return {
        "status": "success",
        "incident": incident,
    }


# ============================================================
# LIST ACTIVE INCIDENTS
# ============================================================


@router.get("")
def list_incidents():

    incidents = incident_manager.list_incidents()

    return {
        "status": "success",
        "count": len(incidents),
        "incidents": incidents,
    }


# ============================================================
# LIST TRASH
#
# IMPORTANT:
# This route MUST be before:
#     /{incident_id}
#
# URL:
#     GET /api/incidents/trash/list
# ============================================================


@router.get("/trash/list")
def list_trash():

    incidents = incident_manager.list_trash()

    return {
        "status": "success",
        "count": len(incidents),
        "incidents": incidents,
    }


# ============================================================
# GET TRASH INCIDENT
#
# URL:
#     GET /api/incidents/trash/{incident_id}
# ============================================================


@router.get("/trash/{incident_id}")
def get_trash_incident(
    incident_id: str,
):

    incident = incident_manager.get_trash_incident(
        incident_id
    )

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Trashed incident not found.",
        )

    return {
        "status": "success",
        "incident": incident,
    }


# ============================================================
# GET SINGLE ACTIVE INCIDENT
#
# KEEP THIS AFTER STATIC TRASH ROUTES
# ============================================================


@router.get("/{incident_id}")
def get_incident(
    incident_id: str,
):

    incident = incident_manager.get_incident(
        incident_id
    )

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found.",
        )

    return {
        "status": "success",
        "incident": incident,
    }


# ============================================================
# UPDATE INCIDENT STATUS
# ============================================================


@router.patch("/{incident_id}/status")
def update_incident_status(
    incident_id: str,
    data: UpdateStatusRequest,
):

    try:

        incident = incident_manager.update_status(
            incident_id=incident_id,
            status=data.status,
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    if not incident:

        raise HTTPException(
            status_code=404,
            detail="Incident not found.",
        )

    return {
        "status": "success",
        "incident": incident,
    }


# ============================================================
# ADD ANALYST NOTE
# ============================================================


@router.post("/{incident_id}/notes")
def add_incident_note(
    incident_id: str,
    data: AddNoteRequest,
):

    incident = incident_manager.add_note(
        incident_id=incident_id,
        note=data.note,
    )

    if not incident:

        raise HTTPException(
            status_code=404,
            detail="Incident not found.",
        )

    return {
        "status": "success",
        "incident": incident,
    }


# ============================================================
# MOVE INCIDENT TO TRASH
# ============================================================


@router.post("/{incident_id}/trash")
def move_incident_to_trash(
    incident_id: str,
    data: MoveToTrashRequest,
):

    try:

        incident = incident_manager.move_to_trash(
            incident_id=incident_id,
            retention_days=data.retention_days,
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    if not incident:

        raise HTTPException(
            status_code=404,
            detail="Incident not found.",
        )

    return {
        "status": "success",
        "message": (
            f"Incident moved to Trash for "
            f"{data.retention_days} days."
        ),
        "incident": incident,
    }


# ============================================================
# RESTORE INCIDENT
# ============================================================


@router.post("/{incident_id}/restore")
def restore_incident(
    incident_id: str,
):

    incident = incident_manager.restore_incident(
        incident_id
    )

    if not incident:

        raise HTTPException(
            status_code=404,
            detail="Trashed incident not found.",
        )

    return {
        "status": "success",
        "message": "Incident restored successfully.",
        "incident": incident,
    }


# ============================================================
# PERMANENT DELETE
# ============================================================


@router.delete("/{incident_id}/permanent")
def permanently_delete_incident(
    incident_id: str,
):

    try:

        deleted = incident_manager.permanently_delete(
            incident_id
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    if not deleted:

        raise HTTPException(
            status_code=404,
            detail="Trashed incident not found.",
        )

    return {
        "status": "success",
        "message": "Incident permanently deleted.",
    }
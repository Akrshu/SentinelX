from __future__ import annotations

import json
from datetime import datetime, timedelta
from threading import Lock
from typing import Any

from sqlalchemy import delete, select

from app.database.database import SessionLocal
from app.database.models import IncidentModel


class IncidentManager:
    """
    Database-backed incident manager for SentinelX.

    Persistent storage:
        sentinelx.db

    Supported operations:
        - Create incident
        - List active incidents
        - Get incident
        - Update status
        - Add analyst notes
        - Move incident to Trash
        - List Trash
        - Get Trash incident
        - Restore incident
        - Permanent delete
        - Automatic expired-trash cleanup
    """

    ALLOWED_RETENTION_DAYS = {
        30,
        90,
        180,
        365,
    }

    ALLOWED_STATUSES = {
        "Open",
        "Investigating",
        "Contained",
        "Resolved",
        "Closed",
    }

    def __init__(self):
        self._lock = Lock()

        # Make sure the database/table exists.
        from app.database.database import init_db

        init_db()

        self._counter = 0
        self._recalculate_counter()

    # ============================================================
    # JSON HELPERS
    # ============================================================

    @staticmethod
    def _json_load(value: str | None) -> list | dict:
        """
        Convert JSON text from the database back into Python data.
        """

        if not value:
            return []

        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return []

    @staticmethod
    def _json_dump(value: Any) -> str:
        """
        Convert Python data into JSON text for database storage.
        """

        if value is None:
            value = []

        return json.dumps(
            value,
            ensure_ascii=False,
        )

    # ============================================================
    # DATETIME HELPERS
    # ============================================================

    @staticmethod
    def _parse_datetime(
        value: str | datetime | None,
    ) -> datetime | None:

        if value is None:
            return None

        if isinstance(value, datetime):
            return value

        try:
            return datetime.fromisoformat(value)
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _datetime_string(
        value: datetime | None,
    ) -> str | None:

        if value is None:
            return None

        return value.isoformat()

    # ============================================================
    # MODEL → API DICTIONARY
    # ============================================================

    def _to_dict(
        self,
        incident: IncidentModel,
    ) -> dict[str, Any]:

        return {
            "id": incident.id,
            "title": incident.title,
            "severity": incident.severity,
            "risk_score": incident.risk_score,
            "status": incident.status,

            "findings": self._json_load(
                incident.findings
            ),

            "timeline": self._json_load(
                incident.timeline
            ),

            "mitre": self._json_load(
                incident.mitre
            ),

            "iocs": self._json_load(
                incident.iocs
            ),

            "recommendations": self._json_load(
                incident.recommendations
            ),

            "events": self._json_load(
                incident.events
            ),

            "notes": self._json_load(
                incident.notes
            ),

            "created_at": self._datetime_string(
                incident.created_at
            ),

            "updated_at": self._datetime_string(
                incident.updated_at
            ),

            "is_deleted": incident.is_deleted,

            "deleted_at": self._datetime_string(
                incident.deleted_at
            ),

            "trash_until": self._datetime_string(
                incident.trash_until
            ),

            "deleted_retention_days": (
                incident.deleted_retention_days
            ),
        }

    # ============================================================
    # ID GENERATION
    # ============================================================

    def _recalculate_counter(self) -> None:
        """
        Continue incident numbering from the highest
        incident currently stored in the database.
        """

        with SessionLocal() as session:

            incidents = session.scalars(
                select(IncidentModel.id)
            ).all()

        highest = 0

        for incident_id in incidents:

            if not isinstance(
                incident_id,
                str,
            ):
                continue

            if not incident_id.startswith("INC-"):
                continue

            try:
                number = int(
                    incident_id.split("-", 1)[1]
                )

                highest = max(
                    highest,
                    number,
                )

            except (
                ValueError,
                IndexError,
            ):
                continue

        self._counter = highest

    def _next_id(self) -> str:

        self._counter += 1

        return f"INC-{self._counter:04d}"

    # ============================================================
    # AUTOMATIC TRASH CLEANUP
    # ============================================================

    def _purge_expired_trash(
        self,
        session,
    ) -> None:
        """
        Permanently delete incidents whose
        Trash retention period has expired.
        """

        now = datetime.utcnow()

        expired = session.scalars(
            select(IncidentModel).where(
                IncidentModel.is_deleted.is_(True),
                IncidentModel.trash_until.is_not(None),
                IncidentModel.trash_until <= now,
            )
        ).all()

        if not expired:
            return

        for incident in expired:
            session.delete(incident)

        session.commit()

    # ============================================================
    # CREATE INCIDENT
    # ============================================================

    def create_incident(
        self,
        title: str,
        severity: str,
        risk_score: int,
        investigation: dict[str, Any] | None = None,
    ) -> dict[str, Any]:

        with self._lock:

            with SessionLocal() as session:

                self._purge_expired_trash(
                    session
                )

                incident_id = self._next_id()

                now = datetime.utcnow()

                investigation = (
                    investigation or {}
                )

                incident = IncidentModel(

                    id=incident_id,

                    title=title,

                    severity=severity,

                    risk_score=risk_score,

                    status="Open",

                    findings=self._json_dump(
                        investigation.get(
                            "findings",
                            [],
                        )
                    ),

                    timeline=self._json_dump(
                        investigation.get(
                            "timeline",
                            [],
                        )
                    ),

                    mitre=self._json_dump(
                        investigation.get(
                            "mitre",
                            investigation.get(
                                "mitre_techniques",
                                [],
                            ),
                        )
                    ),

                    iocs=self._json_dump(
                        investigation.get(
                            "iocs",
                            [],
                        )
                    ),

                    recommendations=self._json_dump(
                        investigation.get(
                            "recommendations",
                            [],
                        )
                    ),

                    events=self._json_dump(
                        investigation.get(
                            "events",
                            [],
                        )
                    ),

                    notes=self._json_dump([]),

                    created_at=now,

                    updated_at=now,

                    is_deleted=False,

                    deleted_at=None,

                    trash_until=None,

                    deleted_retention_days=None,
                )

                session.add(incident)

                session.commit()

                session.refresh(incident)

                return self._to_dict(
                    incident
                )

    # ============================================================
    # LIST ACTIVE INCIDENTS
    # ============================================================

    def list_incidents(
        self,
    ) -> list[dict[str, Any]]:

        with self._lock:

            with SessionLocal() as session:

                self._purge_expired_trash(
                    session
                )

                incidents = session.scalars(
                    select(IncidentModel)
                    .where(
                        IncidentModel.is_deleted.is_(
                            False
                        )
                    )
                    .order_by(
                        IncidentModel.created_at.desc()
                    )
                ).all()

                return [
                    self._to_dict(
                        incident
                    )
                    for incident in incidents
                ]

    # ============================================================
    # GET ACTIVE INCIDENT
    # ============================================================

    def get_incident(
        self,
        incident_id: str,
    ) -> dict[str, Any] | None:

        with self._lock:

            with SessionLocal() as session:

                self._purge_expired_trash(
                    session
                )

                incident = session.scalar(
                    select(IncidentModel).where(
                        IncidentModel.id
                        == incident_id
                    )
                )

                if not incident:
                    return None

                if incident.is_deleted:
                    return None

                return self._to_dict(
                    incident
                )

    # ============================================================
    # UPDATE STATUS
    # ============================================================

    def update_status(
        self,
        incident_id: str,
        status: str,
    ) -> dict[str, Any] | None:

        if status not in self.ALLOWED_STATUSES:

            raise ValueError(
                "Invalid status. Allowed values: "
                + ", ".join(
                    sorted(
                        self.ALLOWED_STATUSES
                    )
                )
            )

        with self._lock:

            with SessionLocal() as session:

                self._purge_expired_trash(
                    session
                )

                incident = session.scalar(
                    select(IncidentModel).where(
                        IncidentModel.id
                        == incident_id
                    )
                )

                if not incident:
                    return None

                if incident.is_deleted:
                    return None

                incident.status = status

                incident.updated_at = (
                    datetime.utcnow()
                )

                session.commit()

                session.refresh(incident)

                return self._to_dict(
                    incident
                )

    # ============================================================
    # ADD ANALYST NOTE
    # ============================================================

    def add_note(
        self,
        incident_id: str,
        note: str,
    ) -> dict[str, Any] | None:

        with self._lock:

            with SessionLocal() as session:

                self._purge_expired_trash(
                    session
                )

                incident = session.scalar(
                    select(IncidentModel).where(
                        IncidentModel.id
                        == incident_id
                    )
                )

                if not incident:
                    return None

                if incident.is_deleted:
                    return None

                notes = self._json_load(
                    incident.notes
                )

                if not isinstance(
                    notes,
                    list,
                ):
                    notes = []

                now = datetime.utcnow()

                notes.append(
                    {
                        "text": note,
                        "author": "Analyst",
                        "created_at": now.isoformat(),
                    }
                )

                incident.notes = (
                    self._json_dump(notes)
                )

                incident.updated_at = now

                session.commit()

                session.refresh(incident)

                return self._to_dict(
                    incident
                )

    # ============================================================
    # MOVE TO TRASH
    # ============================================================

    def move_to_trash(
        self,
        incident_id: str,
        retention_days: int,
    ) -> dict[str, Any] | None:

        if retention_days not in (
            self.ALLOWED_RETENTION_DAYS
        ):

            raise ValueError(
                "Invalid retention period. "
                "Allowed values: "
                "30, 90, 180, 365 days."
            )

        with self._lock:

            with SessionLocal() as session:

                self._purge_expired_trash(
                    session
                )

                incident = session.scalar(
                    select(IncidentModel).where(
                        IncidentModel.id
                        == incident_id
                    )
                )

                if not incident:
                    return None

                if incident.is_deleted:
                    return self._to_dict(
                        incident
                    )

                now = datetime.utcnow()

                trash_until = (
                    now
                    + timedelta(
                        days=retention_days
                    )
                )

                incident.is_deleted = True

                incident.deleted_at = now

                incident.trash_until = (
                    trash_until
                )

                incident.deleted_retention_days = (
                    retention_days
                )

                incident.updated_at = now

                session.commit()

                session.refresh(incident)

                return self._to_dict(
                    incident
                )

    # ============================================================
    # LIST TRASH
    # ============================================================

    def list_trash(
        self,
    ) -> list[dict[str, Any]]:

        with self._lock:

            with SessionLocal() as session:

                self._purge_expired_trash(
                    session
                )

                incidents = session.scalars(
                    select(IncidentModel)
                    .where(
                        IncidentModel.is_deleted.is_(
                            True
                        )
                    )
                    .order_by(
                        IncidentModel.deleted_at.desc()
                    )
                ).all()

                return [
                    self._to_dict(
                        incident
                    )
                    for incident in incidents
                ]

    # ============================================================
    # GET TRASH INCIDENT
    # ============================================================

    def get_trash_incident(
        self,
        incident_id: str,
    ) -> dict[str, Any] | None:

        with self._lock:

            with SessionLocal() as session:

                self._purge_expired_trash(
                    session
                )

                incident = session.scalar(
                    select(IncidentModel).where(
                        IncidentModel.id
                        == incident_id
                    )
                )

                if not incident:
                    return None

                if not incident.is_deleted:
                    return None

                return self._to_dict(
                    incident
                )

    # ============================================================
    # RESTORE INCIDENT
    # ============================================================

    def restore_incident(
        self,
        incident_id: str,
    ) -> dict[str, Any] | None:

        with self._lock:

            with SessionLocal() as session:

                self._purge_expired_trash(
                    session
                )

                incident = session.scalar(
                    select(IncidentModel).where(
                        IncidentModel.id
                        == incident_id
                    )
                )

                if not incident:
                    return None

                if not incident.is_deleted:
                    return self._to_dict(
                        incident
                    )

                now = datetime.utcnow()

                incident.is_deleted = False

                incident.deleted_at = None

                incident.trash_until = None

                incident.deleted_retention_days = None

                incident.updated_at = now

                session.commit()

                session.refresh(incident)

                return self._to_dict(
                    incident
                )

    # ============================================================
    # PERMANENT DELETE
    # ============================================================

    def permanently_delete(
        self,
        incident_id: str,
    ) -> bool:

        with self._lock:

            with SessionLocal() as session:

                incident = session.scalar(
                    select(IncidentModel).where(
                        IncidentModel.id
                        == incident_id
                    )
                )

                if not incident:
                    return False

                if not incident.is_deleted:

                    raise ValueError(
                        "Incident must be moved to Trash "
                        "before permanent deletion."
                    )

                session.delete(
                    incident
                )

                session.commit()

                return True


# ============================================================
# GLOBAL INCIDENT MANAGER
# ============================================================

incident_manager = IncidentManager()
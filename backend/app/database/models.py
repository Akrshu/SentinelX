from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


# ============================================================
# INCIDENT
# ============================================================

class IncidentModel(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    severity: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="Low",
    )

    risk_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="Open",
    )

    # JSON-compatible data is temporarily stored as text.
    # We will normalize these into separate tables later
    # after the core persistence migration is stable.

    findings: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="[]",
    )

    timeline: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="[]",
    )

    mitre: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="[]",
    )

    iocs: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="[]",
    )

    recommendations: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="[]",
    )

    events: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="[]",
    )

    notes: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="[]",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    # ========================================================
    # TRASH
    # ========================================================

    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    trash_until: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    deleted_retention_days: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
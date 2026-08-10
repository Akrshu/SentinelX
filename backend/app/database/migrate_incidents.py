import json
from datetime import datetime
from pathlib import Path

from sqlalchemy import select

from app.database.database import SessionLocal, init_db
from app.database.models import IncidentModel


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

INCIDENTS_FILE = (
    BASE_DIR
    / "app"
    / "incidents"
    / "incidents.json"
)


# ============================================================
# HELPERS
# ============================================================

def parse_datetime(value):
    """
    Convert an ISO datetime string into a Python datetime.

    Returns None when the value is empty or missing.
    """

    if not value:
        return None

    if isinstance(value, datetime):
        return value

    return datetime.fromisoformat(value)


def json_text(value):
    """
    Convert Python lists/dicts into JSON text
    for storage inside SQLite TEXT columns.
    """

    if value is None:
        value = []

    return json.dumps(
        value,
        ensure_ascii=False,
    )


# ============================================================
# MIGRATION
# ============================================================

def migrate_incidents():
    print("=" * 60)
    print("SentinelX Incident Migration")
    print("=" * 60)

    # Make sure database/tables exist.
    init_db()

    # --------------------------------------------------------
    # CHECK SOURCE FILE
    # --------------------------------------------------------

    if not INCIDENTS_FILE.exists():
        raise FileNotFoundError(
            f"Incident file not found: {INCIDENTS_FILE}"
        )

    print(f"Source: {INCIDENTS_FILE}")

    # --------------------------------------------------------
    # READ JSON
    # --------------------------------------------------------

    with INCIDENTS_FILE.open(
        "r",
        encoding="utf-8",
    ) as file:
        incidents_data = json.load(file)

    if not isinstance(incidents_data, dict):
        raise ValueError(
            "incidents.json must contain an object/dictionary."
        )

    print(
        f"Found {len(incidents_data)} incident(s) "
        "in incidents.json."
    )

    # --------------------------------------------------------
    # DATABASE SESSION
    # --------------------------------------------------------

    with SessionLocal() as session:

        inserted = 0
        skipped = 0

        for incident_id, data in incidents_data.items():

            if not isinstance(data, dict):
                print(
                    f"[SKIP] {incident_id}: "
                    "invalid incident object."
                )
                skipped += 1
                continue

            # ------------------------------------------------
            # DUPLICATE CHECK
            # ------------------------------------------------

            existing = session.scalar(
                select(IncidentModel).where(
                    IncidentModel.id == incident_id
                )
            )

            if existing:
                print(
                    f"[SKIP] {incident_id}: "
                    "already exists in database."
                )
                skipped += 1
                continue

            # ------------------------------------------------
            # CREATE DATABASE RECORD
            # ------------------------------------------------

            incident = IncidentModel(
                id=data.get(
                    "id",
                    incident_id,
                ),

                title=data.get(
                    "title",
                    "Untitled Incident",
                ),

                severity=data.get(
                    "severity",
                    "Low",
                ),

                risk_score=int(
                    data.get(
                        "risk_score",
                        0,
                    )
                ),

                status=data.get(
                    "status",
                    "Open",
                ),

                # Nested investigation data
                # is preserved exactly as JSON.

                findings=json_text(
                    data.get(
                        "findings",
                        [],
                    )
                ),

                timeline=json_text(
                    data.get(
                        "timeline",
                        [],
                    )
                ),

                mitre=json_text(
                    data.get(
                        "mitre",
                        [],
                    )
                ),

                iocs=json_text(
                    data.get(
                        "iocs",
                        [],
                    )
                ),

                recommendations=json_text(
                    data.get(
                        "recommendations",
                        [],
                    )
                ),

                events=json_text(
                    data.get(
                        "events",
                        [],
                    )
                ),

                notes=json_text(
                    data.get(
                        "notes",
                        [],
                    )
                ),

                # Dates

                created_at=parse_datetime(
                    data.get("created_at")
                ),

                updated_at=parse_datetime(
                    data.get("updated_at")
                ),

                # Trash state

                is_deleted=bool(
                    data.get(
                        "is_deleted",
                        False,
                    )
                ),

                deleted_at=parse_datetime(
                    data.get("deleted_at")
                ),

                trash_until=parse_datetime(
                    data.get("trash_until")
                ),

                deleted_retention_days=(
                    data.get(
                        "deleted_retention_days"
                    )
                ),
            )

            session.add(incident)

            inserted += 1

            print(
                f"[INSERT] {incident_id} "
                f"- {incident.title}"
            )

        # ----------------------------------------------------
        # COMMIT
        # ----------------------------------------------------

        session.commit()

    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("Migration completed.")
    print(f"Inserted : {inserted}")
    print(f"Skipped  : {skipped}")
    print("=" * 60)


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    migrate_incidents()
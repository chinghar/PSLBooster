"""
Local-only server for the facial metrics app.

Serves the built frontend (frontend/ is bundled by Vite into ../dist — run
`npm run build` first) on localhost, and exposes small endpoints for
saving/listing/viewing/deleting locally-stored results (photo + the metrics
and face-shape JSON already computed in the browser). No external network
calls are made by this process — everything is written to and read from
./data on disk.
"""
import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .db import get_conn, init_db

ROOT = Path(__file__).resolve().parent.parent
DIST_DIR = ROOT / "dist"
PHOTOS_DIR = ROOT / "data" / "photos"
PHOTOS_DIR.mkdir(parents=True, exist_ok=True)

if not (DIST_DIR / "index.html").exists():
    sys.exit(
        "dist/index.html not found. Build the frontend first: `npm run build` "
        "(or `./scripts/setup.sh`, which does this for you)."
    )

init_db()

app = FastAPI(title="Facial Metrics (local-only)")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/history")
async def save_entry(
    photo: UploadFile = File(...),
    metrics: str = Form(...),
    face_shape: str = Form(...),
    note: str = Form(""),
):
    ext = ".png" if photo.content_type == "image/png" else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    contents = await photo.read()
    (PHOTOS_DIR / filename).write_bytes(contents)

    created_at = datetime.now(timezone.utc).isoformat()
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO entries (created_at, photo_filename, note, metrics_json, face_shape_json) "
            "VALUES (?, ?, ?, ?, ?)",
            (created_at, filename, note, metrics, face_shape),
        )
        conn.commit()
        entry_id = cur.lastrowid

    return {"id": entry_id, "created_at": created_at}


@app.get("/api/history")
def list_entries():
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, created_at, note FROM entries ORDER BY created_at DESC"
        ).fetchall()
    return [dict(row) for row in rows]


@app.get("/api/history/{entry_id}")
def get_entry(entry_id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM entries WHERE id = ?", (entry_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "id": row["id"],
        "created_at": row["created_at"],
        "note": row["note"],
        "metrics": json.loads(row["metrics_json"]),
        "face_shape": json.loads(row["face_shape_json"]),
    }


@app.get("/api/history/{entry_id}/photo")
def get_entry_photo(entry_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT photo_filename FROM entries WHERE id = ?", (entry_id,)
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    path = PHOTOS_DIR / row["photo_filename"]
    if not path.exists():
        raise HTTPException(status_code=404, detail="Photo file missing")
    return FileResponse(path)


@app.delete("/api/history/{entry_id}")
def delete_entry(entry_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT photo_filename FROM entries WHERE id = ?", (entry_id,)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Not found")
        conn.execute("DELETE FROM entries WHERE id = ?", (entry_id,))
        conn.commit()
    photo_path = PHOTOS_DIR / row["photo_filename"]
    if photo_path.exists():
        photo_path.unlink()
    return {"status": "deleted"}


@app.delete("/api/history")
def delete_all_entries():
    """The 'delete my data' function: wipes every saved photo and record."""
    with get_conn() as conn:
        rows = conn.execute("SELECT photo_filename FROM entries").fetchall()
        conn.execute("DELETE FROM entries")
        conn.commit()
    for row in rows:
        photo_path = PHOTOS_DIR / row["photo_filename"]
        if photo_path.exists():
            photo_path.unlink()
    return {"status": "deleted", "count": len(rows)}


# Mounted last so /api routes above take precedence.
app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="frontend")

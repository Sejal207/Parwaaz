print("STEP 0 - MAIN FILE STARTED", flush=True)
print("STEP 1", flush=True)
from fastapi import FastAPI

print("STEP 2", flush=True)
from fastapi.middleware.cors import CORSMiddleware

print("STEP 3", flush=True)
from fastapi.staticfiles import StaticFiles

print("STEP 4", flush=True)
from app.db.database import Base, engine

print("STEP 5", flush=True)
from app.api.routes import sessions

print("STEP 6", flush=True)
import app.db.models

print("STEP 7", flush=True)
from sqlalchemy import text

print("STEP 8", flush=True)

# Create all tables (safety net alongside Alembic)
# Base.metadata.create_all(bind=engine)

def run_db_migrations():
    print(">>> Running manual DB schema migration for Singing Module...")
    migrations = [
        "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS reference_audio_path VARCHAR(500);",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS pitch_accuracy FLOAT;",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS mean_error_cents FLOAT;",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS final_score FLOAT;",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS rhythm_deviation_ms FLOAT;",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS tempo_ratio FLOAT;",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS stability FLOAT;",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS lyrics_error FLOAT;",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS key_offset INTEGER;",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS ref_contour JSON;",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS user_contour JSON;",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS pitch_tendency VARCHAR(200);",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS timing_tendency VARCHAR(200);",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS detected_scale VARCHAR(100);",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS note_transitions JSON;",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS note_durations JSON;",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS note_timeline JSON;",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS timeline_feedback JSON;",
        "ALTER TABLE pitch_results ADD COLUMN IF NOT EXISTS feedback_summary TEXT;"
    ]
    try:
        with engine.begin() as conn:
            for stmt in migrations:
                conn.execute(text(stmt))
        print(">>> DB schema migration completed successfully!")
    except Exception as e:
        print(f">>> DB schema migration failed: {e}")

# run_db_migrations()
print("BEFORE FASTAPI")
app = FastAPI(
    title="AI Performing Arts Coach",
    description="Multimodal feedback for actors, speakers, and singers",
    version="1.0.0",
)
print("AFTER FASTAPI")
# Allow React dev server to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads as static so frontend can display videos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register routes
app.include_router(sessions.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
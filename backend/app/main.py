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

import os
import shutil
import subprocess
import logging
from pathlib import Path
from app.core.config import settings

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

logger.info("=== STARTUP DIAGNOSTICS ===")

# Check FFmpeg
ffmpeg_path = shutil.which("ffmpeg")
if not ffmpeg_path and os.path.exists("/opt/homebrew/bin/ffmpeg"):
    ffmpeg_path = "/opt/homebrew/bin/ffmpeg"
if not ffmpeg_path:
    try:
        import imageio_ffmpeg
        ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        pass
logger.info(f"FFmpeg path: {ffmpeg_path}")
if ffmpeg_path:
    try:
        ffmpeg_version = subprocess.check_output([ffmpeg_path, "-version"]).decode("utf-8").split("\n")[0]
        logger.info(f"FFmpeg version: {ffmpeg_version}")
    except Exception as e:
        logger.error(f"Failed to get FFmpeg version: {e}")
else:
    logger.error("FFmpeg NOT FOUND in PATH! Video/Audio processing will fail.")

# Check Upload Directory
BASE_DIR = Path(__file__).resolve().parents[2]
upload_dir_path = BASE_DIR / settings.UPLOAD_DIR
logger.info(f"Upload directory path: {upload_dir_path}")
logger.info(f"Upload directory exists before creation: {upload_dir_path.exists()}")
upload_dir_path.mkdir(exist_ok=True, parents=True)
logger.info(f"Upload directory exists after creation: {upload_dir_path.exists()}")

logger.info("=== END STARTUP DIAGNOSTICS ===")

print("BEFORE FASTAPI")
app = FastAPI(
    title="AI Performing Arts Coach",
    description="Multimodal feedback for actors, speakers, and singers",
    version="1.0.0",
)
print("AFTER FASTAPI")
# Allow React dev server to talk to FastAPI
@app.on_event("startup")
async def startup_db():
    try:
        logger.info("=== CREATING DATABASE TABLES ===")
        import app.db.models
        Base.metadata.create_all(bind=engine)
        run_db_migrations()
        logger.info("=== DATABASE TABLES READY ===")
    except Exception as e:
        logger.error(f"=== DATABASE INIT FAILED: {e} ===")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://parwaaz-mocha.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
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
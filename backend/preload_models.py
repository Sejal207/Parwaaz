#!/usr/bin/env python3
"""
Pre-download script for Render deployment.
Run this as the BUILD COMMAND in Render before starting the server.
It pre-caches the Whisper model so the first real request doesn't OOM.

Render Build Command:
  pip install -r requirements.txt && python preload_models.py

Render Start Command:
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
"""

import os
import sys
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "tiny")

def preload_whisper():
    logger.info(f"Pre-loading Whisper model '{WHISPER_MODEL}'...")
    try:
        from faster_whisper import WhisperModel
        model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
        logger.info(f"✓ Whisper '{WHISPER_MODEL}' model cached successfully.")
        del model
    except Exception as e:
        logger.error(f"✗ Failed to pre-load Whisper: {e}")
        # Don't exit — server can still start and download on first request
        # sys.exit(1)

def check_facial_model():
    from pathlib import Path
    model_path = Path(__file__).parent / "app/modules/facial/weights/final_model.pth"
    if model_path.exists():
        size_mb = model_path.stat().st_size / (1024 * 1024)
        logger.info(f"✓ Facial model found at {model_path} ({size_mb:.1f} MB)")
    else:
        logger.error(
            f"✗ Facial model NOT FOUND at {model_path}. "
            "Facial analysis will use fallback scores. "
            "Run: git add -f backend/app/modules/facial/weights/final_model.pth && git commit"
        )

def check_ffmpeg():
    import shutil
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg:
        logger.info(f"✓ FFmpeg found: {ffmpeg}")
    else:
        logger.warning(
            "✗ FFmpeg NOT found in PATH. Audio extraction will fail. "
            "Add 'ffmpeg' to Render's system packages or install imageio-ffmpeg."
        )

if __name__ == "__main__":
    logger.info("=== Parwaaz Deployment Pre-check ===")
    check_ffmpeg()
    check_facial_model()
    preload_whisper()
    logger.info("=== Pre-check complete ===")

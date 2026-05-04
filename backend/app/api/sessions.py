import os
import uuid
import asyncio
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session as DBSession
from typing import Optional, List

from app.db.database import get_db
from app.db.models import Session, SpeechResult, FacialResult, PitchResult, AnalysisStatus, PerformanceMode
from app.api.schemas import SessionOut
from app.core.config import settings
from app.modules.speech.analyzer import analyze_speech

router = APIRouter(prefix="/sessions", tags=["sessions"])


# ── helper: save uploaded file ────────────────────────
async def save_upload(file: UploadFile, dest_dir: str) -> str:
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(dest_dir, filename)
    async with aiofiles.open(path, "wb") as f:
        content = await file.read()
        await f.write(content)
    return path


# ── POST /sessions/upload ─────────────────────────────
@router.post("/upload", response_model=SessionOut)
async def upload_and_analyze(
    title: str = Form(...),
    mode: PerformanceMode = Form(PerformanceMode.full),
    reference_text: Optional[str] = Form(None),
    video: UploadFile = File(...),
    db: DBSession = Depends(get_db),
):
    # 1. Save video
    video_path = await save_upload(video, settings.UPLOAD_DIR)

    # 2. Create session record
    session = Session(
        title=title,
        mode=mode,
        video_path=video_path,
        reference_text=reference_text,
        status=AnalysisStatus.processing,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # 3. Run analysis (synchronous for now — wrap in thread for production)
    try:
        # Extract audio from video using ffmpeg
        audio_path = video_path.replace(os.path.splitext(video_path)[1], "_audio.wav")
        os.system(
            f'ffmpeg -i "{video_path}" -vn -acodec pcm_s16le '
            f'-ar 16000 -ac 1 "{audio_path}" -y -loglevel quiet'
        )
        session.audio_path = audio_path
        db.commit()

        # Run speech module if mode includes speech
        if mode in [PerformanceMode.speech, PerformanceMode.full]:
            speech_data = analyze_speech(
                audio_path=audio_path,
                reference_text=reference_text or "",
            )
            speech_result = SpeechResult(
                session_id=session.id,
                **speech_data,
            )
            db.add(speech_result)

        # Facial + pitch: placeholders until teammates integrate
        if mode in [PerformanceMode.acting, PerformanceMode.full]:
            from app.modules.facial.analyzer import analyze_facial
            from app.modules.facial.video_overlay import create_annotated_video

            facial_data = analyze_facial(
                user_video_path=str(video_path),
                reference_video_path=str(ref_video_path) if ref_video_path else None,
            )

            annotated_path = create_annotated_video(
                str(video_path),
                facial_data["predictions"],
                str(UPLOAD_DIR),
                {k: v/100 for k, v in facial_data["emotion_percentages"].items()},
            )

            db.add(FacialResult(
                session_id=session.id,
                dominant_emotion=facial_data["dominant_emotion"],
                ref_dominant=facial_data.get("ref_dominant"),
                predictions=facial_data["predictions"],
                emotion_percentages=facial_data["emotion_percentages"],
                ref_percentages=facial_data.get("ref_percentages"),
                feedback_summary=facial_data["feedback_summary"],
                comparison_score=facial_data.get("comparison_score"),
                grade=facial_data.get("grade"),
                score_components=facial_data.get("score_components"),
            ))
            session.annotated_video_path = annotated_path
            db.commit()

        if mode in [PerformanceMode.singing, PerformanceMode.full]:
            db.add(PitchResult(
                session_id=session.id,
                mean_error_cents=None,
                in_range_percent=None,
                pitch_contour=[],
                feedback_summary="Pitch module not yet integrated.",
            ))

        session.status = AnalysisStatus.completed
        db.commit()
        db.refresh(session)

    except Exception as e:
        session.status = AnalysisStatus.failed
        session.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

    return session


# ── GET /sessions ─────────────────────────────────────
@router.get("/", response_model=List[SessionOut])
def list_sessions(db: DBSession = Depends(get_db)):
    return db.query(Session).order_by(Session.created_at.desc()).all()


# ── GET /sessions/{id} ───────────────────────────────
@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: int, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


# ── DELETE /sessions/{id} ────────────────────────────
@router.delete("/{session_id}")
def delete_session(session_id: int, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"message": "Deleted"}
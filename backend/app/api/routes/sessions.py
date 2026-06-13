import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session as DBSession
from typing import Optional, List
from pathlib import Path

from app.db.database import get_db
from app.db.models import Session, SpeechResult, FacialResult, PitchResult, AnalysisStatus, PerformanceMode
from app.api.schemas import SessionOut
from app.core.config import settings
from app.modules.speech.analyzer import analyze_speech
# from app.modules.facial.analyzer import analyze_facial
# from app.modules.facial.video_overlay import create_annotated_video

router = APIRouter(prefix="/sessions", tags=["sessions"])

# Absolute base directory (where backend/ folder is)
BASE_DIR = Path(__file__).resolve().parents[3]
UPLOAD_DIR = BASE_DIR / settings.UPLOAD_DIR
UPLOAD_DIR.mkdir(exist_ok=True)


async def save_upload(file: UploadFile) -> Path:
    ext = Path(file.filename).suffix
    filename = f"{uuid.uuid4().hex}{ext}"
    path = UPLOAD_DIR / filename
    async with aiofiles.open(path, "wb") as f:
        content = await file.read()
        await f.write(content)
    return path


@router.post("/upload", response_model=SessionOut)
async def upload_and_analyze(
    title: str = Form(...),
    mode: PerformanceMode = Form(PerformanceMode.full),
    reference_text: Optional[str] = Form(None),
    video: UploadFile = File(...),
    reference_video: Optional[UploadFile] = File(None),
    reference_audio: Optional[UploadFile] = File(None),
    db: DBSession = Depends(get_db),
    ):
    video_path = await save_upload(video)

    # Save reference video if provided
    ref_video_path = None
    if reference_video and reference_video.filename:
        ref_video_path = await save_upload(reference_video)

    # Save reference audio if provided (for singing mode)
    ref_audio_path = None
    if reference_audio and reference_audio.filename:
        ref_audio_path = await save_upload(reference_audio)

    session = Session(
        title=title,
        mode=mode,
        video_path=str(video_path),
        reference_text=reference_text,
        reference_video_path=str(ref_video_path) if ref_video_path else None,
        reference_audio_path=str(ref_audio_path) if ref_audio_path else None,
        status=AnalysisStatus.processing,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    try:

        # Check if uploaded file is audio or video
        file_ext = video_path.suffix.lower()
        is_audio_file = file_ext in ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac']
        
        if is_audio_file:
            # If it's an audio file, use it directly (convert to wav for consistency)
            audio_path = video_path.with_suffix('').with_name(
                video_path.stem + "_audio.wav"
            )
            ret = os.system(
                f'ffmpeg -i "{video_path}" -acodec pcm_s16le '
                f'-ar 16000 -ac 1 "{audio_path}" -y -loglevel quiet'
            )
            if ret != 0:
                raise Exception(f"ffmpeg conversion failed with code {ret}. Is ffmpeg installed? Run: brew install ffmpeg")
        else:
            # Extract audio from video
            audio_path = video_path.with_suffix('').with_name(
                video_path.stem + "_audio.wav"
            )
            ret = os.system(
                f'ffmpeg -i "{video_path}" -vn -acodec pcm_s16le '
                f'-ar 16000 -ac 1 "{audio_path}" -y -loglevel quiet'
            )
            if ret != 0:
                raise Exception(f"ffmpeg failed with code {ret}. Is ffmpeg installed? Run: brew install ffmpeg")

        if not audio_path.exists():
            raise Exception(f"Audio extraction failed — file not created at {audio_path}")

        session.audio_path = str(audio_path)
        db.commit()

        # -- Facial Analysis (only for video files) --
        if not is_audio_file and session.mode in ['acting', 'full'] and not session.facial_result:
            try:
                print(">>> Running facial analysis...")
                facial_data = analyze_facial(
                    user_video_path=str(video_path),
                    reference_video_path=str(ref_video_path) if ref_video_path else None,
                )

                # Annotated video overlay
                try:
                    annotated_path = create_annotated_video(
                        str(video_path),
                        facial_data["predictions"],
                        str(UPLOAD_DIR),
                        {k: v / 100 for k, v in facial_data["emotion_percentages"].items()},
                    )
                    # Re-encode to H.264 so browsers can play it
                    h264_path = annotated_path.replace('.mp4', '_h264.mp4')
                    convert_ret = os.system(
                        f'ffmpeg -i "{annotated_path}" -c:v libx264 -preset fast '
                        f'-crf 23 -pix_fmt yuv420p -movflags +faststart '
                        f'"{h264_path}" -y -loglevel quiet'
                    )
                    if convert_ret == 0 and Path(h264_path).exists():
                        os.remove(annotated_path)
                        annotated_path = h264_path
                    session.annotated_video_path = str(annotated_path)
                except Exception as overlay_err:
                    print(f"[Facial] Annotated video failed (non-fatal): {overlay_err}")

                session.facial_result = FacialResult(
                    session_id=session.id,
                    dominant_emotion=facial_data.get("dominant_emotion"),
                    ref_dominant=facial_data.get("ref_dominant"),
                    predictions=facial_data.get("predictions"),
                    feedback_summary=facial_data.get("feedback_summary"),
                    emotion_percentages=facial_data.get("emotion_percentages"),
                    ref_percentages=facial_data.get("ref_percentages"),
                    comparison_score=facial_data.get("comparison_score"),
                    grade=facial_data.get("grade"),
                    score_components=facial_data.get("score_components"),
                )
                db.commit()
            except Exception as e:
                print(f"Error in facial analysis: {e}")
                import traceback; traceback.print_exc()

        # -- Speech Analysis --
        if session.mode in ['speech', 'full'] and not session.speech_result:
            try:
                print(">>> Running speech analysis...")
                speech_data = analyze_speech(
                    audio_path=str(audio_path),
                    reference_text=reference_text or "",
                )
                session.speech_result = SpeechResult(
                    session_id=session.id,
                    **speech_data,
                )
                db.commit()
            except Exception as e:
                print(f"Error in speech analysis: {e}")

        # -- Singing Analysis --
        if session.mode in ['singing', 'full'] and not session.pitch_result:
            try:
                print(">>> Running singing analysis...")
                if ref_audio_path and ref_audio_path.exists():
                    from app.modules.singing.analyzer import analyze_singing
                    cache_dir = str(UPLOAD_DIR / "singing_cache")
                    singing_data = analyze_singing(
                        user_audio_path=str(audio_path),
                        reference_audio_path=str(ref_audio_path),
                        cache_dir=cache_dir,
                    )
                    session.pitch_result = PitchResult(
                        session_id=session.id,
                        pitch_accuracy=singing_data.get("pitch_accuracy"),
                        mean_error_cents=singing_data.get("mean_error_cents"),
                        in_range_percent=singing_data.get("pitch_accuracy"),
                        final_score=singing_data.get("final_score"),
                        rhythm_deviation_ms=singing_data.get("rhythm_deviation_ms"),
                        tempo_ratio=singing_data.get("tempo_ratio"),
                        stability=singing_data.get("stability"),
                        lyrics_error=singing_data.get("lyrics_error"),
                        key_offset=singing_data.get("key_offset"),
                        ref_contour=singing_data.get("ref_contour"),
                        user_contour=singing_data.get("user_contour"),
                        pitch_tendency=singing_data.get("pitch_tendency"),
                        timing_tendency=singing_data.get("timing_tendency"),
                        detected_scale=singing_data.get("detected_scale"),
                        note_transitions=singing_data.get("note_transitions"),
                        note_durations=singing_data.get("note_durations"),
                        note_timeline=singing_data.get("note_timeline"),
                        timeline_feedback=singing_data.get("timeline_feedback"),
                        feedback_summary=singing_data.get("feedback_summary"),
                    )
                    db.commit()
                else:
                    session.pitch_result = PitchResult(
                        session_id=session.id,
                        feedback_summary="No reference audio provided. Upload a reference track for full singing analysis.",
                    )
                    db.commit()
            except Exception as e:
                print(f"Error in singing analysis: {e}")
                import traceback; traceback.print_exc()

        session.status = AnalysisStatus.completed
        db.commit()
        db.refresh(session)

    except Exception as e:
        session.status = AnalysisStatus.failed
        session.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

    return session


@router.get("/", response_model=List[SessionOut])
def list_sessions(db: DBSession = Depends(get_db)):
    return db.query(Session).order_by(Session.created_at.desc()).all()


@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: int, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/{session_id}")
def delete_session(session_id: int, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"message": "Deleted"}

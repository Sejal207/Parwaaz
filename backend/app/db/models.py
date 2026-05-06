from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class AnalysisStatus(str, enum.Enum):
    pending   = "pending"
    processing = "processing"
    completed = "completed"
    failed    = "failed"


class PerformanceMode(str, enum.Enum):
    acting  = "acting"   # facial only
    speech  = "speech"   # speech only
    singing = "singing"  # pitch only
    full    = "full"     # all three


class Session(Base):
    """One upload = one session."""
    __tablename__ = "sessions"

    id              = Column(Integer, primary_key=True, index=True)
    title           = Column(String(200), nullable=False)
    mode            = Column(Enum(PerformanceMode), default=PerformanceMode.full)
    video_path      = Column(String(500))          # path to uploaded video
    audio_path      = Column(String(500))          # ffmpeg-extracted audio
    reference_text  = Column(Text)                 # script user pasted in
    reference_audio = Column(String(500))          # reference singing audio path
    reference_video_path = Column(String(500))     # path to reference video
    language        = Column(String(10), server_default="en")
    status          = Column(Enum(AnalysisStatus), default=AnalysisStatus.pending)
    error_message   = Column(Text)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())
    annotated_video_path = Column(String(500))

    # one-to-one results
    speech_result   = relationship("SpeechResult", back_populates="session", uselist=False)
    facial_result   = relationship("FacialResult", back_populates="session", uselist=False)
    pitch_result    = relationship("PitchResult",  back_populates="session", uselist=False)


class SpeechResult(Base):
    """Whisper STT + WER results."""
    __tablename__ = "speech_results"

    id                  = Column(Integer, primary_key=True, index=True)
    session_id          = Column(Integer, ForeignKey("sessions.id"), unique=True)
    transcribed_text    = Column(Text)
    wer                 = Column(Float)    # Word Error Rate 0.0–1.0
    substitutions       = Column(Integer)
    deletions           = Column(Integer)
    insertions          = Column(Integer)
    missing_words       = Column(JSON)     # list of words
    extra_words         = Column(JSON)     # list of words
    feedback_summary      = Column(Text)
    word_scores           = Column(JSON)
    pronunciation_summary = Column(JSON)
    pauses                = Column(JSON)
    pause_stats           = Column(JSON)
    filler_words          = Column(JSON)
    filler_counts         = Column(JSON)
    created_at            = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("Session", back_populates="speech_result")


class FacialResult(Base):
    __tablename__ = "facial_results"

    id                 = Column(Integer, primary_key=True, index=True)
    session_id         = Column(Integer, ForeignKey("sessions.id"), unique=True)
    dominant_emotion   = Column(String(50))
    ref_dominant       = Column(String(50))
    predictions        = Column(JSON)
    emotion_percentages = Column(JSON)
    ref_percentages    = Column(JSON)
    feedback_summary   = Column(Text)
    comparison_score   = Column(Float)
    grade              = Column(String(100))
    score_components   = Column(JSON)
    created_at         = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("Session", back_populates="facial_result")

class PitchResult(Base):
    """Placeholder for teammate's module."""
    __tablename__ = "pitch_results"

    id                = Column(Integer, primary_key=True, index=True)
    session_id        = Column(Integer, ForeignKey("sessions.id"), unique=True)
    mean_error_cents  = Column(Float)
    in_range_percent  = Column(Float)
    pitch_contour     = Column(JSON)   # [{time, user_pitch, ref_pitch}]
    feedback_summary  = Column(Text)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("Session", back_populates="pitch_result")

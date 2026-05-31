from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.db.models import AnalysisStatus, PerformanceMode


class SessionCreate(BaseModel):
    title: str
    mode: PerformanceMode = PerformanceMode.full
    reference_text: Optional[str] = None


class SpeechResultOut(BaseModel):
    transcribed_text:     Optional[str]
    wer:                  Optional[float]
    substitutions:        Optional[int]
    deletions:            Optional[int]
    insertions:           Optional[int]
    missing_words:        Optional[List[str]]
    extra_words:          Optional[List[str]]
    feedback_summary:     Optional[str]
    word_scores:          Optional[list] = None
    pronunciation_summary: Optional[dict] = None
    pauses:               Optional[list] = None
    pause_stats:          Optional[dict] = None
    filler_words:         Optional[list] = None
    filler_counts:        Optional[dict] = None

    class Config:
        from_attributes = True


class FacialResultOut(BaseModel):
    dominant_emotion:    Optional[str]
    ref_dominant:        Optional[str]
    predictions:         Optional[list]
    emotion_percentages: Optional[dict]
    ref_percentages:     Optional[dict]
    feedback_summary:    Optional[str]
    comparison_score:    Optional[float]
    grade:               Optional[str]
    score_components:    Optional[dict]

    class Config:
        from_attributes = True


class PitchResultOut(BaseModel):
    # Core accuracy
    pitch_accuracy:       Optional[float] = None
    mean_error_cents:     Optional[float] = None
    in_range_percent:     Optional[float] = None   # legacy alias
    final_score:          Optional[float] = None

    # Rhythm
    rhythm_deviation_ms:  Optional[float] = None
    tempo_ratio:          Optional[float] = None

    # Voice quality
    stability:            Optional[float] = None
    lyrics_error:         Optional[float] = None
    key_offset:           Optional[int] = None

    # Contours
    ref_contour:          Optional[list] = None
    user_contour:         Optional[list] = None

    # Qualitative
    pitch_tendency:       Optional[str] = None
    timing_tendency:      Optional[str] = None
    detected_scale:       Optional[str] = None

    # Note analysis
    note_transitions:     Optional[list] = None
    note_durations:       Optional[list] = None
    note_timeline:        Optional[list] = None
    timeline_feedback:    Optional[list] = None

    feedback_summary:     Optional[str] = None

    class Config:
        from_attributes = True


class SessionOut(BaseModel):
    id:                   int
    title:                str
    mode:                 PerformanceMode
    language:             str = "en"
    status:               AnalysisStatus
    error_message:        Optional[str]
    created_at:           datetime
    speech_result:        Optional[SpeechResultOut]
    facial_result:        Optional[FacialResultOut]
    pitch_result:         Optional[PitchResultOut]
    annotated_video_path: Optional[str] = None
    reference_audio_path: Optional[str] = None

    class Config:
        from_attributes = True

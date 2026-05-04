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
    mean_error_cents:  Optional[float]
    in_range_percent:  Optional[float]
    pitch_contour:     Optional[list]
    feedback_summary:  Optional[str]

    class Config:
        from_attributes = True


class SessionOut(BaseModel):
    id:             int
    title:          str
    mode:           PerformanceMode
    status:         AnalysisStatus
    error_message:  Optional[str]
    created_at:     datetime
    speech_result:  Optional[SpeechResultOut]
    facial_result:  Optional[FacialResultOut]
    pitch_result:   Optional[PitchResultOut]
    annotated_video_path: Optional[str] = None

    class Config:
        from_attributes = True

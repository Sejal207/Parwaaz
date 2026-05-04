from faster_whisper import WhisperModel
from jiwer import process_words
from app.core.config import settings
from app.modules.speech.pronunciation import compute_word_scores, generate_pronunciation_summary
import re

_model = None

def get_model() -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel(
            settings.WHISPER_MODEL,
            device="cpu",
            compute_type="int8",
        )
    return _model


def clean_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s']", "", text)
    text = re.sub(r"\s+", " ", text)
    return text


def generate_feedback(wer: float, missing: list, extra: list,
                      pronunciation_score: float = None) -> str:
    parts = []
    if pronunciation_score is not None:
        if pronunciation_score >= 90:
            parts.append(f"Pronunciation is excellent ({pronunciation_score}%).")
        elif pronunciation_score >= 75:
            parts.append(f"Pronunciation is good ({pronunciation_score}%) with room to improve.")
        else:
            parts.append(f"Pronunciation needs work ({pronunciation_score}%). Focus on the highlighted words.")

    if wer == 0.0:
        parts.append("Every word matched the reference script perfectly.")
    elif wer < 0.1:
        parts.append(f"Very minor script deviations — only {len(missing + extra)} word(s) differed.")
    elif wer < 0.25:
        if missing: parts.append(f"Missed: {', '.join(missing[:5])}.")
        if extra:   parts.append(f"Added: {', '.join(extra[:5])}.")
    elif wer < 0.5:
        parts.append(f"Moderate accuracy (WER {wer:.0%}).")
        if missing: parts.append(f"Missing words: {', '.join(missing[:6])}.")
        parts.append("Practise section by section.")
    else:
        parts.append(f"Significant deviation (WER {wer:.0%}). Memorise in smaller chunks.")
    return " ".join(parts)


def extract_error_words(alignments):
    """Compatible with both old and new jiwer versions."""
    missing_words = []
    extra_words   = []

    for chunk in alignments[0]:
        chunk_type = chunk.type

        # Handle both jiwer API versions
        try:
            ref_words = chunk.ref_words
        except AttributeError:
            ref_words = getattr(chunk, 'reference_words', [])

        try:
            hyp_words = chunk.hyp_words
        except AttributeError:
            hyp_words = getattr(chunk, 'hypothesis_words', [])

        if chunk_type == "delete":
            missing_words.extend(ref_words)
        elif chunk_type == "insert":
            extra_words.extend(hyp_words)
        elif chunk_type == "substitute":
            missing_words.extend(ref_words)
            extra_words.extend(hyp_words)

    return missing_words, extra_words


def analyze_speech(audio_path: str, reference_text: str) -> dict:
    model = get_model()

    segments, _ = model.transcribe(
        audio_path,
        beam_size=3,
        # language="en", 
        word_timestamps=True,
    )

    transcribed_words_raw = []
    whisper_word_data     = []
    full_text_parts       = []

    for seg in segments:
        full_text_parts.append(seg.text.strip())
        if seg.words:
            for w in seg.words:
                transcribed_words_raw.append(w.word.strip())
                whisper_word_data.append({
                    "word":        w.word.strip(),
                    "start":       w.start,
                    "end":         w.end,
                    "probability": w.probability,
                })

    transcribed = " ".join(full_text_parts)

    if not reference_text or not reference_text.strip():
        return {
            "transcribed_text":       transcribed,
            "wer":                    None,
            "substitutions":          None,
            "deletions":              None,
            "insertions":             None,
            "missing_words":          [],
            "extra_words":            [],
            "feedback_summary":       "No reference script provided — transcription only.",
            "word_scores":            whisper_word_data,
            "pronunciation_summary":  {},
        }

    ref_clean = clean_text(reference_text)
    hyp_clean = clean_text(transcribed)

    result = process_words(ref_clean, hyp_clean)
    wer    = result.wer

    missing_words, extra_words = extract_error_words(result.alignments)

    # Pronunciation scoring
    reference_words   = ref_clean.split()
    transcribed_words = hyp_clean.split()

    word_scores = compute_word_scores(
        reference_words=reference_words,
        transcribed_words=transcribed_words,
        whisper_word_data=whisper_word_data,
    )
    pronunciation_summary = generate_pronunciation_summary(word_scores)

    feedback = generate_feedback(
        wer, missing_words, extra_words,
        pronunciation_score=pronunciation_summary.get("overall_pronunciation_score"),
    )

    return {
        "transcribed_text":       transcribed,
        "wer":                    round(wer, 4),
        "substitutions":          result.substitutions,
        "deletions":              result.deletions,
        "insertions":             result.insertions,
        "missing_words":          missing_words[:20],
        "extra_words":            extra_words[:20],
        "feedback_summary":       feedback,
        "word_scores":            word_scores,
        "pronunciation_summary":  pronunciation_summary,
    }

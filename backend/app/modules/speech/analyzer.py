from faster_whisper import WhisperModel
from jiwer import process_words
from app.core.config import settings
# from app.modules.speech.pronunciation import compute_word_scores, generate_pronunciation_summary
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


def normalize_word(word: str) -> str:
    word = word.lower().strip()
    word = re.sub(r"[^\w']", "", word)
    return word


def analyze_pauses(whisper_word_data: list, threshold_seconds: float) -> dict:
    pauses = []
    if not whisper_word_data:
        return {
            "pauses": pauses,
            "pause_stats": {
                "threshold_seconds": threshold_seconds,
                "pause_count": 0,
                "total_pause_seconds": 0.0,
                "avg_pause_seconds": 0.0,
                "longest_pause_seconds": 0.0,
            },
        }

    sorted_words = sorted(whisper_word_data, key=lambda w: w.get("start", 0))
    for prev, nxt in zip(sorted_words, sorted_words[1:]):
        prev_end = prev.get("end", 0)
        next_start = nxt.get("start", 0)
        gap = round(max(0.0, next_start - prev_end), 3)
        if gap >= threshold_seconds:
            pauses.append({
                "start": prev_end,
                "end": next_start,
                "duration": gap,
                "before_word": prev.get("word"),
                "after_word": nxt.get("word"),
            })

    total_pause = round(sum(p["duration"] for p in pauses), 3)
    pause_count = len(pauses)
    avg_pause = round(total_pause / pause_count, 3) if pause_count else 0.0
    longest_pause = round(max([p["duration"] for p in pauses], default=0.0), 3)

    return {
        "pauses": pauses,
        "pause_stats": {
            "threshold_seconds": threshold_seconds,
            "pause_count": pause_count,
            "total_pause_seconds": total_pause,
            "avg_pause_seconds": avg_pause,
            "longest_pause_seconds": longest_pause,
        },
    }


def analyze_fillers(whisper_word_data: list, filler_words: list) -> dict:
    fillers = []
    filler_counts = {}
    filler_set = {normalize_word(w) for w in filler_words}
    filler_set.discard("")

    for wd in whisper_word_data:
        word = normalize_word(wd.get("word", ""))
        if word in filler_set:
            fillers.append({
                "word": word,
                "start": wd.get("start"),
                "end": wd.get("end"),
                "confidence": wd.get("probability"),
            })
            filler_counts[word] = filler_counts.get(word, 0) + 1

    return {
        "filler_words": fillers,
        "filler_counts": filler_counts,
    }


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


def extract_error_words(alignments, ref_words_list, hyp_words_list):
    """Compatible with both old and new jiwer versions."""
    missing_words = []
    extra_words   = []

    for chunk in alignments[0]:
        chunk_type = chunk.type

        ref_words = None
        hyp_words = None

        if hasattr(chunk, 'ref_words'):
            ref_words = chunk.ref_words
        elif hasattr(chunk, 'reference_words'):
            ref_words = chunk.reference_words
        else:
            ref_words = ref_words_list[chunk.ref_start_idx : chunk.ref_end_idx]

        if hasattr(chunk, 'hyp_words'):
            hyp_words = chunk.hyp_words
        elif hasattr(chunk, 'hypothesis_words'):
            hyp_words = chunk.hypothesis_words
        else:
            hyp_words = hyp_words_list[chunk.hyp_start_idx : chunk.hyp_end_idx]

        if chunk_type == "delete":
            missing_words.extend(ref_words)
        elif chunk_type == "insert":
            extra_words.extend(hyp_words)
        elif chunk_type == "substitute":
            missing_words.extend(ref_words)
            extra_words.extend(hyp_words)

    return missing_words, extra_words


def analyze_speech(audio_path: str, reference_text: str) -> dict:
    from app.modules.speech.pronunciation import (
    compute_word_scores,
    generate_pronunciation_summary
)
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

    pause_analysis = analyze_pauses(whisper_word_data, threshold_seconds=0.5)
    filler_analysis = analyze_fillers(
        whisper_word_data,
        filler_words=["um", "uh", "like", "ok", "mmm"],
    )

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
            "pauses":                 pause_analysis["pauses"],
            "pause_stats":            pause_analysis["pause_stats"],
            "filler_words":           filler_analysis["filler_words"],
            "filler_counts":          filler_analysis["filler_counts"],
        }

    ref_clean = clean_text(reference_text)
    hyp_clean = clean_text(transcribed)

    result = process_words(ref_clean, hyp_clean)
    wer    = result.wer

    reference_words   = ref_clean.split()
    transcribed_words = hyp_clean.split()

    missing_words, extra_words = extract_error_words(
        result.alignments,
        reference_words,
        transcribed_words
    )

    # Pronunciation scoring
    word_scores = compute_word_scores(
        reference_words=reference_words,
        transcribed_words=transcribed_words,
        whisper_word_data=whisper_word_data,
        alignments=result.alignments,
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
        "pauses":                 pause_analysis["pauses"],
        "pause_stats":            pause_analysis["pause_stats"],
        "filler_words":           filler_analysis["filler_words"],
        "filler_counts":          filler_analysis["filler_counts"],
    }

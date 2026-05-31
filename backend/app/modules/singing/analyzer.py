"""
Singing Analysis Module
Adapted from SINGING_MODULE/analyzer.py for integration into the main backend.
"""

import numpy as np
import librosa
import torch
import os
import json
import glob
import sys

TARGET_SR = 22050
NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

MAJOR_SCALES = {
    "C Major": ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    "G Major": ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
    "D Major": ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
    "A Major": ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
    "E Major": ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
}


# ──────────────────────────── VOCAL SEPARATION ────────────────────────────

def separate_vocals(input_path: str, output_dir: str = "separated") -> str:
    """Run demucs stem separation; fall back to original path on failure."""
    os.makedirs(output_dir, exist_ok=True)
    cmd = [
        sys.executable, "-m", "demucs",
        "--two-stems=vocals", "-o", output_dir, input_path
    ]
    try:
        import subprocess
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.strip() or "Unknown demucs error")
    except Exception:
        return input_path

    matches = glob.glob(os.path.join(output_dir, "**", "vocals.wav"), recursive=True)
    if matches:
        return matches[0]
    return input_path


# ──────────────────────────── PREPROCESS ────────────────────────────

def load_and_preprocess(audio_path: str) -> dict:
    y, sr = librosa.load(audio_path, sr=TARGET_SR, mono=True)
    duration = librosa.get_duration(y=y, sr=sr)
    return {"audio": y, "sr": sr, "duration": duration}


# ──────────────────────────── PITCH EXTRACTION ────────────────────────────

def extract_pitch(audio: np.ndarray, sr: int) -> dict:
    import torchcrepe
    audio_tensor = torch.tensor(audio).float().unsqueeze(0)
    pitch, confidence = torchcrepe.predict(
        audio_tensor, sr,
        hop_length=160, fmin=50, fmax=1000,
        model='tiny', batch_size=1024, device='cpu',
        return_periodicity=True,
    )
    frequency = pitch.squeeze().numpy()
    confidence = confidence.squeeze().numpy()
    time = (np.arange(len(frequency)) * 160) / float(sr)
    return {"time": time, "frequency": frequency, "confidence": confidence}


def hz_to_cents(freq: np.ndarray) -> np.ndarray:
    freq = np.where(freq <= 0, 1e-6, freq)
    return 1200 * np.log2(freq / 440.0)


def filter_pitch(pitch: dict, th: float = 0.5) -> dict:
    mask = pitch["confidence"] >= th
    if not np.any(mask):
        mask = np.ones_like(pitch["confidence"], dtype=bool)
    return {
        "cents": hz_to_cents(pitch["frequency"][mask]),
        "time": pitch["time"][mask],
    }


# ──────────────────────────── ALIGNMENT ────────────────────────────

def align_pitch(ref: np.ndarray, user: np.ndarray):
    ref = ref.reshape(-1, 1)
    user = user.reshape(-1, 1)
    D, wp = librosa.sequence.dtw(X=ref.T, Y=user.T)
    wp = np.array(wp)[::-1]
    return ref[wp[:, 0]].flatten(), user[wp[:, 1]].flatten()


# ──────────────────────────── RHYTHM ────────────────────────────

def extract_onsets(audio: np.ndarray, sr: int) -> np.ndarray:
    frames = librosa.onset.onset_detect(y=audio, sr=sr)
    return librosa.frames_to_time(frames, sr=sr)


def compute_rhythm(ref_on: np.ndarray, user_on: np.ndarray):
    if len(ref_on) == 0 or len(user_on) == 0:
        return 500.0, 1.0
    m = min(len(ref_on), len(user_on))
    deviation = np.abs(ref_on[:m] - user_on[:m]) * 1000
    mean_dev = float(np.mean(deviation))
    tempo_ratio = float(user_on[-1] / ref_on[-1]) if ref_on[-1] > 0 else 1.0
    return mean_dev, tempo_ratio


def compute_rhythm_score(rhythm_dev: float) -> float:
    """
    Calculate rhythm score based on deviation in milliseconds.
    Perfect: < 50ms, Excellent: < 100ms, Good: < 150ms, Fair: < 250ms, Poor: >= 250ms
    """
    if rhythm_dev < 50:
        return 100.0
    elif rhythm_dev < 100:
        return 95.0
    elif rhythm_dev < 150:
        return 85.0
    elif rhythm_dev < 200:
        return 75.0
    elif rhythm_dev < 300:
        return 60.0
    elif rhythm_dev < 500:
        return 40.0
    elif rhythm_dev < 1000:
        return 20.0
    return 5.0


# ──────────────────────────── STABILITY ────────────────────────────

def compute_stability(cents: np.ndarray) -> float:
    return float(np.std(cents))


# ──────────────────────────── LYRICS ────────────────────────────

_whisper_model = None


def _get_whisper():
    global _whisper_model
    if _whisper_model is None:
        try:
            import whisper
            _whisper_model = whisper.load_model("base")
        except Exception:
            _whisper_model = None
    return _whisper_model


def transcribe(audio_path: str) -> str:
    model = _get_whisper()
    if model is None:
        return ""
    try:
        result = model.transcribe(audio_path)
        return result.get("text", "")
    except Exception:
        return ""


def compute_wer(ref: str, user: str) -> float:
    ref_words = ref.split()
    user_words = user.split()
    m = min(len(ref_words), len(user_words))
    errors = sum(r != u for r, u in zip(ref_words[:m], user_words[:m]))
    return errors / max(1, len(ref_words))


# ──────────────────────────── KEY ────────────────────────────

def compute_key_offset(ref: np.ndarray, user: np.ndarray) -> int:
    offset = int(round((float(np.median(user)) - float(np.median(ref))) / 100))
    return max(-6, min(6, offset))


def apply_key_correction(user: np.ndarray, offset: int) -> np.ndarray:
    return user - offset * 100


# ──────────────────────────── PITCH TENDENCY ────────────────────────────

def detect_pitch_tendency(ref: np.ndarray, user: np.ndarray) -> str:
    """Detect overall pitch tendency compared to reference."""
    mean_diff = float(np.mean(user - ref))
    std_diff = float(np.std(user - ref))
    
    if mean_diff < -50:
        return f"You are consistently singing flat (below pitch) by ~{abs(mean_diff):.0f} cents."
    elif mean_diff < -20:
        return f"You tend to sing slightly flat (below pitch) by ~{abs(mean_diff):.0f} cents."
    elif mean_diff > 50:
        return f"You are consistently singing sharp (above pitch) by ~{mean_diff:.0f} cents."
    elif mean_diff > 20:
        return f"You tend to sing slightly sharp (above pitch) by ~{mean_diff:.0f} cents."
    else:
        stability_msg = "with good consistency" if std_diff < 100 else "but with variable consistency"
        return f"Pitch alignment is generally balanced {stability_msg}."


def detect_timing_tendency(ref_on: np.ndarray, user_on: np.ndarray) -> str:
    """Detect timing tendency: early, late, or on-beat."""
    if len(ref_on) == 0 or len(user_on) == 0:
        return "Timing could not be evaluated due to insufficient onset data."
    m = min(len(ref_on), len(user_on))
    mean_shift = float(np.mean(user_on[:m] - ref_on[:m]))
    std_shift = float(np.std(user_on[:m] - ref_on[:m]))
    
    if mean_shift < -0.1:
        return f"You consistently sing early (ahead of beat) by ~{abs(mean_shift)*1000:.0f}ms. Try relaxing and focusing on the beat."
    elif mean_shift < -0.03:
        return f"You slightly rush ahead by ~{abs(mean_shift)*1000:.0f}ms. Stay with the beat."
    elif mean_shift > 0.1:
        return f"You consistently sing late (behind the beat) by ~{mean_shift*1000:.0f}ms. Practice staying with the rhythm."
    elif mean_shift > 0.03:
        return f"You slightly lag behind by ~{mean_shift*1000:.0f}ms. Lock in with the beat."
    else:
        consistency = "with excellent consistency" if std_shift < 0.05 else "but with some variance"
        return f"Timing is generally aligned with the beat {consistency}."


# ──────────────────────────── SCALE + NOTES ────────────────────────────

def cents_to_note(cents: float) -> str:
    freq = 440 * (2 ** (cents / 1200))
    midi = int(round(69 + 12 * np.log2(freq / 440)))
    return NOTE_NAMES[midi % 12]


def detect_scale(notes: list) -> str:
    from collections import Counter
    unique = set(Counter(notes).keys())
    best_scale, best_score = None, 0
    for scale, scale_notes in MAJOR_SCALES.items():
        score = len(unique.intersection(scale_notes))
        if score > best_score:
            best_score, best_scale = score, scale
    return best_scale or "Unknown"


def get_note_transitions(notes: list) -> list:
    return [
        f"{notes[i]} → {notes[i+1]}"
        for i in range(len(notes) - 1)
        if notes[i] != notes[i + 1]
    ][:10]


def extract_notes_with_time(cents_array: np.ndarray, time_array: np.ndarray) -> list:
    if len(cents_array) == 0 or len(time_array) == 0:
        return []
    notes = [cents_to_note(c) for c in cents_array]
    result = []
    current_note = notes[0]
    start_time = time_array[0]
    for i in range(1, len(notes)):
        if notes[i] != current_note:
            end_time = time_array[i]
            result.append({
                "note": current_note,
                "start": float(start_time),
                "end": float(end_time),
                "duration": float(end_time - start_time),
            })
            current_note = notes[i]
            start_time = time_array[i]
    result.append({
        "note": current_note,
        "start": float(start_time),
        "end": float(time_array[-1]),
        "duration": float(time_array[-1] - start_time),
    })
    return result


def get_note_durations(note_segments: list) -> list:
    return [
        {"note": seg["note"], "duration": round(seg["duration"], 2)}
        for seg in note_segments if seg["duration"] > 0.1
    ]


def get_note_timeline(note_segments: list) -> list:
    return [
        {"note": seg["note"], "start": round(seg["start"], 2), "end": round(seg["end"], 2)}
        for seg in note_segments if seg["duration"] > 0.1
    ]


def build_live_note_timeline(pitch: dict, conf_th: float = 0.45, min_duration: float = 0.08) -> list:
    """Smooth + segment notes for live UI sync during audio playback."""
    freq = pitch["frequency"]
    conf = pitch["confidence"]
    time = pitch["time"]
    if len(time) == 0:
        return []

    midi_vals = np.full(len(time), np.nan)
    for i in range(len(time)):
        if conf[i] >= conf_th and freq[i] > 0:
            midi_vals[i] = 69 + 12 * np.log2(freq[i] / 440.0)

    smoothed = np.full(len(time), np.nan)
    for i in range(len(time)):
        if np.isnan(midi_vals[i]):
            continue
        lo, hi = max(0, i - 3), min(len(time), i + 4)
        valid = midi_vals[lo:hi][~np.isnan(midi_vals[lo:hi])]
        smoothed[i] = float(np.median(valid)) if len(valid) > 0 else midi_vals[i]

    labels = []
    for i in range(len(time)):
        if np.isnan(smoothed[i]):
            labels.append("Rest")
        else:
            labels.append(NOTE_NAMES[int(round(smoothed[i])) % 12])

    timeline = []
    start_idx = 0
    current = labels[0]
    for i in range(1, len(labels)):
        if labels[i] != current:
            start_t, end_t = float(time[start_idx]), float(time[i])
            if (end_t - start_t) >= min_duration:
                timeline.append({"note": current, "start": round(start_t, 2), "end": round(end_t, 2)})
            start_idx = i
            current = labels[i]

    frame_dt = (float(time[-1]) - float(time[-2])) if len(time) > 1 else 0.01
    start_t = float(time[start_idx])
    end_t = float(time[-1]) + max(frame_dt, 0.01)
    if (end_t - start_t) >= min_duration:
        timeline.append({"note": current, "start": round(start_t, 2), "end": round(end_t, 2)})

    return timeline


# ──────────────────────────── TIMELINE FEEDBACK ────────────────────────────

def generate_timeline_feedback(ref: np.ndarray, user: np.ndarray) -> list:
    feedback = []
    window = 50
    for i in range(0, len(ref), window):
        r, u = ref[i:i+window], user[i:i+window]
        if len(r) == 0:
            continue
        error = float(np.mean(np.abs(r - u)))
        msg = "Good pitch" if error < 30 else ("Slightly off" if error < 80 else "Off pitch")
        feedback.append({
            "start": round(i / 100, 2),
            "end": round((i + window) / 100, 2),
            "message": msg,
        })
    return feedback


# ──────────────────────────── SECOND-BY-SECOND ANALYSIS ────────────────────────────

def generate_second_by_second_analysis(ref: np.ndarray, user: np.ndarray, 
                                       user_note_segments: list,
                                       ref_note_segments: list = None) -> dict:
    """
    Analyze performance on a per-second basis with note comparison.
    
    Args:
        ref: Reference pitch contour
        user: User pitch contour
        user_note_segments: User's note segments with timing
        ref_note_segments: Reference's note segments with timing (optional)
    
    Returns:
        {
            "overall_stats": {...},
            "per_second": [
                {
                    "second": 0,
                    "start_time": 0.0,
                    "end_time": 1.0,
                    "metrics": {...},
                    "issues": [...],
                    "reference_notes": [...],
                    "user_notes": [...],
                    "note_match": bool,
                    "performance": "excellent|good|fair|poor"
                },
                ...
            ]
        }
    """
    # Resample to 100Hz for cleaner second binning
    ref_resampled = np.interp(
        np.linspace(0, len(ref), int(len(ref) / 100 * 100)),
        np.arange(len(ref)),
        ref
    )
    user_resampled = np.interp(
        np.linspace(0, len(user), int(len(user) / 100 * 100)),
        np.arange(len(user)),
        user
    )
    
    # Ensure same length
    min_len = min(len(ref_resampled), len(user_resampled))
    ref_resampled = ref_resampled[:min_len]
    user_resampled = user_resampled[:min_len]
    
    duration_seconds = int(len(ref_resampled) / 100)
    samples_per_second = 100
    
    per_second = []
    all_issues = []
    seconds_accurate = 0
    seconds_with_issues = 0
    notes_matched = 0
    
    for sec in range(duration_seconds):
        start_idx = sec * samples_per_second
        end_idx = (sec + 1) * samples_per_second
        
        r_slice = ref_resampled[start_idx:end_idx]
        u_slice = user_resampled[start_idx:end_idx]
        
        if len(r_slice) == 0:
            continue
        
        # Calculate per-second metrics
        diff = np.abs(r_slice - u_slice)
        mean_diff = float(np.mean(diff))
        std_diff = float(np.std(diff))
        max_diff = float(np.max(diff))
        min_diff = float(np.min(diff))
        
        # Pitch accuracy for this second
        accuracy_pct = float(np.mean(diff <= 50) * 100)
        
        # Detect issues in this second
        issues = []
        
        # Flat/Sharp detection
        mean_u_ref = float(np.mean(u_slice) - np.mean(r_slice))
        if mean_u_ref < -60:
            issues.append({"type": "flat", "severity": "severe", "value": abs(mean_u_ref)})
        elif mean_u_ref < -30:
            issues.append({"type": "flat", "severity": "moderate", "value": abs(mean_u_ref)})
        elif mean_u_ref > 60:
            issues.append({"type": "sharp", "severity": "severe", "value": mean_u_ref})
        elif mean_u_ref > 30:
            issues.append({"type": "sharp", "severity": "moderate", "value": mean_u_ref})
        
        # Instability detection
        if std_diff > 100:
            issues.append({"type": "instability", "severity": "severe", "value": std_diff})
        elif std_diff > 50:
            issues.append({"type": "instability", "severity": "moderate", "value": std_diff})
        
        # Get reference notes for this second
        ref_notes_in_sec = []
        if ref_note_segments:
            ref_notes_in_sec = list(set([
                seg["note"] for seg in ref_note_segments
                if seg.get("start", 0) < sec + 1 and seg.get("end", 0) > sec
            ]))
        
        # Get user notes for this second
        user_notes_in_sec = list(set([
            seg["note"] for seg in user_note_segments
            if seg.get("start", 0) < sec + 1 and seg.get("end", 0) > sec
        ]))
        
        # Check if notes match
        note_match = False
        if ref_notes_in_sec and user_notes_in_sec:
            note_match = len(set(ref_notes_in_sec) & set(user_notes_in_sec)) > 0
            if note_match:
                notes_matched += 1
        
        # Determine performance level
        if accuracy_pct >= 80 and len(issues) == 0 and note_match:
            perf = "excellent"
            seconds_accurate += 1
        elif accuracy_pct >= 60 and len(issues) <= 1 and note_match:
            perf = "good"
            seconds_accurate += 1
        elif accuracy_pct >= 40 and note_match:
            perf = "fair"
            seconds_with_issues += 1
        else:
            perf = "poor"
            seconds_with_issues += 1
        
        second_data = {
            "second": sec,
            "start_time": float(sec),
            "end_time": float(sec + 1),
            "metrics": {
                "mean_error_cents": mean_diff,
                "std_deviation": std_diff,
                "max_deviation": max_diff,
                "min_deviation": min_diff,
                "accuracy_percentage": accuracy_pct,
                "pitch_offset": mean_u_ref,
            },
            "issues": issues,
            "reference_notes": ref_notes_in_sec,
            "user_notes": user_notes_in_sec,
            "note_match": note_match,
            "performance": perf,
        }
        per_second.append(second_data)
        
        if len(issues) > 0:
            all_issues.extend([{**issue, "second": sec} for issue in issues])
    
    # Overall statistics
    overall_stats = {
        "total_duration_seconds": duration_seconds,
        "seconds_on_pitch": seconds_accurate,
        "seconds_with_issues": seconds_with_issues,
        "overall_accuracy": float(seconds_accurate / max(duration_seconds, 1) * 100),
        "notes_matched_seconds": notes_matched,
        "issue_distribution": {
            "flat": len([i for i in all_issues if i["type"] == "flat"]),
            "sharp": len([i for i in all_issues if i["type"] == "sharp"]),
            "instability": len([i for i in all_issues if i["type"] == "instability"]),
        },
        "critical_issues": [i for i in all_issues if i["severity"] == "severe"],
    }
    
    return {
        "overall_stats": overall_stats,
        "per_second": per_second,
    }


# ──────────────────────────── METRICS ────────────────────────────

def compute_pitch_metrics(ref: np.ndarray, user: np.ndarray):
    diff = np.abs(ref - user)
    return float(np.mean(diff)), float(np.mean(diff <= 50) * 100)


# ──────────────────────────── CACHE ────────────────────────────

def save_cache(data: dict, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    d = {k: v.tolist() if isinstance(v, np.ndarray) else v for k, v in data.items()}
    with open(path, "w") as f:
        json.dump(d, f)


def load_cache(path: str) -> dict:
    with open(path) as f:
        d = json.load(f)
    for k in d:
        if isinstance(d[k], list):
            d[k] = np.array(d[k])
    return d


# ──────────────────────────── PIPELINES ────────────────────────────

def _ensure_non_empty(cents: np.ndarray) -> np.ndarray:
    return cents if len(cents) > 0 else np.array([0.0], dtype=float)


def process_reference(path: str, cache_path: str) -> dict:
    if os.path.exists(cache_path):
        return load_cache(cache_path)

    print("[Singing] Running Demucs on reference track...")
    vocal_path = separate_vocals(path, output_dir=os.path.join(os.path.dirname(cache_path), "separated"))
    data = load_and_preprocess(vocal_path)
    pitch = filter_pitch(extract_pitch(data["audio"], data["sr"]))
    onsets = extract_onsets(data["audio"], data["sr"])
    lyrics = transcribe(vocal_path)

    out = {"cents": pitch["cents"], "time": pitch["time"], "onsets": onsets, "lyrics": lyrics}
    save_cache(out, cache_path)
    return out


def process_user(path: str, cache_path: str) -> dict:
    if os.path.exists(cache_path):
        return load_cache(cache_path)

    data = load_and_preprocess(path)
    raw_pitch = extract_pitch(data["audio"], data["sr"])
    pitch = filter_pitch(raw_pitch)
    onsets = extract_onsets(data["audio"], data["sr"])
    lyrics = transcribe(path)
    live_timeline = build_live_note_timeline(raw_pitch)

    out = {
        "cents": pitch["cents"],
        "time": pitch["time"],
        "live_timeline": live_timeline,
        "onsets": onsets,
        "lyrics": lyrics,
    }
    save_cache(out, cache_path)
    return out


# ──────────────────────────── FEEDBACK ────────────────────────────

def generate_feedback(r: dict) -> str:
    """Generate comprehensive, actionable feedback based on singing metrics."""
    strengths = []
    improvements = []
    
    # Pitch Analysis
    if r["pitch_accuracy"] >= 85:
        strengths.append("Excellent pitch control and tuning accuracy")
    elif r["pitch_accuracy"] >= 70:
        improvements.append(f"Pitch accuracy ({r['pitch_accuracy']:.1f}%) needs improvement. Focus on matching notes precisely")
    elif r["pitch_accuracy"] >= 60:
        improvements.append(f"Significant pitch issues detected. Practice scales and intervals to develop better pitch control")
    else:
        improvements.append("Pitch accuracy is very low. Consider working with a vocal coach on ear training")
    
    # Rhythm & Timing
    if r["rhythm_deviation_ms"] < 100:
        strengths.append("Excellent rhythm and timing consistency")
    elif r["rhythm_deviation_ms"] < 150:
        strengths.append("Good rhythm control")
    elif r["rhythm_deviation_ms"] < 250:
        improvements.append(f"Timing is off by {r['rhythm_deviation_ms']:.0f}ms on average. Practice with a metronome")
    else:
        improvements.append(f"Significant timing issues ({r['rhythm_deviation_ms']:.0f}ms deviation). Strong metronome practice recommended")
    
    # Tempo
    tempo_diff = abs(1.0 - r["tempo_ratio"]) * 100
    if tempo_diff > 10:
        improvements.append(f"You're singing {'too fast' if r['tempo_ratio'] > 1.0 else 'too slow'} ({r['tempo_ratio']:.2f}x tempo)")
    
    # Voice Stability
    stability_score = max(0, 100 - (r["stability"] / 2))
    if stability_score >= 80:
        strengths.append("Excellent vocal stability on sustained notes")
    elif stability_score >= 60:
        improvements.append("Work on maintaining stable pitch during held notes")
    else:
        improvements.append(f"Voice stability needs significant work (score: {stability_score:.0f}%). Practice sustained tones")
    
    # Lyrics
    lyrics_accuracy = (1 - r["lyrics_error"]) * 100
    if lyrics_accuracy >= 95:
        strengths.append("Perfect lyric delivery")
    elif lyrics_accuracy >= 80:
        strengths.append("Good lyric accuracy")
    elif lyrics_accuracy >= 60:
        improvements.append(f"Lyrics accuracy is {lyrics_accuracy:.0f}%. Review the lyrics and pronunciation")
    else:
        improvements.append("Focus on learning the lyrics correctly before working on vocal techniques")
    
    # Key and Range
    if r["key_offset"] != 0:
        improvements.append(f"You're singing in a different key ({r['key_offset']:+d} semitones). Adjust your key or practice transposition")
    
    # Build final message
    feedback = []
    
    if strengths:
        feedback.append("Strengths: " + ", ".join(strengths) + ".")
    
    if improvements:
        feedback.append("Focus areas: " + ", ".join(improvements) + ".")
    
    if not feedback:
        feedback.append("Keep practicing to develop your singing skills further.")
    
    return " ".join(feedback)


# ──────────────────────────── PUBLIC ENTRY POINT ────────────────────────────

def analyze_singing(user_audio_path: str, reference_audio_path: str, cache_dir: str = None) -> dict:
    """
    Main entry point for singing analysis.

    Args:
        user_audio_path: Path to the user's audio (wav/mp3).
        reference_audio_path: Path to the reference/original song (wav/mp3).
        cache_dir: Directory for storing intermediate cache files.
                   Defaults to the uploads directory next to the audio.

    Returns:
        A flat dict with all singing metrics ready to be saved to PitchResult.
    """
    if cache_dir is None:
        cache_dir = os.path.join(os.path.dirname(user_audio_path), "singing_cache")

    ref_cache = os.path.join(cache_dir, "ref.json")
    user_cache = os.path.join(cache_dir, "user.json")

    # Clear stale caches so we always get fresh results per upload
    for p in [ref_cache, user_cache]:
        if os.path.exists(p):
            os.remove(p)

    ref = process_reference(reference_audio_path, ref_cache)
    user = process_user(user_audio_path, user_cache)

    ref["cents"] = _ensure_non_empty(ref["cents"])
    user["cents"] = _ensure_non_empty(user["cents"])

    # Key normalisation
    offset = compute_key_offset(ref["cents"], user["cents"])
    user_corr = apply_key_correction(user["cents"], offset)

    # DTW alignment
    ref_a, user_a = align_pitch(ref["cents"], user_corr)

    # Reference time axis for note extraction
    ref_time = ref.get("time")
    if ref_time is None or len(ref_time) != len(ref["cents"]):
        ref_time = np.linspace(0, len(ref["cents"]) / 100, len(ref["cents"]))

    # Note analysis for user performance
    user_time = user.get("time")
    if user_time is None or len(user_time) != len(user["cents"]):
        user_time = np.linspace(0, len(user["cents"]) / 100, len(user["cents"]))

    user_note_segments = extract_notes_with_time(user["cents"], user_time)
    user_notes = [seg["note"] for seg in user_note_segments]
    
    # Note analysis for reference
    ref_note_segments = extract_notes_with_time(ref["cents"], ref_time)

    scale = detect_scale(user_notes)
    transitions = get_note_transitions(user_notes)
    durations = get_note_durations(user_note_segments)
    note_timeline = user.get("live_timeline") or get_note_timeline(user_note_segments)

    pitch_tendency = detect_pitch_tendency(ref_a, user_a)
    timing_tendency = detect_timing_tendency(ref["onsets"], user["onsets"])
    timeline_feedback = generate_timeline_feedback(ref_a, user_a)
    
    # Generate second-by-second analysis with reference comparison
    second_by_second = generate_second_by_second_analysis(ref_a, user_a, user_note_segments, ref_note_segments)

    # Metrics
    pitch_error, pitch_acc = compute_pitch_metrics(ref_a, user_a)
    rhythm_dev, tempo = compute_rhythm(ref["onsets"], user["onsets"])
    stability = compute_stability(user_a)
    wer = compute_wer(ref["lyrics"], user["lyrics"])

    # Scores (0–100)
    pitch_score = float(np.clip(pitch_acc, 0, 100))
    rhythm_score = float(np.clip(compute_rhythm_score(rhythm_dev), 0, 100))
    lyrics_score = float(np.clip(100 * np.exp(-wer * 2), 0, 100))
    stability_score = float(np.clip(100 * np.exp(-stability / 200), 0, 100))

    final_score = (
        0.40 * pitch_score +
        0.30 * rhythm_score +
        0.20 * lyrics_score +
        0.10 * stability_score
    )

    result = {
        "pitch_accuracy":        pitch_score,
        "mean_error_cents":      float(pitch_error),
        "rhythm_deviation_ms":   float(rhythm_dev),
        "tempo_ratio":           float(tempo),
        "stability":             float(stability),
        "lyrics_error":          float(wer),
        "key_offset":            int(offset),
        "final_score":           float(final_score),
        "ref_contour":           ref_a.tolist(),
        "user_contour":          user_a.tolist(),
        "pitch_tendency":        pitch_tendency,
        "timing_tendency":       timing_tendency,
        "detected_scale":        scale,
        "note_transitions":      transitions,
        "note_durations":        durations,
        "note_timeline":         note_timeline,
        "timeline_feedback":     timeline_feedback,
        "second_by_second":      second_by_second,
    }
    result["feedback_summary"] = generate_feedback(result)
    return result

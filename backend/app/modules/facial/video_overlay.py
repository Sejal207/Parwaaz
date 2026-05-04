import cv2
import numpy as np
from pathlib import Path
import uuid

# Sky-blue / navy palette matching Parwaaz
EMOTION_COLORS_BGR = {
    "happy":   (160, 229, 0),    # teal-green
    "sad":     (235, 206, 135),  # sky blue
    "angry":   (59,  59,  255),  # red-ish
    "neutral": (160, 160, 160),  # grey
    "fear":    (255, 140, 0),    # amber
    "disgust": (180, 0,  180),   # purple
    "unknown": (80,  80,  80),
}

def draw_hud(frame, emotion: str, probs: dict, frame_no: int, fps: float):
    h, w = frame.shape[:2]
    color = EMOTION_COLORS_BGR.get(emotion, (200, 200, 200))

    # ── Top bar ──────────────────────────────────────────────
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, 44), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)

    cv2.putText(frame, "PARWAAZ / EXPRESSION ANALYSIS",
                (12, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.38,
                (135, 206, 235), 1, cv2.LINE_AA)

    timestamp = round(frame_no / fps, 1)
    cv2.putText(frame, f"t={timestamp}s",
                (w - 80, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.35,
                (100, 140, 160), 1, cv2.LINE_AA)

    # Dominant emotion label
    label = f"{emotion.upper()}"
    cv2.putText(frame, label,
                (12, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.55,
                color, 2, cv2.LINE_AA)

    # ── Side probability bars ─────────────────────────────────
    bar_w    = 110
    bar_h    = 14
    bar_x    = w - bar_w - 16
    bar_y0   = 60
    padding  = 20

    panel_h = len(probs) * padding + 12
    overlay2 = frame.copy()
    cv2.rectangle(overlay2, (bar_x - 8, bar_y0 - 8),
                  (w - 4, bar_y0 + panel_h), (0,0,0), -1)
    cv2.addWeighted(overlay2, 0.55, frame, 0.45, 0, frame)

    for i, (em, prob) in enumerate(sorted(probs.items(), key=lambda x: x[1], reverse=True)):
        y  = bar_y0 + i * padding
        bw = int(bar_w * prob)
        c  = EMOTION_COLORS_BGR.get(em, (120,120,120))

        # Background track
        cv2.rectangle(frame, (bar_x, y), (bar_x + bar_w, y + bar_h),
                      (40, 40, 40), -1)
        # Filled bar
        if bw > 0:
            cv2.rectangle(frame, (bar_x, y), (bar_x + bw, y + bar_h), c, -1)

        # Label
        cv2.putText(frame, f"{em[:3].upper()} {prob*100:.0f}%",
                    (bar_x - 70, y + 11),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.28,
                    (200, 200, 200), 1, cv2.LINE_AA)

    # ── Corner accents ────────────────────────────────────────
    accent = (135, 206, 235)
    sz     = 14
    thick  = 1
    # TL
    cv2.line(frame, (0, 48), (sz, 48), accent, thick)
    cv2.line(frame, (0, 48), (0, 48+sz), accent, thick)
    # TR
    cv2.line(frame, (w, 48), (w-sz, 48), accent, thick)
    cv2.line(frame, (w, 48), (w, 48+sz), accent, thick)
    # BL
    cv2.line(frame, (0, h), (sz, h), accent, thick)
    cv2.line(frame, (0, h), (0, h-sz), accent, thick)
    # BR
    cv2.line(frame, (w, h), (w-sz, h), accent, thick)
    cv2.line(frame, (w, h), (w, h-sz), accent, thick)

    return frame


def create_annotated_video(
    original_video_path: str,
    predictions: list,
    output_dir: str,
    emotion_probs: dict,
) -> str:
    """
    Burn emotion HUD overlay onto the original video.
    Returns absolute path to annotated mp4.
    """
    cap = cv2.VideoCapture(original_video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    W   = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H   = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    out_path = str(Path(output_dir) / f"annotated_{uuid.uuid4().hex[:8]}.mp4")
    fourcc   = cv2.VideoWriter_fourcc(*"mp4v")
    writer   = cv2.VideoWriter(out_path, fourcc, fps, (W, H))

    # Build sorted timestamp → prediction lookup
    pred_by_time = sorted(predictions, key=lambda p: p["timestamp"])
    current_pred = pred_by_time[0] if pred_by_time else None

    frame_idx = 0
    pred_ptr  = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        timestamp = frame_idx / fps

        # Advance prediction pointer
        while pred_ptr < len(pred_by_time) - 1 and \
              pred_by_time[pred_ptr + 1]["timestamp"] <= timestamp:
            pred_ptr += 1
        current_pred = pred_by_time[pred_ptr] if pred_by_time else None

        if current_pred:
            frame = draw_hud(
                frame,
                emotion=current_pred["emotion"],
                probs=current_pred.get("all_probs", emotion_probs),
                frame_no=frame_idx,
                fps=fps,
            )

        writer.write(frame)
        frame_idx += 1

    cap.release()
    writer.release()
    return out_path

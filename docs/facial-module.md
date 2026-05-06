# Facial Module (Module 1)

This document explains the facial expression analysis module: concepts, formulas, and technologies used. It reflects the current backend implementation in `backend/app/modules/facial/`.

## 1) What the facial module does

The facial module analyzes facial expressions in a user video and optionally compares them to a reference video. It outputs:

- Dominant emotion classification
- Emotion probability distribution
- Comparison score and grade (when reference video is provided)
- Per-frame predictions and an annotated video overlay

## 2) Pipeline overview

1. **Frame sampling**
   - The video is sampled into a fixed number of frames (default 30).
   - Frames are evenly spaced over the full video duration.

2. **Feature extraction**
   - Each frame is passed through a ResNet18 backbone.
   - The final classification layer is removed (identity), producing 512-dim features.

3. **Temporal modeling**
   - Frame features are stacked into a sequence.
   - A bidirectional LSTM (EmotionLSTM) processes the sequence.
   - The pooled sequence embedding is mapped to emotion logits.

4. **Emotion probabilities**
   - Logits are converted to probabilities with softmax.
   - The max-probability class is the dominant emotion.

5. **Comparison scoring (if reference video exists)**
   - The same pipeline runs on the reference video.
   - Scores are computed from dominant emotion match, distribution similarity, embedding similarity, temporal proxy, and confidence.

6. **Annotated video overlay**
   - A HUD overlay is burned into frames with emotion and confidence bars.
   - The annotated video is saved for frontend playback.

## 3) Concepts and formulas

### 3.1 Emotion probabilities (softmax)

Given logits $z$, probabilities are:

$$
P_i = \frac{e^{z_i}}{\sum_j e^{z_j}}
$$

The dominant emotion is $\arg\max_i P_i$.

### 3.2 Distribution similarity

Emotion distributions are compared with cosine similarity:

$$
\text{dist\_sim}(u, r) = \frac{u \cdot r}{\|u\|\,\|r\|}
$$

This is scaled to a 0-100 range:

$$
\text{distribution} = 100 \times \text{dist\_sim}
$$

### 3.3 Embedding similarity

The LSTM pooled embedding vectors are compared with cosine similarity:

$$
\text{emb\_sim}(u, r) = \frac{u \cdot r}{\|u\|\,\|r\|}
$$

Scaled to 0-100:

$$
\text{embedding} = 100 \times \text{emb\_sim}
$$

### 3.4 Temporal proxy score

The module uses a proxy temporal score based on confidence difference:

$$
\text{temporal} = 100 \times \left(1 - |c_u - c_r|\right)
$$

Where $c_u$ and $c_r$ are the dominant-emotion confidences from user and reference.

### 3.5 Confidence score

Average of user and reference confidence:

$$
\text{confidence} = 50 \times (c_u + c_r)
$$

### 3.6 Final score

The final comparison score is a weighted sum:

$$
\text{final\_score} = 0.35\,E + 0.15\,D + 0.25\,M + 0.15\,T + 0.10\,C
$$

Where:
- $E$ = emotion match (100 if dominant emotions match, else 30)
- $D$ = distribution similarity
- $M$ = embedding similarity
- $T$ = temporal proxy score
- $C$ = confidence score

### 3.7 Grade thresholds

- A: $\text{final\_score} \ge 85$
- B: $70 \le \text{final\_score} < 85$
- C: $55 \le \text{final\_score} < 70$
- D: $40 \le \text{final\_score} < 55$
- F: $\text{final\_score} < 40$

## 4) Technologies used

### Core libraries

- **PyTorch**
  - ResNet18 backbone for feature extraction
  - Custom EmotionLSTM for sequence modeling

- **Torchvision**
  - Pretrained ResNet18 weights and transforms

- **OpenCV**
  - Video frame extraction and HUD rendering
  - Video encoding for annotated output

- **PIL (Pillow)**
  - Conversion of frames to PIL images for transforms

- **NumPy**
  - Vector operations, frame sampling, and math

- **scikit-learn** (`sklearn.metrics.pairwise`)
  - Cosine similarity

### Internal modules

- `backend/app/modules/facial/analyzer.py`
  - Core analysis and comparison logic

- `backend/app/modules/facial/video_overlay.py`
  - HUD overlay and annotated video generation

- `backend/app/modules/facial/weights/model_config.json`
  - Model metadata, class labels, and normalization values

- `backend/app/modules/facial/weights/final_model.pth`
  - Trained EmotionLSTM weights

## 5) Outputs (API fields)

The facial module returns:

- `dominant_emotion`
- `ref_dominant` (if reference video provided)
- `predictions` (timestamped probabilities)
- `emotion_percentages`
- `ref_percentages`
- `feedback_summary`
- `comparison_score`
- `grade`
- `score_components`

These fields are persisted into `facial_results` and returned via `SessionOut`.

## 6) Notes and limits

- The model runs on CPU for portability.
- Sampling is capped to a fixed frame count (default 30).
- Temporal scoring is a proxy; it is not a full sequence alignment.
- If no reference video is provided, comparison fields are omitted and only classification is returned.

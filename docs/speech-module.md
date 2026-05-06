# Speech Module (Module 2)

This document describes the speech analysis module: core concepts, formulas, and the technologies used. It is based on the current backend implementation in `backend/app/modules/speech/`.

## 1) What the speech module does

The speech module analyzes an uploaded performance by:

- Transcribing the audio using Whisper (via `faster-whisper`).
- Comparing the transcription against a reference script (if provided).
- Computing word-level error metrics (WER, substitutions, deletions, insertions).
- Scoring pronunciation by comparing reference words vs. transcribed words with embeddings and cosine similarity.
- Generating a human-readable feedback summary.

If no reference script is supplied, the module returns transcription-only results.

## 2) Pipeline overview

1. **Whisper transcription**
   - Audio is passed to Whisper with `word_timestamps=True`.
   - The module collects:
     - Full transcript text.
     - Word-level timestamps and confidence values.

2. **Normalization**
   - Both reference and transcription are lowercased.
   - Punctuation is removed except apostrophes.
   - Multiple spaces are collapsed.

3. **Word error statistics (WER)**
   - The module uses `jiwer.process_words` to align the reference and hypothesis.
   - It extracts substitutions, deletions, and insertions.
   - It derives missing and extra words from alignment chunks.

4. **Pronunciation scoring**
   - Each reference word is compared to the most similar transcribed word.
   - Similarity uses a sentence-transformer embedding + cosine similarity.
   - A combined score blends cosine similarity and Whisper confidence.

5. **Summary feedback**
   - The module generates text feedback based on WER and pronunciation score.

## 3) Concepts and formulas

### 3.1 Word Error Rate (WER)

WER measures how different the transcription is from the reference script.

$$
WER = \frac{S + D + I}{N}
$$

Where:
- $S$ = number of substitutions
- $D$ = number of deletions
- $I$ = number of insertions
- $N$ = number of words in the reference

The module uses `jiwer` to compute $S$, $D$, $I$, and the final WER.

### 3.2 Word-level alignment categories

Alignment uses these categories:
- **delete**: word present in reference, missing in transcription
- **insert**: word present in transcription, not in reference
- **substitute**: word in reference replaced by a different word in transcription

These are aggregated into `missing_words` and `extra_words` lists for feedback.

### 3.3 Pronunciation similarity (cosine similarity)

Each word is embedded into a vector using a sentence-transformer model. The similarity between reference and transcribed word vectors is computed with cosine similarity:

$$
\text{cosine\_sim}(a, b) = \frac{a \cdot b}{\|a\|\,\|b\|}
$$

The best-matching transcribed word is selected by maximum cosine similarity.

### 3.4 Combined pronunciation score

The module blends cosine similarity and Whisper word confidence:

$$
\text{combined} = 0.7 \cdot \text{cosine\_sim} + 0.3 \cdot \text{whisper\_confidence}
$$

This combined score is used for the overall pronunciation score.

### 3.5 Pronunciation labels

Labeling uses cosine similarity thresholds:

- `correct`: $\text{cosine\_sim} \ge 0.95$
- `acceptable`: $0.80 \le \text{cosine\_sim} < 0.95$
- `mispronounced`: $0.60 \le \text{cosine\_sim} < 0.80$
- `incorrect`: $\text{cosine\_sim} < 0.60$
- `missing`: no matched transcribed word

### 3.6 Overall pronunciation score

The average of per-word combined scores is converted into a 0-100 scale:

$$
\text{overall\_pronunciation\_score} = 100 \times \text{mean(combined\_score)}
$$

The module also reports:
- counts of correct/acceptable/mispronounced/incorrect/missing words
- overall accuracy percent
- top problem words with lowest scores

## 4) Technologies used

### Core libraries

- **faster-whisper**
  - Model: `settings.WHISPER_MODEL`
  - Device: CPU
  - Compute type: `int8`
  - Provides transcript + per-word timestamps and confidence

- **jiwer**
  - Computes WER and alignment stats

- **sentence-transformers**
  - Model: `all-MiniLM-L6-v2`
  - Generates embeddings for reference and transcribed words

- **scikit-learn** (`sklearn.metrics.pairwise`)
  - Cosine similarity function

- **numpy**
  - Aggregations for mean and summary statistics

### Internal modules

- `backend/app/modules/speech/analyzer.py`
  - Orchestrates transcription, WER, and pronunciation scoring

- `backend/app/modules/speech/pronunciation.py`
  - Embedding, similarity, and summary calculations

## 5) Outputs (API fields)

The speech module returns:

- `transcribed_text`
- `wer`, `substitutions`, `deletions`, `insertions`
- `missing_words`, `extra_words`
- `feedback_summary`
- `word_scores` (per-word details with timestamps)
- `pronunciation_summary` (aggregate pronunciation metrics)

These fields are persisted into `speech_results` and returned through the `SessionOut` API response.

## 6) Notes and limits

- If no reference script is provided, WER and pronunciation are skipped.
- Confidence from Whisper is treated as a proxy for pronunciation quality.
- The model runs on CPU for reproducibility and ease of deployment.

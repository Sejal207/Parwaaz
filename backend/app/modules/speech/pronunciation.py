"""
Pronunciation scoring using cosine similarity.

How it works:
- We get word-level timestamps from Whisper
- For each word, Whisper gives us a confidence score (its own DL certainty)
- We use a sentence-transformer to encode the reference word and the
  transcribed word into embedding vectors
- Cosine similarity between those vectors gives pronunciation closeness
- Score 0.95+ = correct, 0.80-0.95 = acceptable, below 0.80 = mispronounced
"""

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict

# Load once at import time
_embedder = None

def get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        # Small, fast model — good balance of speed and accuracy
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


def score_label(score: float) -> str:
    if score >= 0.95:
        return "correct"
    if score >= 0.80:
        return "acceptable"
    if score >= 0.60:
        return "mispronounced"
    return "incorrect"


def compute_word_scores(
    reference_words: List[str],
    transcribed_words: List[str],
    whisper_word_data: List[Dict],   # [{word, start, end, probability}]
) -> List[Dict]:
    """
    For each reference word, find the closest transcribed word and
    compute cosine similarity between their embeddings.

    Returns list of per-word results.
    """
    embedder = get_embedder()

    # Build a lookup of transcribed word -> whisper confidence
    whisper_lookup = {}
    for wd in whisper_word_data:
        w = wd["word"].strip().lower()
        whisper_lookup[w] = {
            "start": wd.get("start", 0),
            "end": wd.get("end", 0),
            "whisper_confidence": wd.get("probability", 1.0),
        }

    # Encode all words in one batch (fast)
    all_words = list(set(reference_words + transcribed_words))
    embeddings = embedder.encode(all_words, convert_to_numpy=True)
    word_to_vec = {w: embeddings[i] for i, w in enumerate(all_words)}

    results = []

    # Match reference words to transcribed words
    transcribed_lower = [w.lower() for w in transcribed_words]

    for ref_word in reference_words:
        ref_lower = ref_word.lower()
        ref_vec = word_to_vec.get(ref_lower)

        # Find best matching transcribed word by cosine similarity
        best_score = 0.0
        best_match = None

        for trans_word in transcribed_lower:
            trans_vec = word_to_vec.get(trans_word)
            if ref_vec is not None and trans_vec is not None:
                sim = cosine_similarity(
                    ref_vec.reshape(1, -1),
                    trans_vec.reshape(1, -1)
                )[0][0]
                if sim > best_score:
                    best_score = float(sim)
                    best_match = trans_word

        # Get timing info from whisper if available
        timing = whisper_lookup.get(best_match, {}) if best_match else {}
        whisper_conf = timing.get("whisper_confidence", 1.0)

        # Combined score: 70% cosine similarity + 30% whisper confidence
        combined_score = round(0.7 * best_score + 0.3 * whisper_conf, 4)

        results.append({
            "reference_word":    ref_word,
            "transcribed_word":  best_match or "[missing]",
            "cosine_similarity": round(best_score, 4),
            "whisper_confidence": round(whisper_conf, 4),
            "combined_score":    combined_score,
            "label":             score_label(best_score) if best_match else "missing",
            "timestamp_start":   timing.get("start"),
            "timestamp_end":     timing.get("end"),
        })

    return results


def generate_pronunciation_summary(word_scores: List[Dict]) -> Dict:
    """Aggregate word scores into overall pronunciation metrics."""
    if not word_scores:
        return {}

    total = len(word_scores)
    correct     = sum(1 for w in word_scores if w["label"] == "correct")
    acceptable  = sum(1 for w in word_scores if w["label"] == "acceptable")
    mispronounced = sum(1 for w in word_scores if w["label"] == "mispronounced")
    incorrect   = sum(1 for w in word_scores if w["label"] == "incorrect")
    missing     = sum(1 for w in word_scores if w["label"] == "missing")

    avg_score = np.mean([w["combined_score"] for w in word_scores])

    # Words that need most attention
    problem_words = sorted(
        [w for w in word_scores if w["label"] in ("mispronounced", "incorrect", "missing")],
        key=lambda x: x["combined_score"]
    )[:10]

    return {
        "overall_pronunciation_score": round(float(avg_score) * 100, 1),
        "total_words":     total,
        "correct":         correct,
        "acceptable":      acceptable,
        "mispronounced":   mispronounced,
        "incorrect":       incorrect,
        "missing":         missing,
        "accuracy_percent": round((correct + acceptable) / total * 100, 1),
        "problem_words":   problem_words,
    }

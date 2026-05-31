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


import re
import difflib

def normalize_word(word: str) -> str:
    word = word.lower().strip()
    word = re.sub(r"[^\w']", "", word)
    return word


def align_transcribed_to_whisper(transcribed_words: List[str], whisper_word_data: List[Dict]) -> Dict[int, Dict]:
    """
    Align transcribed_words (from cleaned hypothesis string) with whisper_word_data (raw whisper outputs).
    Returns a mapping from transcribed_word index to the corresponding whisper_word_data dict.
    """
    whisper_words_cleaned = [normalize_word(wd.get("word", "")) for wd in whisper_word_data]
    trans_words_cleaned = [normalize_word(w) for w in transcribed_words]
    
    matcher = difflib.SequenceMatcher(None, trans_words_cleaned, whisper_words_cleaned)
    mapping = {}
    
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                mapping[i1 + k] = whisper_word_data[j1 + k]
        elif tag == "replace":
            min_len = min(i2 - i1, j2 - j1)
            for k in range(min_len):
                mapping[i1 + k] = whisper_word_data[j1 + k]
                
    # Fallback for unmapped indices
    for i in range(len(transcribed_words)):
        if i not in mapping:
            for offset in [1, -1, 2, -2]:
                adj = i + offset
                if 0 <= adj < len(transcribed_words) and adj in mapping:
                    mapping[i] = mapping[adj]
                    break
            if i not in mapping:
                w_norm = trans_words_cleaned[i]
                for wd in whisper_word_data:
                    if normalize_word(wd.get("word", "")) == w_norm:
                        mapping[i] = wd
                        break
                        
    return mapping


def compute_word_scores(
    reference_words: List[str],
    transcribed_words: List[str],
    whisper_word_data: List[Dict],   # [{word, start, end, probability}]
    alignments: List = None,
) -> List[Dict]:
    """
    For each reference word, find the closest transcribed word and
    compute cosine similarity between their embeddings using alignment info.

    Returns list of per-word results.
    """
    embedder = get_embedder()

    # Build alignment mapping from transcribed index to whisper metadata
    trans_to_whisper = align_transcribed_to_whisper(transcribed_words, whisper_word_data)

    # Encode all words in one batch (fast)
    all_words = list(set([w.lower() for w in reference_words] + [w.lower() for w in transcribed_words]))
    if all_words:
        embeddings = embedder.encode(all_words, convert_to_numpy=True)
        word_to_vec = {w: embeddings[i] for i, w in enumerate(all_words)}
    else:
        word_to_vec = {}

    # Initialize results list of the same length as reference_words
    results = [None] * len(reference_words)

    # If alignments are not provided, compute them
    if alignments is None:
        from jiwer import process_words
        ref_str = " ".join(reference_words)
        hyp_str = " ".join(transcribed_words)
        if ref_str.strip() and hyp_str.strip():
            alignments = process_words(ref_str, hyp_str).alignments

    if alignments and len(alignments) > 0:
        for chunk in alignments[0]:
            chunk_type = chunk.type
            ref_start = chunk.ref_start_idx
            ref_end = chunk.ref_end_idx
            hyp_start = chunk.hyp_start_idx
            hyp_end = chunk.hyp_end_idx

            if chunk_type == "equal":
                for k in range(ref_end - ref_start):
                    ref_idx = ref_start + k
                    hyp_idx = hyp_start + k
                    if ref_idx < len(reference_words) and hyp_idx < len(transcribed_words):
                        ref_word = reference_words[ref_idx]
                        trans_word = transcribed_words[hyp_idx]
                        
                        timing = trans_to_whisper.get(hyp_idx, {})
                        whisper_conf = timing.get("probability", timing.get("whisper_confidence", 1.0))
                        
                        results[ref_idx] = {
                            "reference_word":    ref_word,
                            "transcribed_word":  trans_word,
                            "cosine_similarity": 1.0,
                            "whisper_confidence": round(whisper_conf, 4),
                            "combined_score":    round(0.7 * 1.0 + 0.3 * whisper_conf, 4),
                            "label":             "correct",
                            "timestamp_start":   timing.get("start"),
                            "timestamp_end":     timing.get("end"),
                        }

            elif chunk_type == "delete":
                for ref_idx in range(ref_start, ref_end):
                    if ref_idx < len(reference_words):
                        ref_word = reference_words[ref_idx]
                        results[ref_idx] = {
                            "reference_word":    ref_word,
                            "transcribed_word":  "[missing]",
                            "cosine_similarity": 0.0,
                            "whisper_confidence": 0.0,
                            "combined_score":    0.0,
                            "label":             "missing",
                            "timestamp_start":   None,
                            "timestamp_end":     None,
                        }

            elif chunk_type == "substitute":
                ref_len = ref_end - ref_start
                hyp_len = hyp_end - hyp_start

                if ref_len == hyp_len:
                    for k in range(ref_len):
                        ref_idx = ref_start + k
                        hyp_idx = hyp_start + k
                        if ref_idx < len(reference_words) and hyp_idx < len(transcribed_words):
                            ref_word = reference_words[ref_idx]
                            trans_word = transcribed_words[hyp_idx]

                            ref_vec = word_to_vec.get(ref_word.lower())
                            trans_vec = word_to_vec.get(trans_word.lower())
                            if ref_vec is not None and trans_vec is not None:
                                sim = float(cosine_similarity(ref_vec.reshape(1, -1), trans_vec.reshape(1, -1))[0][0])
                            else:
                                sim = 0.0

                            timing = trans_to_whisper.get(hyp_idx, {})
                            whisper_conf = timing.get("probability", timing.get("whisper_confidence", 1.0))
                            combined_score = round(0.7 * sim + 0.3 * whisper_conf, 4)

                            results[ref_idx] = {
                                "reference_word":    ref_word,
                                "transcribed_word":  trans_word,
                                "cosine_similarity": round(sim, 4),
                                "whisper_confidence": round(whisper_conf, 4),
                                "combined_score":    combined_score,
                                "label":             score_label(sim),
                                "timestamp_start":   timing.get("start"),
                                "timestamp_end":     timing.get("end"),
                            }
                else:
                    for ref_idx in range(ref_start, ref_end):
                        if ref_idx < len(reference_words):
                            ref_word = reference_words[ref_idx]
                            ref_vec = word_to_vec.get(ref_word.lower())

                            best_score = -1.0
                            best_hyp_idx = None

                            for hyp_idx in range(hyp_start, hyp_end):
                                if hyp_idx < len(transcribed_words):
                                    trans_word = transcribed_words[hyp_idx]
                                    trans_vec = word_to_vec.get(trans_word.lower())
                                    if ref_vec is not None and trans_vec is not None:
                                        sim = float(cosine_similarity(ref_vec.reshape(1, -1), trans_vec.reshape(1, -1))[0][0])
                                        if sim > best_score:
                                            best_score = sim
                                            best_hyp_idx = hyp_idx

                            if best_hyp_idx is not None:
                                trans_word = transcribed_words[best_hyp_idx]
                                timing = trans_to_whisper.get(best_hyp_idx, {})
                                whisper_conf = timing.get("probability", timing.get("whisper_confidence", 1.0))
                                combined_score = round(0.7 * best_score + 0.3 * whisper_conf, 4)

                                results[ref_idx] = {
                                    "reference_word":    ref_word,
                                    "transcribed_word":  trans_word,
                                    "cosine_similarity": round(best_score, 4),
                                    "whisper_confidence": round(whisper_conf, 4),
                                    "combined_score":    combined_score,
                                    "label":             score_label(best_score),
                                    "timestamp_start":   timing.get("start"),
                                    "timestamp_end":     timing.get("end"),
                                }
                            else:
                                results[ref_idx] = {
                                    "reference_word":    ref_word,
                                    "transcribed_word":  "[missing]",
                                    "cosine_similarity": 0.0,
                                    "whisper_confidence": 0.0,
                                    "combined_score":    0.0,
                                    "label":             "missing",
                                    "timestamp_start":   None,
                                    "timestamp_end":     None,
                                }
    
    # Fallback for any unpopulated reference words
    for ref_idx in range(len(reference_words)):
        if results[ref_idx] is None:
            ref_word = reference_words[ref_idx]
            results[ref_idx] = {
                "reference_word":    ref_word,
                "transcribed_word":  "[missing]",
                "cosine_similarity": 0.0,
                "whisper_confidence": 0.0,
                "combined_score":    0.0,
                "label":             "missing",
                "timestamp_start":   None,
                "timestamp_end":     None,
            }

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

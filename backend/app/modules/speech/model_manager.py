"""
Whisper Model Manager — Download and cache models from Hugging Face Hub.

Handles automatic downloading and caching of Whisper models from Hugging Face.
Supports both standard models (via faster_whisper) and custom models (via huggingface_hub).

Usage:
    # Standard model (auto-downloads from faster_whisper defaults)
    model = get_whisper_model("small")

    # Custom model from Hugging Face (e.g., Hindi fine-tuned)
    model = get_whisper_model_from_hub(
        repo_id="sejal207/whisper-hindi-parwaaz",
        model_name="whisper-small-hindi-final"
    )
"""

import os
import logging
from pathlib import Path
from typing import Optional
from faster_whisper import WhisperModel
from huggingface_hub import hf_hub_download, snapshot_download

logger = logging.getLogger(__name__)

# Cache directory for models
HF_CACHE_DIR = os.environ.get("HF_HOME", os.path.expanduser("~/.cache/huggingface"))
MODEL_CACHE_DIR = Path(HF_CACHE_DIR) / "hub"
MODEL_CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Global model cache
_model_cache = {}


def get_whisper_model(model_name: str = "small", device: str = "cpu", compute_type: str = "int8") -> WhisperModel:
    """
    Load a standard Whisper model via faster_whisper.
    
    Models are automatically downloaded from the faster_whisper defaults (which pull from HF Hub).
    Downloads are cached in ~/.cache/huggingface/hub/
    
    Args:
        model_name: Model identifier (e.g., "tiny", "base", "small", "medium", "large")
        device: Device to load model on ("cpu", "cuda", "auto")
        compute_type: Quantization type ("int8", "int8_float32", "int8_float16", "float16", "float32")
    
    Returns:
        WhisperModel instance
    
    Examples:
        # Load small model (auto-downloads on first use)
        model = get_whisper_model("small")
        
        # Load with explicit device and compute type
        model = get_whisper_model("base", device="cpu", compute_type="int8")
    """
    cache_key = f"whisper_{model_name}_{device}_{compute_type}"
    
    if cache_key not in _model_cache:
        logger.info(f"Loading Whisper model '{model_name}' (device={device}, compute_type={compute_type})")
        try:
            model = WhisperModel(
                model_name,
                device=device,
                compute_type=compute_type,
            )
            _model_cache[cache_key] = model
            logger.info(f"✓ Model '{model_name}' loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model '{model_name}': {e}")
            raise
    
    return _model_cache[cache_key]


def get_whisper_model_from_hub(
    repo_id: str,
    model_name: Optional[str] = None,
    device: str = "cpu",
    compute_type: str = "int8",
) -> WhisperModel:
    """
    Load a custom Whisper model from Hugging Face Hub.
    
    Downloads the model from specified repo and uses faster_whisper to load it.
    Model is cached locally for future use.
    
    Args:
        repo_id: Hugging Face repo ID (e.g., "sejal207/whisper-hindi-parwaaz")
        model_name: Optional model identifier within the repo (defaults to repo_id)
        device: Device to load model on
        compute_type: Quantization type
    
    Returns:
        WhisperModel instance
    
    Examples:
        # Load custom Hindi Whisper model
        model = get_whisper_model_from_hub(
            repo_id="sejal207/whisper-hindi-parwaaz",
            model_name="whisper-small-hindi-final"
        )
    """
    cache_key = f"hf_{repo_id}_{model_name}_{device}_{compute_type}"
    
    if cache_key not in _model_cache:
        logger.info(f"Loading model from HF Hub: {repo_id}/{model_name or 'main'}")
        try:
            # Download entire model directory from HF Hub
            model_path = snapshot_download(
                repo_id=repo_id,
                local_dir=str(MODEL_CACHE_DIR / repo_id.replace("/", "_")),
                local_dir_use_symlinks=False,
            )
            logger.info(f"✓ Model downloaded to: {model_path}")
            
            # Load with faster_whisper
            model = WhisperModel(
                model_path,  # Pass local path to cached model
                device=device,
                compute_type=compute_type,
            )
            _model_cache[cache_key] = model
            logger.info(f"✓ Model from {repo_id} loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load model from {repo_id}: {e}")
            raise
    
    return _model_cache[cache_key]


def download_model_files(
    repo_id: str,
    filenames: Optional[list] = None,
) -> Path:
    """
    Download specific model files from Hugging Face Hub.
    
    Useful for downloading just the model binary without the entire repository.
    Files are cached in ~/.cache/huggingface/hub/
    
    Args:
        repo_id: Hugging Face repo ID
        filenames: List of specific files to download (e.g., ["config.json", "model.bin"])
                  If None, downloads entire repo
    
    Returns:
        Path to cached model directory
    
    Examples:
        # Download entire model
        model_path = download_model_files("sejal207/whisper-hindi-parwaaz")
        
        # Download specific files only
        model_path = download_model_files(
            "sejal207/whisper-hindi-parwaaz",
            filenames=["config.json", "model.bin", "vocabulary.json"]
        )
    """
    logger.info(f"Downloading model from {repo_id}")
    
    if filenames is None:
        # Download entire repo
        try:
            model_path = snapshot_download(
                repo_id=repo_id,
                local_dir=str(MODEL_CACHE_DIR / repo_id.replace("/", "_")),
                local_dir_use_symlinks=False,
            )
            logger.info(f"✓ Model downloaded to: {model_path}")
            return Path(model_path)
        except Exception as e:
            logger.error(f"Failed to download model: {e}")
            raise
    else:
        # Download specific files
        try:
            model_dir = MODEL_CACHE_DIR / repo_id.replace("/", "_")
            model_dir.mkdir(parents=True, exist_ok=True)
            
            for filename in filenames:
                logger.info(f"  Downloading: {filename}")
                hf_hub_download(
                    repo_id=repo_id,
                    filename=filename,
                    cache_dir=str(MODEL_CACHE_DIR),
                    local_dir=str(model_dir),
                    local_dir_use_symlinks=False,
                )
            
            logger.info(f"✓ Files downloaded to: {model_dir}")
            return model_dir
            
        except Exception as e:
            logger.error(f"Failed to download model files: {e}")
            raise


def clear_model_cache():
    """Clear in-memory model cache."""
    global _model_cache
    _model_cache.clear()
    logger.info("Model cache cleared")


if __name__ == "__main__":
    # Test script
    logging.basicConfig(level=logging.INFO)
    
    print("Testing model manager...")
    
    # Test 1: Load standard model
    print("\n1. Loading standard 'small' model...")
    try:
        model1 = get_whisper_model("small")
        print(f"✓ Loaded: {type(model1)}")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test 2: Test from HF Hub (requires repo to exist)
    print("\n2. Testing HF Hub download structure...")
    print(f"Cache directory: {MODEL_CACHE_DIR}")
    print(f"Available cache: {list(MODEL_CACHE_DIR.iterdir())[:5]}")

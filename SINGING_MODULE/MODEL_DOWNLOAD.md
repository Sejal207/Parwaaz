# Singing Module - Model Download Guide

This module uses the **openai-whisper base model** which is automatically downloaded from Hugging Face Hub.

## Model Details

- **Model**: `openai-whisper-base`
- **Size**: ~140 MB
- **Library**: `openai-whisper`
- **Download**: Automatic (first run)
- **Cache**: `~/.cache/huggingface/hub/`

## Code Reference

The module loads the model automatically on first use:

```python
# analyzer.py
import whisper

whisper_model = whisper.load_model("base")  # Auto-downloads if not cached
```

## Deployment

Models are downloaded automatically at runtime. No manual steps needed.

For faster deployment, the model can be pre-cached during Docker build or startup (see main `DEPLOYMENT_MODEL_DOWNLOAD.md`).

## No Large Files Stored Locally

Unlike previous versions, this module no longer stores 900MB model files in the repository. The `openai-whisper` library handles all downloading and caching automatically.

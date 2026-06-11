# Model Download & Deployment Guide

## Overview

This project uses **automatic model downloading** from Hugging Face Hub. Large model files (920+ MB each) are **NOT stored in the repository**. Instead, they are downloaded automatically at runtime on first use.

## How It Works

### Speech Analysis Module
- **Library**: `faster_whisper`
- **Model**: `small` (configurable in `backend/app/core/config.py`)
- **Automatic Download**: Yes ✅
- **Cache Location**: `~/.cache/huggingface/hub/` (user's home directory)
- **First Run**: ~500MB download (one-time)

```python
# backend/app/core/config.py
WHISPER_MODEL: str = "small"  # automatically downloaded from HF Hub

# backend/app/modules/speech/analyzer.py
_model = WhisperModel(
    settings.WHISPER_MODEL,  # Downloads automatically if not cached
    device="cpu",
    compute_type="int8",
)
```

### Singing Analysis Module
- **Library**: `openai-whisper`
- **Model**: `base` (hardcoded)
- **Automatic Download**: Yes ✅
- **Cache Location**: `~/.cache/huggingface/hub/`

```python
# Multiple singing analyzers use:
whisper_model = whisper.load_model("base")  # Downloads automatically
```

## Deployment Instructions

### For Render, Railway, Vercel, or any Cloud Platform

#### Step 1: Add Model Download Startup Script
Create `backend/startup.sh`:

```bash
#!/bin/bash
set -e

echo "🤖 Downloading Whisper models on startup..."

# Ensure cache directory exists
export HF_HOME="$PWD/.cache/huggingface"
mkdir -p "$HF_HOME"

# Pre-download models to speed up first request
python -c "
from faster_whisper import WhisperModel
import whisper

print('Downloading faster_whisper small model...')
WhisperModel('small', device='cpu', compute_type='int8')

print('Downloading openai-whisper base model...')
whisper.load_model('base')

print('✅ Models ready!')
"

echo "Starting application..."
exec "$@"
```

#### Step 2: Update Procfile (for Render/Railway)
```
web: bash backend/startup.sh && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### Step 3: Environment Variables (if needed)
```bash
# .env or platform settings
HF_HOME=.cache/huggingface
HF_HUB_CACHE=.cache/huggingface/hub
```

### For Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend/ .

# Create cache directory
RUN mkdir -p .cache/huggingface

# Pre-download models at build time (optional, but recommended)
RUN python -c "
from faster_whisper import WhisperModel
import whisper
print('Downloading models...')
WhisperModel('small', device='cpu', compute_type='int8')
whisper.load_model('base')
print('Done!')
"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### For Local Development

Models download automatically on first use. No additional setup needed.

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

## Model Details

### Currently Used Models

| Module | Model | Size | Download Time | Cache Size |
|--------|-------|------|---|---|
| Speech | `faster_whisper-small` | ~500 MB | 2-3 min (fast internet) | ~500 MB |
| Singing | `openai-whisper-base` | ~140 MB | 30-60 sec | ~140 MB |
| Facial | `final_model.pth` | 110 MB | Already in repo | ~110 MB |

**Total First Download**: ~650 MB (combined)

### Download Sources

- **faster_whisper-small**: Hugging Face Hub
- **openai-whisper-base**: Hugging Face Hub
- **final_model.pth**: Already committed to git (facial emotion model, <100 MB)

## Troubleshooting

### Models Not Downloading?

**Problem**: `FileNotFoundError` or connection errors

**Solutions**:
1. Check internet connection
2. Verify HuggingFace Hub is accessible
3. Clear cache: `rm -rf ~/.cache/huggingface/`
4. Re-run application

### Out of Disk Space?

**Problem**: Deployment fails due to insufficient space

**Solutions**:
1. Ensure 1 GB free space on deployment platform
2. For Docker: Mount a persistent volume: `docker run -v models:/app/.cache/huggingface ...`
3. Use Railway's persistent disks or Render's disk mount

### Slow First Request?

**Normal**: First request takes 30-60 seconds while models load from cache

**Optimization**: Use startup script to pre-download models before accepting requests (see above)

## Removed Files

The following large model files were removed from git tracking:
- ~~`backend/app/modules/speech/whisper_hindi/model.bin`~~ (922 MB) - No longer needed
- ~~`backend/whisper_final/kaggle/working/whisper-small-hindi-final/model.safetensors`~~ (922 MB) - No longer needed

These were backups/artifacts. The current code doesn't use them. Standard HF models are used instead.

## Required Dependencies

Ensure `backend/requirements.txt` has:
```
faster-whisper>=1.0.3
openai-whisper>=20231117  # For singing module
transformers>=4.25.0      # For Whisper
huggingface-hub>=0.17.0   # For model downloading
```

All are already in your `requirements.txt` ✅

## Verifying Deployment

After deployment, test models are working:

```bash
curl http://your-deployment-url/api/speech/analyze \
  -F "audio=@test.mp3" \
  -F "reference_text=hello world"
```

First call will download models (expect 30-60 sec delay). Subsequent calls will be fast.

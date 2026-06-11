# Whisper Model Migration Guide — Complete Implementation

## A. File-by-File Modifications

### **FILE 1: `backend/app/modules/speech/model_manager.py` (NEW)**
✅ **Created** — Model downloading and caching helper module
- See full code in `model_manager.py`
- Handles automatic downloads from Hugging Face Hub
- Provides two functions: `get_whisper_model()` and `get_whisper_model_from_hub()`

---

### **FILE 2: `backend/app/modules/speech/analyzer.py` (MODIFIED)**

#### **Current Code (Lines 1-20):**
```python
from faster_whisper import WhisperModel
from jiwer import process_words
from app.core.config import settings
from app.modules.speech.pronunciation import compute_word_scores, generate_pronunciation_summary
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
```

#### **Option A: MINIMAL CHANGE (Recommended)**
**Keep current code as-is** — It already works perfectly and auto-downloads from Hugging Face!

✅ **Why**: `faster_whisper` library automatically:
- Downloads models from Hugging Face Hub
- Caches them in `~/.cache/huggingface/hub/`
- No code changes needed

---

#### **Option B: ENHANCED (Use custom HF repo for Hindi model)**
**New Code (Replace lines 1-20):**
```python
from faster_whisper import WhisperModel
from jiwer import process_words
from app.core.config import settings
from app.modules.speech.pronunciation import compute_word_scores, generate_pronunciation_summary
from app.modules.speech.model_manager import get_whisper_model, get_whisper_model_from_hub
import re

_model = None

def get_model() -> WhisperModel:
    """
    Load Whisper model. Uses custom Hindi model if HF_REPO_ID is set,
    otherwise falls back to standard model.
    """
    global _model
    if _model is None:
        hf_repo = settings.WHISPER_HF_REPO  # e.g., "sejal207/whisper-hindi-parwaaz"
        
        if hf_repo:
            # Load from custom Hugging Face repo (e.g., Hindi model)
            _model = get_whisper_model_from_hub(
                repo_id=hf_repo,
                device="cpu",
                compute_type="int8",
            )
        else:
            # Load standard model (auto-downloads from HF)
            _model = get_whisper_model(
                model_name=settings.WHISPER_MODEL,  # "small" by default
                device="cpu",
                compute_type="int8",
            )
    return _model
```

---

### **FILE 3: `backend/app/core/config.py` (MODIFIED for Option B)**

#### **Current Code (Lines 1-20):**
```python
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    UPLOAD_DIR: str = "uploads"
    REFERENCE_DIR: str = "references"
    MAX_FILE_SIZE_MB: int = 100
    WHISPER_MODEL: str = "small"

    class Config:
        env_file = ".env"

settings = Settings()

# Ensure directories exist at startup
Path(settings.UPLOAD_DIR).mkdir(exist_ok=True)
Path(settings.REFERENCE_DIR).mkdir(exist_ok=True)
```

#### **Updated Code (Add this field):**
```python
from pydantic_settings import BaseSettings
from pathlib import Path
import os

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    UPLOAD_DIR: str = "uploads"
    REFERENCE_DIR: str = "references"
    MAX_FILE_SIZE_MB: int = 100
    WHISPER_MODEL: str = "small"
    
    # NEW: Optional Hugging Face repo for custom models
    # Example: "sejal207/whisper-hindi-parwaaz"
    WHISPER_HF_REPO: str = os.environ.get("WHISPER_HF_REPO", "")

    class Config:
        env_file = ".env"

settings = Settings()

# Ensure directories exist at startup
Path(settings.UPLOAD_DIR).mkdir(exist_ok=True)
Path(settings.REFERENCE_DIR).mkdir(exist_ok=True)
```

---

### **FILE 4: `backend/requirements.txt` (MODIFIED)**

#### **Current:**
```
faster-whisper>=1.0.3
openai-whisper>=20231117
huggingface-hub>=0.17.0
```

#### **Updated (Add huggingface-hub if missing):**
```
faster-whisper>=1.0.3
openai-whisper>=20231117
huggingface-hub>=0.17.0
```

✅ **Status**: Already has all required packages from previous migration!

---

### **FILE 5: `.gitignore` (MODIFIED)**

#### **Current:**
```
venv/
__pycache__/
*.pyc
.DS_Store
# ML Models
*.bin
*.safetensors
*.pt
*.pth

backend/app/modules/speech/whisper_hindi/
backend/whisper_final/kaggle/working/whisper-small-hindi-final/
```

#### **Verify/Keep as-is (already correct):**
```
venv/
__pycache__/
*.pyc
.DS_Store
# ML Models
*.bin
*.safetensors
*.pt
*.pth

# Local Whisper model directories (auto-downloaded, not tracked)
backend/app/modules/speech/whisper_hindi/
backend/whisper_final/kaggle/working/whisper-small-hindi-final/
```

✅ **Status**: Already ignoring large files!

---

## B. Exact Code Patches

### **Patch 1: Update analyzer.py (Option B)**
```diff
--- a/backend/app/modules/speech/analyzer.py
+++ b/backend/app/modules/speech/analyzer.py
@@ -1,6 +1,7 @@
 from faster_whisper import WhisperModel
 from jiwer import process_words
 from app.core.config import settings
+from app.modules.speech.model_manager import get_whisper_model, get_whisper_model_from_hub
 from app.modules.speech.pronunciation import compute_word_scores, generate_pronunciation_summary
 import re
 
@@ -8,14 +9,22 @@
 
 def get_model() -> WhisperModel:
+    """
+    Load Whisper model. Uses custom Hindi model if HF_REPO_ID is set,
+    otherwise falls back to standard model.
+    """
     global _model
     if _model is None:
-        _model = WhisperModel(
-            settings.WHISPER_MODEL,
-            device="cpu",
-            compute_type="int8",
-        )
+        hf_repo = settings.WHISPER_HF_REPO
+        
+        if hf_repo:
+            _model = get_whisper_model_from_hub(
+                repo_id=hf_repo,
+                device="cpu",
+                compute_type="int8",
+            )
+        else:
+            _model = get_whisper_model(settings.WHISPER_MODEL, "cpu", "int8")
     return _model
```

### **Patch 2: Update config.py**
```diff
--- a/backend/app/core/config.py
+++ b/backend/app/core/config.py
@@ -1,5 +1,6 @@
 from pydantic_settings import BaseSettings
 from pathlib import Path
+import os
 
 
 class Settings(BaseSettings):
@@ -8,6 +9,7 @@
     UPLOAD_DIR: str = "uploads"
     REFERENCE_DIR: str = "references"
     MAX_FILE_SIZE_MB: int = 100
     WHISPER_MODEL: str = "small"
+    WHISPER_HF_REPO: str = os.environ.get("WHISPER_HF_REPO", "")
 
     class Config:
         env_file = ".env"
```

---

## C. Hugging Face Upload Instructions

### **Step 1: Create HF Repository** (if not exists)
```bash
# Create on huggingface.co/new or use CLI
huggingface-cli repo create whisper-hindi-parwaaz --type model --private
```

### **Step 2: Upload Model Files**

#### **Option A: Upload entire directory** (RECOMMENDED)
```bash
# Clone or create a temporary repo directory
mkdir -p /tmp/whisper-hindi-parwaaz
cd /tmp/whisper-hindi-parwaaz

# Copy model files
cp backend/app/modules/speech/whisper_hindi/config.json .
cp backend/app/modules/speech/whisper_hindi/model.bin .
cp backend/app/modules/speech/whisper_hindi/vocabulary.json .

# Initialize git-lfs (for large files)
git lfs install
git lfs track "*.bin"
git lfs track "*.safetensors"

# Create .gitattributes
git add .gitattributes

# Commit and push
git config user.email "your-email@example.com"
git config user.name "Your Name"
git add .
git commit -m "Add Whisper Hindi model"
git push -u origin main
```

#### **Option B: Upload using Python** (Programmatic)
```python
from huggingface_hub import upload_folder

upload_folder(
    repo_id="sejal207/whisper-hindi-parwaaz",
    folder_path="backend/app/modules/speech/whisper_hindi",
    commit_message="Upload Whisper Hindi model",
)
```

#### **Option C: Upload specific files via CLI**
```bash
# Individual file upload
huggingface-cli upload sejal207/whisper-hindi-parwaaz \
  backend/app/modules/speech/whisper_hindi/config.json ./config.json

huggingface-cli upload sejal207/whisper-hindi-parwaaz \
  backend/app/modules/speech/whisper_hindi/model.bin ./model.bin

huggingface-cli upload sejal207/whisper-hindi-parwaaz \
  backend/app/modules/speech/whisper_hindi/vocabulary.json ./vocabulary.json
```

### **Step 3: Configure for Deployment**

Add to `.env` or deployment environment:
```bash
WHISPER_HF_REPO=sejal207/whisper-hindi-parwaaz
```

Or in `settings.py` environment:
```
export WHISPER_HF_REPO=sejal207/whisper-hindi-parwaaz
```

---

## D. Git Cleanup Commands

### **Step 1: Remove large files from git history**
```bash
# Remove from tracking (already done in previous migration)
git rm --cached backend/app/modules/speech/whisper_hindi/model.bin
git rm --cached backend/whisper_final/kaggle/working/whisper-small-hindi-final/model.safetensors

# Commit the removal
git add -A
git commit -m "Remove large model files from tracking - now downloaded from HF Hub"
```

### **Step 2: Optional - Clean git history** (if files were previously committed)
```bash
# Clean git history to reclaim space (destructive - backup first!)
git reflog expire --expire=now --all
git gc --prune=now
```

### **Step 3: Verify large files are gone**
```bash
# Should show no results
git ls-files | grep -E "\.bin|\.safetensors"
```

### **Step 4: Delete local directories** (optional)
```bash
# These are ignored by git, safe to delete locally
rm -rf backend/app/modules/speech/whisper_hindi/model.bin
rm -rf backend/whisper_final/kaggle/working/whisper-small-hindi-final/
```

---

## E. Deployment Instructions

### **For Render.com**

1. **Add environment variable in Dashboard:**
   ```
   WHISPER_HF_REPO=sejal207/whisper-hindi-parwaaz
   HF_HOME=.cache/huggingface
   ```

2. **Update Procfile** (if using startup script):
   ```
   web: python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

3. **First deployment:**
   - Models download on first request (~30-60 seconds)
   - Cached in `.cache/huggingface/`
   - Subsequent requests: fast

4. **Persistent storage** (optional, for faster redeploys):
   - Mount persistent disk in Render
   - Set `HF_HOME=/var/data/.cache/huggingface`
   - Models persist between deploys

### **For Railway.app**

1. **Environment Variables:**
   ```
   WHISPER_HF_REPO=sejal207/whisper-hindi-parwaaz
   HF_HOME=/app/.cache/huggingface
   ```

2. **Start command:**
   ```
   python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

3. **Build output:**
   - Packages installed
   - Models download on first request
   - Cached in `.cache/` directory

### **For Docker**

**Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Create cache directory
RUN mkdir -p .cache/huggingface

# Optional: Pre-cache models at build time (faster startup)
# Requires HF_REPO to be passed as build arg
# ARG HF_REPO=sejal207/whisper-hindi-parwaaz
# RUN python -c "
# from app.modules.speech.model_manager import get_whisper_model_from_hub
# get_whisper_model_from_hub('$HF_REPO') if '$HF_REPO' else None
# "

EXPOSE 8000

ENV HF_HOME=/app/.cache/huggingface

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### **For Local Development**

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Optional: Set custom model
export WHISPER_HF_REPO=sejal207/whisper-hindi-parwaaz

# Run application
cd backend
python -m uvicorn app.main:app --reload

# Models download automatically on first request
# Cached in ~/.cache/huggingface/
```

---

## F. Model Upload Checklist

### **Files to Upload to Hugging Face**

✅ **Must Include:**
- `config.json` (2.3 KB) - Model configuration
- `model.bin` (922 MB) - Model weights
- `vocabulary.json` (1.0 MB) - Vocabulary

❌ **Do NOT Upload:**
- `.gitignore` files
- `__pycache__/`
- `.DS_Store`

### **Upload Command Summary**

```bash
# Quick upload using Python
from huggingface_hub import upload_folder
upload_folder(
    repo_id="sejal207/whisper-hindi-parwaaz",
    folder_path="backend/app/modules/speech/whisper_hindi",
)

# Or using git-lfs (for large files)
cd backend/app/modules/speech/whisper_hindi
git lfs install
git lfs track "*.bin"
git add . && git commit -m "Add model" && git push
```

---

## G. What About `model.safetensors`?

The `model.safetensors` file (922 MB) in `backend/whisper_final/` appears to be:
- An alternative format of the same model
- Not currently used by any Python code
- Can be safely deleted

### **Decision:**
- **Upload**: Only `model.bin` format to Hugging Face
- **Delete**: `backend/whisper_final/` directory (not used)
- **Reason**: Reduces upload size by 50%; safetensors format not needed by faster_whisper

```bash
# Safe to delete (after model uploaded to HF)
rm -rf backend/whisper_final/
```

---

## H. Summary Table

| Item | Status | Action |
|------|--------|--------|
| **Create helper module** | ✅ Done | File: `model_manager.py` |
| **Update analyzer.py** | ⏳ Optional | Use Option A (no change) or Option B (enhanced) |
| **Update config.py** | ⏳ Optional | Add `WHISPER_HF_REPO` field |
| **Update requirements.txt** | ✅ Done | Already has `huggingface-hub` |
| **Upload to HF** | ⏳ Pending | 3 files: config.json, model.bin, vocabulary.json |
| **Remove from git** | ✅ Done | Large files already ignored |
| **Deploy** | ⏳ Ready | Set env var `WHISPER_HF_REPO` |
| **Delete safetensors** | ⏳ Safe | Not used; can be removed |

---

## I. Implementation Timeline

**Phase 1 (Now)**: Files already prepared
- ✅ `model_manager.py` created
- ✅ Git already ignores large files
- ✅ Requirements already include huggingface-hub

**Phase 2 (Optional enhancement)**: Update analyzer if using custom HF repo
- Update `analyzer.py` (Option B)
- Update `config.py`
- Add `WHISPER_HF_REPO` to `.env`

**Phase 3 (Upload)**: Move models to Hugging Face
- Run upload command
- Verify models accessible
- Delete from local repo

**Phase 4 (Deploy)**: Set environment variable
- Add `WHISPER_HF_REPO` to production
- Deploy updated code
- Models auto-download on first request

---

## J. Quick Start Command

```bash
# 1. Create model_manager.py (already done)
# 2. Upload models (if using custom HF repo)
python -c "from huggingface_hub import upload_folder; upload_folder(repo_id='sejal207/whisper-hindi-parwaaz', folder_path='backend/app/modules/speech/whisper_hindi')"

# 3. Set environment variable
export WHISPER_HF_REPO=sejal207/whisper-hindi-parwaaz

# 4. Deploy
git push origin main  # Models now download automatically!
```

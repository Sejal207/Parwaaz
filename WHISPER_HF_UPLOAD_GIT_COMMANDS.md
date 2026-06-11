# Exact HF Upload & Git Cleanup Commands

## SECTION A: Hugging Face Upload Commands

### ⚠️ Pre-requisites
```bash
# 1. Install Hugging Face CLI
pip install huggingface-hub

# 2. Authenticate with Hugging Face
huggingface-cli login
# Or set token: export HF_TOKEN=hf_xxxxx

# 3. Create repository on HF (if not exists)
huggingface-cli repo create whisper-hindi-parwaaz --type model
```

---

### **OPTION A: Upload via Python (RECOMMENDED)**

**Command:**
```bash
cd /Users/sejalgupta/Desktop/clg_prjs/sem6/DL/performing-arts-coach

python3 << 'EOF'
from huggingface_hub import upload_folder
import os

print("📤 Uploading Whisper Hindi model to Hugging Face...")

try:
    info = upload_folder(
        repo_id="sejal207/whisper-hindi-parwaaz",
        folder_path="backend/app/modules/speech/whisper_hindi",
        commit_message="Upload Whisper Hindi model - config, model.bin, vocabulary",
        ignore_patterns=["*.pyc", "__pycache__", ".DS_Store"],
    )
    print(f"✅ Upload successful!")
    print(f"   Repo URL: {info.repo_url}")
    print(f"   Commit: {info.commit_url}")
except Exception as e:
    print(f"❌ Upload failed: {e}")
    exit(1)
EOF
```

---

### **OPTION B: Upload via Git LFS (Recommended for large files)**

**Commands:**
```bash
# 1. Create temporary directory
mkdir -p /tmp/whisper-hindi-upload
cd /tmp/whisper-hindi-upload

# 2. Clone HF repo
git clone https://huggingface.co/sejal207/whisper-hindi-parwaaz
cd whisper-hindi-parwaaz

# 3. Install and configure Git LFS
git lfs install
git lfs track "*.bin"
git lfs track "*.safetensors"
git add .gitattributes

# 4. Copy model files
cp /Users/sejalgupta/Desktop/clg_prjs/sem6/DL/performing-arts-coach/backend/app/modules/speech/whisper_hindi/config.json .
cp /Users/sejalgupta/Desktop/clg_prjs/sem6/DL/performing-arts-coach/backend/app/modules/speech/whisper_hindi/model.bin .
cp /Users/sejalgupta/Desktop/clg_prjs/sem6/DL/performing-arts-coach/backend/app/modules/speech/whisper_hindi/vocabulary.json .

# 5. Commit and push
git config user.email "your-email@example.com"
git config user.name "Your Name"
git add .
git commit -m "Add Whisper Hindi model - trained whisper-small"
git push -u origin main

# 6. Verify upload
echo "✅ Upload complete! Check: https://huggingface.co/sejal207/whisper-hindi-parwaaz"
```

---

### **OPTION C: Upload Individual Files via CLI**

**Commands:**
```bash
REPO_ID="sejal207/whisper-hindi-parwaaz"
MODEL_DIR="/Users/sejalgupta/Desktop/clg_prjs/sem6/DL/performing-arts-coach/backend/app/modules/speech/whisper_hindi"

# Upload config.json
echo "📤 Uploading config.json..."
huggingface-cli upload "$REPO_ID" "$MODEL_DIR/config.json" ./config.json

# Upload model.bin
echo "📤 Uploading model.bin (this may take 5-10 minutes)..."
huggingface-cli upload "$REPO_ID" "$MODEL_DIR/model.bin" ./model.bin

# Upload vocabulary.json
echo "📤 Uploading vocabulary.json..."
huggingface-cli upload "$REPO_ID" "$MODEL_DIR/vocabulary.json" ./vocabulary.json

echo "✅ All files uploaded!"
```

---

### **OPTION D: Quick One-Liner**

```bash
python3 -c "from huggingface_hub import upload_folder; upload_folder(repo_id='sejal207/whisper-hindi-parwaaz', folder_path='backend/app/modules/speech/whisper_hindi')"
```

---

### **Verification: Confirm Upload**

```bash
# List files in HF repo
huggingface-cli list-files sejal207/whisper-hindi-parwaaz

# Expected output:
# config.json
# model.bin
# vocabulary.json

# Or check in browser:
# https://huggingface.co/sejal207/whisper-hindi-parwaaz/tree/main
```

---

## SECTION B: Git Cleanup Commands

### **Step 1: Remove Large Files from Git Tracking**

```bash
cd /Users/sejalgupta/Desktop/clg_prjs/sem6/DL/performing-arts-coach

# Remove model.bin from tracking
git rm --cached backend/app/modules/speech/whisper_hindi/model.bin

# Remove safetensors file from tracking (if tracked)
git rm --cached backend/whisper_final/kaggle/working/whisper-small-hindi-final/model.safetensors 2>/dev/null || true

# Stage the removal
git add .gitignore

# Commit
git commit -m "Remove large model files - now distributed via Hugging Face Hub

- Removed: backend/app/modules/speech/whisper_hindi/model.bin (922 MB)
- Removed: backend/whisper_final/kaggle/working/whisper-small-hindi-final/model.safetensors (922 MB)
- Models now downloaded from sejal207/whisper-hindi-parwaaz at runtime
- Config and vocabulary remain as reference (small files)"
```

---

### **Step 2: Verify Files Removed**

```bash
# Check git status
git status

# Should show: deleted: backend/app/modules/speech/whisper_hindi/model.bin

# Verify no large files in staging
git diff --cached --name-only | xargs -I {} sh -c 'echo "Checking: {}"; ls -lh {} 2>/dev/null || echo "  (will be deleted)"'
```

---

### **Step 3: (Optional) Rewrite Git History to Reclaim Space**

⚠️ **DESTRUCTIVE - Only if files were committed to master/main before**

```bash
# Backup current state
git bundle create backup.bundle main

# Expire old references
git reflog expire --expire=now --all

# Garbage collect to reclaim space
git gc --prune=now --aggressive

# Verify size reduction
du -sh .git

# If something goes wrong, restore:
# git bundle unbundle backup.bundle
# git checkout BACKUP_REF
```

---

### **Step 4: Delete Local Model Files** (Optional)

```bash
# These are now ignored by .gitignore, safe to delete

# Delete individual files
rm -f backend/app/modules/speech/whisper_hindi/model.bin

# Delete entire unused directory
rm -rf backend/whisper_final/

# Verify they're gone
ls backend/app/modules/speech/whisper_hindi/  # Should show only: config.json, vocabulary.json
```

---

### **Step 5: Push to GitHub**

```bash
# Now push the cleaned repo
git push origin main

# ✅ Should work without "file too large" errors!
```

---

## SECTION C: Combined Command Sequence

### **Complete Migration in One Script**

```bash
#!/bin/bash
set -e

cd /Users/sejalgupta/Desktop/clg_prjs/sem6/DL/performing-arts-coach

echo "🚀 Starting Whisper Model Migration..."

# 1. Upload to HF
echo -e "\n📤 Step 1: Uploading to Hugging Face Hub..."
python3 << 'EOF'
from huggingface_hub import upload_folder
upload_folder(
    repo_id="sejal207/whisper-hindi-parwaaz",
    folder_path="backend/app/modules/speech/whisper_hindi",
    commit_message="Upload Whisper Hindi model"
)
print("✅ Upload complete!")
EOF

# 2. Clean git
echo -e "\n🧹 Step 2: Cleaning git repository..."
git rm --cached backend/app/modules/speech/whisper_hindi/model.bin 2>/dev/null || true
git rm --cached backend/whisper_final/kaggle/working/whisper-small-hindi-final/model.safetensors 2>/dev/null || true
git add .gitignore
git commit -m "Remove large model files - now on HF Hub" 2>/dev/null || echo "   (nothing to commit)"

# 3. Delete local files
echo -e "\n🗑️  Step 3: Deleting local model files..."
rm -f backend/app/modules/speech/whisper_hindi/model.bin
rm -rf backend/whisper_final/

# 4. Push to GitHub
echo -e "\n⬆️  Step 4: Pushing to GitHub..."
git push origin main

echo -e "\n✅ Migration complete!"
echo "   Models: https://huggingface.co/sejal207/whisper-hindi-parwaaz"
echo "   Repo: $(git remote get-url origin)"
echo "   Commit: $(git rev-parse --short HEAD)"
```

**Run the script:**
```bash
bash migrate_whisper.sh
```

---

## SECTION D: Deployment Configuration

### **.env File**

Add to `backend/.env`:
```bash
# Existing variables...
DATABASE_URL=postgresql://...
SECRET_KEY=...

# NEW: Whisper model configuration
WHISPER_MODEL=small
WHISPER_HF_REPO=sejal207/whisper-hindi-parwaaz
HF_HOME=.cache/huggingface
```

### **Docker Build**

Add to deployment startup:
```dockerfile
# Pre-download models at build time (optional, reduces first request latency)
RUN python -c "from app.modules.speech.model_manager import get_whisper_model_from_hub; get_whisper_model_from_hub('sejal207/whisper-hindi-parwaaz')" || echo "Model download skipped (optional)"
```

### **Render.com**

Environment variables in Dashboard:
```
WHISPER_MODEL=small
WHISPER_HF_REPO=sejal207/whisper-hindi-parwaaz
HF_HOME=.cache/huggingface
```

### **Railway.app**

Environment variables:
```
WHISPER_MODEL=small
WHISPER_HF_REPO=sejal207/whisper-hindi-parwaaz
HF_HOME=/app/.cache/huggingface
```

---

## SECTION E: Verification Checklist

After completing all steps:

- [ ] Models uploaded to HF: `https://huggingface.co/sejal207/whisper-hindi-parwaaz`
- [ ] Git push successful (no file size errors)
- [ ] Local files deleted (only .gitignore entry remains)
- [ ] `.env` updated with `WHISPER_HF_REPO`
- [ ] `model_manager.py` created
- [ ] `analyzer.py` and `config.py` updated (if Option B chosen)
- [ ] Deployment configured with env variables
- [ ] First request downloads model (~30-60 sec)
- [ ] Subsequent requests are fast (cached)

---

## SECTION F: Rollback Plan

If something goes wrong:

```bash
# Restore deleted files from git history
git checkout HEAD~1 backend/app/modules/speech/whisper_hindi/model.bin

# Or restore from backup bundle
git bundle unbundle backup.bundle

# Undo latest commit
git reset --hard HEAD~1

# Push to revert
git push -f origin main
```

---

## SECTION G: File Size Summary

| File | Size | Status |
|------|------|--------|
| `config.json` | 2.3 KB | ✅ Keep in repo (small) |
| `model.bin` | 922 MB | 📤 Upload to HF, delete locally |
| `vocabulary.json` | 1.0 MB | ✅ Keep in repo (small) |
| `model.safetensors` | 922 MB | 🗑️  Delete (not used) |

**Space Reclaimed**: 1.9 GB

---

## SECTION H: Support URLs

- **Hugging Face Hub**: https://huggingface.co/
- **Your Model Repo**: https://huggingface.co/sejal207/whisper-hindi-parwaaz
- **HF Hub Docs**: https://huggingface.co/docs/hub
- **Faster Whisper**: https://github.com/guillaumekln/faster-whisper

#!/usr/bin/env python3
"""
Backup existing ML model before retraining

Creates timestamped backup of current model files
"""

import sys
import shutil
from pathlib import Path
from datetime import datetime
import io

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

MODELS_DIR = Path("models")
BACKUP_DIR = Path("models/backups")

MODEL_FILES = [
    "match_compatibility_model.pkl",
    "model_features.json",
    "model_metadata.json"
]

def backup_model():
    """Backup existing model files with timestamp"""
    print("=" * 80)
    print("BACKUP EXISTING MODEL")
    print("=" * 80)
    
    if not MODELS_DIR.exists():
        print(f"❌ Models directory not found: {MODELS_DIR}")
        print("   No existing model to backup")
        return False
    
    # Check if any model files exist
    existing_files = [f for f in MODEL_FILES if (MODELS_DIR / f).exists()]
    
    if not existing_files:
        print("ℹ️  No existing model files found")
        print("   Nothing to backup - safe to train new model")
        return True
    
    # Create backup directory
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    
    # Create timestamped backup folder
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = BACKUP_DIR / f"model_{timestamp}"
    backup_path.mkdir(exist_ok=True)
    
    print(f"\n📦 Backing up {len(existing_files)} model file(s)...")
    
    # Copy files
    for filename in existing_files:
        src = MODELS_DIR / filename
        dst = backup_path / filename
        
        try:
            shutil.copy2(src, dst)
            print(f"   ✅ {filename} → {backup_path.name}/")
        except Exception as e:
            print(f"   ❌ Failed to backup {filename}: {e}")
            return False
    
    print(f"\n✅ Model backed up to: {backup_path}")
    print(f"   You can restore it later if needed")
    
    return True

def main():
    success = backup_model()
    
    if success:
        print("\n" + "=" * 80)
        print("✅ Backup complete - safe to retrain model")
        print("=" * 80)
        print("\nNext step:")
        print("   python src/lib/ai/datasets/train_model.py")
    else:
        print("\n" + "=" * 80)
        print("❌ Backup failed - check errors above")
        print("=" * 80)
        sys.exit(1)

if __name__ == "__main__":
    main()

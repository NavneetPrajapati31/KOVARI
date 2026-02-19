import json
import sys
import subprocess
import time

# Test features
features = {
    "matchType": "user_user",
    "distanceScore": 1.0,
    "dateOverlapScore": 0.9,
    "budgetScore": 0.8,
    "interestScore": 0.5,
    "ageScore": 0.7,
    "personalityScore": 0.6,
    "languageScore": 0,
    "lifestyleScore": 0,
    "backgroundScore": 0
}

features_json = json.dumps(features)

print("Testing ML prediction server...")
print(f"Features: {features_json}\n")

# Test with persistent server
start = time.time()
result = subprocess.run(
    ["python", "src/lib/ai/datasets/ml-prediction-server.py", "models"],
    input=features_json,
    text=True,
    capture_output=True,
    timeout=20
)
elapsed = time.time() - start

print(f"Time: {elapsed:.2f}s")
print(f"Exit code: {result.returncode}")
print(f"Stdout: {result.stdout}")
if result.stderr:
    print(f"Stderr: {result.stderr}")

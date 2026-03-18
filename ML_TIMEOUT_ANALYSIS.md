# ML Prediction Timeout Analysis

## Problem Identified

### Root Cause
The ML prediction is timing out because:

1. **Model Loading Time**: 8.43 seconds per process
2. **Import Time**: 4.16 seconds per process  
3. **Total Startup**: ~12.6 seconds per Python process
4. **Parallel Predictions**: 6 matches = 6 parallel processes
5. **Timeout**: 15 seconds (not enough for all processes)

### Current Flow (Inefficient)
```
Request → Spawn Python Process 1 → Load Model (8.4s) → Predict → Exit
       → Spawn Python Process 2 → Load Model (8.4s) → Predict → Exit
       → Spawn Python Process 3 → Load Model (8.4s) → Predict → Exit
       ... (6 processes in parallel)
```

**Problem**: Each process reloads the model from disk, causing:
- High memory usage (6 copies of model in memory)
- Slow startup (8.4s × 6 = 50+ seconds total)
- Timeout failures (15s timeout < 8.4s load time)

## Solutions

### Solution 1: Persistent Python Service (Recommended) ✅
Create a persistent Python service that keeps the model in memory:

**Benefits:**
- Model loaded once (8.4s startup, then cached)
- Subsequent predictions: <0.1s
- Single model instance in memory
- No timeout issues

**Implementation:**
- Created `ml-prediction-server.py` with model caching
- Still uses stdin/stdout for communication
- Model loaded on first request, cached for subsequent requests

### Solution 2: Increase Timeout
- Increase timeout to 20-30 seconds
- Still inefficient (reloads model each time)
- Not recommended for production

### Solution 3: HTTP/WebSocket Service
- Create Flask/FastAPI service
- Keep model in memory
- More complex but more scalable

## Recommended Fix

Use the persistent Python service (`ml-prediction-server.py`):

1. **First Request**: Loads model (8.4s), then predicts (<0.1s)
2. **Subsequent Requests**: Uses cached model (<0.1s each)
3. **Total Time**: ~8.5s for first, then <1s for all others

### Performance Comparison

**Current (Spawn per request):**
- 6 predictions: 6 × 8.4s = 50.4s (timeout!)
- Memory: 6 × model size

**With Persistent Service:**
- First prediction: 8.4s (load model)
- Next 5 predictions: 5 × 0.1s = 0.5s
- Total: ~9s (well under timeout)
- Memory: 1 × model size

## Next Steps

1. Update `ml-scoring.ts` to use persistent service
2. Test with single prediction (should be fast after first)
3. Monitor memory usage
4. Consider process pooling for even better performance

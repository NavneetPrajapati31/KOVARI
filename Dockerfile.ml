# Dockerfile for Kovari ML Matching Service
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY packages/api/src/ai/datasets/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create models directory (even if empty) to prevent build failure
RUN mkdir -p models

# Copy model files if they exist (using wildcard to avoid error if missing)
# Note: You should train your model and place it in packages/api/src/ai/datasets/models/
COPY packages/api/src/ai/datasets/models* ./models/

# Copy the server script
COPY packages/api/src/ai/datasets/ml_server_fastapi.py .

# Expose the API port
EXPOSE 8001

# Run the FastAPI server
# We use python -m uvicorn to ensure it's in the path correctly
CMD ["python", "-m", "uvicorn", "ml_server_fastapi:app", "--host", "0.0.0.0", "--port", "8001"]

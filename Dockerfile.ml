# Dockerfile for Kovari ML Matching Service
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements-ml.txt .
RUN pip install --no-cache-dir -r requirements-ml.txt

# Copy model files
COPY models/ ./models/

# Copy the server script
COPY src/lib/ai/datasets/ml_server_fastapi.py .

# Expose the API port
EXPOSE 8001

# Run the FastAPI server
CMD ["uvicorn", "ml_server_fastapi:app", "--host", "0.0.0.0", "--port", "8001"]

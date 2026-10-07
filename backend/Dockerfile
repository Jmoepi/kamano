# Multi-stage production build for the Kamano backend.
# Target runtime: Python 3.11 slim (matches requirements.txt pins).
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# System deps for PyMuPDF / OpenCV (headless) + general build tools.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Prefer the pinned lockfile for reproducible builds; fall back to floors.
# For a fully linux-matched lock, regenerate requirements.lock.txt inside this
# image (see the header of that file).
COPY requirements.txt requirements.lock.txt ./
RUN pip install --upgrade pip \
    && if [ -f requirements.lock.txt ]; then \
         pip install -r requirements.lock.txt; \
       else \
         pip install -r requirements.txt; \
       fi

COPY . .

EXPOSE 8000

# Gunicorn with Uvicorn workers for production.
CMD ["gunicorn", "app.main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "-w", "4", "-b", "0.0.0.0:8000"]

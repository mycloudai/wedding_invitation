# ---- Build Stage ----
FROM python:3.15-rc AS base

WORKDIR /app

# Install dependencies
COPY server/requirements.txt ./server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt

# Copy application files
COPY server/ ./server/
COPY templates/ ./templates/
COPY static/ ./static/
COPY music/ ./music/
COPY photo/ ./photo/

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 5000

# Environment defaults
ENV DATA_DIR=/app/data \
    MUSIC_DIR=/app/data/music \
    PHOTO_DIR=/app/data/photo \
    SECRET_KEY=change-me-in-production \
    GROOM_NAME=新郎 \
    BRIDE_NAME=新娘 \
    WEDDING_DATE=2026年10月01日 \
    WEDDING_DATE_WEEKDAY=星期四 \
    BANQUET_TIME=18:00 \
    CEREMONY_TIME=16:00 \
    WEDDING_VENUE=某某酒店·草坪厅 \
    WEDDING_ADDRESS="" \
    BGM_FILENAME=bgm.ogg \
    COVER_PHOTO=cover.jpg \
    ADMIN_PASSWORD=admin123

# Run with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--chdir", "server", "app:app"]

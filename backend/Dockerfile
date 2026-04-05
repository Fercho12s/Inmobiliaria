FROM python:3.12-slim

# ── Dependencias del sistema ──────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    ca-certificates \
    # Fuentes para Pillow (Liberation ≈ Arial, DejaVu como fallback)
    fonts-liberation \
    fonts-dejavu-core \
    libfontconfig1 \
    # Chromium + dependencias para Remotion
    chromium \
    libglib2.0-0 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    && (apt-get install -y --no-install-recommends libasound2t64 || apt-get install -y --no-install-recommends libasound2) \
    && rm -rf /var/lib/apt/lists/*

# ── Node.js 20 ────────────────────────────────────────────────────────────────
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Wrapper so Chromium runs with --no-sandbox (required inside Docker)
RUN printf '#!/bin/sh\nexec /usr/bin/chromium --no-sandbox "$@"\n' \
    > /usr/local/bin/chromium-sandbox-wrapper \
    && chmod +x /usr/local/bin/chromium-sandbox-wrapper

ENV REMOTION_CHROME_EXECUTABLE=/usr/local/bin/chromium-sandbox-wrapper

WORKDIR /app

# ── Python venv (evita bug de overlayfs en Docker Desktop para Windows) ───────
# Instalar en /app/venv en lugar de /usr/local/lib para que los archivos
# se escriban correctamente en la capa del build.
ENV VIRTUAL_ENV=/app/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# ── Python deps ───────────────────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Node deps del proyecto de video (cacheado en capa propia) ─────────────────
COPY video/package.json video/package-lock.json* ./video/
RUN cd video && (npm ci --omit=dev 2>/dev/null || npm install --omit=dev) && npm cache clean --force

# ── Código fuente ─────────────────────────────────────────────────────────────
COPY . .

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

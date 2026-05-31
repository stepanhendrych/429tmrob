# Použijeme lehký Python
FROM python:3.14-slim

# Instalace curl pro healthcheck (pokud chceš)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Instalace uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app
COPY . .

# Instalace závislostí
RUN uv pip install --system -r pyproject.toml

# Spuštění
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
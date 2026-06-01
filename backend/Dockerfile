# Použijeme lehký Python
FROM python:3.13-slim

# Instalace curl pro healthcheck (pokud chceš)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Instalace uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app
COPY . .

# Instalace závislostí (uv sync vytvoří .venv a nainstaluje dle pyproject.toml)
RUN uv sync

# Spuštění přes uv (použije .venv)
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
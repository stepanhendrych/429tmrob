# Makefile - Ultimate Project Setup
.PHONY: setup check-deps clean push

# 1. Kontrola závislostí
check-deps:
    @echo "--- Kontroluji systémové závislosti ---"
    @command -v git >/dev/null 2>&1 || { echo "ERROR: Git chybí."; exit 1; }
    @if ! command -v docker >/dev/null 2>&1 && ! command -v podman >/dev/null 2>&1; then \
        echo "ERROR: Docker ani Podman nejsou nainstalované."; exit 1; \
    fi
    @command -v uv >/dev/null 2>&1 || { echo "ERROR: UV chybí."; exit 1; }
    @command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js chybí."; exit 1; }
    @echo "OK: Všechny nástroje připraveny."

# 2. Instalace projektu
setup: check-deps
    @echo "--- Spouštím setup projektu ---"
    # Backend: synchronizace + instalace ruff
    cd backend && uv sync && uv add ruff --dev
    # Root (dotenvx)
    npm install @dotenvx/dotenvx --save-dev
    # Frontend (konkrétní verze dle zadání)
    cd frontend && npm install -D @biomejs/biome@2.4.16 autoprefixer@10.5.0 postcss@8.5.15 tailwindcss@4.3.0
    @echo "--- Setup kompletní! ---"

# 3. Commit & Push (Check -> Format -> Encrypt -> Push)
push:
    @echo "--- Kontroluji a formátuji kód ---"
    # Backend check
    cd backend && uv run ruff check . --fix
    # Frontend check
    cd frontend && npx biome check --write .
    @echo "--- Šifruji .env ---"
    npx dotenvx encrypt -f .env
    @echo "--- Commituji a odesílám ---"
    git add .
    git commit -m "$(m)"
    git push
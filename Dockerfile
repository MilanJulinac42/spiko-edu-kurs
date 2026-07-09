# Spiko Edu API (apps/api) — Bun + Elysia server za Railway.
# Build context = repo root (zbog @spiko/shared workspace zavisnosti).
FROM oven/bun:1.3

WORKDIR /app

# Ceo repo (workspace: apps/*, packages/*). .dockerignore izbacuje node_modules,
# .next i .env fajlove — tajne NE ulaze u image.
COPY . .

# Instalira ceo workspace; @spiko/shared se linkuje preko root node_modules.
RUN bun install

WORKDIR /app/apps/api

# Railway sam ubacuje PORT env; app ga čita preko process.env.PORT (env.ts).
CMD ["bun", "run", "src/index.ts"]

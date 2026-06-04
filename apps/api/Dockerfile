FROM oven/bun:1.3 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun build apps/api/src/index.ts --compile --outfile /app/api

FROM debian:bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /app/api /app/api
ENV PORT=4000
EXPOSE 4000
CMD ["/app/api"]

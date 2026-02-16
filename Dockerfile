# Root Dockerfile for Railway deployment
# Build context: repository root (Railway deploys from repo root)
# Builds the Rust backend in server/

# Stage 1: Build
FROM rust:1.83-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
  pkg-config \
  libssl-dev \
  libclang-dev \
  clang \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy manifests (paths relative to repo root)
COPY server/Cargo.toml server/Cargo.lock* ./
COPY server/src ./src

# Build for release
RUN cargo build --release

# Stage 2: Runtime
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
  ca-certificates \
  libssl3 \
  && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 appuser

WORKDIR /app

COPY --from=builder /app/target/release/gse-backend /app/gse-backend

RUN mkdir -p /app/data && chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

ENV RUST_LOG=info
ENV PORT=3000
ENV SCRAPE_INTERVAL=3600
ENV MAX_RETRIES=3
ENV RETRY_DELAY=5
ENV FETCH_EQUITY_DATA=true
ENV GENERATE_MARKET_SUMMARY=true
ENV DATABASE_PATH=/app/data/gse.db

CMD ["/app/gse-backend"]

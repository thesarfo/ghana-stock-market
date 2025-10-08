# Multi-stage build for Rust backend

# Stage 1: Build
FROM rust:1.82-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
  pkg-config \
  libssl-dev \
  libclang-dev \
  clang \
  && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy manifests
COPY Cargo.toml ./

# Copy source code
COPY src ./src

# Build for release
RUN cargo build --release

# Stage 2: Runtime
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
  ca-certificates \
  libssl3 \
  && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -m -u 1000 appuser

# Create app directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/gse-backend /app/gse-backend

# Create data directory
RUN mkdir -p /app/data && chown -R appuser:appuser /app

# Switch to app user
USER appuser

# Expose port
EXPOSE 3000

# Set environment variables
ENV RUST_LOG=info
ENV PORT=3000
ENV SCRAPE_INTERVAL=3600
ENV MAX_RETRIES=3
ENV RETRY_DELAY=5
ENV FETCH_EQUITY_DATA=true
ENV GENERATE_MARKET_SUMMARY=true
ENV DATABASE_PATH=/app/data/gse.db

# Run the binary
CMD ["/app/gse-backend"]

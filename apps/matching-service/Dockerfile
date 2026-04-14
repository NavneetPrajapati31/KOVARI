# Stage 1: Build
FROM golang:1.25.0-alpine AS builder

WORKDIR /app

# Install dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o matching-service .

# Stage 2: Runtime
FROM gcr.io/distroless/static-debian12:latest-amd64

WORKDIR /

# Copy binary from builder
COPY --from=builder /app/matching-service /matching-service

# Expose port
EXPOSE 8080

# Run as non-root user (distroless provides 'nonroot')
USER nonroot:nonroot

ENTRYPOINT ["/matching-service"]

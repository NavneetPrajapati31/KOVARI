# Stage 1: Build
<<<<<<< HEAD
FROM golang:1.22-alpine AS builder
WORKDIR /app

# Copy the entire monorepo so we have access to packages/config
COPY . .

# Move into the matching-service directory and build the binary
WORKDIR /app/apps/matching-service
RUN go mod download
RUN go build -o /app/bin/matching-service main.go

# Stage 2: Run (Lightweight Alpine container)
FROM alpine:latest
WORKDIR /app

# Copy the built binary back to the correct relative path
COPY --from=builder /app/bin/matching-service ./apps/matching-service/
# Copy the config file so the relative path "../../packages/config/matching.json" works perfectly
COPY --from=builder /app/packages/config/matching.json ./packages/config/

# Set working directory to where the binary expects to run from
WORKDIR /app/apps/matching-service

# Expose port and start
EXPOSE 8080
CMD ["./matching-service"]
=======
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
>>>>>>> c76ec5b5bd754b408ae9ab3b5322443553eb772f

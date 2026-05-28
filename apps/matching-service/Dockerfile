# Stage 1: Build
FROM golang:1.25-alpine AS builder
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

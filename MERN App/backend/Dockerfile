# ===========================================
# TaskFlow Backend - Dockerfile
# ===========================================
# Multi-stage build for optimized production image

# Stage 1: Base image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Stage 2: Development
FROM base AS development

# Install all dependencies (including devDependencies)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start development server with hot reload
CMD ["npm", "run", "dev"]

# Stage 3: Production build
FROM base AS production

# Set production environment
ENV NODE_ENV=production

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/images uploads/documents uploads/general

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S taskflow -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R taskflow:nodejs /app

# Switch to non-root user
USER taskflow

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start production server
CMD ["node", "server.js"]

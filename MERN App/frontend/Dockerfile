# ===========================================
# Frontend Dockerfile
# ===========================================
# 
# Multi-stage Dockerfile for React/Vite application.
# Supports both development and production builds.
# 
# Stages:
# - base: Common dependencies
# - development: Development server with hot reload
# - build: Production build stage
# - production: Nginx server for static files
# ===========================================

# ===========================================
# Base Stage
# ===========================================
# Install dependencies for both dev and prod
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# ===========================================
# Development Stage
# ===========================================
# Development server with hot module replacement
FROM base AS development

# Set environment
ENV NODE_ENV=development

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start development server
# Note: --host flag is needed for Docker
CMD ["npm", "run", "dev", "--", "--host"]

# ===========================================
# Build Stage
# ===========================================
# Build production-ready static files
FROM base AS build

# Set environment
ENV NODE_ENV=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ===========================================
# Production Stage
# ===========================================
# Serve static files with Nginx
FROM nginx:alpine AS production

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

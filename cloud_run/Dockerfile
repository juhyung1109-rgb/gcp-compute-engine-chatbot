# Multi-stage / lightweight Node.js 20 LTS container for Cloud Run
FROM node:20-slim

# Set working directory inside the container
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Install dependencies separately to leverage Docker layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY server.js ./
COPY public ./public

# Cloud Run defaults to listening on port 8080
EXPOSE 8080

# Start application
CMD ["node", "server.js"]

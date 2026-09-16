# Multi-stage / lightweight Node.js 20 LTS container for Cloud Run (ADC Mode)
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY server.js ./
COPY public ./public

EXPOSE 8080

CMD ["node", "server.js"]

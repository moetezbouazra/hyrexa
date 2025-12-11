# Development stage
FROM node:18-slim AS development

WORKDIR /app

# Install system dependencies required for ONNX Runtime, Prisma, and Sharp
RUN apt-get update && apt-get install -y \
    openssl \
    libssl3 \
    ca-certificates \
    python3 \
    make \
    g++ \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install && npm rebuild sharp

COPY . .

RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "run", "dev"]

# Production stage
FROM node:18-slim AS production

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    libssl3 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code and other necessary files
COPY tsconfig*.json ./
COPY src ./src
COPY models ./models

# Build TypeScript
RUN npm install -D typescript tsx @types/node && \
    npm run build && \
    npm uninstall -D typescript tsx @types/node

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "dist/index.js"]

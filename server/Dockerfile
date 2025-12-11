FROM node:18-slim

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

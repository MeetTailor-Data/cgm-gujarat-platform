FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src/ ./src/
COPY .env.example ./.env.example

# Create data and uploads directories
RUN mkdir -p data uploads/crops uploads/quality

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "src/index.js"]

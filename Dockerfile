# Dockerfile in geomap.webapp
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built application (standalone output)
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"


# ✅ Fix: Use standalone server instead of npm start
CMD ["node", "server.js"]
# -------- Base Image --------
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# -------- Dependencies --------
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# -------- Build --------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_PUBLIC_ONBOARDING_URL=https://auth.greenearthx.io
ENV NEXT_PUBLIC_GEOMAP_URL=https://geomap.greenearthx.io
ENV ONBOARDING_APP_URL=https://auth.greenearthx.io
ENV GEOMAP_URL=https://geomap.greenearthx.io

RUN npm run build

# -------- Production --------
FROM base AS runner

WORKDIR /app

# Create app folder and give it permissions
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p /app/.next/cache \
  && chown -R nextjs:nodejs /app

ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Copy only the required files for production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set user AFTER files are copied and permissions are set
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

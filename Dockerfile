# Multi-stage build for Next.js (pnpm monorepo)
FROM node:22-alpine AS base

# Native dependencies required by @libsql/client & sharp on Alpine
RUN apk add --no-cache libc6-compat

# dumb-init forwards SIGTERM to the Next.js process so containers stop cleanly
RUN apk add --no-cache dumb-init

# Enable pnpm matching packageManager version
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Re-link workspace packages after copying full source tree
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build-time public environment values. NEXT_PUBLIC_* vars are inlined into the
# browser bundle at build time, so set them via --build-arg for real deployments.
# The default below is a Clerk TEST publishable key (public by design), enough to
# build/verify locally. Never put secret keys here: pass them at runtime via env.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YnVyc3RpbmctaGVuLTUuY2xlcmsuYWNjb3VudHMuZGV2JA
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_WHATSAPP_NUMBER=573128386640
ARG NEXT_PUBLIC_INACTIVITY_TIMEOUT=900000

ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER
ENV NEXT_PUBLIC_INACTIVITY_TIMEOUT=$NEXT_PUBLIC_INACTIVITY_TIMEOUT
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm build

# Production stage
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat dumb-init

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=America/Bogota

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy only @libsql/* native platform bindings and libsql@* symlinks into standalone's
# pnpm virtual store (Next.js NFT cannot trace dynamic require(`@libsql/${target}`)).
RUN --mount=type=bind,from=deps,source=/app/node_modules/.pnpm,target=/tmp/pnpm-deps \
    set -eux; \
    mkdir -p /app/node_modules/.pnpm; \
    rm -rf /app/node_modules/.pnpm/@libsql+* /app/node_modules/.pnpm/libsql@* 2>/dev/null || true; \
    cp -a /tmp/pnpm-deps/@libsql+* /app/node_modules/.pnpm/; \
    cp -a /tmp/pnpm-deps/libsql@* /app/node_modules/.pnpm/; \
    chown -R nextjs:nodejs /app/node_modules/.pnpm/@libsql+* /app/node_modules/.pnpm/libsql@*

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]

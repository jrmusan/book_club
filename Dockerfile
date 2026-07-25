# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
# Native bcrypt needs a toolchain on Alpine when prebuilds aren't used.
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
# Skip lifecycle scripts so postinstall (prisma generate) doesn't run before the schema is present.
# Then rebuild bcrypt so its native binding install script still runs.
RUN npm install --ignore-scripts \
  && npm rebuild bcrypt

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
# Ensure bcrypt native addon is present in the standalone image.
COPY --from=builder /app/node_modules/bcrypt ./node_modules/bcrypt
COPY --from=builder /app/node_modules/node-addon-api ./node_modules/node-addon-api
COPY --from=builder /app/node_modules/node-gyp-build ./node_modules/node-gyp-build
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && chown nextjs:nodejs docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]

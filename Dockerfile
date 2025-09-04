FROM node:20-alpine

# Install dependencies needed for building
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy root package.json
COPY package*.json ./

# Copy and install web app dependencies
COPY apps/web/package*.json ./apps/web/
WORKDIR /app/apps/web
RUN npm ci

# Copy web app source and build
COPY apps/web ./
RUN npm run build

# Go back to root and copy server files
WORKDIR /app
COPY server.js orchestrator.js ./
COPY db ./db/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV SOVEREIGNTY_ENFORCED=true
ENV TARGET_COST=0.001

CMD ["node", "server.js"]
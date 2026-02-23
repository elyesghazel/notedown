# Stage 1: Build
FROM node:20-slim AS build

WORKDIR /app

# Install system deps for Puppeteer
RUN apt-get update && apt-get install -y \
	ca-certificates \
	fonts-liberation \
	libasound2 \
	libatk-bridge2.0-0 \
	libatk1.0-0 \
	libc6 \
	libcairo2 \
	libcups2 \
	libdbus-1-3 \
	libexpat1 \
	libfontconfig1 \
	libgbm1 \
	libgcc1 \
	libgconf-2-4 \
	libgdk-pixbuf2.0-0 \
	libglib2.0-0 \
	libgtk-3-0 \
	libnspr4 \
	libnss3 \
	libpango-1.0-0 \
	libpangocairo-1.0-0 \
	libstdc++6 \
	libx11-6 \
	libx11-xcb1 \
	libxcb1 \
	libxcomposite1 \
	libxcursor1 \
	libxdamage1 \
	libxext6 \
	libxfixes3 \
	libxi6 \
	libxrandr2 \
	libxrender1 \
	libxss1 \
	libxtst6 \
	lsb-release \
	wget \
	xdg-utils \
	--no-install-recommends \
	&& rm -rf /var/lib/apt/lists/*

# Copy package.json only; do not include lockfiles
COPY package.json ./

# Install deps and generate a temporary package-lock inside the container
RUN npm install

# Copy the rest of the app
COPY . .

# Build the app
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Install the Chromium bundle used by Puppeteer
RUN npx puppeteer browsers install chrome

# Stage 2: Production
FROM node:20-slim AS runner

WORKDIR /app

# Install system deps for Puppeteer
RUN apt-get update && apt-get install -y \
	ca-certificates \
	fonts-liberation \
	libasound2 \
	libatk-bridge2.0-0 \
	libatk1.0-0 \
	libc6 \
	libcairo2 \
	libcups2 \
	libdbus-1-3 \
	libexpat1 \
	libfontconfig1 \
	libgbm1 \
	libgcc1 \
	libgconf-2-4 \
	libgdk-pixbuf2.0-0 \
	libglib2.0-0 \
	libgtk-3-0 \
	libnspr4 \
	libnss3 \
	libpango-1.0-0 \
	libpangocairo-1.0-0 \
	libstdc++6 \
	libx11-6 \
	libx11-xcb1 \
	libxcb1 \
	libxcomposite1 \
	libxcursor1 \
	libxdamage1 \
	libxext6 \
	libxfixes3 \
	libxi6 \
	libxrandr2 \
	libxrender1 \
	libxss1 \
	libxtst6 \
	lsb-release \
	wget \
	xdg-utils \
	--no-install-recommends \
	&& rm -rf /var/lib/apt/lists/*

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN mkdir -p .data public/uploads && chmod -R 755 public

COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /root/.cache/puppeteer /root/.cache/puppeteer

# Ensure public folder is world-readable for static file serving
RUN chmod -R 755 public && chmod -R 666 public/uploads

EXPOSE 3000

ENV PORT 3000
CMD ["npm", "start"]

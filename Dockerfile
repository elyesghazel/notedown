# Stage 1: Build
FROM node:20-slim AS build

WORKDIR /app

# Copy package.json only; do not include lockfiles
COPY package.json ./

# Install deps and generate a temporary package-lock inside the container
RUN npm install

# Copy the rest of the app
COPY . .

# Build and export static assets
RUN npm run build && npx next export

# Stage 2: Production
FROM nginx:alpine
COPY --from=build /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

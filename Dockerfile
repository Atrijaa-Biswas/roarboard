# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
# Copy built assets from builder
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom nginx config to handle React Router (SPA fallback) & Cloud Run's port 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

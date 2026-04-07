# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
# Install dependencies — ignore native addon compilation (canvas is devDep for tests only)
RUN npm ci --ignore-scripts

# Copy code and build
COPY . .
RUN npm run build -- --configuration production

# ---- Runtime Stage ----
FROM nginx:alpine

# Remove default nginx setup
RUN rm -rf /usr/share/nginx/html/* && \
    rm /etc/nginx/conf.d/default.conf

# Copy custom nginx conf
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts
COPY --from=builder /app/dist/finaces-front/browser /usr/share/nginx/html

# Change ownership of nginx directories to non-root user "nginx"
# and grant required permissions for nginx to run without root.
RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root
USER nginx

# Listen on non-privileged port
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

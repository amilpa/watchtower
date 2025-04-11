# Use the official Node.js 18 image.
FROM node:18 as build

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package*.json ./

# Install production dependencies.
RUN npm install

# Copy application code.
COPY . .

# Build the application.
RUN npm run build

# Serve the built app with a lightweight web server.
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Add a healthcheck
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://localhost || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

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
COPY --from=build /usr/src/app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

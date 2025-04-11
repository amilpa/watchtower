# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Add this to debug the build output
RUN ls -la dist/

# Production stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy bundled code from build stage
COPY --from=builder /app/dist ./dist

# Add this to debug the copied files
RUN ls -la dist/

# Expose the port
EXPOSE 5000

# Run the app
CMD ["node", "dist/bundle.cjs"]

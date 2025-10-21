# Use official Node image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose backend port (change if your backend uses another port)
EXPOSE 5000

# Start the backend
CMD ["node", "dist/index.js"]

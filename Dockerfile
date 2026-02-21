# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the Backend and Final Image
FROM node:20-alpine
WORKDIR /app

# Install git for repository management
RUN apk add --no-nowarn git

# Copy backend dependencies
COPY package*.json ./
RUN npm install

# Copy backend source
COPY . .

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/client/dist ./public

# Update server.js to serve the static frontend if needed
# (I will modify server.js in a later step to serve these static files)

EXPOSE 3001
CMD ["npm", "start"]

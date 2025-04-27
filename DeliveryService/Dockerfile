FROM node:18-alpine

WORKDIR /app

# Install build dependencies for bcrypt
RUN apk add --no-cache python3 make g++ && \
    npm install -g nodemon

COPY package*.json ./

# Install dependencies
RUN npm ci

COPY . .

CMD ["nodemon", "src/server.js"]
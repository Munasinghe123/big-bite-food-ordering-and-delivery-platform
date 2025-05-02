FROM node:20.17.0

# Set working directory
WORKDIR /app

# Copy package.json and lock file first (if available)
COPY package.json .
RUN npm install


# Copy everything else (code, .env, etc.)
COPY . .

# Expose port
EXPOSE 7001 

# Start server
CMD ["npm", "run", "start"]

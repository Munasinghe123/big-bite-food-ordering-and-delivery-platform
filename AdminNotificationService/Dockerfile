# Use node base image
FROM node:20.19.0

WORKDIR /app

# Copy only package.json first for caching
COPY package*.json ./

RUN npm install

# Now copy rest of the app
COPY . .

EXPOSE 7000

CMD ["npm", "run", "start"]

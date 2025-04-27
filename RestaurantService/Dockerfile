FROM node:22-bookworm-slim

WORKDIR /app

# Install system dependencies & fonts (English support)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    fonts-liberation \
    fonts-freefont-ttf \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# Ensure fontconfig is properly initialized
RUN fc-cache -f -v

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5004

CMD ["npm", "start"]
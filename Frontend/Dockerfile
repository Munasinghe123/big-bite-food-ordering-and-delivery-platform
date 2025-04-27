FROM node:20.19.0

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . ./

# USER node  

EXPOSE 5173

CMD ["npm", "run", "dev"]

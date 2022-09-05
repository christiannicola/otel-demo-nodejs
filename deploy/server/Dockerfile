# Build stage
FROM node:16-alpine
WORKDIR /usr
COPY . .
RUN npm install
RUN npm run build
# Final stage
FROM node:16-alpine
WORKDIR /usr
COPY package.json ./
COPY package-lock.json ./
RUN npm install --production
COPY --from=0 /usr/dist .
EXPOSE 8080
CMD ["node", "server.js"]

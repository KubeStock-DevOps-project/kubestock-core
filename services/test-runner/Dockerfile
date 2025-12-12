FROM node:18-alpine

# Install k6
RUN apk add --no-cache ca-certificates && \
    apk add --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/v3.13/main libconfig && \
    wget https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -O - | tar -xz && \
    mv k6-v0.47.0-linux-amd64/k6 /usr/bin/k6

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expose port
EXPOSE 3007

CMD ["npm", "start"]

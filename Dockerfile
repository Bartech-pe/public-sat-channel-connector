FROM node:22

WORKDIR /app

COPY package*.json ./

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
 && ln -s /usr/bin/python3 /usr/bin/python \
 && npm install --production \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

COPY . .

EXPOSE 3010

CMD ["npm", "start"]

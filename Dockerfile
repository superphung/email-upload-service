FROM zzrot/alpine-node

RUN mkdir /app

WORKDIR /app

COPY package.json /app
RUN npm install

COPY . /app

EXPOSE 3001

CMD ["npm", "start"]

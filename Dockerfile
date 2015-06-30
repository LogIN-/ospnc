FROM node:latest

RUN mkdir /src

WORKDIR /src
ADD . /src/
RUN npm install

EXPOSE 8089

CMD node index.js

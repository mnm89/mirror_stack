FROM node:18-alpine3.16

ENV NODE_ENV=production


WORKDIR /usr/src/app

COPY . .

RUN npm ci -omit=dev


ENTRYPOINT [ "node" ] 
CMD ["server.cjs"]
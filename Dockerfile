FROM node:10 as builder

RUN mkdir /michaelhost
WORKDIR /michaelhost

ADD ./package.json .
ADD ./yarn.lock .
RUN yarn install

ADD . .

RUN yarn build-react



FROM node:10

RUN mkdir /michaelhost
WORKDIR /michaelhost

ADD ./package.json .
ADD ./yarn.lock .
RUN yarn install --production

ADD . .
COPY --from=builder /michaelhost/build build

RUN ln -s /michaelhost/bin/michaelhost.js /bin/michaelhost

CMD michaelhost

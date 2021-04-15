FROM node:10

RUN mkdir /michaelhost
WORKDIR /michaelhost

ADD ./package.json .
ADD ./yarn.lock .
RUN yarn install

ADD . .

RUN yarn build-react
RUN ln -s /michaelhost/bin/michaelhost.js /bin/michaelhost

CMD michaelhost

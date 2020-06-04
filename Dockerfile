FROM node:10

RUN mkdir /michaelhost
WORKDIR /michaelhost

ADD ./package.json .
ADD ./yarn.lock .
RUN yarn install

ADD lib lib
ADD public public
ADD bin bin
ADD src src
ADD ./config-overrides.js .

RUN yarn build-react
RUN ln -s /michaelhost/bin/michaelhost.js /bin/michaelhost

CMD michaelhost

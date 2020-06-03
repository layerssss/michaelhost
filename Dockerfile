FROM node:10

RUN mkdir /michaelhost
RUN mkdir /data
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
RUN node ./bin/michaelhost.js --state-file-path /data/michaelhost-state.json init
WORKDIR /data

ENTRYPOINT ["node", "/michaelhost/bin/michaelhost.js", "--state-file-path", "/data/michaelhost-state.json"]

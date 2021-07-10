FROM node:14-alpine as admin_ui_builder

RUN mkdir /admin_ui
WORKDIR /admin_ui
ADD /admin_ui .
RUN yarn install && yarn cache clean
RUN yarn build


FROM node:14-alpine as builder

RUN apk add --no-cache python make g++
RUN mkdir /michaelhost
WORKDIR /michaelhost
ADD ./package.json .
ADD ./yarn.lock .
RUN yarn install --production && yarn cache clean


FROM node:14-alpine

RUN apk add --no-cache openssh-client
RUN mkdir /michaelhost
WORKDIR /michaelhost
ADD ./lib lib
ADD ./bin bin
ADD ./package.json .
COPY --from=admin_ui_builder /admin_ui/build admin_ui/build
COPY --from=builder /michaelhost/node_modules node_modules
RUN ln -s /michaelhost/bin/michaelhost.js /bin/michaelhost

CMD michaelhost

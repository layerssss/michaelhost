FROM node:26-alpine as base

FROM base as admin_ui_builder

RUN mkdir /admin_ui
WORKDIR /admin_ui
ADD /admin_ui .
RUN npm install
RUN npm run build


FROM base as builder

RUN apk add --no-cache python3 make g++
RUN mkdir /michaelhost
WORKDIR /michaelhost
ADD ./package.json .
RUN npm install --omit=dev


FROM base

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

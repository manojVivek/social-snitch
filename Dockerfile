FROM node:lts-alpine

WORKDIR /opt/app

COPY . /opt/app

RUN yarn bootstrap

ENTRYPOINT ["yarn", "lerna", "run", "--stream", "--scope", "@socialsnitch/discord-bot-server", "prod"]
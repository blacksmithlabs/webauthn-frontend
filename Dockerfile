# syntax=docker/dockerfile:1-labs
FROM --platform=$BUILDPLATFORM node:20-alpine AS build

WORKDIR /build
COPY package*.json .
RUN npm ci

COPY --exclude=nginx/* . .
ENV BASE=/
RUN npm run build

FROM --platform=$BUILDPLATFORM nginx:alpine AS run

RUN ln -s /usr/share/nginx/html/ /app
COPY --from=build /build/dist /app
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

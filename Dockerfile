FROM --platform=$BUILDPLATFORM node:20-alpine AS build

WORKDIR /build
COPY package*.json .
RUN npm ci

COPY . .
ENV BASE=/
RUN npm run build

FROM --platform=$BUILDPLATFORM nginx:alpine AS run

RUN ln -s /usr/share/nginx/html/ /app
COPY --from=build /build/dist /app

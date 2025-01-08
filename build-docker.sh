#!/bin/bash

app_tag="registry.blacksmithlabs.dev/webauthn-frontend:alpha"

echo "Building frontend image..."
docker buildx build --platform=linux/amd64,linux/arm64 -t "$app_tag" --push .

if [ $? -ne 0 ]; then
    echo "Build frontend failed. Exiting..."
    exit 1
fi

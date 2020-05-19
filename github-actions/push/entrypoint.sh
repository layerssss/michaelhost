#!/bin/sh

curl \
  --fail \
  -v -H "Authorization: Bearer ${MICHAELHOST_SECRET}" \
  -X POST ${MICHAELHOST_WEBHOOK_URL}/image\?repoName\=${IMAGE_NAME}\&tag\=${IMAGE_TAG}


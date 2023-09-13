FROM node:16-alpine AS build

WORKDIR /app

COPY review-report-svelte-app/. ./review-report-svelte-app/

WORKDIR /app/review-report-svelte-app

RUN npm ci

RUN npm run build

EXPOSE 3000

CMD ["node", "build"]

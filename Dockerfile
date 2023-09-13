FROM node:16-alpine AS build

WORKDIR /review-report-svelte-app

COPY review-report-svelte-app/package*.json /review-report-svelte-app

RUN npm ci

COPY review-report-svelte-app/. /review-report-svelte-app

RUN npm run build

EXPOSE 3000

CMD ["node", "build"]

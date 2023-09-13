FROM node:16-alpine AS build

WORKDIR /app

COPY review-report-svelte-app/package*.json ./

RUN npm ci

COPY review-report-svelte-app/. .

RUN npm run build

EXPOSE 3000

CMD ["node", "build"]

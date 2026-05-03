FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

ARG VITE_METABASE_DASHBOARD_URL
ENV VITE_METABASE_DASHBOARD_URL=${VITE_METABASE_DASHBOARD_URL}

RUN npm run build


FROM node:20-alpine

RUN npm install -g serve@14.2.4

WORKDIR /app
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]

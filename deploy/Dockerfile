# Stage 1: Build
FROM node:20-slim AS build
WORKDIR /app

# 빌드 타임 환경 변수 수용 (기본값 설정)
ARG VITE_API_BASE_URL=/api
ARG VITE_APP_NAME=Stockwellness
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

# 의존성 설치
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# 소스 복사 및 빌드
COPY . .
RUN yarn build

# Stage 2: Serve
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

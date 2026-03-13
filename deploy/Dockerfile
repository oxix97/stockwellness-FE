# Stage 1: Build
FROM node:20-slim AS build
WORKDIR /app

# 의존성 설치
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# 소스 복사 및 빌드
COPY . .
RUN yarn build

# Stage 2: Serve
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

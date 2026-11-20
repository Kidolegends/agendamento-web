# ---- build stage: compile the React app to static files ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# The browser calls "/api/*"; nginx forwards it to the API container (see nginx.conf).
ENV VITE_API_URL=/api
RUN npm run build

# ---- runtime stage: tiny nginx serving the static files, running as a non-root user ----
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080

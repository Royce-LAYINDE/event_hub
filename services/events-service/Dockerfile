FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY services/events-service/package.json services/events-service/package.json
RUN npm ci --workspace=@eventhub/events-service --include-workspace-root=false
COPY services/events-service services/events-service
RUN npm run build --workspace=@eventhub/events-service

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/events-service/package.json services/events-service/package.json
RUN npm ci --workspace=@eventhub/events-service --include-workspace-root=false --omit=dev && npm cache clean --force
COPY --from=build /app/services/events-service/dist services/events-service/dist
USER node
EXPOSE 3001
CMD ["node", "services/events-service/dist/server.js"]

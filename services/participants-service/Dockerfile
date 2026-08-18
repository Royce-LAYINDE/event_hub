FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY services/participants-service/package.json services/participants-service/package.json
RUN npm ci --workspace=@eventhub/participants-service --include-workspace-root=false
COPY services/participants-service services/participants-service
RUN npm run build --workspace=@eventhub/participants-service

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/participants-service/package.json services/participants-service/package.json
RUN npm ci --workspace=@eventhub/participants-service --include-workspace-root=false --omit=dev && npm cache clean --force
COPY --from=build /app/services/participants-service/dist services/participants-service/dist
USER node
EXPOSE 3002
CMD ["node", "services/participants-service/dist/server.js"]

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY services/registrations-service/package.json services/registrations-service/package.json
RUN npm ci --workspace=@eventhub/registrations-service --include-workspace-root=false
COPY services/registrations-service services/registrations-service
RUN npm run build --workspace=@eventhub/registrations-service

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/registrations-service/package.json services/registrations-service/package.json
RUN npm ci --workspace=@eventhub/registrations-service --include-workspace-root=false --omit=dev && npm cache clean --force
COPY --from=build /app/services/registrations-service/dist services/registrations-service/dist
USER node
EXPOSE 3003
CMD ["node", "services/registrations-service/dist/server.js"]

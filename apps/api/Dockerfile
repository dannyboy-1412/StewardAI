FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo prune @docai/api --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile || pnpm install
COPY --from=pruner /app/out/full/ .
WORKDIR /app/apps/api
EXPOSE 4000
ENV NODE_ENV=production
CMD ["pnpm", "start"]

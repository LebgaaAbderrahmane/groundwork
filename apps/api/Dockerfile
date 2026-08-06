FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @groundwork/api --filter @groundwork/db --filter @groundwork/shared

FROM base AS build
COPY . .
RUN pnpm --filter @groundwork/api --filter @groundwork/db --filter @groundwork/shared exec tsc -b

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app
EXPOSE 4000
CMD ["pnpm", "--filter", "@groundwork/api", "start"]

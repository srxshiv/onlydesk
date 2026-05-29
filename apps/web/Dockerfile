FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json ./
COPY packages/config/package.json packages/config/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/tools-sdk/package.json packages/tools-sdk/
COPY packages/api-client/package.json packages/api-client/
COPY tools/resume-editor/package.json tools/resume-editor/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /repo /repo
COPY . .
RUN pnpm --filter @onlydesk/shared-types build && \
    pnpm --filter @onlydesk/tools-sdk build && \
    pnpm --filter @onlydesk/api-client build && \
    pnpm --filter @onlydesk/web build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]

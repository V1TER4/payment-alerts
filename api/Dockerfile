FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates postgresql-client \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package.json
COPY tsconfig.base.json tsconfig.base.json
COPY api/package.json api/package.json
COPY web/package.json web/package.json
RUN npm install
COPY api api
COPY prisma prisma
WORKDIR /app/api
RUN npm run db:generate
RUN chmod +x ./docker-entrypoint.sh
EXPOSE 3000
CMD ["./docker-entrypoint.sh"]

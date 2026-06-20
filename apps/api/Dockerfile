ARG NODE_IMAGE=node:22-alpine
FROM ${NODE_IMAGE}

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm ci

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

RUN npx prisma generate --schema apps/api/prisma/schema.prisma
RUN npm run build --workspace @smart-erp/api

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace", "@smart-erp/api"]

FROM node:20-alpine
# Prisma needs openssl on alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
# prisma CLI is a devDependency but we need it for generate/migrate at runtime
RUN npm install --include=dev
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src

RUN mkdir -p uploads && chown -R node:node /app
USER node
VOLUME ["/app/uploads"]
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:5000/api/health >/dev/null || exit 1

# Sync the schema and seed the service catalogue before accepting requests.
CMD ["sh", "-c", "npx prisma db push && npm run seed && node src/server.js"]

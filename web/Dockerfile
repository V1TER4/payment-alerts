FROM node:22-bookworm-slim
WORKDIR /app/web
COPY web/package.json ./package.json
COPY tsconfig.base.json /app/tsconfig.base.json
RUN npm install
COPY web/ ./
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

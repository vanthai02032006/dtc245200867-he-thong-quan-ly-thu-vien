FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

# Hardening: Chạy ứng dụng dưới quyền Non-root user (node)
USER node

EXPOSE 3000

CMD ["npm", "start"]

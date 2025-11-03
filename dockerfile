# 构建阶段
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

RUN npm install

# 复制源代码
COPY . .

EXPOSE 3000

CMD ["npm", "start"]

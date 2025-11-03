# 构建阶段
FROM node:18-alpine AS build

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package.json package-lock.json ./

# 如果有 package-lock.json 使用 ci，否则使用 install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# 复制源代码
COPY . .

# 验证 axios 是否安装
RUN npm list axios

# 构建应用
RUN npm run build

# 运行阶段
FROM nginx:alpine

# 复制构建结果到 nginx
COPY --from=build /app/build /usr/share/nginx/html



# 暴露端口
EXPOSE 3000

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
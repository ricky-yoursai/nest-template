# --- Build Stage ---
FROM node:18-alpine AS builder

WORKDIR /app

# 先只复制 package 文件，利用 Docker 缓存层
COPY package*.json ./
# 安装所有依赖（包括 devDependencies，因为 nest build 需要 typescript）
RUN npm install

COPY . .

# 构建项目 (生成 dist 目录)
RUN npm run build

# --- Production Stage ---
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# 只安装生产依赖 (去掉 typescript, eslint 等)
RUN npm install --production

# 从构建层复制编译好的代码
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/main.js"]

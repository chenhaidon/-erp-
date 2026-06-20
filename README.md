# 智能制造 ERP 一期工程

面向离散制造场景的 Web 端智能制造 ERP 全栈工程，采用 `React + NestJS + PostgreSQL + Redis + MinIO`。

## 开发 / 生产隔离策略

当前仓库采用“同一套业务代码，不同环境配置与启动入口分离”的方式，不维护两套代码。

### 开发环境

- 编排文件：`docker-compose.yml`
- API 环境模板：`apps/api/.env.development.example`
- Web 环境模板：`apps/web/.env.development.example`
- 典型用途：本地联调、功能开发、演示数据测试

### 生产环境

- 编排文件：`docker-compose.prod.yml`
- 根环境模板：`.env.production.example`
- API 环境模板：`apps/api/.env.production.example`
- Web 环境模板：`apps/web/.env.production.example`
- 典型用途：云服务器部署、Nginx 反向代理、容器运行

### API 环境变量加载顺序

`apps/api` 会按以下顺序加载配置：

1. `.env.<NODE_ENV>.local`
2. `.env.<NODE_ENV>`
3. `.env.local`
4. `.env`

这意味着：

- 开发环境建议使用 `NODE_ENV=development`
- 生产环境建议使用 `NODE_ENV=production`
- 本地临时覆盖建议放在 `*.local`

## 常用命令

### 开发环境

1. 安装依赖：`npm install`
2. 启动基础依赖：`npm run dev:infra`
3. 初始化数据库：
   - `npm run dev:db:push`
   - `npm run dev:seed`
4. 启动应用：
   - API：`npm run dev:api`
   - Web：`npm run dev:web`

### 生产环境

1. 复制模板：`Copy-Item .env.production.example .env.production`
2. 修改生产变量：数据库密码、JWT 密钥、域名、MinIO 密码
3. 启动：`npm run prod:up`
4. 查看日志：`npm run prod:logs`
5. 停止：`npm run prod:down`

## 目录结构

- `apps/web`：React 前端控制台
- `apps/api`：NestJS 后端 API
- `packages/shared`：共享类型、枚举、导航常量
- `docker-compose.yml`：开发环境依赖编排
- `docker-compose.prod.yml`：生产环境编排

## 默认账号

- 用户名：`admin`
- 密码：`Admin@123`

更多演示账号、角色权限和页面操作说明见：[系统操作文档](系统操作文档.md)

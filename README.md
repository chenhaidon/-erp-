# 智能制造 ERP 一期工程

面向离散制造场景的 Web 端智能制造 ERP 全栈工程，采用 `React + NestJS + PostgreSQL + Redis + MinIO`。

## 开发 / 生产隔离结构

仓库现在按“代码、环境、部署”三层隔离：

- 代码：
  - `apps/web`
  - `apps/api`
  - `packages/shared`
- 环境模板：
  - `env/development/.env.example`
  - `env/production/.env.example`
  - `apps/api/.env.development.example`
  - `apps/api/.env.production.example`
  - `apps/web/.env.development.example`
  - `apps/web/.env.production.example`
- 部署编排：
  - `deploy/development/docker-compose.yml`
  - `deploy/production/docker-compose.yml`

根目录只保留入口和说明，不再混放生产环境模板。

## 常用命令

### 开发环境

1. 安装依赖：`npm install`
2. 启动基础依赖：`npm run dev:infra`
3. 初始化数据库：
   - `npm run dev:db:push`
   - `npm run dev:seed`
4. 启动服务：
   - `npm run dev:api`
   - `npm run dev:web`

### 生产环境

1. 复制模板：`Copy-Item env/production/.env.example env/production/.env`
2. 修改生产变量
3. 启动：`npm run prod:up`
4. 查看日志：`npm run prod:logs`
5. 停止：`npm run prod:down`

## 分支建议

- `develop`：开发集成分支
- `production`：生产发布分支
- `main`：基线分支

详细规则见：[BRANCHING.md](BRANCHING.md)

## 默认账号

- 用户名：`admin`
- 密码：`Admin@123`

更多演示账号、角色权限和页面操作说明见：[系统操作文档](系统操作文档.md)

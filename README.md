# 智能制造 ERP 一期工程

面向离散制造场景的 Web 端智能制造 ERP 全栈工程，采用 `React + NestJS + PostgreSQL + Redis + MinIO`。

## 目录结构

- `apps/web`：React 前端控制台
- `apps/api`：NestJS 后端 API
- `packages/shared`：共享类型、枚举、导航常量
- `docker-compose.yml`：本地依赖服务编排

## 已实现能力

- 登录认证、刷新令牌、工厂切换
- 多租户、组织架构、角色权限、工厂级数据隔离
- 物料、BOM、工艺路线、仓库、供应商等主数据查询
- 工单、工序报工、MRP 运算、库存事务、采购单
- 质量检验、设备台账、维护工单、集成任务监控
- AI 助手接口层、经营摘要、排产建议、异常分析

## 运行方式

1. 安装依赖：`npm install`
2. 启动数据库与依赖：
   - 优先使用 `docker compose up -d`
   - 如果 Docker Desktop 未启动，请先启动 Docker Desktop，或自行提供 PostgreSQL / Redis
3. 初始化数据库：
   - `cd apps/api`
   - `npx prisma generate --schema prisma/schema.prisma`
   - `npx prisma db push --schema prisma/schema.prisma`
   - `npm run prisma:seed`
4. 启动应用：
   - API：`npm run dev --workspace @smart-erp/api`
   - Web：`npm run dev --workspace @smart-erp/web`

## 默认账号

- 用户名：`admin`
- 密码：`Admin@123`

更多演示账号、角色权限和页面操作说明见：[系统操作文档](系统操作文档.md)

## 当前验证状态

- `apps/web` 已通过生产构建
- `apps/api` 已通过 TypeScript/Nest 构建
- 数据库初始化依赖本机 PostgreSQL 可用；当前机器上的 Docker daemon 未启动，因此未完成 `db push` 和 `seed` 的最终落库验证

## 环境变量

- `apps/api/.env.example`
- `apps/web/.env.example`

# GitHub Actions 自动部署设计

## 背景

当前仓库已经采用三分支模型：

- `main`：基线分支
- `develop`：开发集成分支
- `production`：生产发布分支

当前部署方式为私有化容器部署，生产环境通过 [deploy/production/docker-compose.yml](C:/Users/Administrator/Desktop/ERP系统/deploy/production/docker-compose.yml) 启动，生产变量保存在服务器本地 `env/production/.env`，不进入仓库。当前部署目标已明确为百度云 Linux 服务器。

本次目标是在不改变现有部署结构的前提下，引入 GitHub Actions 自动化能力，实现：

- `develop` 分支自动执行 CI 检查，不部署
- `production` 分支只能通过 Pull Request 合并进入
- `production` 合并完成后，自动触发正式环境部署
- 部署执行位置为生产服务器上的 `self-hosted runner`

## 目标

本设计解决以下问题：

1. 统一 `develop -> production` 的发布路径
2. 杜绝直接向 `production` 推送代码
3. 将生产部署动作标准化、可追踪、可重复执行
4. 保持生产密钥和环境变量只存在于服务器本地

## 非目标

本次不包含以下内容：

- 测试环境自动部署
- 蓝绿部署、金丝雀发布、滚动发布
- 自动数据库回滚
- 基于镜像仓库的发布流水线
- 生产环境动态密钥分发

## 方案选型

### 方案 A：单工作流同时承担 CI 和部署

优点：

- 文件少
- 初期实现快

缺点：

- `develop` 校验与 `production` 部署职责混杂
- 后续增加测试环境时扩展成本高
- 问题定位不清晰

### 方案 B：CI 与生产部署分离

优点：

- `ci.yml` 和 `deploy-production.yml` 职责清晰
- 与当前三分支模型天然匹配
- 后续增加 `staging` 或 `release/*` 更容易

缺点：

- 工作流文件多一个

### 方案 C：基于 Tag 发布

优点：

- 发布控制最严
- 可以天然形成版本节点

缺点：

- 流程更重
- 当前团队分支实践还未稳定，不适合先引入更多手工环节

### 推荐方案

采用方案 B：

- `ci.yml`：负责 `develop` 和相关 PR 的构建校验
- `deploy-production.yml`：负责 `production` 合并后的正式部署

## 分支与环境规则

### develop

- 允许日常开发集成
- 推送到 `develop` 时触发 CI
- CI 只做代码检查与构建验证
- 不连接正式环境

### production

- 禁止开发者直接 `push`
- 只能通过 Pull Request 从 `develop` 合并
- 合并后触发正式部署
- 正式部署只认 `production` 当前代码

### main

- 保持为基线分支
- 本次不绑定自动部署

## GitHub 侧规则

### Branch Protection

需要对 `production` 开启分支保护：

- 禁止直接推送
- 要求通过 Pull Request 合并
- 要求合并前必须通过 CI
- 建议要求至少 1 个 reviewer
- 建议禁止强推

这保证正式环境发布只能来自经过审查和检查的代码。

## Runner 设计

### Runner 类型

采用 `self-hosted runner`，直接部署在正式服务器上。

原因：

- 符合当前私有化容器部署方式
- 不需要在 GitHub Hosted Runner 中配置服务器访问凭证
- 部署命令直接在服务器本机执行，链路更短
- 与本地 `docker compose` 运维方式一致

### Runner 要求

正式服务器上的 runner 需要满足：

- 已安装 Git
- 已安装 Docker 和 Docker Compose
- runner 运行账号具备 Docker 执行权限
- runner 工作目录固定到仓库发布目录

当前固定发布目录：

- Linux：`/opt/smart-erp`

## 仓库与服务器目录规范

服务器上的生产目录固定保持如下结构：

```text
<deploy-root>/
  repo/
    apps/
    packages/
    deploy/
    env/
  env/
    production/.env
```

为避免 Git 清理或分支切换误伤生产变量，推荐：

- 仓库中只保留 `env/production/.env.example`
- 服务器实际生效的 `env/production/.env` 只保存在部署机本地
- workflow 不创建、不覆盖生产 `.env`

如果现有项目目录已经固定，也可以保持当前仓库内 `env/production/.env` 方案，但必须确保该文件不纳入版本控制。

## 工作流设计

### 1. CI 工作流

文件建议：

- `.github/workflows/ci.yml`

触发条件：

- `push` 到 `develop`
- `pull_request` 指向 `develop`
- `pull_request` 指向 `production`

执行内容：

1. 检出代码
2. 安装 Node.js
3. 执行 `npm ci`
4. 执行 workspace 构建
5. 执行 `lint`
6. 执行必要测试

设计原则：

- CI 要能为 `production` 合并提供质量闸门
- CI 不依赖生产环境资源
- CI 不访问服务器本地敏感文件

### 2. 生产部署工作流

文件建议：

- `.github/workflows/deploy-production.yml`

触发条件：

- `push` 到 `production`

说明：

虽然规则上 `production` 禁止人工直接推送，但 Pull Request 合并在 GitHub 底层仍会形成一次对 `production` 的更新，因此使用 `push` 监听最稳定。

执行位置：

- `runs-on: self-hosted`

核心步骤：

1. 获取最新 `production` 代码
2. 确认工作目录位于正式发布目录
3. 执行 `docker compose --env-file env/production/.env -f deploy/production/docker-compose.yml up -d --build`
4. 等待服务启动
5. 对前端或后端健康接口做探活

建议增加：

- `concurrency` 防止重复部署并发执行
- `timeout-minutes` 防止部署无限挂起

## 部署命令约定

标准部署命令采用现有仓库脚本等价形式：

```powershell
docker compose --env-file env/production/.env -f deploy/production/docker-compose.yml up -d --build
```

如果服务器仓库使用 `npm run prod:up` 作为统一入口，也可以在 workflow 中调用该脚本，但底层仍应落到同一套 compose 编排。

## 健康检查设计

部署成功不能只以 `docker compose` 返回码为准，还需要至少一次服务探活。

建议检查：

- 后端：`/api/auth/me`
  - 预期返回 `401`
  - 表示服务已启动且鉴权中间件工作正常
- 前端：站点首页返回 `200`

理由：

- `/api/auth/me` 无需登录即可验证应用是否启动到业务层
- `401` 是预期业务返回，不是失败

## 失败处理

工作流失败条件包括：

- 代码拉取失败
- `npm ci` 或构建失败
- `docker compose up -d --build` 失败
- 健康检查失败

失败后的处理原则：

- workflow 标红
- 不自动回滚
- 由运维或开发根据容器日志人工处理

本阶段不做自动回滚，原因是当前数据库迁移、容器构建和状态恢复尚未形成完整的幂等回滚链路。

## 安全边界

需要明确以下边界：

- 生产密钥不进入 Git 仓库
- GitHub Actions 不存储生产 `.env` 内容
- runner 只拥有本机部署权限，不负责跨机器发布
- 正式部署只由 `production` 合并触发

如果后续引入多个生产节点，再评估 SSH、制品仓库或编排平台。

## 可观测性与审计

建议保留以下记录：

- GitHub Actions 执行日志
- 合并到 `production` 的 PR 记录
- 服务器本机 Docker 容器日志

这样可以回答三个问题：

1. 谁在什么时间发布了代码
2. 发布的是哪次提交
3. 发布失败时失败在什么步骤

## 实施结果

完成实现后，预期开发流程如下：

1. 从 `develop` 拉出 `feature/*`
2. 完成功能开发并合并回 `develop`
3. GitHub Actions 自动对 `develop` 执行 CI
4. 准备发版时，从 `develop` 提交 PR 到 `production`
5. PR 审核并合并后，GitHub Actions 在正式服务器的 `self-hosted runner` 上自动部署

## 风险与约束

### 风险

- 生产 runner 宕机时，部署流水线不可用
- 服务器本机 Git 工作区被人工改乱时，部署可能失败
- Docker 缓存或磁盘空间问题会影响构建和启动

### 约束

- `production` 分支保护必须在 GitHub 仓库设置中手工完成
- runner 安装和注册必须在服务器上手工完成
- 生产 `.env` 必须先在服务器准备好，否则部署会失败

## 实施拆分

建议按两步实施：

1. 先落库文档与 GitHub Actions 配置
2. 再在服务器上安装和注册 `self-hosted runner`，验证一次从 PR 合并到自动部署的完整链路

## 验收标准

满足以下条件视为本次方案完成：

1. `develop` 推送后自动触发 CI
2. `production` 无法直接推送，只能通过 PR 合并
3. `production` 合并后自动触发部署工作流
4. 工作流在 `self-hosted runner` 上完成 `docker compose` 发布
5. 部署后健康检查通过

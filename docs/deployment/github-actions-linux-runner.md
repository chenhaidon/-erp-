# GitHub Actions Linux Runner 部署说明

## 适用场景

本说明适用于当前仓库的正式环境自动部署方案：

- GitHub Actions
- `production` 只能通过 Pull Request 合并
- 百度云 Linux 服务器
- `self-hosted runner`
- 发布目录固定为 `/opt/smart-erp`

## 工作流约定

- `develop`
  - 自动执行 CI
  - 不部署
- `production`
  - 合并后自动触发正式部署

对应文件：

- [.github/workflows/ci.yml](C:/Users/Administrator/Desktop/ERP系统/.github/workflows/ci.yml)
- [.github/workflows/deploy-production.yml](C:/Users/Administrator/Desktop/ERP系统/.github/workflows/deploy-production.yml)

## 服务器前置条件

服务器需要预先安装：

- Git
- Docker
- Docker Compose
- curl

同时需要：

- 一个专用的 GitHub `self-hosted runner`
- runner 运行账号具备 Docker 权限
- 仓库代码已克隆到 `/opt/smart-erp`
- 生产环境变量文件已准备好：`/opt/smart-erp/env/production/.env`

## 目录约定

正式服务器固定使用：

```text
/opt/smart-erp
```

这个目录必须是一个专用发布目录，不要在里面做日常开发，也不要混放其他项目。

原因：

- 自动部署会强制同步到 `origin/production`
- 工作流中包含 `git reset --hard origin/production`
- 如果目录里有手工改动，会被覆盖

## 初始化服务器

首次部署前，在服务器上执行：

```bash
sudo mkdir -p /opt/smart-erp
sudo chown -R "$USER":"$USER" /opt/smart-erp
git clone <your-repo-url> /opt/smart-erp
cd /opt/smart-erp
git checkout production
```

然后创建生产环境变量文件：

```bash
cp env/production/.env.example env/production/.env
```

再按实际生产参数修改 `env/production/.env`。

## 安装 self-hosted runner

在 GitHub 仓库页面进入：

`Settings -> Actions -> Runners -> New self-hosted runner`

选择 Linux，并在服务器上按 GitHub 页面提供的命令安装 runner。

建议：

- 使用专门目录安装 runner，例如 `/opt/actions-runner`
- 不要把 runner 装在项目仓库目录里

## 赋予 Docker 权限

如果 runner 账号不是 `root`，需要给它 Docker 权限：

```bash
sudo usermod -aG docker <runner-user>
```

修改后重新登录该账号，或者重启 runner 服务。

## 将 runner 注册为系统服务

在 runner 安装目录执行：

```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

这样服务器重启后 runner 也会自动拉起。

## 生产部署逻辑

当 Pull Request 合并到 `production` 后，工作流会在服务器执行：

```bash
cd /opt/smart-erp
git fetch --all --prune
git checkout production
git reset --hard origin/production
docker compose --env-file env/production/.env -f deploy/production/docker-compose.yml up -d --build
```

随后执行健康检查：

- `http://127.0.0.1/` 返回成功
- `http://127.0.0.1/api/auth/me` 返回 `401`

`401` 是预期结果，表示后端在线且鉴权生效。

## GitHub 仓库设置

需要手工配置以下内容：

1. 打开 `production` 分支保护
2. 禁止直接 push 到 `production`
3. 要求通过 Pull Request 合并
4. 要求状态检查通过后才能合并
5. 将 CI 工作流设为必需检查

## 首次验证流程

建议按下面顺序验证：

1. 推送一次 `develop`，确认 `CI` 工作流正常
2. 从 `develop` 提交 PR 到 `production`
3. 合并 PR
4. 观察 `Deploy Production` 工作流是否在 Linux runner 上执行
5. 登录服务器检查容器状态

## 常用排查命令

查看容器：

```bash
docker ps
```

查看 compose 日志：

```bash
cd /opt/smart-erp
docker compose --env-file env/production/.env -f deploy/production/docker-compose.yml logs -f
```

检查 runner 服务状态：

```bash
cd /opt/actions-runner
sudo ./svc.sh status
```

# 帧桥 API Demo 启动 TODO

目标：先把 fork 后的 One API demo 在本地跑起来，完成后台登录、渠道配置、令牌创建和一次 OpenAI 兼容接口调用。

## P0 跑通 Demo

- [ ] 确认 Docker / Docker Desktop 已启动。
- [ ] 检查本地端口是否空闲：`3000`、`3306`。
- [ ] 进入项目目录：

```bash
cd /Users/bytedance/my_workspace/VideoBridge
```

- [ ] 启动服务：

```bash
docker compose up -d
```

如果本机 Docker 版本较旧，可改用：

```bash
docker-compose up -d
```

- [ ] 查看容器状态：

```bash
docker compose ps
```

- [ ] 查看 One API 日志：

```bash
docker logs -f one-api
```

- [ ] 打开后台：

```text
http://localhost:3000
```

- [ ] 使用默认管理员账号登录：

```text
用户名：root
密码：123456
```

- [ ] 首次登录后立即修改 `root` 密码。
- [ ] 准备一个可用的上游模型 API Key，例如 OpenAI、DeepSeek、火山、硅基流动等。
- [ ] 在后台「渠道」里新增一个渠道。
- [ ] 在后台「令牌」里创建一个测试 Token。
- [ ] 使用 `curl` 验证 `/v1/chat/completions` 能正常调用。

示例：

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <你的 One API 测试 Token>" \
  -d '{
    "model": "<后台渠道支持的模型名>",
    "messages": [
      {
        "role": "user",
        "content": "hello"
      }
    ]
  }'
```

## P1 做成「帧桥 API」

- [ ] 在后台系统设置里把系统名称改成：`帧桥 API`。
- [ ] 在 README 中补充本地启动方式。
- [ ] 考虑将本地仓库目录从 `VideoBridge` 调整为 `FrameBridge` 或 `framebridge-api`。
- [ ] 修改 `docker-compose.yml` 中的默认弱密码。
- [ ] 修改 `SESSION_SECRET=random_string` 为强随机字符串。
- [ ] 补充一份本地环境说明，记录端口、数据库、Redis、持久化目录等配置。

## P2 为 Seedance 改造做准备

- [ ] 跑通源码构建流程。
- [ ] 构建前端：

```bash
cd /Users/bytedance/my_workspace/VideoBridge/web/default
npm install
npm run build
```

- [ ] 构建后端：

```bash
cd /Users/bytedance/my_workspace/VideoBridge
go mod download
go build -ldflags "-s -w" -o one-api
```

- [ ] 本地运行源码构建产物：

```bash
./one-api --port 3000 --log-dir ./logs
```

- [ ] 梳理现有路由入口：
  - `router/relay.go`
  - `controller/relay.go`
  - `relay/controller/*`
- [ ] 设计视频任务 API 草案：
  - `POST /v1/videos/generations`
  - `GET /v1/videos/tasks/:id`
  - `POST /v1/videos/tasks/:id/cancel`
- [ ] 设计核心数据表：
  - `video_tasks`
  - `video_task_events`
  - `ledger_entries`
  - `provider_jobs`
- [ ] 先做 fake Seedance provider，用本地假任务模拟 `pending -> running -> succeeded`。
- [ ] fake provider 跑通后，再接真实 Seedance 上游。

## 验收标准

- [ ] `docker compose ps` 显示 `one-api`、`mysql`、`redis` 均已启动。
- [ ] `http://localhost:3000` 可以正常打开。
- [ ] 可以使用 `root` 登录，并已修改默认密码。
- [ ] 后台至少存在 1 个可用渠道。
- [ ] 后台至少存在 1 个测试 Token。
- [ ] `/v1/chat/completions` 可以返回正常响应。

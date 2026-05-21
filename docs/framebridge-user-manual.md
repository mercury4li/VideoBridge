# 帧桥 API / One API 用户手册

最后更新：2026-05-21

## 适用范围

本文档说明当前本地版帧桥 API，也就是基于 One API 的中转站 demo，应该如何配置、使用和排查问题。

当前系统先复用 One API 的能力：

- 用户注册和登录
- 上游渠道配置
- 下游 API Token 管理
- OpenAI 兼容接口转发
- 用户额度、Token 额度、日志
- 兑换码和人工充值

当前尚未包含自动支付、发票、视频任务、对象存储和 webhook。这些属于后续 Seedance 视频任务 MVP 范围。

## 基本概念

One API 是一个 API 中转网关。它不直接生成内容，而是把用户请求转发到 OpenAI、Kimi、DeepSeek、火山等上游模型服务。

调用链路：

```text
你的应用
  -> One API Token
  -> One API / 帧桥 API
  -> 上游渠道 Key
  -> 模型服务商
```

两种 Key 不要混用：

- 上游渠道 Key：管理员填在「渠道」里，例如 Kimi / OpenAI 的真实 API Key。
- One API Token：用户或业务系统调用本中转站时使用的 `sk-...` Token。

## 本地访问

本地服务地址：

```text
http://localhost:3000
```

默认管理员账号：

```text
用户名：root
密码：123456
```

首次登录后应立即修改默认密码。

API Base URL：

```text
http://localhost:3000/v1
```

## 管理员使用流程

### 1. 配置上游渠道

进入「渠道」页面，新增渠道。

常用字段：

| 字段 | 含义 |
|---|---|
| 名称 | 方便识别，例如 `kimi-main`、`openai-test` |
| 类型 | 上游服务商类型，例如 `Moonshot AI`、`OpenAI` |
| 密钥 | 上游服务商的真实 API Key |
| 代理 | 一般留空 |
| Base URL | 上游 API 地址；默认值不满足时必须手动填写 |
| 模型 | 该渠道支持的模型名，多个模型用逗号分隔 |
| 分组 | 用户组，默认是 `default` |

配置后点击「测试」。测试通过才说明 One API 能正常访问该上游。

### 2. 创建用户 Token

进入「令牌」页面，创建新的 One API Token。

建议字段：

| 字段 | 含义 |
|---|---|
| 名称 | 业务用途，例如 `local-test`、`web-app` |
| 剩余额度 | 这个 Token 最多可消耗的额度 |
| 过期时间 | 可选 |
| 模型限制 | 可选；为空表示不额外限制 |
| 无限额度 | 仅本地测试或管理员自用时考虑 |

Token 创建后，用户程序调用接口时使用这个 Token，而不是上游渠道 Key。

### 3. 查看日志

进入「日志」页面查看请求记录。

重点看：

- 调用时间
- 用户名
- Token 名称
- 模型名
- 渠道 ID
- 消耗额度
- 上游错误信息
- 请求耗时

排查问题时，日志里的模型名、渠道 ID 和上游错误最关键。

## 普通用户使用流程

### 1. 获取 Token

用户登录后进入「令牌」页面，创建或复制自己的 One API Token。

### 2. 调用接口

curl 示例：

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-你的OneAPI令牌" \
  -d '{
    "model": "moonshot-v1-8k",
    "messages": [
      {
        "role": "user",
        "content": "你好，介绍一下你自己"
      }
    ]
  }'
```

Python OpenAI SDK 示例：

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-你的OneAPI令牌",
    base_url="http://localhost:3000/v1",
)

resp = client.chat.completions.create(
    model="moonshot-v1-8k",
    messages=[
        {"role": "user", "content": "你好"}
    ],
)

print(resp.choices[0].message.content)
```

Node.js OpenAI SDK 示例：

```js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-你的OneAPI令牌",
  baseURL: "http://localhost:3000/v1",
});

const resp = await client.chat.completions.create({
  model: "moonshot-v1-8k",
  messages: [
    { role: "user", content: "你好" },
  ],
});

console.log(resp.choices[0].message.content);
```

### 3. 模型名必须匹配

请求里的 `model` 必须是渠道里配置过、并且上游真实支持的模型名。

如果模型名不存在或当前 Key 无权限，常见错误是：

```text
404 The model does not exist or you do not have access to it
```

处理方式：

- 在渠道里改成真实可用模型。
- 或配置模型映射，把用户侧模型名映射到上游实际模型名。

## 额度和充值

### 1. One API 额度不是上游余额

One API 有自己的内部额度账本。它和 Kimi、OpenAI 等上游平台的真实余额是两套东西。

```text
用户付钱给你
  -> 你给用户发 One API 额度
  -> 用户调用 One API
  -> One API 扣用户额度和 Token 额度
  -> One API 用你的上游 Key 请求模型服务商
  -> 上游服务商扣你的真实余额
```

所以必须同时保证：

- 用户在 One API 里有额度。
- Token 本身有额度。
- 上游平台账号有余额。

### 2. 默认额度换算

当前本地默认配置：

```text
500000 额度 = $1
100000 额度 = $0.2
1000000 额度 = $2
```

这个换算由 `QuotaPerUnit` 控制，默认值是：

```text
QuotaPerUnit = 500000
```

### 3. 扣费逻辑

文本模型请求的内部扣费大致是：

```text
扣除额度 = (输入 tokens + 输出 tokens × 输出倍率) × 模型倍率 × 用户组倍率
```

请求开始前会先做预扣，用来避免用户余额不足还继续请求上游。请求成功后再按实际上游返回的 usage 做结算，多退少补。

如果请求上游失败，会返还预扣额度。

### 4. 兑换码

兑换码由管理员在「兑换」页面生成。

创建字段：

| 字段 | 含义 |
|---|---|
| 名称 | 方便管理员识别 |
| 额度 | 每张兑换码能增加的用户额度 |
| 数量 | 一次生成多少张，单次最多 100 张 |

创建后系统会下载一个 txt 文件，里面是兑换码列表。

兑换码只能使用一次。用户兑换后：

- 用户额度增加。
- 兑换码状态变为已使用。
- 系统写入充值日志。

### 5. 充值页

用户进入「充值」页面后，可以输入兑换码完成充值。

页面里的「获取充值码」按钮不是内置支付。它只会打开后台配置的外部充值链接。

如果要接入真实支付，推荐流程是：

```text
用户在外部支付系统付款
  -> 支付系统确认成功
  -> 发放兑换码，或调用 One API 管理接口给用户加额度
```

当前 MVP 阶段建议先使用人工充值和兑换码，不做自动支付。

## 常见问题

### 渠道测试返回 401

含义：上游认证失败。

常见原因：

- API Key 填错。
- Key 已删除或失效。
- Key 属于另一个平台区域。
- Base URL 和 Key 不匹配。

Kimi 常见场景：

```text
platform.kimi.ai 的 Key + api.moonshot.cn => 401
platform.kimi.ai 的 Key + api.moonshot.ai => 正确
```

### 渠道测试返回 404 模型不存在

含义：认证可能已经通过，但模型名不对或当前 Key 没权限。

处理方式：

- 换成上游模型列表里真实存在的模型。
- 检查渠道模型列表。
- 检查模型映射。

### 渠道测试返回 429

含义：上游限流、余额不足或套餐限制。

如果错误里包含：

```text
insufficient balance
```

说明上游账号需要充值。

### 请求返回用户额度不足

含义：One API 用户余额不够。

处理方式：

- 管理员给用户增加额度。
- 用户在「充值」页兑换充值码。

### 请求返回令牌额度不足

含义：Token 自己的额度不够。

处理方式：

- 编辑 Token，增加剩余额度。
- 或将 Token 设置为无限额度，仅建议本地测试或管理员自用。

### 为什么渠道测试通过，用户调用还是失败

优先检查：

- 用户请求的 `model` 是否和渠道模型一致。
- 用户账号额度是否足够。
- Token 额度是否足够。
- 用户分组是否能匹配到渠道分组。
- 日志里实际选择的渠道 ID 和错误信息。

## 本地排查命令

查看服务日志：

```bash
tail -f /Users/bytedance/my_workspace/VideoBridge/logs/framebridge-dev.log
```

查看后台服务是否监听 3000：

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

查看 MySQL 和 Redis：

```bash
cd /Users/bytedance/my_workspace/VideoBridge
docker compose ps
```

查看后台进程：

```bash
screen -ls
```

停止本地后台服务：

```bash
screen -S framebridge-dev -X quit
```

## 安全注意事项

- 不要把上游 API Key 放到客户端。
- 不要把上游 API Key 发给用户。
- 用户只应该拿到 One API Token。
- API Key 一旦出现在聊天记录、截图或日志里，应立即删除并重新生成。
- 生产环境必须修改默认管理员密码。
- 生产环境必须修改默认数据库密码和 `SESSION_SECRET`。

## 推荐本地验收流程

1. 管理员登录后台。
2. 新增一个 Kimi 或 OpenAI 渠道。
3. 点击渠道测试并通过。
4. 创建一个测试 Token。
5. 确认用户账号和 Token 都有额度。
6. 使用 curl 调 `/v1/chat/completions`。
7. 在「日志」页面确认有消费记录。
8. 创建一张兑换码。
9. 在「充值」页兑换。
10. 确认用户额度增加。

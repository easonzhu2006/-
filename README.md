# Vocabulary & Corpus

这是一个单文件前端学习网站，同时包含 Cloudflare Pages Function，用于安全代理 AI 请求。现在代理支持 OpenAI 兼容接口，因此可以接入悟空 API。

## 本地预览

直接用 Chrome 或 Edge 打开 `index.html` 即可查看页面。单独打开本地文件时，AI 接口不会工作，因为 `/api/generate-passage` 需要部署在 Cloudflare 上。

## Cloudflare Pages 正确部署方式

必须部署整个项目文件夹，至少包含：

```text
index.html
functions/api/generate-passage.js
```

只上传 `index.html` 或只上传 `dist`，都会导致 `/api/generate-passage` 返回 404。

## GitHub 自动部署（推荐）

1. 把整个项目文件夹上传到 GitHub 仓库，确认 GitHub 页面里能看到 `functions` 文件夹。
2. Cloudflare Dashboard -> **Workers & Pages** -> 打开已有的 `vocabulary-5lr` 项目。
3. 进入 **Settings -> Builds & deployments**，确认：
   - Root directory：留空，或填写项目所在的仓库目录。
   - Build command：留空。
   - Build output directory：填写 `.`。
4. 进入 **Settings -> Variables and Secrets**，选择 **Production**。
5. 添加加密 Secret：
   - Name：`OPENAI_API_KEY`
   - Value：你的悟空 API Key，不要带 `Bearer ` 前缀。
6. 添加普通变量：
   - Name：`OPENAI_BASE_URL`
   - Value：悟空 API 提供的 OpenAI-compatible base URL，通常形如 `https://你的悟空接口域名/v1`。
   - 如果悟空给你的是完整地址 `.../v1/chat/completions`，也可以先填进去，代码会自动处理。
7. 添加普通变量：
   - Name：`OPENAI_MODEL`
   - Value：悟空后台支持的模型名，例如 `gpt-4o-mini`、`gpt-4o`，或悟空文档给你的模型名。
8. 回到 **Deployments**，点击 **Retry deployment**，或提交一次新的 GitHub 更新触发部署。

## Wrangler 部署

在项目根目录执行：

```bash
npx wrangler pages deploy . --project-name vocabulary-5lr
npx wrangler pages secret put OPENAI_API_KEY --project-name vocabulary-5lr
```

`OPENAI_BASE_URL` 和 `OPENAI_MODEL` 建议在 Cloudflare Dashboard 的 Variables and Secrets 中设置。

## 如何检查接口是否真正上线

在浏览器地址栏打开：

```text
https://vocabulary-5lr.pages.dev/api/generate-passage
```

看到类似下面的结果，说明 Function 已上线：

```json
{"ok":true,"service":"generate-passage"}
```

如果返回内容里 `providerBaseUrl` 仍然是：

```text
https://api.openai.com/v1
```

说明你还没有在 Cloudflare Production 环境设置 `OPENAI_BASE_URL`，或者设置后没有重新部署。

## 常见错误含义

`404`：当前部署没有包含 `functions` 文件夹。

`Method not allowed`：旧版本接口还在运行，或者你访问的是只接受 POST 的旧 Function。重新部署新版后，GET 应该返回健康检查 JSON。

`OPENAI_API_KEY is not configured`：Function 已上线，但 Cloudflare Production 环境还没有添加密钥。

`401`：悟空 API 拒绝身份验证。常见原因是 key 填错、key 前面带了 `Bearer `、`OPENAI_BASE_URL` 仍指向 OpenAI 官方、模型名不是悟空支持的模型名。

`429`：账户额度不足或请求频率受限。

## 重要安全说明

不要把真实 API Key 写进 `index.html`，也不要保存到 GitHub。生产环境只把密钥添加到 Cloudflare 的 **Variables and Secrets -> Production -> Encrypted Secret** 中。`OPENAI_BASE_URL` 和 `OPENAI_MODEL` 可以作为普通变量保存。网站目前的登录和学习资产仍是浏览器本地存储，后续接入真实账号系统时需要数据库和身份认证服务。

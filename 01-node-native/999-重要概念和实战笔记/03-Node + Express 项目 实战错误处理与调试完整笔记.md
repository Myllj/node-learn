# Node \+ Express 项目 实战错误处理与调试完整笔记

## 前言

本文为**企业实战标准**，只保留 Node 原生 \+ Express 后端项目通用的错误捕获、统一异常处理、本地调试、线上运维方案，完全适配日常业务开发、接口开发、服务部署，剔除无关技术栈，可直接作为项目规范落地。

---

## 一、Node 项目三类核心错误（必须分清，处理方式不同）

### 1\. 同步代码错误（throw 抛出）

普通逻辑、参数校验、同步计算报错，直接用 `try / catch` 捕获。

```javascript
function calcNum(a, b) {
  if (!a || !b) throw new Error('参数不能为空')
  return a + b
}

// 同步标准捕获
try {
  calcNum()
} catch (err) {
  console.error('同步业务错误：', err.message)
}

```

### 2\. 异步 Promise / async\-await 错误（后端 90% 错误来源）

数据库、文件、网络请求全部是异步，不捕获会出现**未捕获异步异常**，严重直接崩服务。

```javascript
// 1. async/await 标准写法（业务接口必备）
async function getUsers() {
  try {
    const res = await db.query('select * from user')
    return res
  } catch (err) {
    console.error('数据库查询异常：', err)
    throw err // 抛出交给全局中间件处理
  }
}

// 2. 裸 Promise 必须加 .catch()
fs.promises.readFile('test.txt')
.catch(err => console.error('文件读取失败', err))

```

### 3\. 事件流/IO 类错误（EventEmitter 体系）

所有 Stream、HTTP、Socket、文件流底层都继承 EventEmitter，**必须监听 error 事件**，否则进程直接崩溃。

```javascript
const rs = fs.createReadStream('big-file.mp4')
// 必写！不监听程序直接挂
rs.on('error', (err) => {
  console.error('文件流异常：', err.message)
})

```

---

## 二、Node 全局兜底错误监听（项目入口必配，防止服务宕机）

捕获所有遗漏的、未手动处理的致命错误，是线上服务的最后一道防线，直接写在项目入口 app\.js 最顶部。

```javascript
// 1. 捕获所有未处理的同步致命异常
process.on('uncaughtException', (err) => {
  console.error('【致命同步错误】', err.message, err.stack)
  // 记录日志后优雅退出，由PM2自动重启
  process.exit(1)
})

// 2. 捕获所有未处理的 Promise 异步异常
process.on('unhandledRejection', (reason, promise) => {
  console.error('【未捕获异步异常】', reason.message)
})

```

**作用**：防止单个接口/单个IO异常导致整个服务崩溃。

---

## 三、Express 企业级分层错误处理（核心重点）

Express 错误处理固定四层架构：**参数主动校验抛出 → 自定义业务错误类 → 异步路由包装器 → 全局统一错误中间件**

### 1\. 统一自定义业务错误类（规范返回格式）

新建 `utils/HttpError.js`，统一业务错误状态码、错误信息、错误标识

```javascript
class HttpError extends Error {
  constructor(message, statusCode = 500, errorCode = 'SERVER_ERROR') {
    super(message)
    this.statusCode = statusCode // HTTP状态码
    this.errorCode = errorCode // 业务错误码
  }
}

module.exports = HttpError

```

### 2\. 异步路由统一包装器（不用每段写 try/catch）

解决 Express 原生异步路由报错不触发全局中间件、接口挂起问题

```javascript
// utils/wrapAsync.js
const wrapAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

module.exports = wrapAsync

```

### 3\. 业务路由实战使用

```javascript
const express = require('express')
const router = express.Router()
const HttpError = require('../utils/HttpError')
const wrapAsync = require('../utils/wrapAsync')

// 示例：获取用户信息接口
router.get('/user/:id', wrapAsync(async (req, res) => {
  const { id } = req.params

  // 1. 参数校验主动抛错
  if (!id) {
    throw new HttpError('用户ID不能为空', 400, 'PARAM_EMPTY')
  }

  // 2. 业务逻辑
  const user = await db.getUserById(id)
  if (!user) {
    throw new HttpError('用户不存在', 404, 'USER_NOT_FOUND')
  }

  res.json({
    code: 0,
    msg: 'success',
    data: user
  })
}))

module.exports = router

```

### 4\. 全局统一错误中间件（固定四参数）

新建 `middleware/errorHandler.js`，**必须放在所有路由最后注册**

```javascript
const HttpError = require('../utils/HttpError')

// 四参数中间件：err, req, res, next
module.exports = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development'

  // 自定义业务错误
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      code: err.errorCode,
      msg: err.message,
      // 开发环境展示堆栈，生产环境隐藏
      stack: isDev ? err.stack : undefined
    })
  }

  // 系统未知异常、数据库崩溃、第三方接口报错
  res.status(500).json({
    code: 'SERVER_CRASH',
    msg: isDev ? err.message : '服务器内部异常，请稍后重试',
    stack: isDev ? err.stack : undefined
  })
}

```

### 5\. 入口文件完整挂载顺序（顺序绝对不能乱）

```javascript
const express = require('express')
const app = express()
const errorHandler = require('./middleware/errorHandler')

// 1. 基础中间件
app.use(express.json())

// 2. 挂载所有业务路由
app.use('/api', require('./routes'))

// 3. 404 兜底
app.use((req, res, next) => {
  next(new HttpError('请求接口不存在', 404, 'API_NOT_FOUND'))
})

// 4. 全局错误处理（必须在最末尾）
app.use(errorHandler)

app.listen(3000)

```

---

## 四、日常开发调试手段（工作高频实用）

### 1\. 控制台精准调试（替代无脑 console\.log）

```javascript
// 1. 打印完整深层对象（数据库返回数据、复杂配置）
console.dir(obj, { depth: null })

// 2. 打印调用堆栈，定位代码执行来源
console.trace('当前调用栈')

// 3. 分级输出
console.info('正常日志')
console.warn('警告日志')
console.error('错误日志')

```

### 2\. VSCode 断点调试（企业开发首选）

无需大量打印日志，支持单步调试、查看变量、异步代码追踪。

根目录新建 `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "启动Node调试",
      "cwd": "${workspaceFolder}",
      "program": "${workspaceFolder}/app.js",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal"
    }
  ]
}

```

使用：打断点 → F5 启动调试 → 拦截接口请求、逐行排查 Bug

### 3\. 日志分级管理（winston）

区分开发/生产日志，开发看详细信息，生产只留存错误日志，避免日志爆炸

```javascript
const winston = require('winston')
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
})

logger.debug('开发调试信息')
logger.error('服务异常错误')

```

### 4\. 接口调试工具

- Apifox / Postman：模拟 GET/POST 请求，查看错误码、返回格式、参数报错

- 终端日志：查看完整请求链路、报错堆栈

---

## 五、生产环境线上错误处理规范（上线必备）

### 1\. 安全规范

- 生产环境**禁止返回错误堆栈（stack）**给前端，防止泄露服务器路径和源码

- 所有 500 错误统一友好提示：「服务器内部异常，请稍后重试」

### 2\. 进程守护（PM2）

保证服务报错崩溃后自动重启，不影响线上业务

```bash
pm2 start app.js --name=node-service
pm2 startup
pm2 save

```

### 3\. 错误监控上报（Sentry）

自动捕获线上所有异常、记录请求参数、报错堆栈，无需复现即可定位 Bug，企业项目标配。

```javascript
const Sentry = require('@sentry/node')
Sentry.init({ dsn: '你的项目DSN地址' })

// 最顶层注册
app.use(Sentry.Handlers.requestHandler())
// 路由...
app.use(Sentry.Handlers.errorHandler())

```

---

## 六、高频踩坑总结（工作 90% 人都会错）

- Express 异步路由不写 `next(err)` / 不用包装器 → 报错不响应、前端超时

- Promise 不写 catch、async 不 try/catch → 产生未捕获异常，服务逐步崩掉

- 文件流、网络流不监听 error 事件 → IO 报错直接宕机

- 错误中间件注册在路由前面 → 完全不生效

- 生产环境返回完整 stack 堆栈 → 源码路径泄露，存在安全隐患

- 不配置全局 unhandledRejection → 偶发报错无日志、无法定位问题

---

## 七、最终工作标准流程

### 本地开发调试

1. 简单 Bug：`console.dir / console.trace` 快速排查

2. 复杂逻辑：VSCode 断点调试逐行追踪

3. 接口问题：Apifox 模拟请求，校验参数与返回值

### 错误统一处理

1. 同步代码：try/catch

2. 异步接口：统一 wrapAsync 包装 \+ 全局错误中间件

3. IO/流：强制监听 error 事件

4. 全局兜底：uncaughtException \+ unhandledRejection

### 线上生产

1. PM2 进程守护，崩溃自动重启

2. winston 分级持久化日志

3. Sentry 实时监控报错、推送告警

4. 屏蔽前端错误堆栈，保证服务安全

> （注：部分内容可能由 AI 生成）

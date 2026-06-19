# Node\.js原生http模块完整学习教程

> 本文档包含完整 API 说明、入门示例、3 个实战场景，所有代码均可直接复制运行
> 
> 

---

## 目录

1. \[模块概述\]\(\#模块概述\)

2. \[核心 API 完整说明\]\(\#核心\-api\-完整说明\)

3. \[入门示例：Hello World 服务器\]\(\#入门示例hello\-world\-服务器\)

4. \[实战场景 1：静态文件服务器\]\(\#实战场景\-1静态文件服务器\)

5. \[实战场景 2：后端 RESTful 接口服务\]\(\#实战场景\-2后端\-restful\-接口服务\)

6. \[实战场景 3：CORS 跨域处理\]\(\#实战场景\-3cors\-跨域处理\)

7. \[最佳实践与常见踩坑\]\(\#最佳实践与常见踩坑\)

---

## 模块概述

Node\.js 原生 `http` 模块是构建 Web 服务器的核心模块，无需安装第三方依赖，直接 `require('http')` 即可使用。

**主要功能：**

- 创建 HTTP 服务器和客户端

- 处理请求和响应

- 管理 HTTP 头部、状态码

- 支持流式数据处理

**优点：**

- 零依赖，原生性能优秀

- 轻量灵活，可高度定制

- 理解底层原理，为学习 Express/Koa 等框架打下基础

---

## 核心 API 完整说明

### 1\. http\.createServer\(\[options\]\[, requestListener\]\)

创建 HTTP 服务器实例，最核心的方法。

```javascript
const http = require('http');
const server = http.createServer((req, res) => {
  // 请求处理逻辑
});
```

**返回值：** `http.Server` 实例

**Server 类常用方法：**

|方法|说明|
|---|---|
|`server.listen(port, [hostname], [backlog], [callback])`|启动服务器监听端口|
|`server.close([callback])`|关闭服务器|
|`server.on('request', (req, res) => {})`|监听请求事件|
|`server.on('listening', () => {})`|监听启动成功事件|
|`server.on('error', (err) => {})`|监听错误事件|

---

### 2\. IncomingMessage 对象 \(req \- 请求对象\)

代表客户端的 HTTP 请求，包含所有请求信息。

**常用属性：**

|属性|类型|说明|示例值|
|---|---|---|---|
|`req.method`|string|请求方法|`'GET'`, `'POST'`, `'PUT'`, `'DELETE'`|
|`req.url`|string|请求路径（含查询参数）|`'/api/user?id=123'`|
|`req.headers`|object|请求头对象|`{'content-type': 'application/json'}`|
|`req.httpVersion`|string|HTTP 版本|`'1.1'`|
|`req.socket`|Socket|底层 Socket 连接|\-|

**常用方法：**

- `req.on('data', (chunk) => {})` \- 监听请求体数据（POST/PUT 等）

- `req.on('end', () => {})` \- 请求体接收完成

- 可读流，可通过管道传输

---

### 3\. ServerResponse 对象 \(res \- 响应对象\)

代表服务器的 HTTP 响应，用于向客户端发送数据。

**常用方法：**

|方法|说明|示例|
|---|---|---|
|`res.writeHead(statusCode, [statusMessage], [headers])`|设置响应头和状态码|`res.writeHead(200, {'Content-Type': 'text/plain'})`|
|`res.setHeader(name, value)`|设置单个响应头|`res.setHeader('Content-Type', 'application/json')`|
|`res.getHeader(name)`|获取响应头|`res.getHeader('Content-Type')`|
|`res.removeHeader(name)`|删除响应头|\-|
|`res.write(chunk, [encoding])`|写入响应体|`res.write('Hello World')`|
|`res.end([data], [encoding])`|结束响应（必须调用）|`res.end(JSON.stringify({code: 0}))`|
|`res.statusCode`|设置 / 获取状态码|`res.statusCode = 404`|
|`res.statusMessage`|设置状态消息|`res.statusMessage = 'Not Found'`|

**重要注意：** `res.end()` 必须调用，否则客户端会一直挂起等待！

---

## 入门示例：Hello World 服务器

### 最简版服务器

```javascript
// 01-hello-server.js
const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
  // 设置响应头
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8'
  });
  
  // 发送响应内容并结束
  res.end('Hello World! 你好，Node.js HTTP 服务器！\n');
});

server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
```

**运行方式：**

```bash
node 01-hello-server.js
# 浏览器访问 http://localhost:3000
```

---

### 增强版：根据不同路径返回不同内容

```javascript
// 02-hello-router.js
const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
  const { method, url } = req;
  
  console.log(`收到请求: ${method} ${url}`);
  
  // 设置通用响应头
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  // 简单路由处理
  switch (url) {
    case '/':
      res.statusCode = 200;
      res.end('<h1>🏠 首页</h1><p>欢迎来到 Node.js HTTP 服务器</p>');
      break;
      
    case '/about':
      res.statusCode = 200;
      res.end('<h1>📖 关于我们</h1><p>这是一个原生 http 模块演示</p>');
      break;
      
    default:
      res.statusCode = 404;
      res.end('<h1>❌ 404 页面不存在</h1>');
  }
});

server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
```

---

## 实战场景 1：静态文件服务器

支持访问 HTML、CSS、JS、图片等静态资源，自动识别 MIME 类型。

```javascript
// 03-static-server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
// 静态文件根目录（当前目录下的 public 文件夹）
const STATIC_ROOT = path.join(__dirname, 'public');

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
  // 处理 favicon
  if (req.url === '/favicon.ico') {
    res.statusCode = 204;
    return res.end();
  }

  // 解析文件路径
  let filePath = path.join(STATIC_ROOT, req.url === '/' ? 'index.html' : req.url);
  const extname = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  // 读取文件
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 文件不存在
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>❌ 404 文件不存在</h1>');
      } else {
        // 服务器错误
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h1>❌ 服务器错误: ${err.code}</h1>`);
      }
      return;
    }

    // 成功返回文件
    res.writeHead(200, { 'Content-Type': `${contentType}; charset=utf-8` });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`静态文件服务器运行在 http://localhost:${PORT}`);
  console.log(`静态资源目录: ${STATIC_ROOT}`);
});
```

**使用说明：**

1. 在同级目录创建 `public` 文件夹

2. 在 `public` 中放入 `index.html`、CSS、JS、图片等文件

3. 运行服务器，浏览器访问即可

---

## 实战场景 2：后端 RESTful 接口服务

完整的用户 CRUD 接口，支持 GET/POST/PUT/DELETE，解析 JSON 请求体。

```javascript
// 04-api-server.js
const http = require('http');

const PORT = 3000;

// 模拟数据库
let users = [
  { id: 1, name: '张三', age: 25, email: 'zhangsan@example.com' },
  { id: 2, name: '李四', age: 30, email: 'lisi@example.com' }
];
let nextId = 3;

// 工具函数：解析 JSON 请求体
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('JSON 解析失败'));
      }
    });
    req.on('error', reject);
  });
}

// 工具函数：发送 JSON 响应
function sendJson(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8'
  });
  res.end(JSON.stringify({
    code: 0,
    message: 'success',
    data
  }));
}

// 工具函数：发送错误响应
function sendError(res, message, statusCode = 400) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8'
  });
  res.end(JSON.stringify({
    code: statusCode,
    message,
    data: null
  }));
}

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  
  // 设置 CORS 头（跨域支持，详见场景3）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理 OPTIONS 预检请求
  if (method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  try {
    // 路由处理
    if (url === '/api/users' && method === 'GET') {
      // 1. 获取用户列表
      sendJson(res, users);
      
    } else if (url.match(/^\/api\/users\/\d+$/) && method === 'GET') {
      // 2. 获取单个用户
      const id = parseInt(url.split('/')[3]);
      const user = users.find(u => u.id === id);
      user ? sendJson(res, user) : sendError(res, '用户不存在', 404);
      
    } else if (url === '/api/users' && method === 'POST') {
      // 3. 新增用户
      const body = await parseBody(req);
      if (!body.name) return sendError(res, 'name 不能为空');
      
      const newUser = { id: nextId++, ...body };
      users.push(newUser);
      sendJson(res, newUser, 201);
      
    } else if (url.match(/^\/api\/users\/\d+$/) && method === 'PUT') {
      // 4. 更新用户
      const id = parseInt(url.split('/')[3]);
      const index = users.findIndex(u => u.id === id);
      if (index === -1) return sendError(res, '用户不存在', 404);
      
      const body = await parseBody(req);
      users[index] = { ...users[index], ...body };
      sendJson(res, users[index]);
      
    } else if (url.match(/^\/api\/users\/\d+$/) && method === 'DELETE') {
      // 5. 删除用户
      const id = parseInt(url.split('/')[3]);
      const index = users.findIndex(u => u.id === id);
      if (index === -1) return sendError(res, '用户不存在', 404);
      
      const deleted = users.splice(index, 1)[0];
      sendJson(res, deleted);
      
    } else {
      sendError(res, '接口不存在', 404);
    }
  } catch (err) {
    sendError(res, err.message, 500);
  }
});

server.listen(PORT, () => {
  console.log(`API 服务器运行在 http://localhost:${PORT}`);
  console.log('接口列表:');
  console.log('  GET    /api/users     - 获取用户列表');
  console.log('  GET    /api/users/:id - 获取单个用户');
  console.log('  POST   /api/users     - 新增用户');
  console.log('  PUT    /api/users/:id - 更新用户');
  console.log('  DELETE /api/users/:id - 删除用户');
});
```

**接口测试示例（curl）：**

```bash
# 获取用户列表
curl http://localhost:3000/api/users

# 新增用户
curl -X POST -H "Content-Type: application/json" -d '{"name":"王五","age":28}' http://localhost:3000/api/users

# 更新用户
curl -X PUT -H "Content-Type: application/json" -d '{"age":26}' http://localhost:3000/api/users/1

# 删除用户
curl -X DELETE http://localhost:3000/api/users/1
```

---

## 实战场景 3：CORS 跨域处理

完整的跨域解决方案，支持简单请求、预检请求、带凭证请求。

```javascript
// 05-cors-server.js
const http = require('http');

const PORT = 3000;

// CORS 配置
const CORS_CONFIG = {
  // 允许的源，生产环境应指定具体域名，如 'https://example.com'
  'Access-Control-Allow-Origin': '*',
  // 允许的请求方法
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD',
  // 允许的请求头
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  // 允许客户端获取的响应头
  'Access-Control-Expose-Headers': 'Content-Length, X-Custom-Header',
  // 预检请求缓存时间（秒）
  'Access-Control-Max-Age': '86400',
  // 是否允许携带凭证（Cookie）
  // 注意：设为 true 时，Origin 不能为 *，必须指定具体域名
  'Access-Control-Allow-Credentials': 'false'
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(e); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  
  // ========== 第一步：设置 CORS 响应头 ==========
  Object.entries(CORS_CONFIG).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // ========== 第二步：处理 OPTIONS 预检请求 ==========
  // 浏览器在发送非简单请求前会先发 OPTIONS 预检
  if (method === 'OPTIONS') {
    res.statusCode = 204; // No Content
    return res.end();
  }

  // ========== 第三步：正常业务处理 ==========
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  try {
    if (url === '/api/cors-test' && method === 'GET') {
      // 测试 GET 跨域
      res.end(JSON.stringify({
        code: 0,
        message: 'GET 跨域请求成功！',
        method,
        timestamp: new Date().toISOString()
      }));
      
    } else if (url === '/api/cors-test' && method === 'POST') {
      // 测试 POST 跨域（会触发预检）
      const body = await parseBody(req);
      res.end(JSON.stringify({
        code: 0,
        message: 'POST 跨域请求成功！',
        method,
        receivedData: body,
        timestamp: new Date().toISOString()
      }));
      
    } else if (url === '/api/cors-test' && method === 'PUT') {
      // 测试 PUT 跨域（会触发预检）
      const body = await parseBody(req);
      res.end(JSON.stringify({
        code: 0,
        message: 'PUT 跨域请求成功！',
        method,
        receivedData: body,
        timestamp: new Date().toISOString()
      }));
      
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ code: 404, message: 'Not Found' }));
    }
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ code: 500, message: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`CORS 跨域服务器运行在 http://localhost:${PORT}`);
  console.log('');
  console.log('前端测试代码（在其他域名页面控制台执行）：');
  console.log(`
fetch('http://localhost:3000/api/cors-test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: '测试跨域' })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
  `);
});
```

### CORS 关键知识点

|请求类型|触发条件|是否发预检|
|---|---|---|
|简单请求|GET/HEAD/POST \+ 标准 Content\-Type \+ 标准请求头|❌ 不发|
|非简单请求|PUT/DELETE/ 自定义头 /application/json|✅ 先发 OPTIONS 预检|

**生产环境注意事项：**

1. `Access-Control-Allow-Origin` 不要设为 `*`，应指定具体域名

2. 需要 Cookie 时，`Allow-Origin` 不能为 `*`，且 `Allow-Credentials` 必须为 `true`

3. 前端 `fetch`/`axios` 需要设置 `withCredentials: true`

---

## 最佳实践与常见踩坑

### ✅ 最佳实践

1. **统一错误处理**

    - 所有异步操作都要 catch 错误

    - 统一响应格式，方便前端处理

2. **使用 Promise 封装请求体解析**

    - 避免回调地狱，代码更清晰

    - 参考场景 2 中的 `parseBody` 函数

3. **合理设置响应头**

    - 始终设置正确的 `Content-Type`

    - 中文必须加 `charset=utf-8`，否则乱码

4. **优雅关闭服务器**

```javascript
process.on('SIGINT', () => {
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
```

### ❌ 常见踩坑

1. **忘记调用 ****`res.end()`**

    - 后果：客户端一直 pending，超时

    - 每个分支都必须确保 `res.end()` 被调用

2. **中文乱码**

    - 原因：没设置 `charset=utf-8`

    - 正确：`'Content-Type': 'text/plain; charset=utf-8'`

3. **POST 请求体为空**

    - 原因：忘记监听 `data` 事件

    - 必须通过流的方式接收请求体

4. **路由匹配顺序错误**

    - 精确匹配放前面，通配放后面

    - 注意 `/api/users` 和 `/api/users/:id` 的顺序

5. **CORS 预检没处理**

    - 非简单请求必须处理 `OPTIONS` 方法

    - 返回 204 状态码，不要返回内容

---

## 总结

原生 `http` 模块是 Node\.js Web 开发的基础：

- **优点**：零依赖、高性能、理解底层

- **缺点**：需要手动处理路由、解析、中间件等

- **定位**：学习底层原理，简单场景直接用，复杂项目用 Express/Koa 等框架

掌握原生 http 模块后，再学习任何 Node\.js Web 框架都会事半功倍！

> （注：部分内容可能由 AI 生成）

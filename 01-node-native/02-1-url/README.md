# Node.js url / querystring 模块完整学习笔记（前端转全栈专用）

## 一、实战使用频率分级（真实远程/企业项目结论）

### 1. 分模块区分

#### 1.1 querystring 模块

- **原生模块使用频率：⭐⭐ 低频**
- 现状：Node 内置，但现代项目基本**不再手动引入使用**
- 替代方案：`URLSearchParams`（ES 标准，浏览器/Node 通用）、框架内置解析（Express、Koa、Vite/Webpack）

#### 1.2 url 模块（分两套 API）

1）旧版 API：`url.parse()` / `url.format()`

- 使用频率：⭐ 极低，官方已标记废弃，新项目禁止使用
  2）新版标准 API：`new URL()`、`url.URLSearchParams`
- 使用频率：⭐⭐⭐⭐ 中高频，**日常接口、路由、参数解析必用**

### 2. 综合总结

1. 手写原生 Node http 静态服务、简易中间层、接口代理、URL 参数解析：`new URL()` 高频使用；
2. 业务框架开发（Express/Koa）：几乎不用手动引入 url，框架内部封装完毕；
3. querystring 模块仅老旧维护项目可见，新项目完全弃用；
4. 底层网关、爬虫、接口转发、静态资源服务（你之前写的 http 静态服务器）是这两个模块的核心落地场景。

---

## 二、url 模块两套 API 区分（废弃旧版 / 现代标准 API）

### 2.1 废弃旧版（url.parse / url.format，禁止新项目使用）

底层依赖 querystring 模块解析参数，API 老旧、不标准。

```js
const url = require('url')
const qs = require('querystring')

const urlStr = 'http://127.0.0.1:3000/api/user?id=1&name=zs'
// 解析URL
const urlObj = url.parse(urlStr)
console.log(urlObj.query) // id=1&name=zs
// 解析查询参数
const params = qs.parse(urlObj.query)
console.log(params.id) // 1
```

**缺点**：不兼容浏览器标准，存在路径解析漏洞，Node 官方推荐全部迁移 `new URL()`。

### 2.2 现代标准 API（推荐，全项目统一使用）

无需额外引入 querystring，内置 `URLSearchParams`，浏览器/Node 同构，无兼容性问题。

#### 核心 API 完整参数说明

```js
const { URL, URLSearchParams } = require('url')
```

##### 1）new URL(urlString, base?)

- 参数1：完整url字符串 / 相对路径
- 参数2：可选，基础域名（解析相对路径必备）
- 返回：URL 实例，自带全部解析属性

```js
// 完整绝对地址
const myUrl = new URL('http://127.0.0.1:3000/api/user?id=1&name=zs')
console.log(myUrl.hostname) // 127.0.0.1
console.log(myUrl.port)     // 3000
console.log(myUrl.pathname) // /api/user
console.log(myUrl.search)   // ?id=1&name=zs
console.log(myUrl.origin)    // http://127.0.0.1
// searchParams 内置参数解析器（替代querystring）
const searchParams = myUrl.searchParams
console.log(searchParams.get('id')) // 1
searchParams.set('age', 25) // 新增参数
console.log(searchParams.toString()) // id=1&name=zs&age=25
```

##### 2）URLSearchParams 核心方法（替代 querystring）

| 方法                  | 作用                                  |
| --------------------- | ------------------------------------- |
| `.get(key)`         | 获取单个参数值                        |
| `.getAll(key)`      | 获取同名多参数数组（如 ?ids=1&ids=2） |
| `.set(key, val)`    | 覆盖设置参数                          |
| `.append(key, val)` | 追加同名参数，不覆盖                  |
| `.delete(key)`      | 删除参数                              |
| `.has(key)`         | 判断参数是否存在                      |
| `.toString()`       | 拼接为 query 字符串                   |

---

## 三、querystring 模块（仅老旧项目兼容使用）

### 3.1 四大核心API

```js
const qs = require('querystring')
// 1. parse：字符串 → 对象（解析查询参数）
const obj = qs.parse('id=1&name=zs')
console.log(obj.id) // 1

// 2. stringify：对象 → 查询字符串
const str = qs.stringify({ id: 2, name: 'ls' })
// id=2&name=ls

// 3. escape / unescape：url 编码解码
qs.escape('张三') // %E5%BC%A0%E4%B8%89
qs.unescape('%E5%BC%A0%E4%B8%89') // 张三
```

### 3.2 淘汰原因

1. API 非 ES 标准，浏览器无此模块，无法写同构代码；
2. 不支持多值参数便捷处理，无 `.getAll()`；
3. `new URL().searchParams` 完全覆盖其所有能力，无需额外引入模块。

---

## 四、实战高频使用场景（附完整可运行代码）

### 场景1：原生 http 服务解析 GET 请求参数（最高频）

对应你之前手写的静态web服务器，原生 http 无路由，靠 url 模块解析路径和参数

```js
const http = require('http')
const { URL } = require('url')

const server = http.createServer((req, res) => {
  // 第二个参数填域名，兼容相对路径
  const reqUrl = new URL(req.url, `http://${req.headers.host}`)
  
  // 1. 解析路由路径
  const pathname = reqUrl.pathname
  // 2. 解析get参数
  const id = reqUrl.searchParams.get('id')

  res.setHeader('Content-Type', 'application/json;charset=utf-8')
  if(pathname === '/api/user'){
    res.end(JSON.stringify({ code:200, userId: id }))
  }else{
    res.end(JSON.stringify({ code:404, msg:'接口不存在' }))
  }
})
server.listen(3000)
// 访问 http://127.0.0.1:3000/api/user?id=666 自动解析id
```

### 场景2：接口代理/跨域中间层，动态拼接目标请求地址

远程项目前端跨域代理通用逻辑，解析当前请求url，拼接转发到第三方接口

```js
const http = require('http')
const { URL } = require('url')

const proxyServer = http.createServer((req, res) => {
  const curUrl = new URL(req.url, `http://${req.headers.host}`)
  // 拼接目标第三方接口地址，携带原始所有参数
  const targetUrl = new URL(curUrl.searchParams.toString(), 'https://jsonplaceholder.typicode.com/todos')
  
  // 转发请求
  http.get(targetUrl, (targetRes) => {
    res.writeHead(targetRes.statusCode, targetRes.headers)
    targetRes.pipe(res)
  })
})
proxyServer.listen(3000)
```

### 场景3：爬虫、HTTP客户端动态拼接请求参数

Node 后端调用第三方开放接口，动态拼接 query 参数

```js
const { URL, URLSearchParams } = require('url')
const https = require('https')

// 基础接口地址
const target = new URL('https://api.example.com/list')
// 动态追加参数
target.searchParams.set('page', '1')
target.searchParams.set('size', '10')
target.searchParams.set('keyword', '全栈开发')

// 发起请求
https.get(target, (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => console.log('接口返回', JSON.parse(data)))
})
```

### 场景4：解析静态资源路径、分离路由与参数（你之前clock静态服务器优化）

```js
const http = require('http')
const fs = require('fs')
const path = require('path')
const { URL } = require('url')

const server = http.createServer((req, res) => {
  const curUrl = new URL(req.url, `http://${req.headers.host}`)
  // 分离纯粹资源路径，过滤get参数，避免读取文件路径出错
  const purePath = curUrl.pathname
  let fpath = ''
  if(purePath === '/'){
    fpath = path.join(__dirname, './clock/index.html')
  }else{
    fpath = path.join(__dirname, './clock', purePath)
  }
  fs.readFile(fpath, (err, data) => {
    err ? res.end('404') : res.end(data)
  })
})
server.listen(80)
```

### 场景5：兼容老旧项目（querystring 仅维护老代码使用）

```js
const qs = require('querystring')
// 后端接收前端form表单urlencoded格式POST参数
let body = ''
req.on('data', chunk => body += chunk)
req.on('end', () => {
  const params = qs.parse(body)
  console.log(params.username)
})
```

> 新项目 POST 表单统一使用 `URLSearchParams(body)` 解析，不再用 querystring。

---

## 五、面试高频考点

### 1. url 模块新旧两套API区别？

1. 旧版 `url.parse`：依赖 querystring，非标准，官方废弃，存在安全解析缺陷；
2. 新版 `new URL()`：ES 标准，内置 `searchParams`，浏览器 Node 通用，无需额外模块，推荐全部新项目使用。

### 2. querystring 模块为什么现在很少用？

`URLSearchParams` 完全覆盖其参数解析、拼接、编码能力，是跨环境标准API，无需单独引入 querystring，功能更完善（支持多值参数、增删改查方法）。

### 3. req.url 直接分割字符串拿参数有什么问题？

手动分割 `?`、`&` 极易出错：参数为空、多相同参数、中文编码、特殊符号转义，原生 URL 实例内部自动处理编码，稳定无bug。

### 4. URLSearchParams 和 querystring.parse 多参数处理差异？

`?ids=1&ids=2`

- querystring.parse：`{ ids: '2' }` 会覆盖，只能拿到最后一个值；
- URLSearchParams.getAll('ids')：`['1','2']` 完整获取全部数组。

---

## 六、避坑指南

1. **禁止新项目使用 url.parse**，全部替换 `new URL()`；
2. 解析 `req.url` 时必须传入第二个 base 域名，否则相对路径解析报错：`new URL(req.url, http://${req.headers.host})`；
3. 不要手动字符串切割 `?`、`&` 解析参数，编码、多参数场景极易产生bug；
4. 废弃 querystring 仅维护老项目使用，新项目统一 `URLSearchParams`；
5. `URL.searchParams` 所有值读取出来都是字符串，数字类型需手动转 Number。

---

## 七、选型总结

| 需求场景                    | 推荐方案                    | 淘汰方案                |
| --------------------------- | --------------------------- | ----------------------- |
| 新项目参数解析、URL拼接     | new URL() + URLSearchParams | url.parse / querystring |
| 老旧Node项目维护            | 兼容保留 querystring        | 不新增代码使用          |
| 前端同构代码（浏览器+Node） | URLSearchParams             | querystring（浏览器无） |
| 原生http静态服务、接口代理  | new URL()                   | 手动分割字符串          |

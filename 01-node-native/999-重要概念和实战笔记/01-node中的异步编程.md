# Node.js 异步编程完整实战教程（Promise + async/await）

适配：5年前端转全栈、远程项目开发，结合 Node 原生IO场景（fs、http、stream、数据库）

## 一、先搞懂核心概念：为什么Node必须用异步？

### 1. Node 单线程模型底层逻辑

Node.js 只有**一条主线程**负责执行JS代码，**同步代码会阻塞整个服务**。
举个反面例子（同步阻塞大坑）：

```js
const fs = require('fs')
// 同步读取大文件：阻塞主线程，所有接口/请求全部卡住
const data = fs.readFileSync('10G-video.mp4')
console.log('文件读取完毕')
```

- 同步IO执行时，CPU空闲等待磁盘/网络，无法处理其他用户请求；
- 服务并发高时，同步代码直接导致服务器卡死、超时。

**异步核心目的**：
发起IO操作（文件、数据库、网络请求）时，主线程不等待，先去处理其他业务；等IO完成后，再回头执行回调逻辑，最大化利用单线程性能。

### 2. 异步发展三代方案（实战演进）

1. **第一代：回调函数（回调地狱，老旧项目遗留）**
2. **第二代：Promise（标准化异步容器，解决回调嵌套）**
3. **第三代：async/await（Promise语法糖，企业项目标准写法）**

> 实战结论：新项目100%使用 `async/await`，底层基于Promise；仅维护老项目会见到回调。

---

# 二、Promise 完整讲解（async/await底层基础）

## 1. Promise 是什么？

Promise 是**专门封装异步操作的对象**，代表一个**未来才会完成的异步任务**，有三种固定状态：

1. `pending`：等待中（异步执行中，初始状态）
2. `fulfilled`：成功（异步完成，返回结果）
3. `rejected`：失败（异步报错，返回错误信息）

**状态不可逆**：一旦从 pending 变为成功/失败，状态永久锁定，无法二次修改。

## 2. Promise 基础语法（手动封装异步IO）

### 2.1 基础创建格式

```js
const fs = require('fs')
// 封装读取文件的Promise
function readFilePromise(path) {
  return new Promise((resolve, reject) => {
    // resolve：异步成功时调用，传递结果
    // reject：异步失败时调用，传递错误对象
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) reject(err) // 出错，抛出错误
      else resolve(data)  // 成功，返回文件内容
    })
  })
}
```

### 2.2 核心实例方法：then / catch / finally

1. `.then(res)`：接收成功的结果
2. `.catch(err)`：捕获所有异步错误（必写，否则报错进程崩溃）
3. `.finally()`：无论成功失败，最后都会执行（释放资源、关闭连接）

```js
// 使用封装好的文件读取Promise
readFilePromise('./test.txt')
  .then((content) => {
    console.log('文件内容：', content)
  })
  .catch((err) => {
    console.error('读取失败：', err.message)
  })
  .finally(() => {
    console.log('文件读取操作结束，释放资源')
  })
```

### 2.3 Promise 链式调用（解决回调地狱）

回调地狱（嵌套噩梦，不推荐）：

```js
// 多层嵌套，可读性极差
fs.readFile('a.txt', (err, a) => {
  fs.readFile(a, (err, b) => {
    fs.readFile(b, (err, c) => {
      console.log(c)
    })
  })
})
```

Promise 链式平铺写法：

```js
readFilePromise('a.txt')
  .then(pathA => readFilePromise(pathA))
  .then(pathB => readFilePromise(pathB))
  .then(res => console.log('最终结果', res))
  .catch(err => console.error('任意一层报错都会被捕获'))
```

### 2.4 实战高频静态API（Node接口、并发请求必备）

#### ① Promise.all() 并发执行多个异步，全部成功才返回

场景：同时请求多个接口、并行读取多个文件，**所有任务全部完成再往下走**

```js
// 同时读取3个文件，并发执行，提升效率
const taskList = [
  readFilePromise('1.txt'),
  readFilePromise('2.txt'),
  readFilePromise('3.txt')
]
Promise.all(taskList)
  .then(([res1, res2, res3]) => {
    console.log('全部读取完成', res1, res2, res3)
  })
  .catch(err => {
    // 任意一个任务失败，整体直接进入catch
    console.error('其中一个文件读取失败', err)
  })
```

#### ② Promise.race() 竞速，谁先完成取谁的结果

场景：接口超时控制、多服务器测速，第一个返回结果就结束

```js
// 请求接口，5000ms没返回直接判定超时
const fetchData = new Promise(resolve => setTimeout(() => resolve('接口数据'), 3000))
const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), 5000))
Promise.race([fetchData, timeout])
  .then(res => console.log(res))
  .catch(err => console.error(err))
```

#### ③ Promise.allSettled() 全部执行完毕，统一收集成功/失败结果

场景：批量上传文件、批量批量爬虫，**不因为一个失败中断整体**

```js
Promise.allSettled(taskList).then(result => {
  result.forEach(item => {
    if (item.status === 'fulfilled') console.log('成功：', item.value)
    if (item.status === 'rejected') console.log('失败：', item.reason.message)
  })
})
```

## 3. Node 原生API Promise化（不用自己封装）

Node 内置模块大部分提供 `.promises` 命名空间，原生返回Promise，无需手动包回调：

```js
// fs 原生Promise API（企业项目首选）
const fs = require('fs').promises
// 直接返回Promise
fs.readFile('./test.txt', 'utf8')
  .then(data => console.log(data))
  .catch(err => console.error(err))
```

---

# 三、async / await（企业实战标准写法，Promise语法糖）

## 1. 核心定义

1. `async`：修饰函数，**该函数返回值自动包装成Promise**；
2. `await`：只能写在 `async` 函数内部，**等待Promise执行完成，同步写法读异步代码**；
3. 本质：底层完全基于Promise，只是语法简化，消除 `.then()` 链式。

## 2. 基础语法

### 2.1 基础读取文件示例

```js
const fs = require('fs').promises

// async 标记异步函数
async function readText() {
  try {
    // await 等待Promise完成，直接拿到结果，平铺写法
    const content = await fs.readFile('./test.txt', 'utf8')
    console.log('文件内容：', content)
    return content
  } catch (err) {
    // try/catch 捕获所有异步错误，替代 .catch()
    console.error('读取失败', err.message)
  } finally {
    console.log('操作结束')
  }
}

// 调用async函数，本身返回Promise
readText()
```

### 2.2 关键规则（踩坑必记）

1. `await` 不能脱离 `async` 函数，顶层直接写会报错；
   - Node.js v14.8+ 支持**顶层await**（模块最外层直接使用await）
2. `await` 后面只能跟 Promise，普通同步代码会直接放行；
3. 异步错误必须用 `try/catch` 捕获，否则抛出未捕获异常，服务崩溃。

## 3. 实战高频场景代码（Node全栈日常开发）

### 场景1：原生http接口（Express/Koa底层通用）

后端接口串行操作：读取配置 → 查询数据库 → 返回数据

```js
const fs = require('fs').promises
const http = require('http')

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json;charset=utf-8')
  try {
    // 串行异步：先读配置，再处理业务
    const config = await fs.readFile('./config.json', 'utf8')
    const configObj = JSON.parse(config)
    res.end(JSON.stringify({ code: 200, data: configObj }))
  } catch (err) {
    res.writeHead(500)
    res.end(JSON.stringify({ code: 500, msg: '服务器异常：' + err.message }))
  }
})
server.listen(3000)
```

### 场景2：串行执行多个异步（有依赖，必须按顺序）

读取A文件，用A的内容作为路径读取B文件，存在依赖不能并发：

```js
async function serialTask() {
  try {
    const pathB = await fs.readFile('a.txt', 'utf8')
    const result = await fs.readFile(pathB, 'utf8')
    console.log('串行执行结果：', result)
  } catch (err) {
    console.error(err)
  }
}
serialTask()
```

### 场景3：并发无依赖异步（提升性能，Promise.all + await）

多个文件无依赖，并行读取，大幅缩短执行时间：

```js
async function parallelTask() {
  try {
    // 先创建所有Promise任务
    const task1 = fs.readFile('1.txt', 'utf8')
    const task2 = fs.readFile('2.txt', 'utf8')
    const task3 = fs.readFile('3.txt', 'utf8')
    // await等待全部并发完成
    const [r1, r2, r3] = await Promise.all([task1, task2, task3])
    console.log(r1, r2, r3)
  } catch (err) {
    console.error(err)
  }
}
parallelTask()
```

### 场景4：数据库操作（远程全栈项目最常用）

mysql/mongodb 驱动全部基于Promise，统一async/await写法：

```js
// 伪代码，数据库标准写法
async function getUserInfo(uid) {
  try {
    // 查询用户
    const user = await db.query('SELECT * FROM user WHERE id = ?', [uid])
    // 查询用户订单
    const order = await db.query('SELECT * FROM order WHERE uid = ?', [uid])
    return { user, order }
  } catch (err) {
    // 统一捕获SQL异常、网络异常
    console.error('数据库查询失败', err)
    return null
  }
}
```

### 场景5：顶层await（模块外层直接使用，无需包裹函数）

```js
// app.js 入口文件，Node新版本支持
const fs = require('fs').promises
const config = await fs.readFile('./config.json', 'utf8')
console.log('项目配置', JSON.parse(config))
```

## 4. async函数返回值特性

1. `return 普通值` → 自动包装 `Promise.resolve(值)`
2. `throw Error` → 自动包装 `Promise.reject(错误)`

```js
async function test() {
  return 123
}
console.log(test() instanceof Promise) // true
test().then(res => console.log(res)) // 123
```

---

# 四、三代异步方案对比（实战选型标准）

| 方案                    | 写法           | 优点                                 | 缺点                                           | 实战使用场景                            |
| ----------------------- | -------------- | ------------------------------------ | ---------------------------------------------- | --------------------------------------- |
| 回调函数 callback       | 多层嵌套       | 原生底层支持，无额外学习成本         | 回调地狱、错误难以统一捕获、嵌套越深可读性越差 | 老旧遗留项目、底层原生流事件            |
| Promise + then/catch    | 链式平铺       | 解决嵌套，支持并发API，错误集中捕获  | 大量then链式仍有阅读成本                       | 简易脚本、工具函数                      |
| async/await + try/catch | 同步风格写异步 | 代码直观、逻辑清晰、易维护、调试友好 | 底层依赖Promise，老环境需兼容                  | **99%线上正式项目、远程全栈标准** |

---

# 五、实战高频踩坑&避坑指南

1. **忘记await，异步变同步空Promise**

```js
// 错误：没有await，拿到的是Promise对象，不是真实数据
function badDemo() {
  const data = fs.readFile('./test.txt')
  console.log(data) // Promise { <pending> }
}
// 正确：加await等待完成
async function goodDemo() {
  const data = await fs.readFile('./test.txt')
}
```

2. **并发场景误用串行await，性能极低**
   多个无依赖任务不要挨个await，先用数组收集Promise，再用 `Promise.all`并发。
3. **async函数不写try/catch，报错直接进程崩溃**
   所有IO、数据库、网络异步操作必须捕获错误，线上服务不能漏。
4. **循环中await串行，大量数据效率差**
   批量处理数据优先并发，不要for循环逐个await。
5. **混淆同步阻塞代码和异步代码**
   `await`只能等待异步IO，同步计算代码依旧阻塞主线程（大量循环、复杂计算建议拆分子进程）。

---

# 六、远程面试高频考点

## 1. Promise、async/await 关系？

async/await 是 Promise 的语法糖，底层完全基于Promise实现；async函数返回Promise，await等待Promise状态完成。

## 2. 为什么不用回调，统一用async/await？

1. 消除回调嵌套，代码结构平铺，可读性强；
2. try/catch统一捕获所有异步错误，错误处理集中；
3. 支持并发控制API（all/race/allSettled），灵活处理多异步任务；
4. 调试断点友好，和同步代码阅读逻辑一致。

## 3. Promise 三种状态，状态能否变更？

pending（等待）、fulfilled（成功）、rejected（失败）；状态一旦变更不可逆，无法二次修改。

## 4. Promise.all 和 allSettled 区别？

- all：任一任务失败，整体直接失败；适合强依赖场景，一个失败全部作废；
- allSettled：等待所有任务执行完毕，统一收集成功/失败结果；适合批量处理，不中断整体流程。

## 5. await 原理是什么？

JS引擎暂停当前async函数执行，让出主线程处理其他任务；等Promise异步操作完成后，恢复函数执行，拿到结果继续向下运行。

## 6. 不捕获Promise错误会发生什么？

Node.js 会抛出 `unhandledRejection` 警告，高版本Node直接终止进程，线上服务宕机。

---

# 七、工作实战使用总结

1. **新项目、线上业务、远程作品集、全栈接口**：强制使用 `async/await + try/catch`；
2. 多异步并发场景：搭配 `Promise.all / allSettled / race` 控制执行逻辑；
3. Node原生IO优先使用 `.promises` API，不用手动封装回调转Promise；
4. 仅维护十年以上老旧项目时，才会接触回调函数写法；
5. 所有文件、网络、数据库异步操作，必须捕获异常，保证服务稳定性。

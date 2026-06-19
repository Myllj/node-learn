# Node.js Stream 完整实战学习教程（前端转全栈·远程求职专用）

> 配套前置知识：`fs` 文件模块、`http`/`net` 网络模块、Buffer二进制
> 权威文档：https://nodejs.cn/api/stream.html
> 定位：IO处理核心API，**线上项目高频刚需，面试重中之重**

## 目录

1. 实战使用频率总览
2. Stream核心概念、底层原理
3. 四大基础流完整API详解（入参+返回值+示例）
4. 流核心通用方法/事件（所有流共用）
5. 流管道处理：pipe / pipeline 核心API
6. 高频实战场景（完整可运行代码）
7. 粘包、背压、异常处理避坑指南
8. 远程面试高频考点
9. 选型对比：readFile 一次性读取 VS Stream流

---

# 1. Stream实战使用频率分级（真实项目结论）

## 1.1 分场景使用率

| 业务场景                          | 使用频率        | 说明                                 |
| --------------------------------- | --------------- | ------------------------------------ |
| 大文件处理（上传/下载/复制/压缩） | ⭐⭐⭐⭐⭐ 极高 | 强制使用，一次性读取会OOM内存溢出    |
| 日志持续读写、实时数据流          | ⭐⭐⭐⭐⭐ 极高 | 长连接持续输出，必须流式分段处理     |
| HTTP文件接口、视频/图片传输       | ⭐⭐⭐⭐⭐ 极高 | http底层基于流，文件响应全部走stream |
| 内网TCP通信、硬件IoT数据          | ⭐⭐⭐⭐        | net模块socket本身就是流              |
| 小型文本文件(<50M)CRUD            | ⭐ 极低         | 直接fs.readFile更简单，无需流        |
| 简单接口、普通CRUD业务            | ⭐ 极低         | 几乎碰不到流                         |

## 1.2 一句话总结

1. **做文件、网络IO、大体积数据、实时数据流开发：Stream是标配，每天都要用**
2. 单纯操作小json、配置文件、普通接口：几乎不用手写流
3. 所有Node内置IO模块底层全部基于Stream封装（fs文件流、http请求响应、net socket），看懂流等于看懂NodeIO底层

## 1.3 核心优势

传统一次性读取文件：**完整文件全部加载进内存**，1G文件直接占用1G内存，并发直接崩溃；
Stream流式处理：**每次只读取一小块Buffer**，内存占用恒定，不受文件大小限制。

---

# 2. Stream核心基础概念

## 2.1 什么是流？

流是Node中**处理分段数据**的抽象接口，数据会一小块一小块（Buffer）连续传输，像水管流水一样，分阶段读取/写入，不用一次性加载全部数据。

## 2.2 四大基础流分类（全部内置在stream模块）

1. `Readable` 可读流：只能读取数据（fs.createReadStream、http req、net socket）
2. `Writable` 可写流：只能写入数据（fs.createWriteStream、http res）
3. `Duplex` 双工流：可读+可写（net TCP Socket，客户端服务端互相收发）
4. `Transform` 转换流：读写同时修改数据（压缩zlib、加密、转码）

## 2.3 核心名词

- 块chunk：每次传输的一小块二进制Buffer
- 背压backpressure：写入速度 > 读取速度，缓冲区堆积，流自动暂停读取防止内存爆炸（Stream内置自动处理）
- 缓冲区buffer：流内部临时存储数据的内存空间

---

# 3. 四大流完整API详解（参数+返回值+示例）

## 3.1 Readable 可读流（读取数据源）

### 创建API

```js
const stream = require('stream')
// 1. 自定义可读流
const rs = new stream.Readable({
  // 配置项
  highWaterMark: 64 * 1024, // 缓冲区默认64kb
  encoding: 'utf8', // 设置编码，chunk直接转字符串
  objectMode: false, // 是否支持对象流（默认二进制Buffer）
  // 底层读取实现，必须重写
  read(size) {
    // size：建议读取字节数，内部调用push推送数据
    this.push('第一段数据')
    this.push(null) // null代表数据读取完毕，触发end
  }
})

// 2. 实战高频：fs内置可读流（99%业务使用）
const fs = require('fs')
const fileRs = fs.createReadStream('./test.txt', {
  highWaterMark: 128 * 1024,
  encoding: 'utf8',
  start: 0, // 读取起始字节
  end: 1000 // 读取结束字节，分片读取文件
})
```

### Readable核心方法

| 方法                      | 参数            | 作用                                    |
| ------------------------- | --------------- | --------------------------------------- |
| `read(size)`            | size:字节数     | 手动读取指定长度数据，返回Buffer/字符串 |
| `push(chunk, encoding)` | chunk数据、编码 | 向缓冲区推入数据，自定义流专用          |
| `pause()`               | 无              | 暂停读取，停止触发data事件              |
| `resume()`              | 无              | 恢复读取                                |
| `isPaused()`            | 无              | 返回布尔，判断是否暂停                  |

### Readable核心事件

1. `data`：收到一块数据chunk，高频使用
2. `end`：全部数据读取完成，无参数
3. `error`：读取失败（文件不存在、权限不足），必须监听
4. `close`：流彻底关闭
5. `readable`：缓冲区有数据可读时触发

## 3.2 Writable 可写流（写入目标）

### 创建API

```js
const stream = require('stream')
// 自定义可写流
const ws = new stream.Writable({
  highWaterMark: 64 * 1024,
  encoding: 'utf8',
  objectMode: false,
  // 重写底层写入方法
  write(chunk, encode, callback) {
    console.log('写入块', chunk)
    callback() // 写入完成回调，通知流写下一块
  }
})

// 实战高频：fs文件可写流
const fileWs = fs.createWriteStream('./output.txt', {
  flags: 'w', // w覆盖/a追加
  encoding: 'utf8',
  highWaterMark: 128 * 1024
})
```

### Writable核心方法

| 方法                         | 参数                     | 作用                                         |
| ---------------------------- | ------------------------ | -------------------------------------------- |
| `write(chunk, encode, cb)` | 数据、编码、写入完成回调 | 手动写入一段数据，返回布尔（缓冲区是否已满） |
| `end(chunk, encode, cb)`   | 可选收尾数据             | 写入完成，关闭流（必须调用）                 |
| `cork()` / `uncork()`    | 无                       | 缓存批量写入，提升性能                       |

### Writable核心事件

1. `drain`：缓冲区数据全部写入完毕，缓冲区清空（背压核心事件）
2. `finish`：全部数据写入完成（调用end后触发）
3. `error`：写入异常
4. `close`：流关闭

## 3.3 Duplex 双工流（可读可写，TCP Socket）

同时继承Readable、Writable，API完全复用上面两套，多用于网络通信：

```js
const { Duplex } = require('stream')
const duplex = new Duplex({
  read(size) {}, // 读逻辑
  write(chunk, enc, cb) {} // 写逻辑
})
// net模块socket本质就是Duplex双工流
```

## 3.4 Transform 转换流（读写同时加工数据，压缩/加密）

继承Duplex，新增 `_transform`转换方法，**不会缓存完整数据**，边读边处理

```js
const { Transform } = require('stream')
const trans = new Transform({
  transform(chunk, enc, callback) {
    // 加工chunk
    const newChunk = chunk.toString().toUpperCase()
    this.push(newChunk) // 推送处理后数据
    callback()
  },
  flush(callback) {
    // 所有数据读取完成后的收尾处理
    callback()
  }
})
// 内置zlib压缩库全部基于Transform流
```

---

# 4. 全局核心管道API（所有流通用，实战最常用）

## 4.1 pipe() 基础管道（入门写法）

### 语法

`可读流.pipe(可写流)`
自动处理背压、自动开关流，自动传递error事件（缺点：管道中断不会自动销毁流，易内存泄漏）

```js
const rs = fs.createReadStream('input.mp4')
const ws = fs.createWriteStream('copy.mp4')
rs.pipe(ws)
// 自动分段读取写入，无需手动监听data事件
```

## 4.2 pipeline() 官方推荐（生产环境必用，替代pipe）

### 导入&参数

```js
const { pipeline } = require('stream')
pipeline(
  可读流,
  转换流1,
  转换流2,
  可写流,
  (err) => {
    // 统一捕获全部环节异常
    if(err) console.error('流处理失败', err)
    else console.log('全部处理完成')
  }
)
```

### 核心优势（线上项目强制使用）

1. 任何流报错自动关闭所有上下游流，杜绝文件句柄泄漏
2. 完整捕获整条链路所有错误
3. 自动处理背压，性能和pipe一致
4. 支持多段链式流转（文件读取→压缩→写入新文件）

## 4.3 链式转换示例

```js
const fs = require('fs')
const { pipeline } = require('stream')
const zlib = require('zlib') // 内置压缩Transform流

// 读取原文件 → gzip压缩 → 写入压缩包
pipeline(
  fs.createReadStream('data.txt'),
  zlib.createGzip(),
  fs.createWriteStream('data.txt.gz'),
  (err) => err && console.error(err)
)
```

---

# 5. 高频实战场景（完整可运行代码）

## 场景1：大文件复制（解决大文件OOM，最基础场景）

```js
const fs = require('fs')
const { pipeline } = require('stream')

// 1G/10G超大文件安全复制，内存恒定
pipeline(
  fs.createReadStream('./big-video.mp4'),
  fs.createWriteStream('./video-copy.mp4'),
  (err) => {
    if(err) return console.error('复制失败', err)
    console.log('文件复制完成')
  }
)
```

## 场景2：流式日志追加写入（后端服务实时打日志）

长期运行服务持续输出日志，不用频繁打开关闭文件

```js
const fs = require('fs')
// a 追加模式，持续写入
const logWs = fs.createWriteStream('./server.log', { flags: 'a', encoding: 'utf8' })

// 封装日志方法
function writeLog(content) {
  const logStr = `[${new Date().toLocaleString()}] ${content}\n`
  logWs.write(logStr)
}

// 测试持续写入
writeLog('服务启动成功')
writeLog('收到用户接口请求')
// 进程关闭时优雅结束流
process.on('SIGINT', () => {
  logWs.end('服务正常关闭\n')
  process.exit(0)
})
```

## 场景3：HTTP接口流式返回大文件（前端下载视频/压缩包）

Express/Koa底层原理，原生http实现大文件下载，不占用内存

```js
const http = require('http')
const fs = require('fs')
const { pipeline } = require('stream')

const server = http.createServer((req, res) => {
  if(req.url === '/download' && req.method === 'GET') {
    // 设置下载响应头
    res.setHeader('Content-Type', 'video/mp4')
    res.setHeader('Content-Disposition', 'attachment; filename=movie.mp4')
  
    const readStream = fs.createReadStream('./movie.mp4')
    // 文件流直接管道到http响应流
    pipeline(readStream, res, (err) => {
      if(err) res.end('文件读取失败')
    })
  } else {
    res.end('ok')
  }
})
server.listen(3000)
```

## 场景4：文件流式压缩/解压（Transform转换流实战）

```js
const fs = require('fs')
const zlib = require('zlib')
const { pipeline } = require('stream')

// 压缩文件
function compressFile(source, target) {
  pipeline(
    fs.createReadStream(source),
    zlib.createGzip(),
    fs.createWriteStream(target),
    err => err && console.error('压缩失败', err)
  )
}
// 解压文件
function unCompressFile(source, target) {
  pipeline(
    fs.createReadStream(source),
    zlib.createGunzip(),
    fs.createWriteStream(target),
    err => err && console.error('解压失败', err)
  )
}
compressFile('data.txt', 'data.gz')
```

## 场景5：TCP硬件设备流式接收数据（Duplex双工流net）

物联网设备长连接分段上报传感器数据，分段处理不堆积内存

```js
const net = require('net')
const server = net.createServer((socket) => {
  // socket是Duplex双工流，data分段接收设备数据
  socket.on('data', (chunk) => {
    const data = chunk.toString('utf8')
    console.log('设备上报传感器数据：', data)
  })
  socket.on('error', (err) => console.error('设备连接异常', err))
})
server.listen(9527)
```

## 场景6：手动监听data事件自定义处理（文本过滤）

读取文件，过滤空行，写入新文件

```js
const fs = require('fs')
const rs = fs.createReadStream('./article.txt', { encoding: 'utf8' })
const ws = fs.createWriteStream('./article-filter.txt')

rs.on('data', (chunk) => {
  // 分段处理每一块文本
  const lines = chunk.split('\n').filter(line => line.trim() !== '')
  ws.write(lines.join('\n') + '\n')
})
rs.on('end', () => {
  ws.end('---文件读取完毕---')
  console.log('过滤完成')
})
rs.on('error', err => console.error(err))
```

---

# 6. Stream避坑指南（实战高频踩坑）

## 坑1：只用pipe不用pipeline，异常导致文件句柄泄漏

pipe其中一段报错，上下游流不会自动关闭，文件一直占用无法删除；生产统一使用 `stream.pipeline`。

## 坑2：不监听error事件，程序直接崩溃

所有可读/可写流必须绑定 `error`事件，未捕获流异常会直接杀死Node进程。

## 坑3：一次性读取超大文件（放弃Stream用readFile）

超过50MB文件用fs.readFile，并发访问会直接占用大量内存，服务器OOM崩溃。

## 坑4：忘记调用ws.end()，请求/文件卡死

可写流写入完成必须调用end，否则管道一直挂起，浏览器转圈、文件无法保存。

## 坑5：忽略背压，疯狂write写入不判断返回值

`ws.write()`返回false代表缓冲区已满，此时继续大量write会堆积内存；需要监听 `drain`事件后再继续写入。

```js
// 正确背压处理示例
function writeBigData(ws, list, index = 0) {
  if(index >= list.length) return ws.end()
  const flag = ws.write(list[index])
  index++
  if(flag) writeBigData(ws, list, index)
  else ws.once('drain', () => writeBigData(ws, list, index))
}
```

## 坑6：混淆四种流，自定义流忘记push/callback

自定义Readable必须 `push(null)`结束；自定义Writable/Transform必须调用callback通知写入完成，否则流卡死。

---

# 7. 选型对比：readFile 一次性读取 VS Stream流

| 对比项   | fs.readFile / readFileSync   | Stream（createReadStream）     |
| -------- | ---------------------------- | ------------------------------ |
| 内存占用 | 文件全部载入内存，大文件爆炸 | 恒定小缓冲区，不受文件大小限制 |
| 适用文件 | <50MB 小型配置、json文本     | 50MB以上视频、压缩包、日志     |
| 处理方式 | 一次性获取完整字符串         | 分段chunk处理，支持边读边写    |
| 性能开销 | IO单次读取，内存开销大       | IO分段读取，内存开销极小       |
| 线上推荐 | 小型配置文件                 | 所有大文件、流式接口、日志     |

---

# 8. 远程面试高频考点

## 考点1：Stream四种流区别？

1. Readable：仅可读，数据源；
2. Writable：仅可写，数据目标；
3. Duplex：双工读写，如TCP Socket；
4. Transform：读写同时转换加工数据，压缩/加密。

## 考点2：pipe 和 pipeline 区别，线上为什么用pipeline？

1. pipe简单，但报错不会自动销毁流，易句柄泄漏；
2. pipeline自动处理全链路异常，报错自动关闭所有流，统一捕获错误，企业项目标准。

## 考点3：什么是背压（backpressure）？Stream如何处理？

写入速度大于读取速度，缓冲区堆积称为背压；Stream内置自动暂停可读流，缓冲区清空触发drain事件恢复读取，无需手动处理。

## 考点4：大文件上传下载为什么必须用Stream？

一次性读取会将完整文件加载进内存，高并发下内存溢出崩溃；Stream分段处理，内存占用固定，支持超大文件。

## 考点5：http、net、fs哪些底层基于Stream？

1. fs.createReadStream/createWriteStream 文件流
2. http req（Readable）、res（Writable）
3. net Socket 是Duplex双工流
   全部底层基于stream模块封装。

## 考点6：Transform流使用场景？

文件gzip压缩、内容加密、文本转码、数据格式化、日志过滤。

---

# 9. 学习总结

1. Stream是Node IO核心底层抽象，处理大体积/实时数据流必备，线上文件、网络业务高频使用；
2. 90%业务只需要掌握 `fs文件流 + pipeline管道`，自定义底层流极少用到；
3. 生产环境一律使用 `stream.pipeline`替代原生pipe，完善异常处理；
4. 小文件用readFile简化开发，大文件强制流式处理防止内存溢出；
5. 所有流必须监听error事件，避免进程崩溃。

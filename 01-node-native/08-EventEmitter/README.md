# Node.js EventEmitter 完整学习笔记（配套你前面 global/stream/http 笔记）

## 前置权威文档

Node 官方：https://nodejs.cn/api/events.html

# 一、EventEmitter 完整使用教程

## 1. 核心概念

`events.EventEmitter` 是 Node 事件驱动模型**底层基类**，实现「发布-订阅（观察者）模式」：

- `on()`：订阅监听事件
- `emit()`：发布触发事件
  所有带 `.on()` 方法的内置对象，全部继承它。

## 2. 基础引入 & 最简使用

### 2.1 导入模块、创建实例

```javascript
// 1. 导入内置 events 模块
const EventEmitter = require('events')
// 2. 实例化事件发射器
const emitter = new EventEmitter()
```

### 2.2 核心基础API（订阅/触发）

#### ① on(eventName, listener) 持续监听（最常用）

```javascript
// 订阅自定义事件 'msg'
emitter.on('msg', (name, content) => {
  console.log(`【${name}】消息：${content}`)
})

// emit 触发事件，可传递任意数量参数给回调
emitter.emit('msg', '张三', '你好，全栈开发')
emitter.emit('msg', '李四', '学习EventEmitter')
```

#### ② once(eventName, listener) 只监听一次，触发后自动销毁

```javascript
emitter.once('login', (uid) => {
  console.log('用户登录，仅执行一次：', uid)
})
emitter.emit('login', 1001) // 执行
emitter.emit('login', 1002) // 不执行
```

#### ③ off(eventName, listener) 移除指定监听

```javascript
function logHandler() {
  console.log('执行日志')
}
emitter.on('log', logHandler)
emitter.emit('log')

// 移除监听
emitter.off('log', logHandler)
emitter.emit('log') // 无输出
```

#### ④ removeAllListeners([eventName]) 清空全部监听

```javascript
emitter.removeAllListeners('msg') // 只清空msg事件
emitter.removeAllListeners()      // 清空所有事件监听
```

#### ⑤ emit(eventName, ...args) 手动触发事件

- 返回布尔值：`true` = 存在监听函数；`false` = 无任何监听

### 2.3 必处理：error 事件（高频踩坑点）

**如果不监听 `error` 事件，触发时进程直接崩溃！**

```javascript
// 必须捕获error事件
emitter.on('error', (err) => {
  console.error('捕获事件异常：', err.message)
})

// 触发错误
emitter.emit('error', new Error('自定义业务异常'))
```

### 2.4 其他常用API

```javascript
// 获取某个事件所有监听函数数量
emitter.listenerCount('msg')

// 设置同一个事件最大监听数（默认10个，超过会警告内存泄漏）
emitter.setMaxListeners(20)
```

## 3. 两种使用方式

### 方式1：直接 new EventEmitter 简单场景

上面示例，适合临时简易事件总线。

### 方式2：类继承（实战主流，所有内置模块都是这种写法）

业务中自定义工具、流、服务，都会继承 EventEmitter，让自己的类拥有 `on/emit` 能力：

```javascript
const EventEmitter = require('events')

// 自定义类继承事件发射器
class Server extends EventEmitter {
  start() {
    // 内部触发事件，外部可通过.on监听
    this.emit('start', Date.now())
  }
}

// 使用
const app = new Server()
app.on('start', (time) => {
  console.log('服务启动时间：', time)
})
app.start()
```

## 4. 实战场景：全局事件总线（远程项目解耦）

多模块之间解耦通信，不用层层传参：

```javascript
// eventBus.js 全局事件总线
const EventEmitter = require('events')
const bus = new EventEmitter()
module.exports = bus
```

```javascript
// moduleA.js 发布事件
const bus = require('./eventBus')
bus.emit('user:add', { id: 1, name: '新用户' })
```

```javascript
// moduleB.js 订阅监听
const bus = require('./eventBus')
bus.on('user:add', (user) => {
  console.log('收到新增用户：', user)
})
```

# 二、第二个问题：fs/stream/http/net 的 on/error/end 方法是否继承 EventEmitter？

## 结论：**全部都是，底层统一继承 EventEmitter**

## 1. 底层继承链路

1. 顶层基类：`events.EventEmitter`
2. 所有 IO、流、网络模块内置类，全部**继承 EventEmitter**，所以天然拥有 `.on()`、`.once()`、`.emit()`、`.off()` 整套方法。

### 举例验证（可直接运行）

```javascript
const fs = require('fs')
const EventEmitter = require('events')

// 文件可读流
const rs = fs.createReadStream('test.txt')
console.log(rs instanceof EventEmitter) // true

// http server
const http = require('http')
const server = http.createServer()
console.log(server instanceof EventEmitter) // true

// net socket
const net = require('net')
const socket = new net.Socket()
console.log(socket instanceof EventEmitter) // true
```

## 2. 常见内置对象继承关系一览

| 对象                        | 继承关系                       | 常用事件                                      |
| --------------------------- | ------------------------------ | --------------------------------------------- |
| fs.ReadStream / WriteStream | Stream → EventEmitter         | `data` / `end` / `error` / `close`    |
| http.Server、req、res       | Stream → EventEmitter         | `request` / `close` / `error`           |
| net.Socket（Duplex流）      | Stream → EventEmitter         | `data` / `connect` / `error`            |
| process 进程                | 原生封装，底层基于EventEmitter | `exit` / `SIGINT` / `uncaughtException` |

## 3. 为什么它们都有 `.on('error')`、`.on('end')`？

1. 父类 `EventEmitter` 提供统一的订阅/触发能力；
2. 模块内部代码主动调用 `this.emit('xxx')` 抛出事件：
   - 文件读取完毕：`this.emit('end')`
   - 文件读取失败：`this.emit('error', err)`
3. 我们外部使用 `.on('end', cb)` 只是订阅内部抛出的事件。

## 4. 补充区分：模块两种事件来源

1. **内置原生事件**（流/网络自带：`data/end/close/error`）
   模块内部自动 emit，继承 EventEmitter 实现
2. **自定义业务事件**（自己 emit 自定义名称，如 `user:add`）
   开发者手动调用 emit 触发

# 三、高频面试考点

1. **EventEmitter 发布订阅模式原理？**
   内部维护一张 `{事件名: [回调函数数组]}` 映射表；on 存入数组，emit 遍历数组依次执行回调。
2. **on 和 once 的区别？**
   on 持续监听；once 触发一次后自动移除监听。
3. **error 事件不监听会怎样？**
   进程直接崩溃退出，生产代码所有流、服务必须监听 error。
4. 为什么 fs/http/net 都能使用 on 监听事件？
   全部继承 `events.EventEmitter`，复用它的事件监听API。
5. 超过10个同事件监听为什么会警告？
   默认最大监听数10，提示潜在内存泄漏；可通过 `setMaxListeners()` 调整上限。

# 四、避坑指南

1. 流、http、socket 必须监听 `error`，防止程序崩溃；
2. 循环注册 on 不手动 off，会造成内存泄漏；
3. 区分 `slice` 共享内存、EventEmitter 监听堆积，长期后台服务必须及时移除无用监听；
4. emit 传参只能通过回调函数接收，不能同步return获取结果。

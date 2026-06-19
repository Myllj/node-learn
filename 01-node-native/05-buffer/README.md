# Node.js Buffer 完整学习笔记（前端转全栈专用）

## 一、实战使用频率分级（真实企业/远程项目结论）

### 整体结论

**Buffer 是 Node 底层基石，高频刚需，分两种使用场景：**

1. **隐性自动使用（⭐⭐⭐⭐⭐ 每时每刻都在用）**
   所有 IO 底层自动产出 Buffer，你不需要手动创建，但一定会接收 Buffer：

   - `fs.readFile`、文件流 `data` 事件、http 请求/响应、net TCP socket、zlib 压缩、crypto 加密，全部返回 Buffer 二进制块。
   - 做文件上传下载、图片处理、日志、接口代理、硬件通信，**代码里必然接触 chunk（Buffer）**。
2. **手动创建/操作 Buffer（⭐⭐⭐ 中高频）**
   普通 CRUD 接口很少手动 new Buffer；但二进制处理、分片上传、Base64、加解密、自定义TCP协议、文件类型校验时，必须手动操作。

### 分场景使用率明细

| 业务场景                    | 手动操作频率 | 说明                               |
| --------------------------- | ------------ | ---------------------------------- |
| 文件读写、流式大文件传输    | ⭐⭐⭐⭐⭐   | 流的data事件天然返回Buffer，必处理 |
| 图片/音视频/二进制文件处理  | ⭐⭐⭐⭐⭐   | 图片转Base64、校验文件头、分片     |
| 加密、哈希、AES/RSA加解密   | ⭐⭐⭐⭐     | crypto库出入参强制为Buffer         |
| TCP硬件、自定义私有通信协议 | ⭐⭐⭐⭐     | 粘包拆包、按字节解析报文           |
| 接口代理、跨层数据转发      | ⭐⭐⭐       | 转发二进制请求体                   |
| 普通JSON接口、文本CRUD      | ⭐           | 几乎只转字符串，极少手动操作       |
| Vue/React配套后端业务接口   | ⭐⭐         | 上传文件场景高频，纯接口低频       |

### 一句话总结

只要你做**文件、网络二进制IO**，Buffer 绕不开；纯文本业务只会隐性接触，不用手写。所有 Stream 流的 `chunk` 本质都是 Buffer。

## 二、基础核心概念

1. **定位**：JS 浏览器只支持字符串，无法操作原始二进制；Node 内置 `Buffer` 专门处理字节数据，**全局变量，无需 require 导入**。
2. **本质**：V8 堆外分配的**固定长度字节数组**，每个元素取值 `0~255`（1字节=8bit），不占用JS堆内存，GC压力更小。
3. **编码支持**：`utf8/base64/hex/latin1/utf16le`，中文utf8占3字节，英文/数字1字节。
4. **与Stream关系**：Stream 分段传输的每一块数据 `chunk` 就是 Buffer，二者配套使用。

## 三、全套核心API（静态方法+实例方法，参数+示例）

### 3.1 静态创建方法（官方推荐，淘汰new Buffer()）

#### 1）Buffer.from() 最常用

```js
// 1. 字符串转Buffer（默认utf8）
const buf1 = Buffer.from('全栈开发');
// 2. 指定编码
const buf2 = Buffer.from('aGVsbG8=', 'base64');
// 3. 字节数组创建
const buf3 = Buffer.from([0x48, 0x65, 0x6C, 0x6C, 0x6F]);
// 4. 拷贝已有Buffer
const buf4 = Buffer.from(buf1);
```

#### 2）Buffer.alloc(size[, fill[, encoding]]) 安全初始化

```js
// 分配10字节，自动填充0，无脏数据（业务首选）
const buf = Buffer.alloc(10);
// 填充指定字符
const bufFill = Buffer.alloc(5, 'a', 'utf8');
```

#### 3）Buffer.allocUnsafe(size) 高性能但不安全

不初始化内存，速度更快，但会残留旧内存敏感数据，**用户输入场景禁止使用**，仅内部缓存复用场景使用。

```js
const bufFast = Buffer.allocUnsafe(1024);
bufFast.fill(0); // 使用前必须清空
```

#### 4）静态工具方法

1. `Buffer.concat(list[, totalLength])` 拼接多个Buffer（高频）

```js
const b1 = Buffer.from('hello ');
const b2 = Buffer.from('world');
const all = Buffer.concat([b1, b2]);
console.log(all.toString()); // hello world
```

2. `Buffer.byteLength(str[, encoding])` 获取字节长度（≠字符串length，中文3字节）

```js
console.log('张三'.length); // 2 字符长度
console.log(Buffer.byteLength('张三')); // 6 字节长度
```

3. `Buffer.compare(buf1, buf2)` 二进制对比，用于文件排序、校验

### 3.2 Buffer 实例常用属性

```js
const buf = Buffer.from('test');
buf.length // 占用字节数（固定，创建时确定）
buf[0] // 按下标读取单个字节数字（0~255）
```

### 3.3 实例核心方法

| 方法                                       | 参数                 | 实战用途                                 |
| ------------------------------------------ | -------------------- | ---------------------------------------- |
| `buf.toString([encoding[,start[,end]]])` | 编码、起始/结束字节  | Buffer转字符串、截取片段                 |
| `buf.slice(start, end)`                  | 起始、结束下标       | 截取二进制片段，**零拷贝共享内存** |
| `buf.copy(target, tStart, sStart, sEnd)` | 目标Buffer、偏移     | 深拷贝独立内存Buffer                     |
| `buf.fill(value)`                        | 填充值               | 清空复用Buffer                           |
| `buf.write(str, offset, length, enc)`    | 写入字符串到指定偏移 | 二进制分段写入                           |
| `buf.includes(value)`                    | 字符串/字节数组      | 判断是否包含指定数据                     |
| `buf.toJSON()`                           | 无                   | 序列化二进制（接口返回文件字节）         |

示例：截取文件前4字节判断图片类型

```js
const fileBuf = fs.readFileSync('test.jpg');
const header = fileBuf.slice(0, 4);
// JPG文件头 FF D8
if(header[0] === 0xFF && header[1] === 0xD8) {
  console.log('jpg图片');
}
```

## 四、高频实战场景（完整可运行代码）

### 场景1：文件流接收分段Buffer（最基础，90%项目必写）

读取大文件，每一段数据都是Buffer，分段处理，不占满内存

```js
const fs = require('fs');
const rs = fs.createReadStream('big-file.mp4');

rs.on('data', (chunk) => {
  // chunk 类型为 Buffer
  console.log('本次读取字节大小：', chunk.length);
  // 二进制直接写入可写流，无需转字符串
  ws.write(chunk);
});
rs.on('end', () => console.log('读取完成'));
rs.on('error', err => console.error('读取失败', err));
```

### 场景2：图片/文件转Base64（前端上传预览、接口返回图片）

前后端分离项目，返回图片Base64给前端直接渲染

```js
const fs = require('fs');
const imgBuf = fs.readFileSync('./avatar.png');
// 转base64字符串
const base64Str = imgBuf.toString('base64');
// 前端直接使用 <img src="data:image/png;base64,${base64Str}" />
const imgSrc = `data:image/png;base64,${base64Str}`;
console.log(imgSrc);
```

### 场景3：接口接收二进制POST请求体（文件上传）

原生http服务接收上传文件，req流的chunk为Buffer

```js
const http = require('http');
const server = http.createServer((req, res) => {
  if(req.url === '/upload' && req.method === 'POST') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      // 拼接所有分片Buffer
      const fullBuf = Buffer.concat(chunks);
      // 写入本地文件
      fs.writeFileSync('./upload.png', fullBuf);
      res.end('上传成功');
    });
  }
});
server.listen(3000);
```

### 场景4：Crypto加密/哈希（密码加密、接口签名，强制使用Buffer）

Node加密库入参只支持Buffer，字符串必须转换

```js
const crypto = require('crypto');
// 明文转Buffer
const contentBuf = Buffer.from('用户密码123456');
// MD5哈希
const md5 = crypto.createHash('md5').update(contentBuf).digest('hex');
console.log('md5加密结果：', md5);

// AES加密示例
const key = Buffer.alloc(16, 'abcdef1234567890'); // 密钥必须16字节Buffer
const cipher = crypto.createCipheriv('aes-128-cbc', key, Buffer.alloc(16, 0));
```

### 场景5：自定义TCP协议，按字节解析设备数据（IoT硬件项目）

net socket传输的数据全是Buffer，截取固定字节解析报文

```js
const net = require('net');
net.createServer(socket => {
  socket.on('data', (chunk) => {
    // chunk是设备上报二进制Buffer
    const deviceIdBuf = chunk.slice(0, 4); // 前4字节设备ID
    const tempBuf = chunk.slice(4, 8); // 4-8字节温度数据
    const deviceId = deviceIdBuf.toString('hex');
    console.log('设备ID：', deviceId);
  });
}).listen(9527);
```

### 场景6：二进制文件类型校验（安全校验，防止非法文件上传）

通过文件头部字节判断真实文件类型，防止后缀篡改

```js
function getFileType(buf) {
  const head = buf.slice(0, 2);
  if(head[0] === 0xFF && head[1] === 0xD8) return 'jpg';
  if(head[0] === 0x89 && head[1] === 0x50) return 'png';
  if(head.toString('hex') === '25504446') return 'pdf';
  return '未知文件';
}
const fileBuf = fs.readFileSync('test.png');
console.log(getFileType(fileBuf));
```

## 五、高频面试考点（远程全栈必考）

### 1. Buffer 和普通字符串的区别？

1. 存储：Buffer存原始二进制字节，字符串存编码后的字符；
2. 内存：Buffer分配在V8堆外，字符串在JS堆；
3. 长度：`buf.length`是字节数，`str.length`是字符数，中文长度不一致；
4. 用途：Buffer处理文件/网络二进制，字符串仅处理文本；
5. 性能：二进制传输、拼接Buffer远快于字符串。

### 2. Buffer.slice 和 copy 区别？

- `slice`：**零拷贝**，仅创建内存视图，共享原始Buffer内存，修改切片会影响原数据；
- `copy/Buffer.from(buf)`：完整拷贝，独立内存，互不影响，适合修改数据场景。

### 3. alloc 和 allocUnsafe 区别？

- `alloc`：分配内存并自动清零，无脏数据，业务开发推荐；
- `allocUnsafe`：不初始化内存，速度更快，但残留旧内存敏感数据，存在信息泄露风险，仅内部高性能场景使用，使用前必须fill(0)清空。

### 4. Stream 里的 chunk 为什么是 Buffer？

网络、文件底层传输都是二进制字节，JS原生字符串无法承载无编码的原始二进制，因此统一用Buffer承载分段数据。

### 5. Buffer.byteLength 和 str.length 差异？

`str.length`：字符个数；`Buffer.byteLength`：实际占用字节数，中文utf8一个汉字占3字节，二者数值不同，计算上传文件大小必须用 `Buffer.byteLength`。

## 六、避坑指南（实战高频踩坑）

1. **忘记转编码直接操作中文Buffer**：直接 `buf[下标]`拿到字节数字，不是字符，读取文本必须 `toString('utf8')`；
2. **slice共享内存导致数据污染**：修改切片Buffer会改动原始文件二进制，需要独立副本必须拷贝；
3. **用字符串length计算文件大小**：中文多字节，长度偏小，统计文件字节必须用 `Buffer.byteLength`；
4. **allocUnsafe不fill直接使用**：读取到旧内存残留密码、文件数据，造成敏感信息泄露；
5. **拼接大量字符串代替Buffer.concat**：大文件循环字符串拼接性能极差，内存暴涨，二进制统一用Buffer.concat；
6. **加密函数直接传字符串**：crypto库底层只识别Buffer，字符串会自动隐式转换，性能下降，规范写法手动转Buffer。

## 七、选型总结

1. 处理**文本、小接口返回**：直接字符串，仅接收流chunk时临时转Buffer；
2. 处理**图片、视频、上传文件、加解密、TCP硬件**：必须使用Buffer操作二进制；
3. 拼接多段二进制数据：统一使用 `Buffer.concat`，禁止字符串累加；
4. 需要截取文件头部校验类型、自定义协议：使用 `slice`快速截取字节；
5. 对外输出Base64预览：`buf.toString('base64')`标准写法。

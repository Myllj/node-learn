## 一、process 设置 / 读取环境变量

### 1. 核心原理

`process.env` 是 Node 内置**环境变量对象**，纯 JS 对象，读写操作同步生效，仅对**当前运行的 Node 进程**有效，进程销毁后全部失效，不会写入系统环境变量。

### 1.1 读取已有环境变量

```
// 读取系统/启动时注入的环境变量
console.log(process.env.NODE_ENV); // development / production
console.log(process.env.PORT);
console.log(process.env.PATH); // 系统路径
console.log(process.env.HOME); // 用户根目录
```

### 1.2 代码内动态设置环境变量

**语法：**`process.env.变量名 = 值`

> **所有值自动转为字符串，数字、布尔会隐式转字符串，读取时需手动转换。**

```
// 1. 基础字符串变量
process.env.NODE_ENV = 'production';
process.env.SERVER_NAME = '全栈远程服务';

// 2. 数字会自动转字符串，使用时手动转Number
process.env.PORT = 3000;
console.log(typeof process.env.PORT); // string
const port = Number(process.env.PORT);

// 3. 布尔场景（存字符串'true'/'false'）
process.env.ENABLE_LOG = 'true';
const enableLog = process.env.ENABLE_LOG === 'true';

// 4. 删除环境变量
delete process.env.SERVER_NAME;
```

### 1.3 启动脚本时注入环境变量（开发最常用）

#### Windows(cmd)

```
set NODE_ENV=development && node app.js
```

#### Mac / Linux / Git Bash

```
# 单个变量
NODE_ENV=production PORT=8080 node app.js
```

#### package.json 脚本配置（项目标准写法）

```
{
  "scripts": {
    "dev": "NODE_ENV=development node app.js",
    "prod": "NODE_ENV=production PORT=3000 node app.js"
  }
}
```

### 1.4 第三方库 dotenv 加载 .env 文件（实战必备）

**手动写 **`process.env.xxx` 适合少量变量，项目多配置统一用 `.env` 文件：

1. **安装**

```
npm i dotenv
```

2. **根目录新建 **`.env`

```
NODE_ENV=development
PORT=3000
DB_HOST=127.0.0.1
DB_USER=root
```

3. **入口文件第一行加载**

```
require('dotenv').config();
// 直接读取
console.log(process.env.DB_HOST);
```

### 1.5 实战场景

1. **区分开发 / 生产环境：**`NODE_ENV` 判断是否开启日志、热更新、压缩；
2. **统一配置端口、数据库地址、第三方密钥；**
3. **CI/CD 流水线注入线上敏感配置，不硬编码到代码。**

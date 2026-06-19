# Node\.js 环境变量与项目配置 实战总结笔记

## 一、核心概念分工（工作必备区分）

### 1\. 环境变量（\.env 系列文件）

- **作用**：存放动态、敏感、环境差异化配置

- **存储内容**：数据库账号密码、OSS密钥、JWT私钥、接口域名、运行环境、端口

- **特性**：仅当前进程生效、进程销毁即失效、所有值均为字符串类型

- **Git规范**：私密带密钥文件禁止提交，公共无敏感配置可提交

### 2\. 项目静态配置（config 文件夹）

- **作用**：存放固定业务常量，分环境统一管理

- **存储内容**：文件上传大小、分页默认条数、接口超时时间、白名单、日志等级

- **特性**：支持数字/布尔/数组/对象，无需类型转换，代码可直接使用

- **Git规范**：全部正常提交仓库，属于项目公共配置

### 3\. 企业最终分工规则

- **敏感动态数据 → 环境变量**（杜绝硬编码、防止泄露）

- **业务固定常量 → config 静态配置**（统一维护、方便修改）

## 二、\.env 系列文件完整规范（重点）

### 1\. 五类环境文件作用说明

- **\.env**：全局通用基础配置，所有环境生效，存放公共无敏感变量，**允许提交Git**

- **\.env\.development**：开发环境专属公共配置，团队统一共用，**允许提交Git**

- **\.env\.test**：测试环境专属公共配置，**允许提交Git**

- **\.env\.production**：生产环境非敏感配置，线上密钥不存此处，**允许提交Git**

- **\.env\.local**：个人本地私有配置，可覆盖所有公共配置、存放个人密钥，**禁止提交Git**

### 2\. 标准加载顺序（优先级从低 → 高）

`.env` 基础通用 \< `.env.[NODE_ENV]` 环境公共 \< `.env.local` 本地私有

**优先级高的变量会覆盖低优先级同名变量**

### 3\. 标准加载代码（项目通用）

```javascript
// 1. 加载全局基础配置（最低优先级）
require('dotenv').config({ path: '.env' })
// 2. 加载当前运行环境公共配置
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })
// 3. 加载本地私有配置（最高优先级，覆盖所有配置）
require('dotenv').config({ path: '.env.local' })

```

## 三、\.gitignore 忽略规则详解

### 1\. 标准忽略配置（企业规范）

```Plain Text
# 忽略所有本地私有环境文件（绝对禁止上传）
.env.local
.env.*.local

```

### 2\. 规则解释

- `.env.local`：忽略本地专属私有配置文件

- `.env.*.local`：忽略所有拓展本地私有文件（如 \.env\.development\.local）

- **不忽略**：\.env、\.env\.development、\.env\.test、\.env\.production（无local后缀，公共安全配置）

### 3\. 错误避坑

禁止直接写 `.env` 全局忽略，会导致公共基础配置无法同步团队仓库

## 四、环境变量三大注入方式（全覆盖工作场景 \+ 完整代码步骤）

### 1\. 命令行临时注入 \+ package\.json脚本封装（高频实战）

无需修改任何文件，启动命令临时注入环境变量，适配多环境快速切换、临时调试场景，是企业项目通用启动方式。

**步骤1：package\.json 配置环境启动脚本**

```json
{
  "scripts": {
    "dev": "NODE_ENV=development node app.js",
    "test": "NODE_ENV=test node app.js",
    "prod": "NODE_ENV=production node app.js"
  }
}

```

**步骤2：自定义临时变量（端口、开关等）**

```json
{
  "scripts": {
    "dev": "NODE_ENV=development SERVER_PORT=3000 LOG_OPEN=true node app.js"
  }
}

```

**步骤3：项目代码读取使用**

```javascript
// app.js
// 读取命令行注入的环境变量，手动兜底、类型转换
const env = process.env.NODE_ENV
const port = Number(process.env.SERVER_PORT) || 3000
const isLogOpen = process.env.LOG_OPEN === 'true'

console.log('当前运行环境：', env)
console.log('服务启动端口：', port)

```

**执行命令**

```bash
# 启动开发环境，自动注入 NODE_ENV=development
npm run dev

```

**适配系统说明**：Windows 可借助 cross\-env 兼容跨平台环境变量（解决命令不统一问题）

```bash
npm i cross-env -D

```

```json
"scripts": {
  "dev": "cross-env NODE_ENV=development SERVER_PORT=3000 node app.js"
}

```

```Plain Text
# Mac/Linux/GitBash
NODE_ENV=development PORT=3000 node app.js

# Windows CMD
set NODE_ENV=development && node app.js

```

### 2\. \.env 文件持久注入 \+ 顶层标准加载（本地开发主力）

通过 dotenv 读取本地\.env系列文件，持久化存储环境变量，无需重复敲命令，适配团队协作、本地长期开发。

**步骤1：安装依赖**

```bash
npm i dotenv

```

**步骤2：项目根目录创建环境文件（规范命名）**

示例：\.env\.development（开发环境公共配置）

```env
# 开发环境变量
NODE_ENV=development
SERVER_PORT=3000
DB_HOST=127.0.0.1
DB_USER=root
LOG_OPEN=true

```

示例：\.env\.local（本地私有配置，优先级最高，可覆盖公共变量）

```env
# 个人本地专属密钥、自定义配置
DB_PWD=12345678
OSS_SECRET=xxxx_private_key

```

**步骤3：项目入口顶层加载（固定标准写法，优先级有序）**

必须在项目入口文件 **第一行优先加载**，保证全局所有模块可读取环境变量

```javascript
// app.js 最顶部，顺序绝对不能乱
// 1. 加载全局通用基础配置（最低优先级）
require('dotenv').config({ path: '.env' })
// 2. 加载当前运行环境公共配置
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })
// 3. 加载本地私有配置（最高优先级，覆盖所有同名变量）
require('dotenv').config({ path: '.env.local' })

// 全局读取使用
const port = Number(process.env.SERVER_PORT) || 3000
const dbPwd = process.env.DB_PWD
console.log('本地私有密钥：', dbPwd)

```

**核心特性**：搭配启动脚本，执行 `npm run dev` 自动匹配环境文件，变量自动覆盖生效

通过 dotenv 自动加载，无需每次手动输入，适配日常开发

### 3\. 服务器/容器注入（生产环境唯一规范，无代码文件）

生产环境禁止使用\.env文件存密钥，通过系统、容器、CI/CD流水线动态注入，全程不落地文件，安全性最高。

- Linux服务器：配置系统全局环境变量、systemd服务环境变量

- Docker/K8s：通过yaml配置、容器env参数注入密钥

- CI/CD流水线：Jenkins/Github Actions后台配置密钥，运行时注入进程

**代码无需任何改动**，依旧通过 `process.env.xxx` 读取，底层自动获取系统注入的环境变量

- 线上禁止使用 \.env 文件存放密钥，存在磁盘泄露风险

- 生产密钥通过 Linux 环境变量、Docker/K8s 环境变量、CI/CD 流水线注入

## 五、环境变量使用注意事项（高频踩坑）

### 1\. 类型问题

所有 `process.env` 变量**全是字符串**，必须手动转换类型

```javascript
const port = Number(process.env.PORT) || 3000
const isOpen = process.env.ENABLE_LOG === 'true'

```

### 2\. 兜底默认值

所有环境变量必须配置默认值，防止线上变量缺失导致报错崩溃

### 3\. 安全红线

- 禁止密钥硬编码写入代码

- 禁止带敏感信息的 \.local 文件提交 Git

- 生产环境密钥不落地文件，使用容器/系统环境变量注入

## 六、企业级最佳实践方案

### 1\. 小型项目/脚本

仅使用 **dotenv \+ \.env 系列文件**，极简配置即可

### 2\. 中大型线上项目（标准搭配）

- 敏感密钥 → 环境变量 \.env 系列

- 业务常量 → config 配置包分环境管理

- 统一封装全局配置工具类，集中读取、导出所有配置

### 3\. 容器化项目（Docker/K8s）

- 本地开发：使用 dotenv 读取环境文件

- 线上部署：完全舍弃 \.env 文件，全部使用容器环境变量注入

## 七、面试高频简答

1. **\.env\.local 和 \.env\.development 区别？**
\.env\.development 是团队公共开发配置，可提交Git；\.env\.local 是个人本地私有配置，优先级最高，禁止提交Git。

2. **环境变量为什么要单独存放，不写配置文件？**
环境变量可动态注入、不落地代码、规避密钥提交仓库泄露风险，适配本地/测试/生产多环境差异化配置。

3. **process\.env 变量特点？**
全部为字符串类型、进程级生效、重启失效、可动态覆盖。

4. **生产环境为什么不用 \.env\.production 存密钥？**
文件落地服务器存在泄露风险，线上规范使用系统/容器环境变量注入密钥。

> （注：部分内容可能由 AI 生成）

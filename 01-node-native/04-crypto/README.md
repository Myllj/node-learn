# Node \+ Express 项目 Crypto 模块 实战使用场景 \+ 完整代码笔记

## 一、Crypto 模块整体定位 \& 使用频率

### 1\. 模块介绍

`crypto` 是 Node\.js **内置原生加密模块**，无需安装第三方依赖，专门用于：哈希摘要、对称加密、非对称加密、接口签名、随机密钥生成，是后端项目安全体系的核心模块。

### 2\. 实战使用频率（企业真实项目）

- **⭐⭐⭐⭐⭐ 高频必用**：用户密码加盐加密、接口签名验签、防参数篡改

- **⭐⭐⭐⭐ 高频**：手机号/身份证隐私字段加密入库、文件完整性校验

- **⭐⭐⭐ 中频**：第三方支付（微信/支付宝）RSA签名验签、Token随机盐生成

- **⭐ 低频**：纯简单CRUD无用户、无隐私、无对外接口项目

### 3\. 三大加密体系实战分工

- **哈希摘要（不可逆）**：HMAC\-SHA256、SHA512、MD5 → 密码存储、文件校验、签名摘要

- **对称加密（可逆）**：AES → 隐私数据加密存储（手机号、身份证）

- **非对称加密（可逆、公私钥）**：RSA → 支付对接、对外安全接口验签

---

## 二、Express 项目落地规范（核心重点）

Express 项目不会零散写加密代码，统一遵循 **工具封装 \+ 环境变量存密钥 \+ 全局统一调用** 规范，杜绝硬编码、零散代码、安全漏洞。

### 1\. 项目目录规范

```Plain Text
src/
├── utils/
│   └── crypto.js   # 统一封装：加密、解密、签名、验签、密码校验
├── .env            # 存放密钥、盐值（禁止提交Git）
├── config/         # 通用加密配置

```

### 2\. 核心强制规范（线上必须遵守）

- 所有 **盐值、AES密钥、接口密钥、RSA私钥** 全部放入环境变量 `process.env`，禁止硬编码

- 用户密码禁止明文存储、禁止单纯MD5，统一使用 **HMAC\-SHA256加盐**

- 密码、签名对比必须使用`crypto.timingSafeEqual`，防止计时暴力破解

- 对称加密统一使用 `createCipheriv`（带IV向量），废弃老旧不安全的 `createCipher`

- 随机盐、随机Token统一使用 `crypto.randomBytes`，废弃不安全的 `Math.random`

---

## 三、Express 项目通用 Crypto 工具类（可直接全局复用）

新建 `src/utils/crypto.js`，整合所有高频方法，全局路由直接调用

```javascript
const crypto = require('crypto')

// 从环境变量读取密钥（核心：不硬编码）
const CRYPT_SALT = process.env.CRYPT_SALT || 'default_salt_2026'
const API_SECRET = process.env.API_SECRET || 'default_api_secret'
const AES_KEY = Buffer.from(process.env.AES_KEY || '1234567890abcdef')
const AES_IV = Buffer.from(process.env.AES_IV || 'abcdef1234567890')

/**
 * 1. 用户密码加密 HMAC-SHA256（项目密码存储标准）
 * @param {string} pwd 明文密码
 * @returns {string} 加密密文
 */
function encryptPwd(pwd) {
  return crypto.createHmac('sha256', CRYPT_SALT)
    .update(pwd)
    .digest('hex')
}

/**
 * 2. 密码安全校验（防计时攻击）
 * @param {string} inputPwd 输入密码
 * @param {string} dbPwd 数据库加密密码
 * @returns {boolean}
 */
function verifyPwd(inputPwd, dbPwd) {
  const hash = encryptPwd(inputPwd)
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(dbPwd))
}

/**
 * 3. AES-128-CBC 对称加密（隐私数据：手机号、身份证）
 * @param {string} text 明文
 * @returns {string} 密文
 */
function aesEncrypt(text) {
  const cipher = crypto.createCipheriv('aes-128-cbc', AES_KEY, AES_IV)
  let res = cipher.update(text, 'utf8', 'hex')
  res += cipher.final('hex')
  return res
}

/**
 * 4. AES 对称解密
 * @param {string} cipherText 密文
 * @returns {string} 明文
 */
function aesDecrypt(cipherText) {
  const decipher = crypto.createDecipheriv('aes-128-cbc', AES_KEY, AES_IV)
  let res = decipher.update(cipherText, 'hex', 'utf8')
  res += decipher.final('utf8')
  return res
}

/**
 * 5. 生成接口签名（防参数篡改）
 * @param {object} params 请求参数
 * @returns {string} sign签名
 */
function createSign(params) {
  // 参数排序后拼接
  const keys = Object.keys(params).sort()
  let str = ''
  keys.forEach(key => {
    if (params[key] !== undefined && params[key] !== '') {
      str += `${key}=${params[key]}&`
    }
  })
  return crypto.createHmac('sha256', API_SECRET).update(str).digest('hex')
}

/**
 * 6. 校验接口签名
 * @param {object} params 请求参数
 * @param {string} clientSign 前端传入签名
 * @returns {boolean}
 */
function verifySign(params, clientSign) {
  const serverSign = createSign(params)
  return crypto.timingSafeEqual(Buffer.from(serverSign), Buffer.from(clientSign))
}

/**
 * 7. 生成安全随机盐/随机Token
 * @param {number} len 长度
 * @returns {string}
 */
function randomSalt(len = 16) {
  return crypto.randomBytes(len).toString('hex')
}

module.exports = {
  encryptPwd,
  verifyPwd,
  aesEncrypt,
  aesDecrypt,
  createSign,
  verifySign,
  randomSalt
}

```

---

## 四、Express 业务场景实战落地代码

### 场景1：用户注册 \+ 密码加密入库（最常用）

```javascript
const express = require('express')
const router = express.Router()
const { encryptPwd } = require('../utils/crypto')
const db = require('../db')

// 用户注册接口
router.post('/register', async (req, res) => {
  const { username, password } = req.body
  // 密码加密
  const hashPwd = encryptPwd(password)
  // 加密后存入数据库，不存明文
  await db.insertUser({ username, password: hashPwd })
  res.json({ code: 200, msg: '注册成功' })
})

module.exports = router
```

### 场景2：用户登录 \+ 密码校验

```javascript
const { verifyPwd } = require('../utils/crypto')

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  // 查询数据库加密密码
  const user = await db.getUserByName(username)
  if (!user) return res.json({ code: 400, msg: '用户不存在' })

  // 安全校验密码
  if (!verifyPwd(password, user.password)) {
    return res.json({ code: 400, msg: '密码错误' })
  }

  res.json({ code: 200, msg: '登录成功' })
})

```

### 场景3：用户隐私字段加密存储（手机号、身份证）

```javascript
const { aesEncrypt, aesDecrypt } = require('../utils/crypto')

// 保存用户隐私信息
router.post('/save-info', async (req, res) => {
  const { phone, idCard, userId } = req.body
  // 加密后入库
  const encryptPhone = aesEncrypt(phone)
  const encryptIdCard = aesEncrypt(idCard)

  await db.updateUserInfo(userId, { phone: encryptPhone, idCard: encryptIdCard })
  res.json({ code: 200, msg: '保存成功' })
})

// 查询自动解密返回
router.get('/user-info/:id', async (req, res) => {
  const user = await db.getUserInfo(req.params.id)
  res.json({
    code: 200,
    data: {
      phone: aesDecrypt(user.phone),
      idCard: aesDecrypt(user.idCard)
    }
  })
})

```

### 场景4：全局接口签名中间件（防篡改、防非法请求）

所有对外开放接口统一校验签名，拦截恶意请求

```javascript
// middleware/signCheck.js
const { verifySign } = require('../utils/crypto')

module.exports = (req, res, next) => {
  const { sign, ...params } = req.body
  if (!sign) {
    return res.status(400).json({ code: 400, msg: '缺少签名参数' })
  }
  // 校验签名
  if (!verifySign(params, sign)) {
    return res.status(403).json({ code: 403, msg: '签名非法，参数被篡改' })
  }
  next()
}

```

路由挂载使用

```javascript
const signCheck = require('../middleware/signCheck')
// 开放接口统一校验签名
router.post('/api/get-data', signCheck, (req, res) => {
  res.json({ code: 200, data: '业务数据' })
})

```

### 场景5：文件哈希校验（上传文件防篡改）

```javascript
const crypto = require('crypto')
const fs = require('fs')

// 流式计算文件哈希（支持大文件，不爆内存）
function getFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const rs = fs.createReadStream(filePath)
    rs.on('data', chunk => hash.update(chunk))
    rs.on('end', () => resolve(hash.digest('hex')))
    rs.on('error', reject)
  })
}

// 上传接口校验
router.post('/upload', async (req, res) => {
  const fileHash = await getFileHash(req.file.path)
  // 对比数据库存储的哈希，判断是否篡改
  res.json({ code: 200, hash: fileHash })
})

```

---

## 五、RSA非对称加密实战（支付/第三方对接）

适用于：微信支付、支付宝、第三方安全接口，**私钥签名、公钥验签**

```javascript
const crypto = require('crypto')
const fs = require('fs')

// 读取密钥（线上密钥文件/环境变量注入）
const privateKey = fs.readFileSync('./keys/private.key')
const publicKey = fs.readFileSync('./keys/public.key')

// 私钥签名（服务端）
function rsaSign(data) {
  const sign = crypto.createSign('sha256')
  sign.update(data)
  return sign.sign(privateKey, 'hex')
}

// 公钥验签（第三方/接口校验）
function rsaVerify(data, sign) {
  const verify = crypto.createVerify('sha256')
  verify.update(data)
  return verify.verify(publicKey, sign, 'hex')
}

```

---

## 六、核心API速查表

- `crypto.createHmac(alg, key)`：带盐哈希（密码、签名首选，安全）

- `crypto.createHash(alg)`：普通哈希（仅文件校验）

- `crypto.createCipheriv()`：标准AES加密

- `crypto.createDecipheriv()`：标准AES解密

- `crypto.createSign()`：RSA私钥签名

- `crypto.createVerify()`：RSA公钥验签

- `crypto.timingSafeEqual()`：安全对比Buffer，防暴力破解

- `crypto.randomBytes()`：生成安全随机字符串

---

## 七、企业级避坑 \& 安全规范（必记）

1. **禁止密码纯MD5**：MD5无盐易撞库，用户密码必须 HMAC\-SHA256 \+ 自定义盐

2. **禁止密钥硬编码**：所有盐值、AES密钥、API密钥全部存入\.env环境变量

3. **禁止字符串===对比签名/密码**：必须用 timingSafeEqual 防计时攻击

4. **AES密钥长度必须合规**：AES128=16字节、AES256=32字节，长度错误直接报错

5. **大文件必须流式哈希**：避免一次性读取文件导致内存溢出

6. **废弃老旧API**：不用 createCipher、不用 Math\.random

7. **RSA私钥绝对保密**：私钥不对外暴露、不提交Git，公钥可公开分发

8. **接口签名必带时间戳**：防止重放攻击（可在签名参数中加入timestamp校验过期）

---

## 八、面试高频简答

#### 1\. Express项目为什么要封装统一crypto工具，不零散写？

统一加密规则、统一密钥管理、方便全局维护，修改加密算法只需改工具类，不用改每一处业务代码，同时规避硬编码、算法不统一的安全漏洞。

#### 2\. HMAC\-SHA256 和普通 MD5/SHA256 区别？

HMAC自带密钥盐值，即使明文泄露、哈希值泄露，无盐值无法破解匹配，安全性远高于无盐普通哈希，适合密码存储。

#### 3\. AES 为什么必须用 createCipheriv 带IV？

IV初始化向量可以保证：相同明文\+相同密钥，每次加密密文不同，避免固定密文被破解，是生产环境安全标准。

#### 4\. 接口签名的作用是什么？

防止请求参数被篡改、防止非法请求、防止接口重放攻击，保障对外开放接口安全。

> （注：部分内容可能由 AI 生成）

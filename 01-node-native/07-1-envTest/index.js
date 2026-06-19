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
console.log('当前环境：', process.env.NODE_ENV)
console.log('服务器端口：', port)
console.log('本地私有密钥：', dbPwd)

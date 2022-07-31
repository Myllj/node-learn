const express = require('express')
const app = express()

// 配置cors跨域
const cors = require('cors')
app.use(cors())

//配置解析 application/x-www-form-urlencoded 格式的表单数据的中间件
app.use(express.urlencoded({ extended: false }))


const router=require('./router/user')
app.use('/api',router)



app.listen(3007, function () {
  console.log('api server running at http://127.0.0.1:3007')
})
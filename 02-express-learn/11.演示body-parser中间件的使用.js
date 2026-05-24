// 导入 express 模块
const express = require('express')
// 创建 express 的服务器实例
const app = express()

//body-parser中间件的作用等同于下面express.urlencoded的作用，express.urlencoded是express新版本提供的
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
// app.use(express.urlencoded({ extended: false }))


app.post('/user', (req, res) => {
  // 如果没有配置任何解析表单数据的中间件，则 req.body 默认等于 undefined
  console.log(req.body)
  res.send('ok')
})

// 调用 app.listen 方法，指定端口号并启动web服务器
app.listen(80, function () {
  console.log('Express server running at http://127.0.0.1')
})

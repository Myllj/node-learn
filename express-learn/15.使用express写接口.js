const express=require('express')
const app=express()

// 配置解析表单数据的中间件
app.use(express.urlencoded({extended:false}))

// 必须在配置 cors 中间件之前，配置 JSONP 的接口
app.get('/api/jsonp', (req, res) => {
  // TODO: 定义 JSONP 接口具体的实现过程
  // 1. 得到函数的名称
  const funcName = req.query.callback
  // 2. 定义要发送到客户端的数据对象
  const data = { name: 'zs', age: 22 }
  // 3. 拼接出一个函数的调用
  const scriptStr = `${funcName}(${JSON.stringify(data)})`
  // 4. 把拼接的字符串，响应给客户端
  res.send(scriptStr)
})

var cors = require('cors')//cors中间件，解决跨域问题
app.use(cors())

//express.json()中间件解析客户端传过来json数据
app.use(express.json())

const router=require('./16.apiRouter')
app.use('/api',router)


app.listen(80,()=>{
  console.log('写接口...');
})
const express=require('express')
const app=express()

// 1. 定义中间件函数
const mw1=(req,res,next)=>{
  console.log('调用了局部生效的中间件111');
  next()
}

const mw2=(req,res,next)=>{
  console.log('调用了局部生效的中间件222');
  next()
}

// 2. 创建路由
app.get('/', [mw1, mw2], (req, res) => {
  console.log('/////路由');
  res.send('Home page.')
})
app.get('/user', (req, res) => {
  console.log('这是/user路由...');
  res.send('User page.')
})

// 调用 app.listen 方法，指定端口号并启动web服务器
app.listen(80, function () {
  console.log('Express server running at http://127.0.0.1')
})

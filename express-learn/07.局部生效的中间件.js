const express=require('express')
const app=express()

// 1. 定义中间件函数
const mw=(req,res,next)=>{
  console.log('调用了局部生效的中间件');
  next()
}

// 2. 创建路由
app.get('/',mw,(req,res)=>{
  console.log('这是/路由');
})

app.get('/user',(req,res)=>{
  console.log('这是/user路由');
})

app.listen(80,()=>{
  console.log('server123...');
})
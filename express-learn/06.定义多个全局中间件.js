const express=require('express')
const app=express()

// 定义第一个全局中间件
app.use((req,res,next)=>{
  console.log('调用了第1个全局中间件');
  next()
})

// 定义第二个全局中间件
app.use((req,res,next)=>{
  console.log('调用了第2个全局中间件');
  next()
})

// 定义一个路由
app.get('/user',(req,res)=>{
  console.log('这是user接口');
})

app.listen(80,()=>{
  console.log('server123...');
})

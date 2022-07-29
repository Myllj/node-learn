const express = require('express')
const app=express()
const router=require('./03.router')

// app.use(express.urlencoded({ extended: true })) 

app.use(router)
//此时是以/api/xxx形式访问
// app.use('/api',router)

app.listen(80,()=>{
  console.log('路由测试。。。');
})
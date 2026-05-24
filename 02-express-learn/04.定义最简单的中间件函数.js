const express=require('express')
const app=express()

// const mw=function(req,res,next){
//   console.log('这是最简单的中间件函数');
//   //把流转关系，转交给下一个中间件或路由
//   next()
// }

// app.use(mw)

app.use((req,res,next)=>{
  console.log('这是最简单的中间件函数222');
  next()
})

app.get('/', (req, res) => {
  console.log('调用了 / 这个路由')
  res.send('Home page.')
})
app.get('/user', (req, res) => {
  console.log('调用了 /user 这个路由')
  res.send('User page.')
})

app.listen(80, () => {
  console.log('http://127.0.0.1')
})

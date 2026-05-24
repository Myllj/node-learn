const express=require('express')
const router=express.Router()

router.get('/getList',(req,res)=>{
  // 通过 req.query 获取客户端通过查询字符串，发送到服务器的数据
  const query = req.query
  // 调用 res.send() 方法，向客户端响应处理的结果
  res.send({
    status: 0, // 0 表示处理成功，1 表示处理失败
    msg: 'GET 请求成功！', // 状态的描述
    data: query, // 需要响应给客户端的数据
  })
})

router.post('/login',(req,res)=>{
  const body=req.body
  console.log(body);
  res.send({
    status: 0, // 0 表示处理成功，1 表示处理失败
    msg: 'POST 请求成功！', // 状态的描述
    data: body, // 需要响应给客户端的数据
  })
})

// 定义 DELETE 接口
router.delete('/delete', (req, res) => {
  res.send({
    status: 0,
    msg: 'DELETE请求成功',
  })
})

module.exports=router
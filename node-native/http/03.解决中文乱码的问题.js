const http=require('http')
const server=http.createServer()
server.on('request',function(req,res){
    const str=`你好啊！我叫张三，请问你是谁？`
    console.log(str);

    //设置请求头
    res.setHeader('Content-type','text/html;charset=utf-8')
    res.end(str)
})

server.listen(8080,function(){
  console.log('This is 8080');  
})
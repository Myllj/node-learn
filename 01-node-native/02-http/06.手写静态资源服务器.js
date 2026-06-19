/*
 * @Descripttion: 
 * @version: 
 * @Author: llj
 * @email: 
 * @Date: 2026-06-16 10:59:38
 * @LastEditors: llj
 * @LastEditTime: 2026-06-16 11:42:21
 */
const http = require('http')
const fs = require('fs')
const path = require('path')

const server = http.createServer((req, res) => {
  // 拼接静态文件真实路径
  //处理根路径特殊情况，默认返回 index.html;/index.css就返回index.css
  let getCustomPath = `${path.extname(req.url).split(".")[1]}${req.url}`;
  let filePath = path.join(__dirname, './dist', req.url === '/' ? '/index.html' : getCustomPath)
  
  console.log('请求路径：',getCustomPath)
  // 读取静态文件
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, {'Content-Type':'text/html;charset=utf-8'})
      return res.end('404 页面不存在')
    }
    // 自动匹配资源类型（简易版）
    if(filePath.endsWith('.css')) res.setHeader('Content-Type','text/css')
    if(filePath.endsWith('.js')) res.setHeader('Content-Type','application/javascript')
    res.end(data)
  })
})

server.listen(3000, () => {
  console.log('静态资源服务启动：http://127.0.0.1:3000')
})
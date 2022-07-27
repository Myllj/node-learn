const fs = require('fs')

//错误路径./files/11.txt
//正确路径./files/110.txt
fs.readFile('./files/110.txt', 'utf8', function(err, dataStr) {
  if (err) {
    return console.log('读取文件失败！' + err.message)
  }
  console.log('读取文件成功！' + dataStr)
})
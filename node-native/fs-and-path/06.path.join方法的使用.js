const path = require('path')
const fs = require('fs')

// 注意：  ../ 会抵消前面的路径
// const pathStr = path.join('/a', '/b/c', '../../', './d', 'e')
// console.log(pathStr)  // \a\b\d\e

console.log('__dirname',__dirname)
console.log(__dirname + './files/110.txt');//此时多一个.就会出错
fs.readFile(__dirname + '/files/110.txt','utf8',function (err,data) {
  console.log('data',data);
})


fs.readFile(path.join(__dirname, './files/110.txt'), 'utf8', function(err, dataStr) {
  if (err) {
    return console.log(err.message)
  }
  console.log(dataStr)
})

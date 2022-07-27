// 1. 导入 fs 模块，来操作文件
const fs = require('fs')

/**
 * 
 * 坑：在使用fs模块操作文件时，如果提供的操作路径是以./或../开头的相对路径时，很容易出现路径动态拼接错误的问题
 * 原因：代码再运行的时候，会以执行 node 命令时所处的目录，动态拼接出被操作文件的完整路径
 * 解决方案：在使用fs模块操作文件时，直接提供完整的路径，不要以./或../开头的相对路径，从而防止路径动态拼接问题
 * 1、我在根目录node-native运行node .\fs\01.使用readFile方法读取文件的内容.js，.\路径是相对根路径去查找的根路径的files文件夹，而不是node-native里的fs文件夹去查找
 * 
 * 2、建议cd fs进入文件fs夹，然后再node 01.使用readFile方法读取文件的内容.js,此时'./files/110.txt'就是当前目录files下的110.txt文件
 * 
 */


// 2. 调用 fs.readFile() 方法读取文件
//    参数1：读取文件的存放路径
//    参数2：读取文件时候采用的编码格式，一般默认指定 utf8
//    参数3：回调函数，拿到读取失败和成功的结果  err  dataStr

//示例1
fs.readFile('./files/110.txt','utf8',function (err,dataStr) {
  console.log('223');
  // 2.1 打印失败的结果
  // 如果读取成功，则 err 的值为 null
  // 如果读取失败，则 err 的值为 错误对象，dataStr 的值为 undefined
  console.log(err)
  console.log('-------')
  // 2.2 打印成功的结果
  console.log(dataStr)
})


// 示例2
/* var readMe=fs.readFileSync('./files/110.txt','utf8');//同步读取
console.log(readMe) */

/*备注:
      同理也有异步写入文件;
      同步读取与异步读取的区别是接收参数不同,异步读取多出一个回调函数,而同步读取只有两个参数;
      同步读取需要捕获错误需要使用try...catch*/
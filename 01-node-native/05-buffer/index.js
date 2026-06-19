const fs = require('fs');
const rs = fs.createReadStream('abc.mp4');
// 2. 新增：创建可写流 ws，写入目标文件
const ws = fs.createWriteStream('./copyMP4/copy-big-file.mp4');


/* 本例子是读取当前目录 abc.mp4文件，打印Buffer出来，最好写入copyMP4目录下*/
rs.on('data', (chunk) => {
  // chunk 类型为 Buffer
  console.log('本次读取字节大小：', chunk.length);
  // 二进制直接写入可写流，无需转字符串
  ws.write(chunk);
});

rs.on('end', () => {
  console.log('读取完成');
  // 读取完毕，关闭可写流，确保缓存全部写入磁盘
  ws.end();
});

rs.on('error', err => console.error('读取失败', err));
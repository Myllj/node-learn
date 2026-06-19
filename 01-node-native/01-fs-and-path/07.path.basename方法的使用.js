/*
 * @Descripttion: 
 * @version: 
 * @Author: llj
 * @email: 
 * @Date: 2024-07-28 12:01:22
 * @LastEditors: llj
 * @LastEditTime: 2026-06-15 21:06:17
 */
const path = require('path')


/**
 * path.basename(路径, 后缀)：获取路径中的文件名，第二个参数是要移除的文件后缀。
 */

// 定义文件的存放路径
const fpath = '/a/b/c/index.html'

const fullName = path.basename(fpath)
console.log(fullName)

const nameWithoutExt = path.basename(fpath, '.html')
console.log(nameWithoutExt)

//这里路径最终文件是 a.jpg，指定移除后缀 .html，两者不匹配，后缀不会被删除，最终返回 a.jpg
const basename = path.basename("dfsdsf/sdsafz/asxcx/a.jpg", ".html");
console.log(basename)


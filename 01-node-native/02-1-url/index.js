/*
 * @Descripttion: 
 * @version: 
 * @Author: llj
 * @email: 
 * @Date: 2026-06-19 10:15:14
 * @LastEditors: llj
 * @LastEditTime: 2026-06-19 10:15:24
 */
// 完整绝对地址
const myUrl = new URL('http://127.0.0.1:3000/api/user?id=1&name=zs')
console.log(myUrl.hostname) // 127.0.0.1
console.log(myUrl.port)     // 3000
console.log(myUrl.pathname) // /api/user
console.log(myUrl.search)   // ?id=1&name=zs
console.log(myUrl.origin)    // http://127.0.0.1
// searchParams 内置参数解析器（替代querystring）
const searchParams = myUrl.searchParams
console.log('searchParams:',searchParams);

console.log(searchParams.get('id')) // 1
searchParams.set('age', 25) // 新增参数
console.log(searchParams.toString()) // id=1&name=zs&age=25
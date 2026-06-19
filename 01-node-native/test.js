/*
 * @Descripttion: 
 * @version: 
 * @Author: llj
 * @email: 
 * @Date: 2026-06-19 15:24:24
 * @LastEditors: llj
 * @LastEditTime: 2026-06-19 15:24:38
 */
console.log('1.同步代码');


setImmediate(() => {
  console.log('5.setImmediate 宏任务');
})

setTimeout(() => {
  console.log('4.setTimeout 宏任务');
}, 0);


Promise.resolve().then(() => {
  console.log('3.Promise微任务');
})

process.nextTick(() => {
  console.log('2.nextTick最高优先级微任务');
})
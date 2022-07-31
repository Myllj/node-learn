const mysql = require('mysql')

const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'admin',
  database: 'my_db_01',
})

// 测试 mysql 模块能否正常工作
/* db.query('select 1', (err, results) => {
  if (err) return console.log(err.message)
  console.log('results:',results)
}) */


// 查询 users 表中所有的数据
const sqlStr = 'select * from users'
db.query(sqlStr, (err, results) => {
  // 查询数据失败
  if (err) return console.log(err.message)
  // 查询数据成功
  // 注意：如果执行的是 select 查询语句，则执行的结果是数组
  console.log(100,results)
})

// 向 users 表中，新增一条数据，其中 username 的值为 Spider-Man2  passworld 的值为 pcc12345
/* const user = { username: 'Spider-Man2', passworld: 'pcc12345' }
// 定义待执行的 SQL 语句
const sqlStr = 'insert into users (username, passworld) values (?, ?)'
// 执行 SQL 语句
db.query(sqlStr, [user.username, user.passworld], (err, results) => {
  // 执行 SQL 语句失败了
  if (err) return console.log(err.message)
  // 成功了
  // 注意：如果执行的是 insert into 插入语句，则 results 是一个对象
  // 可以通过 affectedRows 属性，来判断是否插入数据成功
  if (results.affectedRows === 1) {
    console.log('插入数据成功!')
  }
}) */

// 演示插入数据的便捷方式
/* const user = { username: 'Spider-Man222', passworld: 'www123' }
// 定义待执行的 SQL 语句
const sqlStr = 'insert into users set ?'
// 执行 SQL 语句
db.query(sqlStr, user, (err, results) => {
  if (err) return console.log(err.message)
  if (results.affectedRows === 1) {
    console.log('插入数据成功')
  }
}) */

// 演示如何更新用户的信息
/* const user = { id: 9, username: 'aaa', passworld: '000' }
// 定义 SQL 语句
const sqlStr = 'update users set username=?, passworld=? where id=?'
// 执行 SQL 语句
db.query(sqlStr, [user.username, user.passworld, user.id], (err, results) => {
  if (err) return console.log(err.message)
  // 注意：执行了 update 语句之后，执行的结果，也是一个对象，可以通过 affectedRows 判断是否更新成功
  if (results.affectedRows === 1) {
    console.log('更新成功')
  }
}) */

// 演示更新数据的便捷方式
/* const user = { id: 8, username: 'aaaa', passworld: '0000' }
// 定义 SQL 语句
const sqlStr = 'update users set ? where id=?'
// 执行 SQL 语句
db.query(sqlStr, [user, user.id], (err, results) => {
  if (err) return console.log(err.message)
  if (results.affectedRows === 1) {
    console.log('更新数据成功')
  }
}) */

// 删除 id 为 5 的用户
/* const sqlStr = 'delete from users where id=?'
db.query(sqlStr, 11, (err, results) => {
  if (err) return console.log(err.message)
  // 注意：执行 delete 语句之后，结果也是一个对象，也会包含 affectedRows 属性
  if (results.affectedRows === 1) {
    console.log('删除数据成功')
  }
}) */

// 标记删除
/* const sqlStr = 'update users set status=? where id=?'
db.query(sqlStr, [1, 12], (err, results) => {
  if (err) return console.log(err.message)
  if (results.affectedRows === 1) {
    console.log('标记删除成功')
  }
}) */
/* process.argv.forEach((val, index) => {
  console.log(`${index}: ${val}`)
}) */

/* const args = process.argv.slice(2)
console.log('args',args,args[0]); */

/* const args = require('minimist')(process.argv.slice(2))
console.log('args',args,args['name']); */

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

readline.question(`你叫什么名字?`, name => {
  console.log(`你好 ${name}!`)
  readline.close()
})
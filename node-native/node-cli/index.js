// const inquirer = require('inquirer')

/* 要使用以下import方式，需要在package.json文件中添加 "type": "module" */
import inquirer from 'inquirer';

var questions = [
  {
    type: 'input',
    name: 'name',
    message: "你叫什么名字?"
  },
  {
    type: 'input',
    name: 'age',
    message: "你几岁了?"
  }
]

inquirer.prompt(questions).then(answers => {
  console.log('answers--',answers);
  console.log(`你好 ${answers['name']}!`)
})

console.log('222');
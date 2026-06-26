<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
📑 **目录**

- [📁 项目目录结构](#-%E9%A1%B9%E7%9B%AE%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84)
- [自动把当前项目目录树写入 README.md（从最简单到工程自动化）](#%E8%87%AA%E5%8A%A8%E6%8A%8A%E5%BD%93%E5%89%8D%E9%A1%B9%E7%9B%AE%E7%9B%AE%E5%BD%95%E6%A0%91%E5%86%99%E5%85%A5-readmemd%E4%BB%8E%E6%9C%80%E7%AE%80%E5%8D%95%E5%88%B0%E5%B7%A5%E7%A8%8B%E8%87%AA%E5%8A%A8%E5%8C%96)
- [根目录下package.json文件里scripts脚本](#%E6%A0%B9%E7%9B%AE%E5%BD%95%E4%B8%8Bpackagejson%E6%96%87%E4%BB%B6%E9%87%8Cscripts%E8%84%9A%E6%9C%AC)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



## 📁 项目目录结构

```text
node-learn/
├─ 01-node-native/       node的原生知识点
├─ 02-express-learn/     Express框架学习案例
├─ 03-operate-mysql/     MySQL数据库基础操作
├─ 04-prisma-learn/      Prisma ORM框架实操
├─ case/                 综合实战案例合集
├─ .gitignore            Git忽略文件配置
├─ gen-tree.js           自动生成目录树脚本
├─ package.json          项目依赖与npm脚本配置
└─ README.md             项目说明文档
```


## 自动把当前项目目录树写入 README.md（从最简单到工程自动化）

### 方案：自定义 Node 脚本（完全可控，自动替换目录区块）

适合长期项目，写入 package.json 脚本一键更新，精准替换指定 markdown 区块，不污染其他内容。

#### 1）项目根新建 gen-tree.js

```js
const fs = require('fs');
const path = require('path');

// 配置项
const README_PATH = './README.md';
const IGNORE = ['node_modules', '.git', 'dist', 'build', '.vscode', '.DS_Store'];
const MAX_DEPTH = 4;
const TITLE = '## 📁 项目目录结构';

// 递归生成树形字符串
function generateTree(dir, depth = 0, prefix = '') {
  let tree = '';
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => !IGNORE.includes(e.name))
    .sort((a, b) => {
      // 文件夹排前面
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  entries.forEach((entry, idx) => {
    if (depth >= MAX_DEPTH) return;
    const isLast = idx === entries.length - 1;
    const symbol = isLast ? '└─' : '├─';
    const name = entry.isDirectory() ? `${entry.name}/` : entry.name;
    tree += `${prefix}${symbol} ${name}\n`;

    if (entry.isDirectory()) {
      const newPrefix = prefix + (isLast ? '   ' : '│  ');
      tree += generateTree(path.join(dir, entry.name), depth + 1, newPrefix);
    }

  });
  return tree;
}

// 拼接md完整区块
function buildMdBlock() {
  const rootName = path.basename(path.resolve('.'));
  const treeStr = `${rootName}/\n` + generateTree('./');
  return `${TITLE}\n\n\`\`\`text\n${treeStr}\`\`\`\n`;
}

// 替换README中旧的目录区块
function updateReadme() {
  const block = buildMdBlock();
  let content = '';
  if (fs.existsSync(README_PATH)) {
    content = fs.readFileSync(README_PATH, 'utf8');
    // 正则匹配旧目录区块，全局替换
    const reg = new RegExp(`${TITLE}[\\s\\S]*?\`\`\`\\s*\``, 'g');
    if (reg.test(content)) {
      content = content.replace(reg, block.trimEnd());
    } else {
      // 不存在则追加到末尾
      content += `\n\n${block}`;
    }
  } else {
    content = `# 项目\n\n${block}`;
  }
  fs.writeFileSync(README_PATH, content, 'utf8');
  console.log('✅ 目录结构已自动更新到 README.md');
}

updateReadme();
```

#### 2）package.json 添加脚本

```json
{
  "scripts": {
    "gen-tree": "node gen-tree.js"
  }
}
```

#### 3）一键执行更新

```bash
npm run gen-tree
```

每次修改文件 / 文件夹，运行命令自动刷新目录，完美适配开发流程。


## 根目录下package.json文件里scripts脚本
```
//生成当前README文件的项目目录结构，具体怎么用仔细阅读当前README文件
npm run gen-tree

//生成当前README文件头部目录
npm run toc
```



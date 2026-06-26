/*
 * @Descripttion:
 * @version:
 * @Author: llj
 * @email:
 * @Date: 2026-06-26 11:41:44
 * @LastEditors: llj
 * @LastEditTime: 2026-06-26 13:54:23
 */
const fs = require("fs");
const path = require("path");

// 配置项
const README_PATH = "./README.md";
const IGNORE = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".vscode",
  ".DS_Store",
];
const MAX_DEPTH = 1;
const TITLE = "## 📁 项目目录结构";

// 文件/文件夹注释配置
const DIR_DESC = {
  "01-node-native": "node的原生知识点",
  "02-express-learn": "Express框架学习案例",
  "03-operate-mysql": "MySQL数据库基础操作",
  "04-prisma-learn": "Prisma ORM框架实操",
  "case": "综合实战案例合集",
  ".gitignore": "Git忽略文件配置",
  "gen-tree.js": "自动生成目录树脚本",
  "package.json": "项目依赖与npm脚本配置",
  "README.md": "项目说明文档"
};
// 统一对齐宽度：最长文件名+6个空格留白
const ALIGN_WIDTH = 22;

// 递归生成树形字符串
function generateTree(dir, depth = 0, prefix = "") {
  let tree = "";
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => !IGNORE.includes(e.name))
    .sort((a, b) => {
      // 文件夹排前面
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  entries.forEach((entry, idx) => {
    if (depth >= MAX_DEPTH) return;
    const isLast = idx === entries.length - 1;
    const symbol = isLast ? "└─" : "├─";
    const name = entry.isDirectory() ? `${entry.name}/` : entry.name;
    // 计算需要补多少空格，实现注释统一对齐
    const fillSpace = " ".repeat(ALIGN_WIDTH - name.length);
    const desc = DIR_DESC[entry.name]
      ? `${fillSpace}${DIR_DESC[entry.name]}`
      : "";
    tree += `${prefix}${symbol} ${name}${desc}\n`;

    if (entry.isDirectory()) {
      const newPrefix = prefix + (isLast ? "   " : "│  ");
      tree += generateTree(path.join(dir, entry.name), depth + 1, newPrefix);
    }
  });
  return tree;
}

// 拼接md完整区块
function buildMdBlock() {
  const rootName = path.basename(path.resolve("."));
  const treeStr = `${rootName}/\n` + generateTree("./");
  return `${TITLE}\n\n\`\`\`text\n${treeStr}\`\`\`\n`;
}

// 替换README中旧的目录区块
function updateReadme() {
  const block = buildMdBlock();
  let content = "";
  if (fs.existsSync(README_PATH)) {
    content = fs.readFileSync(README_PATH, "utf8");
    // 正则匹配旧目录区块，全局替换
    const reg = new RegExp(`${TITLE}[\\s\\S]*?\`\`\`\\s*\``, "g");
    if (reg.test(content)) {
      content = content.replace(reg, block.trimEnd());
    } else {
      // 不存在则追加到末尾
      content += `\n\n${block}`;
    }
  } else {
    content = `# 项目\n\n${block}`;
  }
  fs.writeFileSync(README_PATH, content, "utf8");
  console.log("✅ 目录结构已自动更新到 README.md");
}

updateReadme();

# Sum Eliminate - 数字消除

一个基于 React + Vite + Tailwind CSS 开发的数学求和消除益智游戏。

## 游戏特性
- **经典模式**：每次成功消除后新增一行，挑战生存极限。
- **计时模式**：在倒计时结束前完成求和，否则强制新增行。
- **自动补全**：当方块少于 3 行时自动补充，保证游戏节奏。
- **响应式设计**：适配手机和电脑屏幕。

## 本地开发

1. 安装依赖：
   ```bash
   npm install
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

## 部署到 Vercel

### 第一步：推送到 GitHub
1. 在 GitHub 上创建一个新的仓库。
2. 在本地项目目录运行：
   ```bash
   git init
   ```
3. 添加并提交代码：
   ```bash
   git add .
   git commit -m "Initial commit"
   ```
4. 关联远程仓库并推送：
   ```bash
   git remote add origin https://github.com/你的用户名/仓库名.git
   git branch -M main
   git push -u origin main
   ```

### 第二步：在 Vercel 部署
1. 登录 [Vercel](https://vercel.com/)。
2. 点击 **"Add New"** -> **"Project"**。
3. 导入你刚刚创建的 GitHub 仓库。
4. **环境变量配置（重要）**：
   - 在部署设置的 **Environment Variables** 部分，添加 `GEMINI_API_KEY`（如果你在代码中使用了 Gemini 相关功能）。
5. 点击 **"Deploy"**。

Vercel 会自动识别 Vite 项目并完成构建部署。

# 部署到 GitHub Pages

站点是**纯静态**（无构建步骤），可以直接托管。仓库约 **194 MB**（图片占 175 MB），首次推送会慢一些。

---

## 一、最省事：GitHub Desktop（推荐）

你已经有 GitHub 账号，且机器上没装 git，用桌面客户端最稳。

1. 下载安装 [GitHub Desktop](https://desktop.github.com/)
2. 登录 → `File → Add local repository` → 选这个项目目录
   如果提示 "not a git repository"，点 **create a repository**，其余保持默认
3. 左下角填提交信息（例如 `first commit`）→ 点 **Commit to main**
4. 右上角 **Publish repository**
   - ⚠️ **取消勾选 "Keep this code private"**（私有仓库的 Pages 需要付费）
   - 仓库名建议：`chongqing-37`
5. 推送完成后，浏览器打开仓库 → **Settings → Pages**
   - Source 选 **Deploy from a branch**
   - Branch 选 **main**，目录选 **/ (root)** → Save
6. 等 1–2 分钟，访问：

```
https://<你的用户名>.github.io/chongqing-37/
```

> 首页路径就是仓库根目录，`index.html` 会被自动加载；其余页面全用相对路径，子路径部署不受影响。

---

## 二、命令行方式（装好 git 之后）

```powershell
cd 'D:\新建文件夹 (6)\2026-10-13-20-28-46'
git init
git add .
git commit -m "首次提交：重庆 37 区县旅游站"
git branch -M main
git remote add origin https://github.com/<用户名>/<仓库名>.git
git push -u origin main
```

也可以用本目录下的 `deploy.ps1`（会先检查 git、再提交并推送）：

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Remote https://github.com/<用户名>/<仓库名>.git
```

---

## 三、已做的配置

| 文件 | 作用 |
|---|---|
| `.nojekyll` | 关闭 Jekyll 处理。**必须保留**：站内有 `_*.js` 这类下划线开头的文件，Jekyll 会默认忽略它们 |
| `.gitignore` | 排除 `node_modules/`、`.workbuddy/` 下的截图与备份、`shots/`，仓库从 240 MB 降到约 194 MB；但保留生成器（`gen-detail.py`、`gen-culture.py`）、`spot-audit.json`、`HANDOFF.md`、`memory/` |

---

## 四、更新站点

改完内容后：

- **GitHub Desktop**：会列出改动 → 写提交信息 → Commit → Push
- **命令行**：`.\deploy.ps1 -Message "更新子页文案"`

Pages 大约 1 分钟自动重新构建。

---

## 五、常见问题

**图片打不开 / 404**
检查文件名大小写。Pages 跑在 Linux 上，**大小写敏感**，而 Windows 不敏感。站内路径都是小写 slug，正常不会出问题；若手工加过图，确认与引用大小写一致。

**页面 404 但本地正常**
确认仓库根目录直接就是 `index.html`（不是多套了一层文件夹）。

**推送卡住或失败**
仓库 194 MB、约 1900 个文件，首次推送容易超时。可改用：
```powershell
git config http.postBuffer 524288000
git push -u origin main
```
仍失败就先只推代码、图片分批推，或考虑把图片压到 1600px 宽（能省 60% 体积）。

**想用自定义域名**
Settings → Pages → Custom domain 填域名，并在域名商处加 CNAME 记录指向 `<用户名>.github.io`。

---

## 六、比赛提交建议

- 提交链接用 `https://<用户名>.github.io/<仓库名>/`，不要用带 `index.html` 的完整路径
- 答辩前用**手机＋电脑**各打开一次，确认移动端正常
- 建议在仓库 README 顶部放一张首页截图 + 一句话介绍，评委点进来先看到成品

# 重庆 37 区县旅游网站 · 项目交接文档

- **项目根目录**：`D:/新建文件夹 (6)/2026-10-13-20-28-46/`（所有工作都在此根下）
- **运行方式**：`python -m http.server 8688 --bind 127.0.0.1` → <http://127.0.0.1:8688/index.html>（纯静态，无构建步骤）
- **设计标杆**：`wanzhou/index.html` —— 万州页是全站视觉与子页体系的标准，**禁止改动其图片资源**
- **文档版本**：2026-10-18，对应站内 `?v=20261019*` 一代

---

## 一、根目录

| 文件 | 说明 |
|---|---|
| `index.html` | 首页。板块顺序：序章→历史→地形→镜游→闻云→民宿→人文→民族→三维→摄影→猜地方。已注入 `district-links.js`、`#bgfx` 山城夜景背景层 |
| `district.html` | 区县兜底路由：命中 37 区县则 `location.replace` 到 `districts/{slug}.html`，万州→`wanzhou/index.html`，未命中显示 `.d404` 深色卡片 |
| `README.md` | 项目技术说明（板块逐条说明、3D 构件库与九座地标还原依据、地形优化要点） |
| `shots/`、`_*.js` | 截图核验与临时脚本，可删除 |
| `node_modules/` | 仅 playwright（爬图用），非站点依赖 |

> ⚠️ **缓存版本号不是一个统一值**。`index.html` 里每条资源各带各的版本号，改哪个 JS 就升哪个，别整体替换：
> `style.css?v=20261017i`、`district-links.js?v=20261017c`、`data.js?v=20261017l`、`terrain.js?v=20261019l`、`landmark3d.js?v=20261019d`、`history.js?v=20261018a`、`folk.js?v=20261017f`、`guess.js?v=20261017c`、`main.js?v=20261019a`。

## 二、核心 JS（`assets/js/`，约 1.55 万行）

### 渲染 / 工具

| 文件 | 说明 |
|---|---|
| `perf.js` | `window.CHQ_PERF`：低端机判定 `isLow()`、像素比 `pixelRatio(n)`、贴图降采样 `texSize(n)`、`onVisible(el,on,off)`（板块不可见时停渲染循环） |
| `scenes.js` / `clouds-data.js` | 背景氛围 |
| `models.js` | 3D 板块文案数据 `CHQ.MODELS`（9 座地标名称/数据/描述） |

### 三维地标 `landmark3d.js`（约 1660 行，整份重写）

- 真实米制尺度（**1 单位 = 1 米**），不依赖外部模型
- 顶部自研构件库：`roofGeo`（中式屋顶曲面：反宇＋檐口起翘＋四角起翘，四坡/悬山/攒尖）、`coneRoofGeo`（圆攒尖）、`eaveBand`/`ridge`/`douGong`、`stiltHouse`（吊脚楼单体）、`cliffGeo`（可粗糙化岩体）、`archRockGeo`（石拱桥体）、`cableGeo`（悬垂索）、`between`（两点构件）、`polyChain`（沿折线构件）、`winTexture`/`facadeMat`（canvas 窗格贴图→map+emissiveMap）、`roofTexture`/`woodTexture`/`stoneTexture`/`plaqueTexture`（程序化材质）、`mkBuilding`（幕墙楼体＋女儿墙＋屋顶设备）
- 9 个 builder：`hongyadong` / `siyuan` / `diaojiao` / `dazu` / `suodao` / `litang` / `theatre` / `tiankeng` / `kuimen`，按真实形制还原（洪崖洞 11 层 79m 逐层退台＋檐口灯带＋灯笼；解放碑通高 27.5m 八角碑身＋竖线脚＋柱廊观景台四面自鸣钟；大礼堂直径 46.33m 三重檐＋葫芦宝顶；大剧院 220×110m 倾斜玻璃盾＋带肋桨叶；索道跨江 1166m 门架塔＋索轮组＋红白车厢；大足千手观音放射手屏＋卧佛；天生三桥高窄拱洞；夔门收分成峰＋平顶主峰＋雾带）
- 渲染：ACES 色调映射＋sRGB＋PMREM 程序化夜空环境＋PCF 软阴影（雾/阴影范围随模型尺度自动调整）＋渐变天幕
- 对外 API 不变：`init` / `switchTo` / `injectExternal` / `setSpin` / `isExternal` / `getScene`
- 外部真实模型通道：把 `assets/models/{key}.glb` 放进去即自动替换程序化占位（`models/` 目前只有 `manifest.js`）

### 立体地形 `terrain.js`（约 1350 行）

- 数据：`dem-data.js`（真实 SRTM 高程，PNG 蓝通道＝掩膜，2048²）＋ `dem-sat.js`（卫星影像）＋ `bounds.js`（区县边界折线）
- 网格 1024²，四种模式（地形/影像/水系/夜景）、四种视角、区县悬停/点击
- 已修复/新增：
  - `maskGrid()` 统一几何与贴图掩膜（消除条纹伪影）
  - `buildSkirt()` 裙边＋材质 `alphaTest`（界外灰板消失）
  - 关键索引 bug：贴图分辨率≠DEM 分辨率时未重采样，导致南半部发黑
  - 高程配色提亮＋图例同步；315°/45° 山影（影像模式也叠）
  - 250m 等高线（宽度随坡度自适应，可开关）
  - 标签按缩放分级（远→主城 / 中→＋新区 / 近→全部）
  - 水系主河道＋湿岸外带，按市域裁剪；夜景灯点按聚落成团
  - 指北针＋比例尺（自动换档）；高程剖面（点「剖面」后点两点→地形画线＋右下角曲线图）
  - 点击区县镜头飞入（`tR=82, tP=1.0`）；取点用射线步进求交高程场（`pickTerrain`），不依赖 `matrixWorld`
- API：`init` / `select` / `setMode` / `setView` / `clearSel` / `setContours` / `setProfile` / `setLabels` / `debug`

### 内容板块

| 文件 | 说明 |
|---|---|
| `history.js` + `history-data.js` | 历史年表（8 时代：巴国/秦汉隋唐/宋元/明清/开埠/陪都/解放/直辖；自动巡游＋键盘切换）。已把抽象 SVG 插画换成真实影像：`PHOTOS` 映射表（每时代 1 张实拍图＋图注＋3 项时代速览＋「看今貌/看旧影」切换）、`PLACES` 映射表（事件卡「相关地点›」链接到区县页） |
| `main.js` | 民宿卡/人文卡（稳定键绑图：`STAYS.indexOf(s)+1`，**禁止用筛选后序号**）；地形板块 UI 绑定 |
| `guess.js` | 猜地方：18 题，旧/今双图 `assets/pic/guess/{id}.jpg` 与 `{id}-old.jpg`，`onerror` 回退 |
| `folk.js` + `folk-data.js` | 山城民俗（民族卡 `.eth-vis` 加 `assets/pic/folk/{k}.jpg`，`onerror` 回退色块） |
| 其余 | `stay-art.js` / `wordcloud.js` / `photo-map.js` / `emblems.js`+`emblems-data.js` / `rail.js`+`rail-data.js` / `district-scenes.js` / `district.js` / `districts-deep-data.js` / `wanzhou-data.js` / `district-links.js`（区县名→slug 映射＋`window.districtURL()`，万州特判返回 `wanzhou/index.html`） |

## 三、页面

| 位置 | 数量 | 说明 |
|---|---|---|
| `districts/*.html` | 37 | 区县主页：卡片 anchor 跳子页、轮播 `slide-cta`、导航下拉子页、`bgdeco` 主题纹理、内联 `.topbar` 主题化 |
| `districts/pages/*.html` | 415 | 子页体系 `{slug}-s{n}`（景点）/ `-f{n}`（美食）/ `-c{n}`（人文） |
| `culture/c1..c12.html` | 12 | 人文专页，由 `.workbuddy/gen-culture.py` 生成 |
| `wanzhou/**` | — | 万州标杆页（`fa/`、`fonts/`、`pages/`、`tw.css`），零改动、禁止动其图片 |

## 四、图片资源（`assets/pic/`，共 173MB）

- `{区县slug}/` —— 43 个目录，每区 `hero.jpg` ＋ `s1..s6.jpg`（景点）＋ `f*.jpg`（民俗/美食）＋ `c*.jpg`（人文）
- `guess/` —— 18 组旧/今对照（`{id}.jpg` ＋ `{id}-old.jpg`）：`baidicheng`、`chaotianmen`、`ciqikou`、`dazu`、`diaoyucheng`、`erling`、`gongtan`、`hongyadong`、`huangjueping`、`huguang`、`jiefangbei`、`liziba`、`renmin`、`shanchengxiang`、`shibati`、`suodao`、`tongyuanmen`、`zhazidong`
- `folk/`（5 张）、`stay/`（s1-s16）、`culture/`（c1-c12，**c8 缺**——秀山花灯无真图，卡片 `onerror` 回退色块，不破图）
- `hist/` —— `ba-relic.jpg`（三峡博物馆藏·虎钮錞于，已裁装饰边框）

**图片铁律**：
1. 必须是真实照片，不用 AI 图冒充
2. 必须与文字匹配
3. 动态绑图用稳定键（id / 总表序号 / 名称），不能用筛选后序号
4. 有水印要裁

## 五、工具脚本（`.workbuddy/`，非站点文件）

| 文件 | 作用 |
|---|---|
| `gen-detail.py` | 415 个子页生成器 |
| `gen-culture.py` | 12 个人文专页生成器 |
| `crawl-s6.js` | playwright＋搜狗图片爬图，`node .workbuddy/crawl-s6.js all\|<slug,...>` |
| `spot-audit.json` | 189 条区县景点→图片清单，格式 `[slug, 序号, 景点名, 图片文件名]` |
| `backup-districts-*` | 改动前备份 |
| `memory/` | 每日工作日志（2026-10-13 / 14 / 15） |

## 六、已知遗留问题（下一轮可做）

1. 主城区县标签（北碚/渝北/巴南）在默认视角仍轻微重叠 → 可做标签引线
2. `assets/pic/guess/liziba-old.jpg` 缺旧照（有 `onerror` 回退）
3. `culture/c8.jpg`（秀山花灯）缺真图
4. 长江索道 3D 因真实跨度 1166m，默认视角偏空；天生三桥拱洞要转到正对峡谷纵深才最明显
5. `assets/models/` 下 9 个 `.glb` 均未提供（通道已通，放入即自动替换程序化建模）

## 七、必须遵守的约定

1. **不要动 `wanzhou/` 的图片资源**
2. **改 JS 后必须升 `index.html` 里该文件的 `?v=` 版本号**（注意是分文件版本号，见第一节）
3. **改 `districts/pages/` 要改 `gen-detail.py` 再重跑**，别只改产物
4. 图片必须真实、图文匹配；绑图用稳定键（id / 总表序号 / 名称），不能用筛选后序号
5. 删除文件用 `rm`（回收站），别用 Python `os.remove`

---

## 附：快速自检命令

```powershell
$r = 'D:\新建文件夹 (6)\2026-10-13-20-28-46'
(Get-ChildItem "$r\districts" -Filter *.html -File).Count      # 期望 37
(Get-ChildItem "$r\districts\pages" -Filter *.html -File).Count # 期望 415
(Get-ChildItem "$r\culture" -Filter *.html -File).Count         # 期望 12
```

```powershell
cd $r; python -m http.server 8688 --bind 127.0.0.1
# 打开 http://127.0.0.1:8688/index.html
```

---

## 八、2026-10 升级记录（数媒赛方向）

### 新增文件

| 文件 | 作用 |
|---|---|
| `assets/js/riverline.js` | 「一条江」叙事主线导航：10 个站点、随滚动生长的江线、当前章节高亮、悬停浮层；`J/K` 前后章节、`1–0` 直达 |
| `assets/js/link3d.js` | 地形→三维联动：地形上选中区县 → 自动切换到对应地标 + 底部提示条（渝中→洪崖洞、江北→大剧院、南岸→索道、大足→石刻、武隆→天坑、奉节→夔门、石柱/酉阳/秀山/彭水→吊脚楼） |

### 主要改动

- **landmark3d.js**
  - 默认机位重调：索道 `t0/p1.52/r1150`、天坑 `0.02/1.52/1000`、夔门 `0.35/1.25/1150`、洪崖洞 `0.60/0.95/240`
  - 关节点标注层 `.lm-hots`（HUD「关节点」开关），每座地标 2 个关键尺寸热点
  - 程序化法线贴图（由颜色贴图亮度反推，作用于瓦面/木构/岩壁）
  - 自建泛光管线（无 three addons）：半分辨率 RT → 亮度提取 → 双向高斯 → 加法合成，异常自动回退
  - SSAO：复用深度图做 8 向遮蔽估计，叠「遮蔽黑」做乘法式压暗（不动颜色管线）；`setAO(v, radius)` 可运行时调参
  - 灯笼实例化：44 个灯笼 132 draw call → 2 个 InstancedMesh + 1 个 Points
  - 渲染统计读数 `.lm-stats`（fps / draw call / 三角面）
  - 面板「数据依据」逐条标注来源
  - 自动巡览 `setTour()`：8 秒切换一座地标，用户拖拽/滚轮即退出
- **terrain.js**：`select()` 广播 `chq:district` 事件；标签避让改为「就近扇形 + 虚线引线」，主城九区不再叠字
- **style.css**：`.rv-rail` / `.lm-hot` / `.lm-stats` / `.l3d-toast` / `.hero-src` / `.mf-srcnote`
- **index.html**：新增 `link3d.js`、`riverline.js`；HUD 加「巡览」开关；首屏加数据来源行

### 当前版本号（2026-10-19）

`style.css?v=20261019h` · `terrain.js?v=20261019o` · `landmark3d.js?v=20261019t` · `riverline.js?v=20261019b` · `link3d.js?v=20261019a`

### 已知遗留

1. **3D 几何仍是「示意级」**：崖体、三重檐、玻璃盾等细节不足。要写实只能重建模型（已确认本轮不做）。
2. 控制台会有 1–2 条 `assets/models/*.glb` 探测 404 —— 属预期（文件未提供；放入即自动替换）。
3. `perf.js` 把 SwiftShader/软件渲染判为低端机，会自动关闭泛光与 SSAO；用 Playwright 验证时需伪造 `UNMASKED_RENDERER_WEBGL` 才能看到后期效果。
4. 页面启用了 `scroll-behavior: smooth`，自动化脚本用 `scrollIntoView` 会被平滑动画影响，需临时置 `scrollBehavior='auto'` 再 `scrollTo`。

---

## 九、2026-10-19 动态与排版轮次

### 新增文件

| 文件 | 作用 |
|---|---|
| `assets/js/pagefx.js` | ① 区县主题转场（主色幕布 + 纹样剪影 + 区名，进出页各一次）② 顶部滚动进度条 ③ 首屏图视差 ④ 区县页首屏编排（tag→标题→标语→说明→数据条，间隔 95ms）⑤ 子页滚动入场 ⑥ 排版修正层 |
| `assets/js/districtfx.js` | 一区一纹一动态：12 类纹样（等高线/水波/窗棂/织锦/花信/券龛/城砖/瓦当/点阵/峰丛/灯轮/田垄）× 6 类动效（云烟/灯火上升/江流/落英/呼吸/斜扫），按 37 区县逐一映射；并补齐区县页缺失的 `.bgdeco` 样式 |

### 关键约定

- 转场类名 `pfx-in` 是幕布内层（`position:absolute`），**揭示动画必须用 `pfx-show`**，两者不能混用（曾导致子页整块塌陷）。
- `perf.js` 会把 SwiftShader 判为低端机而关闭泛光/SSAO；用 Playwright 验证后期效果需伪造 `UNMASKED_RENDERER_WEBGL`。
- 站点启用 `scroll-behavior:smooth`，自动化脚本先置 `scrollBehavior='auto'` 再 `scrollTo`，否则会被平滑动画截胡。
- 页面文本文件统一用 UTF-8；不要用 PowerShell 的 `-replace | Set-Content` 改写含中文路径的文件（会乱码）。

### 排版基线

| 项 | 值 |
|---|---|
| 标题行高 | 1.2（原先从正文继承到 1.85） |
| 正文行宽 | 40em（约 40 字/行） |
| 段落节奏 | `p + p` 间距 0.85em |
| 数字 | `font-variant-numeric: tabular-nums` |
| 作用范围 | 区县页 / 415 子页 / 12 人文页；首页保持自己的尺度 |

### 当前版本号（2026-10-19 晚）

`pagefx.js?v=20261019j` · `districtfx.js?v=20261019e`

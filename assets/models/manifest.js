/* ==========================================================
   本地模型库清单
   -----------------------------------------------------------
   用法：把下载来的 .glb 文件放进本目录（assets/models/），
        然后照下面 models 数组里的格式加一条，刷新页面即可。
        注意：清单里的模型需要用本地服务器打开网页才能读，
        直接双击 index.html（file://）加载本地文件会被浏览器拦。
        不过「拖拽 .glb 到舞台」在任何方式下都能用。
   ========================================================== */

window.CHQ_EXT_MODELS = [
  /* ↓↓↓ 在线直链模型（Poly Haven，CC0，点开即载） ↓↓↓ */
  {
    id: "ph_rock_face",
    name: "岩壁 · 写实扫描",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/rock_face_01/rock_face_01_1k.gltf",
    meta: ["Poly Haven", "CC0", "1K 贴图"],
    desc: "Poly Haven 的写实岩石扫描，峡江崖壁、天生桥岩体的质感参考。在线加载，需要联网。",
    facts: { "来源": "Poly Haven", "授权": "CC0（免署名）", "格式": "glTF 1K" },
    category: "配景"
  },
  {
    id: "ph_coastal_cliff",
    name: "海崖 · 写实扫描",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/coastal_cliff_01/coastal_cliff_01_1k.gltf",
    meta: ["Poly Haven", "CC0", "1K 贴图"],
    desc: "大块崖岩，适合垫在夔门、峡谷类场景底部当岸石。在线加载，需要联网。",
    facts: { "来源": "Poly Haven", "授权": "CC0（免署名）", "格式": "glTF 1K" },
    category: "配景"
  },
  {
    id: "ph_pier",
    name: "木栈桥 · 写实扫描",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/modular_wooden_pier/modular_wooden_pier_1k.gltf",
    meta: ["Poly Haven", "CC0", "1K 贴图"],
    desc: "模块化木栈桥，江边吊脚楼、码头场景的现成构件。在线加载，需要联网。",
    facts: { "来源": "Poly Haven", "授权": "CC0（免署名）", "格式": "glTF 1K" },
    category: "配景"
  },
  {
    id: "ph_lantern",
    name: "木提灯 · 写实扫描",
    url: "https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/wooden_lantern_01/wooden_lantern_01_1k.gltf",
    meta: ["Poly Haven", "CC0", "1K 贴图"],
    desc: "老木提灯，古镇夜景的一盏暖光。在线加载，需要联网。",
    facts: { "来源": "Poly Haven", "授权": "CC0（免署名）", "格式": "glTF 1K" },
    category: "配景"
  },
  /* ↓↓↓ 在下面加你自己的模型：本地文件照抄这条（需本地服务器打开） ↓↓↓
  {
    id: "hongyadong_hd",
    name: "洪崖洞（高清）",
    file: "hongyadong.glb",        // 放在本目录下的文件名
    meta: ["真实模型", "GLB", "洪崖洞"],
    desc: "从 Sketchfab 下载的洪崖洞模型，作者 XXX，授权 CC-BY 4.0。",
    facts: { "来源": "Sketchfab", "作者": "XXX", "授权": "CC-BY 4.0" },
    category: "景点"
  },
  */
];

/* ==========================================================
   每个地标 → 网上能找到的真实模型（自己去找过一遍后的结论）
   -----------------------------------------------------------
   说明：下面这些模型大多在 Sketchfab，下载需要免费账号登录
   （Sketchfab 下载 API 要 OAuth，没法直链）。拿到 .glb 后：
   ① 直接拖到左边舞台就能看；② 或放进 assets/models/{key}.glb
      刷新页面会自动替换程序化占位（key 见 assets/js/data.js 的 MODELS）。
   src 标「你本地」的是用户自己有的素材（如大剧院 .skp）。
   ========================================================== */
window.CHQ_LANDMARK_MODELS = {
  hongyadong: [
    { src: "Sketchfab", name: "Hong ya dong（洪崖洞实景模型）", url: "https://sketchfab.com/3d-models/hong-ya-dong-705f2e212021402f90a69b08c9b8d99a", lic: "作者保留", note: "直接搜 'Hong ya dong' 就有，细节一般但形对" },
    { src: "Sketchfab", name: "Chinese Old Hotel（吊脚楼式老建筑，可当洪崖洞替身）", url: "https://sketchfab.com/3d-models/chinese-old-hotel-30aecd8304d04c4eb3c212c2f8cae3c9", lic: "CC-BY", note: "17.7k 浏览，木构层楼很合适" },
    { src: "Sketchfab", name: "Chinese High House Wood（高架木楼替身）", url: "https://sketchfab.com/3d-models/chinese-high-house-wood-204d354e8456472a882005d15728d2df", lic: "CC-BY", note: "34k 浏览，悬空木楼感" }
  ],
  siyuan: [
    { src: "Sketchfab", name: "Chinese Temple（重檐古建，解放碑暂无专门模型，可当替身）", url: "https://sketchfab.com/3d-models/chinese-temple-edc9abda7830426d942aa2c075270e69", lic: "CC-BY", note: "搜 'chinese monument / pagoda' 也能找到碑塔" },
    { src: "Sketchfab", name: "搜 'chinese archway 牌坊 / monument 纪念碑'", url: "https://sketchfab.com/search?q=chinese+memorial+archway", lic: "各不同", note: "解放碑是八面碑塔，找相近的即可" }
  ],
  diaojiao: [
    { src: "Sketchfab", name: "Chinese Old Hotel（吊脚楼式老建筑）", url: "https://sketchfab.com/3d-models/chinese-old-hotel-30aecd8304d04c4eb3c212c2f8cae3c9", lic: "CC-BY", note: "最像吊脚楼的现成模型" },
    { src: "Sketchfab", name: "Old Chinese Roof House（坡屋顶木楼）", url: "https://sketchfab.com/3d-models/old-chinese-roof-house-7d039b0a0db148cf919895668acea0f7", lic: "CC-BY", note: "可拆件拼吊脚楼群" },
    { src: "Sketchfab", name: "Asian House Pack Low Poly（多栋亚洲民居）", url: "https://sketchfab.com/3d-models/asian-house-pack-low-poly-70f36c58345440fe8e7b6168854881e7", lic: "CC-BY", note: "低模，凑聚落很方便" }
  ],
  dazu: [
    { src: "Sketchfab", name: "Dazu Rock Carvings (North Mountain) 大足石刻北山", url: "https://sketchfab.com/3d-models/dazu-rock-carvings-north-mountain-391f8e77cc2d4d2da8f7990a4f6cd459", lic: "CC-BY 4.0", note: "50 万面实景扫描，免费下载需账号" },
    { src: "Sketchfab", name: "大足石刻实景扫描合集（十余组，选一组放 dazu.glb）", url: "https://sketchfab.com/Lionel/collections/photogrammetry-dazu-rock-carvings-china-cf2cb05df22947628cc4f3be4f490182", lic: "CC-BY / CC-BY-NC", note: "Model 4 最热门（3.4k 浏览）" },
    { src: "Sketchfab", name: "大足宝顶山小佛湾毗卢洞（2025 新扫）", url: "https://sketchfab.com/3d-models/f54c90e61e68433cb3678a3625ffb7cd", lic: "CC-BY-NC-SA", note: "洞窟造像，适合做洞窟场景" }
  ],
  suodao: [
    { src: "Sketchfab", name: "搜 'cable car china / 索道'（暂无重庆专属索道模型）", url: "https://sketchfab.com/search?q=cable+car+china", lic: "各不同", note: "可找缆车/车厢拼出长江索道" }
  ],
  litang: [
    { src: "Sketchfab", name: "Chinese Temple（重檐圆顶，人民大礼堂暂无模型，可当替身）", url: "https://sketchfab.com/3d-models/chinese-temple-edc9abda7830426d942aa2c075270e69", lic: "CC-BY", note: "大礼堂仿天坛，找重檐攒尖建筑" },
    { src: "Sketchfab", name: "搜 'chinese domed hall / 大屋顶' ", url: "https://sketchfab.com/search?q=chinese+domed+hall", lic: "各不同", note: "挑一个圆顶宫殿感强的" }
  ],
  theatre: [
    { src: "你本地", name: "重庆大剧院 .skp（爱给网下载的压缩包）", url: "", lic: "需转 glb", note: "用 Blender 装 SketchUp 导入插件 → 导出 theatre.glb → 放 assets/models/" },
    { src: "Sketchfab", name: "搜 'Chongqing theatre / 大剧院'（暂无精确模型）", url: "https://sketchfab.com/search?q=chongqing+theatre", lic: "各不同", note: "玻璃船造型可找现代流线建筑替身" }
  ],
  tiankeng: [
    { src: "Sketchfab", name: "龙缸玻璃廊桥（重庆·龙岗，真实地标）", url: "https://sketchfab.com/3d-models/horseshoe-glass-walkway-bridge-chongqing-china-04530e1201b24a03a8e765610b2e664c", lic: "CC-BY", note: "130 万面，天生三桥/龙缸场景都能用" },
    { src: "Sketchfab", name: "Mountain Temple Entrance（重庆山庙入口实景）", url: "https://sketchfab.com/3d-models/mountain-temple-entrance-attempted-348ffdec53a44208a5dbca3cda3a5e34", lic: "CC-BY", note: "喀斯特崖壁 + 石阶氛围" },
    { src: "Sketchfab", name: "搜 'natural stone bridge / 天生桥' ", url: "https://sketchfab.com/search?q=natural+stone+bridge", lic: "各不同", note: "找天然石拱桥补天生三桥" }
  ],
  kuimen: [
    { src: "Sketchfab", name: "搜 'Kuimen / Qutang gorge / 夔门'（暂无精确模型）", url: "https://sketchfab.com/search?q=kuimen+chongqing", lic: "各不同", note: "可找峡谷/峡江实景扫描拼" }
  ]
};

/* ==========================================================
   去哪儿找模型 —— 站点 / 是否要登录 / 授权 / 格式
   （下面 8 个是用户点名要查的站，结论来自实际搜过一遍）
   ========================================================== */
window.CHQ_MODEL_SITES = [
  /* ===== 用户点名要查的 8 个站（实际搜过一遍的结论） ===== */
  {
    name: "Sketchfab", url: "https://sketchfab.com/tags/chongqing",
    login: "需要", loginNote: "免费账号即可（注册不要钱），下载要 OAuth 授权",
    license: "CC 系列（多为 CC-BY 4.0，必须署名作者）",
    format: "GLB / glTF（下载是 zip，解压得 scene.gltf + scene.bin + textures）",
    note: "★ 重庆真实地标最全的一家。已实测能找到：洪崖洞(Hong ya dong)、大足石刻(北山实景扫描 + 十余组扫描合集)、龙缸玻璃廊桥(重庆·龙岗真实地标,130万面)、重庆山庙入口实景、黄金双子塔(概念)、重庆街灯。还有大量通用中式建筑(Chinese Old Hotel / High House Wood / Chinese Temple)可当吊脚楼、大礼堂替身。各地标对应的具体链接见「推荐真实模型」。",
    tag: "要登录·有真货"
  },
  {
    name: "爱给网 aigei.com", url: "https://aigei.com/3d/model/",
    login: "部分需要", loginNote: "模型多需登录/积分，视频免费",
    license: "各模型不同（有 CC0、可商用标注）",
    format: "MAX / C4D / OBJ / SKP / 视频",
    note: "中文站，模型以 max/c4d/obj/skp 为主，需转 glb。实测：洪崖洞多为视频素材；古建/佛像浮雕/房子模型有但不多；重庆专属地标少。你之前下载的「重庆大剧院.skp」就出自这里——转成 theatre.glb 放进 assets/models/ 即生效。",
    tag: "部分登录"
  },
  {
    name: "学犀牛 xuexiniu.com", url: "https://xuexiniu.com/",
    login: "需要", loginNote: "Rhino 模型站，多需积分",
    license: "各模型不同",
    format: "3DM(Rhino) / 带贴图",
    note: "以 Rhino 建筑/工业/古建构件为主。实测搜「吊脚楼 3D模型」只命中 1 条(古代门户科幻)，重庆地标几乎没有。可找古建构件(斗拱、门窗)当细节补料。",
    tag: "要登录"
  },
  {
    name: "魔顿 modown.cn", url: "https://www.modown.cn/",
    login: "需要", loginNote: "游戏/影视素材站，需登录",
    license: "各模型不同",
    format: "FBX / OBJ / BLEND",
    note: "以游戏/影视通用素材为主。实测搜「大足石刻 3D模型」「洪崖洞 吊脚楼」均无结果，重庆地标稀缺。适合找配景(石头、树、道具)。",
    tag: "要登录"
  },
  {
    name: "CGTrader", url: "https://www.cgtrader.com/3d-models/architectural",
    login: "需要", loginNote: "多为付费，少数免费",
    license: "Royalty-Free，购买后按条款用",
    format: "FBX / OBJ / MAX / BLEND / GLTF",
    note: "中式建筑质量高但要花钱。实测有：Traditional Pagoda 模型包、Chinese Temple、Chinese Ancient Temple、Asian 古建合集($75 包 28 件)。没有重庆专属地标，但 Chinese Temple / Pagoda 可当人民大礼堂、吊脚楼替身。真要买洪崖洞定制模型，这里是找得到的地方。",
    tag: "付费为主"
  },
  {
    name: "TurboSquid", url: "https://www.turbosquid.com/",
    login: "需要", loginNote: "多为付费",
    license: "Royalty-Free",
    format: "3DS Max / FBX / OBJ / glTF",
    note: "老牌素材站。实测搜「Chongqing China」只命中不相关的机械狗，重庆地标稀缺，且普遍付费。优先级低于 Sketchfab / CGTrader。",
    tag: "付费为主"
  },
  {
    name: "Free3D", url: "https://free3d.com/",
    login: "部分需要", loginNote: "免费区可直接下",
    license: "各模型不同（多为 Royalty-Free）",
    format: "MAX / OBJ / FBX（多无 GLB，需转）",
    note: "通用中式建筑多且部分免费：Chinese Temple / Chinese House / Chinese Temple on Bridge 等，细节足(百万面)，适合当大礼堂、吊脚楼、古镇替身；下载后需转 glb。街景小物(路灯、车)也能补细节。",
    tag: "部分免费"
  },
  {
    name: "threedscans.com", url: "https://threedscans.com/",
    login: "不需要", loginNote: "开放档案",
    license: "多 CC0 / 公共领域",
    format: "OBJ / STL / PLY",
    note: "写实文物扫描档案(多为欧美博物馆雕像/器物)。实测搜「China」无结果，没有重庆/中国地标。当文物级扫描参考可以，当素材源不行。",
    tag: "看不了"
  },
  /* ===== 仍好用的补充源（之前已接或通用） ===== */
  {
    name: "Poly Haven", url: "https://polyhaven.com/models",
    login: "不需要", loginNote: "直接下载，还有公开 API",
    license: "CC0（免署名、可商用）",
    format: "glTF / BLEND / FBX + 贴图，可选分辨率",
    note: "写实扫描道具（家具、器物、灯具、岩石、植物），质量极高但跟重庆地标不搭，适合做场景配景。免登录直链法：api.polyhaven.com/assets?type=models 查资产，拼成 dl.polyhaven.org/file/ph-assets/Models/gltf/1k/{slug}/{slug}_1k.gltf 即可在线载入（本页上方 4 个「在线」模型就是这么接的）。",
    tag: "免登录"
  },
  {
    name: "3D Warehouse", url: "https://3dwarehouse.sketchup.com/search?q=%E5%90%8A%E8%84%9A%E6%A5%BC",
    login: "需要", loginNote: "Trimble / Google 账号",
    license: "各模型不同，需逐条确认",
    format: "SKP 为主（部分提供其他格式）→ 需用 SketchUp 或 Blender 转成 GLB",
    note: "中文搜「吊脚楼」「洪崖洞」「古镇」能搜到国内作者上传的建筑模型，数量比 Sketchfab 多。缺点是要转格式(同你那个 .skp)。",
    tag: "要登录"
  },
  {
    name: "Fab（原 Quixel / Megascans）", url: "https://www.fab.com/",
    login: "需要", loginNote: "Epic 账号，有免费额度",
    license: "Fab Standard（免费区可商用，需看单条）",
    format: "FBX / GLB / 源文件",
    note: "写实扫描，质量天花板。Bridge 客户端下载，模型偏大。适合做崖壁、石头等配景。",
    tag: "要登录"
  },
  {
    name: "FUNES（funes.world）", url: "https://funes.world/",
    login: "不需要", loginNote: "在线查看器直接开",
    license: "未标注开放授权，仅限网页查看",
    format: "USDZ（苹果 AR 格式）+ 在线 WebGL 查看器，无 glb/gltf 下载",
    note: "世界遗产 3D 档案。中国内容只有天坛祈年殿、山西小西天、云南喜洲祠堂——没有重庆地标；usdz 格式网页没法直接用。当灵感库可以。",
    tag: "看不了"
  }
];

/* =========================================================
   districtfx.js · 一区一纹 · 一区一动
   依据 URL 判定当前区县，为每个区县换掉背景纹样并叠加专属动效：
     · 12 类纹样（等高线/水波/窗棂/织锦/花信/券龛/城砖/瓦当/点阵/峰丛/灯轮/田垄）
     · 6 类动效（云烟漂移 / 灯火上升 / 江流横移 / 落英 / 呼吸光晕 / 斜扫光）
   全部由 JS 注入，不改任何页面 HTML；颜色沿用页面既有的 --ac / --ac2
   ========================================================= */
(function () {
  "use strict";

  if (window.__dfx) return;
  window.__dfx = true;

  /* ---------- 37 个区县：纹样 + 动效 ---------- */
  var TABLE = {
    // 主城
    yuzhong:    ["grid",     "sweep"],   // 都市天际 · 夜景扫光
    jiangbei:   ["grid",     "flow"],    // 江北嘴 · 滨江
    nanan:      ["wave",     "flow"],    // 南滨路 · 江流
    shapingba:  ["lattice",  "fall"],    // 磁器口窗棂 · 落叶
    jiulongpo:  ["brick",    "sweep"],   // 黄桷坪工业 · 扫光
    dadukou:    ["brick",    "pulse"],   // 工业遗址 · 呼吸
    yubei:      ["grid",     "drift"],   // 两江 · 云烟
    banan:      ["wave",     "drift"],   // 东温泉 · 水汽
    beibei:     ["cone",     "drift"],   // 缙云山 · 山岚
    // 新区
    fuling:     ["wave",     "flow"],    // 白鹤梁 · 水下碑林
    changshou:  ["wave",     "pulse"],   // 长寿湖 · 波光
    jiangjin:   ["cone",     "fall"],    // 四面山 · 飞瀑落叶
    hechuan:    ["brick",    "pulse"],   // 钓鱼城 · 城墙
    yongchuan:  ["field",    "fall"],    // 茶山竹海 · 叶
    nanchuan:   ["cone",     "drift"],   // 金佛山 · 云
    qijiang:    ["lattice",  "fall"],    // 綦江版画 · 刻痕
    dazu:       ["arch",     "pulse"],   // 大足石刻 · 佛光
    bishan:     ["wave",     "drift"],   // 秀湖 · 水雾
    tongliang:  ["lantern",  "rise"],    // 铜梁龙灯 · 灯火上升
    tongnan:    ["petal",    "fall"],    // 潼南油菜花 · 花雨
    rongchang:  ["tile",     "pulse"],   // 荣昌陶 · 窑光
    // 渝东北
    wanzhou:    ["wave",     "flow"],    // 万州平湖
    liangping:  ["lattice",  "drift"],   // 梁平竹帘
    chengkou:   ["cone",     "fall"],    // 城口山地 · 彩叶
    fengdu:     ["arch",     "pulse"],   // 丰都 · 庙宇
    dianjiang:  ["petal",    "fall"],    // 垫江牡丹
    zhongxian:  ["brick",    "pulse"],   // 石宝寨
    kaizhou:    ["wave",     "flow"],    // 汉丰湖
    yunyang:    ["arch",     "drift"],   // 云阳张飞庙
    fengjie:    ["cone",     "drift"],   // 夔门 · 峡江云
    wushan:     ["contour",  "drift"],   // 巫山云雨
    wuxi:       ["cone",     "fall"],    // 红池坝
    // 渝东南
    qianjiang:  ["wave",     "flow"],    // 小南海
    wulong:     ["cone",     "drift"],   // 喀斯特
    shizhu:     ["diamond",  "pulse"],   // 西兰卡普织锦
    xiushan:    ["lantern",  "rise"],    // 秀山花灯
    youyang:    ["petal",    "fall"],    // 酉阳桃花源
    pengshui:   ["diamond",  "flow"]     // 苗绣 · 阿依河
  };

  var W = encodeURIComponent;

  /* ---------- 12 类纹样（白色线稿，平铺） ---------- */
  var PAT = {
    contour: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><g fill="none" stroke="%23fff" stroke-width="1">' +
        '<path d="M75 18c26 0 48 22 48 50s-22 50-48 50-48-22-48-50 22-50 48-50z"/>' +
        '<path d="M75 36c18 0 32 14 32 32s-14 32-32 32-32-14-32-32 14-32 32-32z" stroke-opacity=".65"/>' +
        '<path d="M75 54c8 0 15 6 15 14s-7 14-15 14-15-6-15-14 7-14 15-14z" stroke-opacity=".4"/></g></svg>';
    },
    wave: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="42"><g fill="none" stroke="%23fff" stroke-width="1.1">' +
        '<path d="M0 21q12-9 24 0t24 0 24 0 24 0"/><path d="M-12 34q12-9 24 0t24 0 24 0 24 0" stroke-opacity=".5"/></g></svg>';
    },
    lattice: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="86" height="86"><g fill="none" stroke="%23fff" stroke-width="1">' +
        '<path d="M43 0v86M0 43h86"/><path d="M43 14 72 43 43 72 14 43z"/><circle cx="43" cy="43" r="3.4"/></g></svg>';
    },
    diamond: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><g fill="none" stroke="%23fff" stroke-width="1">' +
        '<path d="M36 0 72 36 36 72 0 36z"/><path d="M36 12 60 36 36 60 12 36z" stroke-opacity=".6"/>' +
        '<path d="M0 0 12 12M72 0 60 12M0 72 12 60M72 72 60 60" stroke-opacity=".35"/></g></svg>';
    },
    petal: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="84" height="84"><g fill="none" stroke="%23fff" stroke-width="1">' +
        '<circle cx="24" cy="24" r="7"/><path d="M24 13v22M13 24h22"/>' +
        '<circle cx="62" cy="58" r="5" stroke-opacity=".6"/><path d="M62 50v16M54 58h16" stroke-opacity=".6"/></g></svg>';
    },
    arch: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="92" height="92"><g fill="none" stroke="%23fff" stroke-width="1">' +
        '<path d="M10 82V44a36 36 0 0 1 72 0v38"/><path d="M24 82V46a22 22 0 0 1 44 0v36" stroke-opacity=".55"/>' +
        '<circle cx="46" cy="30" r="3.2" stroke-opacity=".7"/></g></svg>';
    },
    brick: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="88" height="56"><g fill="none" stroke="%23fff" stroke-width="1">' +
        '<path d="M0 0h88M0 28h88"/><path d="M22 0v28M66 0v28"/><path d="M0 28v28M44 28v28M88 28v28" stroke-opacity=".55"/></g></svg>';
    },
    tile: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="34"><g fill="none" stroke="%23fff" stroke-width="1">' +
        '<path d="M0 34a30 30 0 0 1 60 0" /><path d="M-30 34a30 30 0 0 1 60 0" stroke-opacity=".5"/>' +
        '<path d="M30 34a30 30 0 0 1 60 0" stroke-opacity=".5"/></g></svg>';
    },
    grid: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54"><g fill="%23fff">' +
        '<circle cx="13" cy="13" r="1.5"/><circle cx="41" cy="41" r="1.5"/><circle cx="41" cy="13" r=".9" opacity=".6"/>' +
        '<circle cx="13" cy="41" r=".9" opacity=".6"/></g></svg>';
    },
    cone: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="96"><g fill="none" stroke="%23fff" stroke-width="1">' +
        '<path d="M0 96 36 40 60 78 88 26 120 96"/><path d="M18 96 44 66 66 96" stroke-opacity=".45"/></g></svg>';
    },
    lantern: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><g fill="none" stroke="%23fff" stroke-width="1">' +
        '<circle cx="48" cy="48" r="13"/><path d="M48 26v-9M48 79v9M26 48h-9M79 48h9M33 33l-6-6M63 63l6 6M63 33l6-6M33 63l-6 6" stroke-opacity=".6"/></g></svg>';
    },
    field: function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="132" height="40"><g fill="none" stroke="%23fff" stroke-width="1">' +
        '<path d="M0 10q33 13 66 0t66 0" stroke-dasharray="15 9"/>' +
        '<path d="M0 28q33 13 66 0t66 0" stroke-dasharray="22 11" stroke-opacity=".55"/></g></svg>';
    }
  };

  /* ---------- 6 类动效 ---------- */
  var CSS = [
    '.dfx{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;contain:strict}',
    '.dfx i{position:absolute;display:block;border-radius:50%;will-change:transform,opacity}',
    /* 云烟漂移 */
    '.dfx.drift i{width:70vw;height:70vw;filter:blur(60px);opacity:.16;background:radial-gradient(circle,var(--ac,#ff7a45),transparent 62%)}',
    '.dfx.drift i:nth-child(1){left:-16vw;top:-10vh;animation:dfxDrift 54s ease-in-out infinite alternate}',
    '.dfx.drift i:nth-child(2){right:-20vw;top:18vh;animation:dfxDrift 68s ease-in-out infinite alternate-reverse;opacity:.12}',
    '.dfx.drift i:nth-child(3){left:22vw;bottom:-24vh;animation:dfxDrift 80s ease-in-out infinite alternate;opacity:.1}',
    /* 江流横移 */
    '.dfx.flow i{height:34vh;width:180vw;left:-40vw;border-radius:40%;filter:blur(70px);opacity:.12;background:linear-gradient(90deg,transparent,var(--ac,#5aa8ff),transparent)}',
    '.dfx.flow i:nth-child(1){top:22vh;animation:dfxFlow 40s linear infinite}',
    '.dfx.flow i:nth-child(2){top:52vh;animation:dfxFlow 58s linear infinite reverse;opacity:.09}',
    /* 呼吸光晕 */
    '.dfx.pulse i{width:56vw;height:56vw;filter:blur(70px);opacity:.2;background:radial-gradient(circle,var(--ac,#ffb347),transparent 60%);animation:dfxPulse 13s ease-in-out infinite}',
    '.dfx.pulse i:nth-child(1){left:52vw;top:-14vh}',
    '.dfx.pulse i:nth-child(2){left:-14vw;top:44vh;animation-delay:-6s;opacity:.14}',
    /* 斜扫光 */
    '.dfx.sweep i{width:42vw;height:180vh;left:-60vw;top:-40vh;border-radius:0;filter:blur(48px);opacity:.1;',
    'background:linear-gradient(100deg,transparent,var(--ac2,#9fd0ff),transparent);transform:rotate(12deg);animation:dfxSweep 17s ease-in-out infinite}',
    /* 光和尘：上升 / 下落 */
    '.dfx .sp{width:4px;height:4px;border-radius:50%;background:var(--ac2,#ffd08a);opacity:0;filter:blur(.4px);box-shadow:0 0 10px var(--ac,#ffb347)}',
    '.dfx.rise .sp{animation:dfxRise linear infinite}',
    '.dfx.fall .sp{animation:dfxFAll linear infinite}',
    '@keyframes dfxDrift{from{transform:translate3d(0,0,0) scale(1)}to{transform:translate3d(8vw,-5vh,0) scale(1.18)}}',
    '@keyframes dfxFlow{from{transform:translate3d(0,0,0)}to{transform:translate3d(60vw,0,0)}}',
    '@keyframes dfxPulse{0%,100%{transform:scale(1);opacity:.16}50%{transform:scale(1.22);opacity:.28}}',
    '@keyframes dfxSweep{0%{transform:translate3d(0,0,0) rotate(12deg)}55%,100%{transform:translate3d(140vw,0,0) rotate(12deg)}}',
    '@keyframes dfxRise{0%{transform:translate3d(0,20vh,0) scale(.6);opacity:0}12%{opacity:.85}100%{transform:translate3d(6vw,-92vh,0) scale(1.1);opacity:0}}',
    '@keyframes dfxFAll{0%{transform:translate3d(0,-12vh,0) rotate(0);opacity:0}12%{opacity:.8}100%{transform:translate3d(9vw,96vh,0) rotate(220deg);opacity:0}}',
    '@media (prefers-reduced-motion: reduce){.dfx{display:none}}'
  ].join("");

  function slug() {
    var p = location.pathname;
    var m = p.match(/\/districts\/pages\/([a-z]+)-[a-z0-9]+\.html/);
    if (m) return m[1];
    m = p.match(/\/districts\/([a-z]+)\.html/);
    if (m) return m[1];
    if (/\/wanzhou\//.test(p)) return "wanzhou";
    return null;
  }

  function isIndex() {
    return /\/(index\.html)?$/.test(location.pathname);
  }

  /* 区县页是自包含页面（不引 style.css），.bgdeco 没有样式会变成顶部一条黑带；
     这里补上「固定背景层 + 底部剪影」的正确样式，纹样才有地方显示。 */
  function ensureBgdeco() {
    var deco = document.querySelector(".bgdeco");
    if (!deco) return null;
    if (getComputedStyle(deco).position === "fixed") return deco;
    var st = document.createElement("style");
    st.id = "dfx-bgdeco";
    st.textContent = [
      ".bgdeco{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}",
      ".bgdeco::before{content:\"\";position:absolute;inset:0;background:" +
        "radial-gradient(62vw 48vh at 82% -8%, color-mix(in srgb,var(--ac,#FF9F1C) 17%, transparent), transparent 68%)," +
        "linear-gradient(180deg, color-mix(in srgb,var(--ac,#FF9F1C) 6%, #0a0d12) 0%, #0a0d12 56%, color-mix(in srgb,var(--ac,#FF9F1C) 10%, #0a0d12) 100%)}",
      ".bgdeco .pat{position:absolute;inset:0;opacity:.16;mix-blend-mode:screen}",
      ".bgdeco .motif{position:absolute;left:-2%;right:-2%;bottom:-2px;width:104%;height:200px;" +
        "color:var(--ac,#FF9F1C);opacity:.18;fill:currentColor;" +
        "filter:drop-shadow(0 -6px 24px color-mix(in srgb,var(--ac,#FF9F1C) 25%, transparent))}"
    ].join("");
    document.head.appendChild(st);
    return deco;
  }

  function paintPattern(svg) {
    var uri = "url(\"data:image/svg+xml," + encodeURIComponent(svg) + "\")";
    var st = document.createElement("style");
    st.id = "dfx-pat";
    st.textContent = ".bgdeco .pat{background-image:" + uri + " !important;opacity:.16;mix-blend-mode:screen}";
    document.head.appendChild(st);
  }

  function buildLayer(kind, accent) {
    var box = document.createElement("div");
    box.className = "dfx " + kind;
    box.setAttribute("aria-hidden", "true");
    if (accent) box.style.setProperty("--ac", accent);

    if (kind === "rise" || kind === "fall") {
      var n = window.innerWidth < 760 ? 9 : 16;
      for (var i = 0; i < n; i++) {
        var s = document.createElement("i");
        s.className = "sp";
        s.style.left = (Math.random() * 96 + 2).toFixed(2) + "%";
        var sz = 2 + Math.random() * 4;
        s.style.width = s.style.height = sz.toFixed(1) + "px";
        s.style.animationDuration = (10 + Math.random() * 14).toFixed(1) + "s";
        s.style.animationDelay = (-Math.random() * 18).toFixed(1) + "s";
        s.style.opacity = "0";
        box.appendChild(s);
      }
    } else {
      for (var k = 0; k < 3; k++) box.appendChild(document.createElement("i"));
    }
    document.body.appendChild(box);   /* 追加到末尾：同 z-index 下后绘制，压住 .bgdeco 又被 .wrap(z-index:1) 压住 */
  }

  function boot() {
    var s = slug();
    var cfg = s && TABLE[s];
    var kind, pat;

    if (isIndex()) {
      // 首页：两层暖冷雾，做“江上夜雾”
      kind = "drift"; pat = null;
    } else if (cfg) {
      pat = cfg[0]; kind = cfg[1];
    } else {
      return;
    }

    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);

    ensureBgdeco();
    if (pat && PAT[pat]) paintPattern(PAT[pat]());
    buildLayer(kind);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();

/* ==========================================================
   district.js — 区县专区页（district.html?d=渝中区）
   ========================================================== */
(function () {
  "use strict";
  const id = s => document.getElementById(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const CHQ = window.CHQ, CLOUD = window.CLOUD, WC = window.WordCloud, FOLK = window.FOLK;
  const CAT = WC.CAT;
  const LIST = CHQ.DISTRICTS;
  const key = n => n.replace(/(区|县)$/, "");

  let NAME = "", D = null, CD = null, IDX = 0, placed = [];

  /* ---------- 伪随机 ---------- */
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function seedOf(s) {
    let h = 7;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % 9973;
  }
  const f1 = n => Math.round(n * 10) / 10;

  /* ---------- 由地貌形状函数生成剪影 ---------- */
  function silhouette(inside, w, h) {
    const N = 130, M = 420;
    const L = [], R = [];
    let prevL = -0.05, prevR = 0.05;
    for (let i = 0; i <= N; i++) {
      const v = -1 + 2 * i / N;
      let l = null, r = null;
      for (let j = 0; j <= M; j++) {
        const u = -1 + 2 * j / M;
        if (inside(u, v)) { if (l === null) l = u; r = u; }
      }
      if (l === null) { l = prevL; r = prevR; }
      else { prevL = l; prevR = r; }
      L.push(l); R.push(r);
    }
    const px = u => f1((u + 1) / 2 * w);
    const py = v => f1((1 - (v + 1) / 2) * h + h * 0.06);
    let d = `M${px(L[0])},${py(1)}`;
    for (let i = 0; i <= N; i++) d += ` L${px(L[i])},${py(-1 + 2 * i / N)}`;
    for (let i = N; i >= 0; i--) d += ` L${px(R[i])},${py(-1 + 2 * i / N)}`;
    d += " Z";
    return d;
  }

  /* =======================================================
     抬头背景
     ======================================================= */
  function buildBg() {
    const box = id("dhBg");
    if (!box) return;
    const shape = CD ? CD.shape : "hill";
    const inside = WC.insideOf(shape);
    const W = 1400, H = 420;
    const r = rng(seedOf(NAME));
    const amp = Math.min(1, D.e / 1400);

    let g = `<defs>
      <linearGradient id="dg1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1a2636"/><stop offset="100%" stop-color="#0b1017"/></linearGradient>
      <linearGradient id="dg2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffb066"/><stop offset="55%" stop-color="#ff7a45"/>
        <stop offset="100%" stop-color="#6fc0ff"/></linearGradient>
      <linearGradient id="dg3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ff9a4a" stop-opacity=".16"/>
        <stop offset="100%" stop-color="#ff9a4a" stop-opacity="0"/></linearGradient>
    </defs>`;
    g += `<rect width="${W}" height="${H}" fill="url(#dg1)"/>`;

    // 远山三层
    for (let L2 = 0; L2 < 3; L2++) {
      const rr = rng(seedOf(NAME) + L2 * 31);
      const y0 = 150 + L2 * 46, a = (70 - L2 * 16) * (0.5 + amp);
      let d = `M0,${H} L0,${f1(y0)}`;
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        d += ` L${f1(t * W)},${f1(y0 - (Math.sin(t * 6.3 + L2 * 2) * .5 + .5) * a - rr() * a * .16)}`;
      }
      g += `<path d="${d} L${W},${H} Z" fill="${["#16202d", "#121a25", "#0e151e"][L2]}"/>`;
    }

    // 本区县地貌剪影
    const sd = silhouette(inside, W * 0.86, H * 0.78);
    g += `<g transform="translate(${f1(W * 0.07)},${f1(H * 0.16)})">
            <path d="${sd}" fill="url(#dg3)"/>
            <path d="${sd}" fill="none" stroke="url(#dg2)" stroke-width="2.4" opacity=".55"/>
          </g>`;

    // 灯火
    for (let i = 0; i < 90; i++) {
      const x = r() * W, y = H * 0.5 + r() * H * 0.48;
      g += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(0.8 + r() * 1.4)}" fill="#ffb765" opacity="${f1(0.12 + r() * 0.5)}"/>`;
    }
    g += `<rect width="${W}" height="${H}" fill="#0a0d12" opacity=".32"/>`;
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
  }

  /* =======================================================
     抬头信息
     ======================================================= */
  function buildHead() {
    const rank = LIST.slice().sort((a, b) => b.e - a.e).findIndex(x => x.n === NAME) + 1;
    const cc = { "主城": "#ff8f7a", "新区": "#6fc0ff", "渝东北": "#f2c14e", "渝东南": "#3ecfa0" }[D.c];

    id("dhName").textContent = NAME;
    document.title = NAME + " · 区县专区 — 山城·重庆";
    const tag = id("dhTag");
    tag.textContent = D.c;
    tag.style.color = cc;
    tag.style.background = cc + "22";
    tag.style.border = "1px solid " + cc + "55";

    id("dhShape").textContent = (WC.SHAPE_NAME[CD.shape] || "地貌") + " · " + (CD.note || "");
    id("dhDesc").textContent = D.d;

    // 区县徽章
    const sealBox = id("dhSeal");
    if (sealBox && window.Emblems) sealBox.innerHTML = window.Emblems.seal(NAME, { size: 152 });

    id("dhStats").innerHTML = [
      ["县城海拔", D.e + " m"], ["海拔幅度", D.r],
      ["东经", D.lon.toFixed(2) + "°"], ["北纬", D.lat.toFixed(2) + "°"],
      ["海拔全市第", rank + " / " + LIST.length],
      ["词条", (CD ? CD.words.length : 0) + " 条"]
    ].map(x => `<div class="ds-cell"><div class="ds-k">${x[0]}</div><div class="ds-v">${x[1]}</div></div>`).join("");

    id("dhMarks").innerHTML = D.t.map(t => `<span>${t}</span>`).join("");

    // 切换器
    const sel = id("djSel");
    sel.innerHTML = ["主城", "新区", "渝东北", "渝东南"].map(c =>
      `<optgroup label="${c}">` + LIST.filter(d => d.c === c)
        .map(d => `<option value="${d.n}"${d.n === NAME ? " selected" : ""}>${d.n}</option>`).join("")
      + `</optgroup>`).join("");
    sel.addEventListener("change", () => go(sel.value));
    id("djPrev").addEventListener("click", () => go(LIST[(IDX - 1 + LIST.length) % LIST.length].n));
    id("djNext").addEventListener("click", () => go(LIST[(IDX + 1) % LIST.length].n));
  }

  function go(n) {
    location.href = "district.html?d=" + encodeURIComponent(n);
  }

  /* =======================================================
     词云
     ======================================================= */
  function buildCloud() {
    const stage = id("dcStage"), tip = id("dcTip");
    if (!stage || !CD) return;
    id("dcNote").textContent = CD.note + " —— 外框就是这个地方的地貌轮廓。";

    placed = WC.layout(CD.words, CD.shape, seedOf(NAME));
    stage.innerHTML = WC.svg(placed, CD.shape);

    stage.addEventListener("mouseover", e => {
      const el = e.target.closest(".wc-word");
      if (!el) return;
      const w = CD.words[+el.dataset.i];
      if (!w) return;
      const cat = CAT[w[2]] || CAT.spot;
      tip.innerHTML = `<b style="color:${cat.c}">${w[0]}</b>　<span style="color:var(--dim);font-size:11px">${cat.n}</span>`;
      tip.classList.add("show");
    });
    stage.addEventListener("mousemove", e => {
      const r2 = stage.getBoundingClientRect();
      tip.style.left = (e.clientX - r2.left) + "px";
      tip.style.top = (e.clientY - r2.top) + "px";
    });
    stage.addEventListener("mouseout", e => {
      if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest(".wc-word")) tip.classList.remove("show");
    });
    stage.addEventListener("click", e => {
      const el = e.target.closest(".wc-word");
      if (!el) return;
      $$(".wc-word.sel").forEach(x => x.classList.remove("sel"));
      el.classList.add("sel");
      const w = CD.words[+el.dataset.i];
      if (w) showWord(w);
    });

    id("dcLegend").innerHTML = Object.keys(CAT)
      .map(k => `<span><i style="background:${CAT[k].c}"></i>${CAT[k].n}</span>`).join("");

    const cnt = {};
    CD.words.forEach(w => cnt[w[2]] = (cnt[w[2]] || 0) + 1);
    id("dcStat").innerHTML = `<span>词条 <b>${CD.words.length}</b></span><span>入图 <b>${placed.length}</b></span>` +
      Object.keys(cnt).map(k => `<span>${CAT[k].n} <b>${cnt[k]}</b></span>`).join("");
  }

  function showWord(w) {
    const cat = CAT[w[2]] || CAT.spot;
    id("dcDetail").innerHTML = `
      <div class="wd-body">
        <span class="wd-cat" style="color:${cat.c};background:${cat.c}1e;border:1px solid ${cat.c}55">${cat.n}</span>
        <h4>${w[0]}</h4>
        <p>${w[3]}</p>
        <div class="wd-in">${NAME} · ${D.c} · 县城海拔 ${D.e} 米 · 权重 ${w[1]}/10</div>
      </div>`;
  }

  /* =======================================================
     词条全览
     ======================================================= */
  function buildWords() {
    const box = id("dwCats");
    if (!box || !CD) return;
    const order = ["spot", "nat", "cul", "food", "town"];
    box.innerHTML = order.map(k => {
      const ws = CD.words.filter(w => w[2] === k).sort((a, b) => b[1] - a[1]);
      if (!ws.length) return "";
      const c = CAT[k];
      return `<div class="dw-cat" style="--cc:${c.c}">
        <h4><i style="background:${c.c}"></i>${c.n}<em>${ws.length}</em></h4>
        <div class="dw-list">${ws.map(w => `
          <div class="dw-item">
            <div class="dw-top"><b>${w[0]}</b><span class="dw-w">${w[1]}</span></div>
            <p>${w[3]}</p>
          </div>`).join("")}</div>
      </div>`;
    }).join("");
  }

  /* =======================================================
     住在这儿
     ======================================================= */
  function buildStays() {
    const box = id("dStays"), sub = id("dsSub");
    if (!box) return;
    const k = key(NAME);
    const list = CHQ.STAYS.filter(s => s.loc.indexOf(k) === 0 || s.loc.indexOf(NAME) === 0);
    const catName = c => (CHQ.STAY_CATS.find(x => x.k === c) || { n: "" }).n;
    sub.textContent = list.length
      ? `${list.length} 家收录在这儿，从` + list.map(s => catName(s.cat)).filter((v, i, a) => a.indexOf(v) === i).join("、") + "都有。"
      : "这个区县暂未收录民宿，去主站民宿版块看看别的。";
    box.innerHTML = list.length ? list.map((s, si) => `
      <article class="dstay-card">
        <div class="dst-vis">${window.StayArt ? window.StayArt.svg(s, si) : ""}<span class="sc-price">${s.price}</span></div>
        <div class="dst-top"><h4>${s.n}</h4><span class="dst-rate">★ ${s.rate}</span></div>
        <div class="dst-loc">${s.loc}</div>
        <p class="dst-d">${s.d}</p>
        <div class="dst-foot">
          <div class="dst-tags">${s.tags.map(t => `<span>${t}</span>`).join("")}</div>
          <span class="dst-price">${s.price}</span>
        </div>
      </article>`).join("")
      : `<div class="d-empty">暂无收录　<a class="d-link" href="index.html#stay">去主站看全部民宿 →</a></div>`;
  }

  /* =======================================================
     民族 · 节庆 · 非遗
     ======================================================= */
  function buildFolk() {
    const k = key(NAME);
    const isSE = D.c === "渝东南", isMain = D.c === "主城";

    const eths = FOLK.ETHNIC.filter(e => e.loc.indexOf(k) >= 0);
    const wrapE = id("dfEthWrap");
    if (eths.length) {
      id("dfEth").innerHTML = eths.map(e => `
        <div class="dfe-card" style="--ec:${e.color}">
          <div class="dfe-top"><h4>${e.n}</h4><span>自称 ${e.self}</span></div>
          <div class="dfe-loc">${e.loc}</div>
          <p class="dfe-d">${e.d}</p>
          <div class="dfe-marks">${e.marks.map(m => `<span>${m}</span>`).join("")}</div>
        </div>`).join("");
    } else wrapE.hidden = true;

    const fests = FOLK.FESTS.filter(x => x.loc.indexOf(k) >= 0);
    const wrapF = id("dfFestWrap");
    if (fests.length) {
      id("dfFest").innerHTML = fests.map(x => `
        <div class="dff-card">
          <div class="dff-top"><h4>${x.n}</h4><span class="dff-m">${FOLK.MONTHS[x.m]}</span></div>
          <div class="dff-meta">${x.t} · ${x.e}</div>
          <p class="dff-d">${x.d}</p>
          <div class="fm-do">${x.do.map(t => `<span>${t}</span>`).join("")}</div>
        </div>`).join("");
    } else wrapF.hidden = true;

    const ichs = FOLK.ICH.filter(x =>
      x.loc.indexOf(k) >= 0 ||
      (x.loc === "渝东南" && isSE) ||
      ((x.loc === "重庆市" || x.loc === "重庆市川剧院" || x.loc === "重庆市曲艺团" ||
        x.loc === "长江 · 嘉陵江沿线") && isMain)
    );
    const wrapI = id("dfIchWrap");
    if (ichs.length) {
      const LV = { "国家级": "#ff6b3d", "市级": "#6fc0ff" };
      id("dfIch").innerHTML = ichs.map(x => `
        <div class="dfi-card" style="--lc:${LV[x.lv] || "#8b95a5"}">
          <div class="dfi-top"><h4>${x.n}</h4><span class="dfi-lv">${x.lv}</span></div>
          <div class="dfi-meta">${x.loc} · ${x.y} 年列入</div>
          <p class="dfi-d">${x.d}</p>
          <div class="ich-tags">${x.tag.map(t => `<span>${t}</span>`).join("")}</div>
        </div>`).join("");
    } else wrapI.hidden = true;

    if (!eths.length && !fests.length && !ichs.length) {
      const w = document.querySelector(".dsec-folk");
      if (w) w.hidden = true;
    }
  }

  /* =======================================================
     邻近区县
     ======================================================= */
  function buildNear() {
    const box = id("dNear");
    if (!box) return;
    const dist = (a, b) => {
      const dx = (a.lon - b.lon) * 96.5, dy = (a.lat - b.lat) * 111;
      return Math.hypot(dx, dy);
    };
    const near = LIST.filter(d => d.n !== NAME)
      .map(d => ({ d, km: dist(D, d) }))
      .sort((a, b) => a.km - b.km).slice(0, 8);

    box.innerHTML = near.map(x => `
      <a class="dn-card" href="district.html?d=${encodeURIComponent(x.d.n)}">
        <div class="dn-top"><h4><span class="dn-mini">${window.Emblems ? window.Emblems.mini(x.d.n, 22) : ""}</span>${x.d.n}</h4><span class="dn-tag" style="color:${
          { "主城": "#ff8f7a", "新区": "#6fc0ff", "渝东北": "#f2c14e", "渝东南": "#3ecfa0" }[x.d.c]
        }">${x.d.c}</span></div>
        <div class="dn-km">约 ${Math.round(x.km)} km</div>
        <p class="dn-d">${x.d.d.slice(0, 34)}…</p>
      </a>`).join("");
  }

  /* =======================================================
     万州深度（仅万州区渲染，数据来自 wanzhou-data.js）
     ======================================================= */
  function buildWanzhou() {
    const W = window.WANZHOU;
    const sec = document.querySelector(".dsec-wz");
    if (!W || !sec || NAME !== "万州区") return;
    sec.hidden = false;

    /* Hero 轮播 */
    const hero = id("wzHero");
    if (hero) {
      hero.innerHTML = W.hero.map((h, i) => `
        <div class="wz-slide${i === 0 ? " on" : ""}">
          <img src="${h.img}" alt="${h.t}">
          <div class="wz-slide-mask"></div>
          <div class="wz-slide-tx">
            <b>${h.t}</b><span>${h.s}</span>
            <a class="wz-slide-go" href="${h.link}">去看看 →</a>
          </div>
        </div>`).join("") +
        `<div class="wz-dots">${W.hero.map((_, i) => `<i class="${i === 0 ? "on" : ""}" data-i="${i}"></i>`).join("")}</div>` +
        `<button class="wz-arr wz-prev" aria-label="上一张">‹</button><button class="wz-arr wz-next" aria-label="下一张">›</button>`;
      let cur = 0, timer = null;
      const slides = hero.querySelectorAll(".wz-slide"), dots = hero.querySelectorAll(".wz-dots i");
      const show = i => {
        slides[cur].classList.remove("on"); dots[cur].classList.remove("on");
        cur = (i + slides.length) % slides.length;
        slides[cur].classList.add("on"); dots[cur].classList.add("on");
      };
      const auto = () => { timer = setInterval(() => show(cur + 1), 5500); };
      const reset = () => { clearInterval(timer); auto(); };
      hero.querySelector(".wz-next").addEventListener("click", () => { show(cur + 1); reset(); });
      hero.querySelector(".wz-prev").addEventListener("click", () => { show(cur - 1); reset(); });
      dots.forEach(d => d.addEventListener("click", () => { show(+d.dataset.i); reset(); }));
      auto();
    }

    /* 概况 */
    const ab = id("wzAbout");
    if (ab) {
      ab.innerHTML = `
        <div class="wz-about-img"><img src="${W.about.img}" alt="万州全景"></div>
        <div class="wz-about-tx">
          <h3>${W.about.title}</h3>
          ${W.about.paras.map(p => `<p>${p}</p>`).join("")}
          <div class="wz-metrics">${W.about.metrics.map(m => `
            <div class="wz-metric"><i>${m.i}</i><div><b>${m.v}</b><span>${m.k}</span></div></div>`).join("")}
          </div>
        </div>`;
    }

    /* 历史人文 */
    const hs = id("wzHistory");
    if (hs) {
      hs.innerHTML = W.history.map(h => `
        <a class="wz-hcard" href="${h.link}">
          <i>${h.icon}</i>
          <h4>${h.t}</h4>
          <p>${h.d}</p>
          <span>查看详情 →</span>
        </a>`).join("");
    }

    /* 热门景点 + 筛选 */
    const sc = id("wzScenic");
    if (sc) {
      sc.innerHTML = W.scenic.items.map(s => `
        <a class="wz-scard" data-c="${s.c}" href="${s.link}">
          <div class="wz-scard-img"><img src="${s.img}" alt="${s.t}" loading="lazy"><span>${s.tag}</span></div>
          <div class="wz-scard-tx"><h4>${s.t}</h4><p>${s.d}</p><em>详情 →</em></div>
        </a>`).join("");
      const fb = id("wzFilters");
      if (fb) {
        fb.innerHTML = W.scenic.cats.map((c, i) =>
          `<button class="wz-fbtn${i === 0 ? " on" : ""}" data-k="${c.k}">${c.n}</button>`).join("");
        fb.addEventListener("click", e => {
          const b = e.target.closest(".wz-fbtn");
          if (!b) return;
          fb.querySelectorAll(".wz-fbtn").forEach(x => x.classList.toggle("on", x === b));
          const k = b.dataset.k;
          sc.querySelectorAll(".wz-scard").forEach(c => {
            c.style.display = (k === "all" || c.dataset.c === k) ? "" : "none";
          });
        });
      }
    }

    /* 特色美食 */
    const fd = id("wzFood");
    if (fd) {
      fd.innerHTML = W.food.map(f => `
        <a class="wz-fcard" href="${f.link}">
          <div class="wz-fcard-img"><img src="${f.img}" alt="${f.t}" loading="lazy">${f.badge ? `<span class="wz-badge">${f.badge}</span>` : ""}</div>
          <h4>${f.t}</h4>
          <p>${f.d}</p>
          <em>详情 →</em>
        </a>`).join("");
    }

    /* 交通指南 */
    const tf = id("wzTraffic");
    if (tf) {
      tf.innerHTML = W.traffic.map(t => `
        <a class="wz-tcard" href="${t.link}" target="_blank" rel="noopener">
          <i>${t.i}</i><h4>${t.t}</h4><p>${t.d}</p>
        </a>`).join("");
    }
  }

  /* =======================================================
     区县深度版块（万州区以外的 37 个区县，一区一景）
     ======================================================= */
  function buildDeep() {
    const sec = document.getElementById("dp");
    const DD = window.DEEP, DS = window.DistrictScenes;
    if (!sec || !DD || !DS || NAME === "万州区" || !DD[NAME]) return;
    const d = DD[NAME];
    sec.hidden = false;

    // 片区主题色
    const CAT_COL = { "主城": "#ff6a45", "新区": "#4d9de0", "渝东北": "#f2c14e", "渝东南": "#3ecfa0" };
    sec.style.setProperty("--dp", CAT_COL[d.cat] || "#f2c14e");

    const svg = (v, seed, z, s) => DS.svg(NAME, v, seed, z, s);

    // 卡片机位：同一道风景的不同取景，避免雷同
    const ZOOMS = [
      { x: .5, y: .55, k: 1.45 }, { x: .18, y: .5, k: 1.7 }, { x: .82, y: .5, k: 1.7 },
      { x: .5, y: .18, k: 1.9 }, { x: .3, y: .78, k: 1.55 }, { x: .7, y: .78, k: 1.55 }
    ];

    id("dpTitle").textContent = NAME + "深度";
    id("dpSub").textContent = d.slogan + "——一区一景，三张插画看尽晨、暮、夜。";
    id("dpLinkName").textContent = "「" + (d.spots[0] ? d.spots[0].t : NAME) + "」";

    // 完整详情页链接（districts/{slug}.html）
    const SLUG = {
      "渝中区":"yuzhong","江北区":"jiangbei","南岸区":"nanan","沙坪坝区":"shapingba",
      "九龙坡区":"jiulongpo","大渡口区":"dadukou","渝北区":"yubei","巴南区":"banan",
      "北碚区":"beibei","涪陵区":"fuling","长寿区":"changshou","江津区":"jiangjin",
      "合川区":"hechuan","永川区":"yongchuan","南川区":"nanchuan","綦江区":"qijiang",
      "大足区":"dazu","璧山区":"bishan","铜梁区":"tongliang","潼南区":"tongnan",
      "荣昌区":"rongchang","开州区":"kaizhou","梁平区":"liangping","城口县":"chengkou",
      "丰都县":"fengdu","垫江县":"dianjiang","忠县":"zhongxian","云阳县":"yunyang",
      "奉节县":"fengjie","巫山县":"wushan","巫溪县":"wuxi","黔江区":"qianjiang",
      "武隆区":"wulong","石柱县":"shizhu","秀山县":"xiushan","酉阳县":"youyang",
      "彭水县":"pengshui"
    };
    const slug = SLUG[NAME];

    /* 真实照片优先：取该区县 assets/pic/{slug}/ 下的实拍图，缺失时回退插画 */
    const PICS = (window.PHOTO_MAP && slug && window.PHOTO_MAP[slug]) || [];
    // 分类识别：hero=主图 s*=风景实拍 f*=美食实拍 c*=人文实拍
    const SCEN = PICS.filter(f => /^s\d+\./i.test(f));
    const GAL = SCEN.length ? SCEN
      : PICS.filter(f => !/^hero\./i.test(f) && !/^(f|c)\d+\./i.test(f));
    const FOODPICS = PICS.filter(f => /^f\d+\./i.test(f)).sort((a, b) => +a.match(/\d+/) - +b.match(/\d+/));
    const CULPICS = PICS.filter(f => /^c\d+\./i.test(f)).sort((a, b) => +a.match(/\d+/) - +b.match(/\d+/));
    const pic = (file, alt) => file
      ? `<img class="dp-photo" src="assets/pic/${slug}/${file}" alt="${String(alt || NAME).replace(/"/g, "&quot;")}">`
      : "";
    const dpsub = id("dpSub");
    if (dpsub) dpsub.textContent = PICS.length
      ? (d.slogan + "——" + PICS.length + " 张真实照片，看看这一区的山与水。")
      : d.slogan;

    const pl = id("dpPageLink"), pn = id("dpPageName");
    if (pl && slug) { pl.href = "districts/" + slug + ".html"; }
    if (pn) pn.textContent = NAME;

    /* Hero 轮播 */
    const hero = id("dpHero");
    if (hero) {
      const caps = [
        { k: "晨光", s: "雾还没散，山一层层退出去" },
        { k: "暮色", s: "太阳落到山那边，江面发金" },
        { k: "夜色", s: "灯亮起来，地名开始发光" }
      ];
      const heroFiles = [PICS[0], GAL[0], GAL[1], GAL[2]].filter(Boolean).slice(0, 4);
      const usePic = heroFiles.length > 0;
      const n = usePic ? heroFiles.length : caps.length;
      hero.innerHTML = (usePic ? heroFiles : caps).map((item, i) => `
        <div class="dp-slide${i === 0 ? " on" : ""}">
          ${usePic ? pic(item, NAME + "风光 " + (i + 1)) : svg(i, i + 1)}
          <div class="dp-slide-mask"></div>
          <div class="dp-slide-tx">
            <b>${NAME}</b><span>${d.slogan}</span>
            <em>${usePic ? ("实景 " + (i + 1) + " / " + n) : (item.k + " · " + item.s)}</em>
            <a class="dp-slide-go" href="#dp-scenic">去看看 →</a>
          </div>
        </div>`).join("") +
        `<div class="dp-dots">${caps.map((_, i) => `<i class="${i === 0 ? "on" : ""}" data-i="${i}"></i>`).join("")}</div>` +
        `<button class="dp-arr dp-prev" aria-label="上一张">‹</button><button class="dp-arr dp-next" aria-label="下一张">›</button>`;
      let cur = 0, timer = null;
      const slides = hero.querySelectorAll(".dp-slide"), dots = hero.querySelectorAll(".dp-dots i");
      const show = i => {
        slides[cur].classList.remove("on"); dots[cur].classList.remove("on");
        cur = (i + slides.length) % slides.length;
        slides[cur].classList.add("on"); dots[cur].classList.add("on");
      };
      const reset = () => { clearInterval(timer); timer = setInterval(() => show(cur + 1), 5500); };
      hero.querySelector(".dp-next").addEventListener("click", () => { show(cur + 1); reset(); });
      hero.querySelector(".dp-prev").addEventListener("click", () => { show(cur - 1); reset(); });
      dots.forEach(dt => dt.addEventListener("click", () => { show(+dt.dataset.i); reset(); }));
      reset();
    }

    /* 概况 */
    const ab = id("dpAbout");
    if (ab) {
      ab.innerHTML = `
        <div class="dp-about-img">${PICS[0] ? pic(PICS[0], NAME + "风光") : svg(0, 9)}<span>${NAME} · ${d.cat}</span></div>
        <div class="dp-about-tx">
          <h3>${d.slogan}</h3>
          <p>${d.note}</p>
          <div class="dp-metrics">${d.stats.map(m => `
            <div class="dp-metric"><b>${m.v}</b><span>${m.k}</span></div>`).join("")}
          </div>
        </div>`;
    }

    /* 招牌风景 + 筛选 */
    const sc = id("dpSpots");
    if (sc) {
      sc.innerHTML = d.spots.map((s, i) => {
        const pf = GAL[i] || GAL[0] || PICS[0];
        return `
        <div class="dp-card" data-c="${s.cat}">
          <div class="dp-card-img">${pf ? pic(pf, s.t) : svg(0, i + 20, ZOOMS[i % ZOOMS.length], 1 + (i % 3))}<span>${s.cat}</span></div>
          <div class="dp-card-tx"><h4>${s.t}</h4><p>${s.d}</p></div>
        </div>`; }).join("");
      const fb = id("dpFilters");
      if (fb) {
        const cats = ["全部"].concat([...new Set(d.spots.map(s => s.cat))]);
        fb.innerHTML = cats.map((c, i) => `<button class="dp-fbtn${i === 0 ? " on" : ""}" data-k="${c}">${c}</button>`).join("");
        fb.addEventListener("click", e => {
          const b = e.target.closest(".dp-fbtn");
          if (!b) return;
          fb.querySelectorAll(".dp-fbtn").forEach(x => x.classList.toggle("on", x === b));
          const k = b.dataset.k;
          sc.querySelectorAll(".dp-card").forEach(card => {
            card.style.display = (k === "全部" || card.dataset.c === k) ? "" : "none";
          });
        });
      }
    }

    /* 美食（暮色，暖光） */
    const fd = id("dpFoods");
    if (fd) {
      fd.innerHTML = d.foods.map((f, i) => `
        <div class="dp-card dp-card-food">
          <div class="dp-card-img dp-card-img-s">${FOODPICS[i] ? pic(FOODPICS[i], f.t) : svg(1, i + 40, ZOOMS[(i + 2) % ZOOMS.length], 1 + ((i + 1) % 3))}<span>${f.t}</span></div>
          <div class="dp-card-tx"><h4>${f.t}</h4><p>${f.d}</p></div>
        </div>`).join("");
    }

    /* 人文（晨光） */
    const cu = id("dpCuls");
    if (cu) {
      cu.innerHTML = d.culture.map((c, i) => `
        <div class="dp-card dp-card-cul">
          <div class="dp-card-img dp-card-img-s">${CULPICS[i] ? pic(CULPICS[i], c.t) : svg(0, i + 60, ZOOMS[(i + 4) % ZOOMS.length], 1 + ((i + 2) % 3))}<span>${c.t}</span></div>
          <div class="dp-card-tx"><h4>${c.t}</h4><p>${c.d}</p></div>
        </div>`).join("");
    }

    /* 贴士 */
    const tp = id("dpTip");
    if (tp) tp.innerHTML = `<b>旅行贴士</b><span>${d.tip}</span>`;
  }

  /* =======================================================
     导航区县菜单
     ======================================================= */
  function buildNavMenu() {
    const menu = id("navMenu");
    const btn = id("navDist");
    if (!menu || !btn) return;
    menu.innerHTML = `<div class="nm-inner">` + ["主城", "新区", "渝东北", "渝东南"].map(c => {
      const list = LIST.filter(d => d.c === c);
      return `<div class="nm-g"><h6>${c} · ${list.length}</h6><div class="nm-list">` +
        list.map(d => `<a class="nm-chip${d.n === NAME ? " on" : ""}" href="district.html?d=${encodeURIComponent(d.n)}">${window.Emblems ? window.Emblems.mini(d.n, 17) : ""}<span>${d.n}</span></a>`).join("") +
        `</div></div>`;
    }).join("") + `</div>`;

    const setOpen = open => {
      menu.classList.toggle("open", open);
      btn.classList.toggle("on", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    };

    btn.addEventListener("click", e => {
      e.preventDefault();
      setOpen(!menu.classList.contains("open"));
    });
    document.addEventListener("click", e => {
      if (!e.target.closest(".nav-drop") && !e.target.closest("#navMenu")) setOpen(false);
    });
    menu.addEventListener("click", e => {
      if (e.target.closest(".nm-chip")) setOpen(false);
    });
    // Escape 关闭并把焦点还给触发器
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && menu.classList.contains("open")) {
        setOpen(false);
        btn.focus();
      }
    });
  }

  function bindBurger() {
    const b = id("burger"), list = document.querySelector(".nav-list");
    if (!b || !list) return;
    b.addEventListener("click", () => { b.classList.toggle("x"); list.classList.toggle("open"); });
    list.addEventListener("click", e => {
      if (e.target.closest(".nl")) { b.classList.remove("x"); list.classList.remove("open"); }
    });
    window.addEventListener("scroll", () => id("nav").classList.toggle("solid", window.scrollY > 40), { passive: true });
  }

  /* =======================================================
     启动
     ======================================================= */
  function boot() {
    const q = new URLSearchParams(location.search).get("d");
    NAME = (q && LIST.find(d => d.n === q)) ? q : "渝中区";
    D = LIST.find(d => d.n === NAME);
    IDX = LIST.indexOf(D);
    CD = CLOUD[NAME];

    buildHead();
    buildBg();
    buildCloud();
    buildWords();
    buildStays();
    buildFolk();
    buildNear();
    buildWanzhou();
    buildDeep();
    buildNavMenu();
    bindBurger();

    // 纹样装饰：每个版块后加区县纹样带，标题旁加小徽标
    if (window.Emblems) {
      $$(".dsec").forEach(sec => {
        const b = document.createElement("div");
        b.className = "dsec-band";
        b.innerHTML = window.Emblems.band(NAME);
        sec.after(b);
        const h = sec.querySelector(".dsec-head h2");
        if (h) {
          const o = document.createElement("span");
          o.className = "dsec-orn";
          o.innerHTML = window.Emblems.mini(NAME, 26);
          h.after(o);
        }
      });
    }

    // 入场
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    $$(".dsec").forEach(el => io.observe(el));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

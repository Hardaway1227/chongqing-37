/* ==========================================================
   main.js — 装配与交互
   ========================================================== */
(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const id = s => document.getElementById(s);

  /* ---------- 工具 ---------- */
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  const f = n => Math.round(n * 10) / 10;

  function ridgePath(y0, amp, seed, w, n) {
    const r = rng(seed);
    let d = `M0,300 L0,${f(y0)}`;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = w * t;
      const y = y0 - (Math.sin(t * 7.3 + seed) * 0.5 + 0.5) * amp
        - Math.sin(t * 19 + seed * 2.1) * amp * 0.22 - r() * amp * 0.1;
      d += ` L${f(x)},${f(y)}`;
    }
    d += ` L${w},300 Z`;
    return d;
  }

  /* =========================================================
     Hero
     ========================================================= */
  function buildHero() {
    // 数据条
    id("heroStats").innerHTML = window.CHQ.STATS.map(s =>
      `<div class="hs-item"><div class="hs-n">${s.n}</div><div class="hs-l">${s.l}</div></div>`).join("");

    // 山影
    const layers = [
      { y: 168, a: 74, c: "#1a2432", s: 3 },
      { y: 196, a: 58, c: "#151d28", s: 8 },
      { y: 222, a: 44, c: "#111823", s: 13 },
      { y: 248, a: 32, c: "#0d131c", s: 21 }
    ];
    let svg = `<svg viewBox="0 0 1200 300" preserveAspectRatio="none">`;
    layers.forEach(L => {
      svg += `<path d="${ridgePath(L.y, L.a, L.s, 1200, 90)}" fill="${L.c}"/>`;
    });
    // 前景楼群剪影 + 灯
    const r = rng(97);
    let b = `<g fill="#080c11">`;
    const rs = [];
    for (let i = 0; i < 26; i++) {
      const x = -20 + i * 48 + r() * 16;
      const w = 26 + r() * 26;
      const h = 40 + Math.pow(r(), 1.6) * 150;
      rs.push([x, w, h]);
      b += `<rect x="${f(x)}" y="${f(300 - h)}" width="${f(w)}" height="${f(h)}"/>`;
    }
    b += `</g><g>`;
    rs.forEach((t, k) => {
      const rr = rng(500 + k);
      const cols = Math.max(1, Math.floor(t[1] / 9)), rows = Math.floor(t[2] / 11);
      for (let c2 = 0; c2 < cols; c2++) {
        for (let r2 = 0; r2 < rows; r2++) {
          if (rr() > 0.42) continue;
          b += `<rect x="${f(t[0] + 3 + c2 * 9)}" y="${f(300 - t[2] + 5 + r2 * 11)}" width="3.2" height="4.4" fill="#ffb765" opacity="${f(0.35 + rr() * 0.6)}"/>`;
        }
      }
    });
    b += `</g>`;
    svg += b + `</svg>`;
    id("ridge").innerHTML = svg;
  }

  /* =========================================================
     地形：按钮与快捷入口
     ========================================================= */
  function bindTerrain() {
    const modes = id("terraModes");
    if (modes) {
      modes.addEventListener("click", e => {
        const b = e.target.closest(".hm");
        if (!b) return;
        modes.querySelectorAll(".hm").forEach(x => x.classList.remove("on"));
        b.classList.add("on");
        window.Terrain.setMode(b.dataset.mode);
      });
    }
    $$(".hv").forEach(b => b.addEventListener("click", () => {
      if (b.id === "tvNameBtn") {
        const on = !b.classList.contains("on");
        b.classList.toggle("on", on);
        window.Terrain.setLabels(on);
        return;
      }
      if (b.id === "tvContourBtn") {
        const on = !b.classList.contains("on");
        b.classList.toggle("on", on);
        window.Terrain.setContours(on);
        return;
      }
      if (b.id === "tvProfileBtn") {
        const on = !b.classList.contains("on");
        b.classList.toggle("on", on);
        window.Terrain.setProfile(on);
        return;
      }
      $$(".hv").forEach(x => { if (x.id !== "tvNameBtn" && x.id !== "tvContourBtn" && x.id !== "tvProfileBtn") x.classList.remove("on"); });
      b.classList.add("on");
      window.Terrain.setView(b.dataset.view);
    }));
    const pclose = id("profClose");
    if (pclose) pclose.addEventListener("click", () => {
      const b = id("tvProfileBtn");
      if (b) b.classList.remove("on");
      window.Terrain.setProfile(false);
    });
    const close = id("tpClose");
    if (close) close.addEventListener("click", () => {
      window.Terrain.clearSel();
      $$(".tq").forEach(x => x.classList.remove("on"));
    });

    const quick = ["渝中区", "城口县", "巫山县", "酉阳县", "武隆区", "奉节县", "南川区", "合川区"];
    const q = id("terraQuick");
    if (q) {
      q.innerHTML = `<span style="font-size:12px;color:var(--dim);letter-spacing:.14em;align-self:center;margin-right:4px">快速定位</span>` +
        quick.map(n => `<button class="tq" data-n="${n}">${n}</button>`).join("");
      q.addEventListener("click", e => {
        const b = e.target.closest(".tq");
        if (!b) return;
        $$(".tq").forEach(x => x.classList.remove("on"));
        b.classList.add("on");
        window.Terrain.focus(b.dataset.n);
      });
    }
  }

  /* =========================================================
     地貌词云
     ========================================================= */
  let curName = "", curWords = [];

  function seedOf(s) {
    let h = 7;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % 9973;
  }

  function buildCloud() {
    const groups = id("wcGroups");
    if (!groups || !window.CLOUD || !window.WordCloud) return;
    const CAT = window.WordCloud.CAT;

    groups.innerHTML = ["主城", "新区", "渝东北", "渝东南"].map(c => {
      const list = window.CHQ.DISTRICTS.filter(d => d.c === c && window.CLOUD[d.n]);
      if (!list.length) return "";
      return `<div class="wc-g"><h5>${c} · ${list.length}</h5><div class="wc-g-list">` +
        list.map(d => `<button class="wc-chip" data-n="${d.n}">${d.n}</button>`).join("") +
        `</div></div>`;
    }).join("");

    groups.addEventListener("click", e => {
      const b = e.target.closest(".wc-chip");
      if (b) selectCloud(b.dataset.n);
    });

    id("wcRand").addEventListener("click", () => {
      const keys = Object.keys(window.CLOUD);
      let k = keys[Math.floor(Math.random() * keys.length)];
      if (k === curName) k = keys[(keys.indexOf(k) + 1) % keys.length];
      selectCloud(k);
      const chip = groups.querySelector(`.wc-chip[data-n="${k}"]`);
      if (chip) chip.scrollIntoView({ block: "nearest" });
    });

    const stage = id("wcShape"), tip = id("wcTip");
    stage.addEventListener("mouseover", e => {
      const el = e.target.closest(".wc-word");
      if (!el) return;
      const w = curWords[+el.dataset.i];
      if (!w) return;
      const cat = CAT[w[2]] || CAT.spot;
      tip.innerHTML = `<b style="color:${cat.c}">${w[0]}</b>　<span style="color:var(--dim);font-size:11px">${cat.n}</span>`;
      tip.classList.add("show");
    });
    stage.addEventListener("mousemove", e => {
      const r = stage.getBoundingClientRect();
      tip.style.left = (e.clientX - r.left) + "px";
      tip.style.top = (e.clientY - r.top) + "px";
    });
    stage.addEventListener("mouseout", e => {
      if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest(".wc-word")) {
        tip.classList.remove("show");
      }
    });
    stage.addEventListener("click", e => {
      const el = e.target.closest(".wc-word");
      if (!el) return;
      $$(".wc-word.sel").forEach(x => x.classList.remove("sel"));
      el.classList.add("sel");
      const w = curWords[+el.dataset.i];
      if (w) showWord(w);
    });

    id("wcLegend").innerHTML = Object.keys(CAT)
      .map(k => `<span><i style="background:${CAT[k].c}"></i>${CAT[k].n}</span>`).join("");

    selectCloud("渝中区");
  }

  function selectCloud(name) {
    const data = window.CLOUD[name];
    if (!data) return;
    curName = name;
    curWords = data.words;

    id("wcName").textContent = name;
    id("wcShapeTag").textContent = (window.WordCloud.SHAPE_NAME[data.shape] || "地貌") + "轮廓";
    id("wcNote").textContent = data.note;

    const placed = window.WordCloud.layout(data.words, data.shape, seedOf(name));
    id("wcShape").innerHTML = window.WordCloud.svg(placed, data.shape);

    $$(".wc-chip").forEach(x => x.classList.toggle("on", x.dataset.n === name));

    const enter = id("wcEnter");
    if (enter) enter.href = (window.districtURL ? window.districtURL(name) : null) || "district.html?d=" + encodeURIComponent(name);

    id("wdEmpty").hidden = false;
    id("wdBody").hidden = true;

    const cnt = {};
    data.words.forEach(w => cnt[w[2]] = (cnt[w[2]] || 0) + 1);
    const CAT = window.WordCloud.CAT;
    id("wdStat").innerHTML =
      `<span>词条 <b>${data.words.length}</b></span>` +
      `<span>入图 <b>${placed.length}</b></span>` +
      Object.keys(cnt).map(k => `<span>${CAT[k].n} <b>${cnt[k]}</b></span>`).join("");
  }

  function showWord(w) {
    const CAT = window.WordCloud.CAT;
    const cat = CAT[w[2]] || CAT.spot;
    id("wdEmpty").hidden = true;
    id("wdBody").hidden = false;
    const c = id("wdCat");
    c.textContent = cat.n;
    c.style.color = cat.c;
    c.style.background = cat.c + "1e";
    c.style.border = "1px solid " + cat.c + "55";
    id("wdWord").textContent = w[0];
    id("wdDesc").textContent = w[3];
    const d = window.CHQ.DISTRICTS.find(x => x.n === curName);
    id("wdIn").textContent = d
      ? `${curName} · ${d.c} · 县城海拔 ${d.e} 米 · 幅度 ${d.r}`
      : curName;
    const box = id("wcDetail");
    if (box) box.scrollTop = 0;
  }

  /* =========================================================
     民宿
     ========================================================= */
  function buildStays() {
    const grid = id("stayGrid");
    const bar = id("stayFilter");
    if (!grid) return;

    bar.innerHTML = window.CHQ.STAY_CATS.map(c =>
      `<button class="fb${c.k === "all" ? " on" : ""}" data-k="${c.k}">${c.n}</button>`).join("");

    const paint = k => {
      const list = k === "all" ? window.CHQ.STAYS : window.CHQ.STAYS.filter(s => s.cat === k);
      grid.innerHTML = list.map((s, i) => {
        /* 图片按民宿在 STAYS 总表中的稳定序号编号，筛选后不错位 */
        const gi = window.CHQ.STAYS.indexOf(s) + 1;
        return `<article class="stay-card">
          <div class="sc-vis">${window.StayArt ? window.StayArt.svg(s, gi - 1) : ""}
            <img class="sc-photo" src="assets/pic/stay/s${gi}.jpg" alt="${s.n}" loading="lazy"
                 onerror="this.remove()">
            <span class="sc-badge">${window.CHQ.STAY_CATS.find(c => c.k === s.cat).n}</span>
            <span class="sc-price">${s.price}</span></div>
          <div class="sc-body">
            <div class="sc-top"><h3 class="sc-name">${s.n}</h3><span class="sc-rate">★ ${s.rate}</span></div>
            <div class="sc-loc">${s.loc}</div>
            <p class="sc-desc">${s.d}</p>
            <div class="sc-tags">${s.tags.map(t => `<span>${t}</span>`).join("")}</div>
          </div></article>`;
      }).join("");
    };
    paint("all");
    bar.addEventListener("click", e => {
      const b = e.target.closest(".fb");
      if (!b) return;
      bar.querySelectorAll(".fb").forEach(x => x.classList.remove("on"));
      b.classList.add("on");
      paint(b.dataset.k);
    });
  }

  /* =========================================================
     人文
     ========================================================= */
  function buildCulture() {
    const flow = id("culFlow");
    if (flow) {
      flow.innerHTML = window.CHQ.CULTURE.map((c, i) =>
        `<a class="cul-item has-photo" href="culture/c${i + 1}.html" style="--c:${c.c}66">
          <img class="ci-bg" src="assets/pic/culture/c${i + 1}.jpg" alt="${c.t}" loading="lazy"
               onerror="var _p=this.parentNode;this.remove();if(_p)_p.classList.remove('has-photo')">
          <div class="ci-idx">${String(i + 1).padStart(2, "0")}</div>
          <h4 class="ci-title">${c.t}</h4>
          <p class="ci-desc">${c.d}</p>
          <span class="ci-level">${c.lv}</span>
        </a>`).join("");
    }

    const dl = id("dialectList");
    const btn = id("dialectBtn");
    function rollDialect() {
      if (!dl) return;
      const arr = window.CHQ.DIALECT.slice();
      for (let k = arr.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [arr[k], arr[j]] = [arr[j], arr[k]];
      }
      dl.innerHTML = arr.slice(0, 5).map((d, i) =>
        `<div class="dl-row" style="animation-delay:${i * 55}ms"><span class="dl-w">${d.w}</span><span class="dl-m">${d.m}</span></div>`).join("");
    }
    rollDialect();
    if (btn) btn.addEventListener("click", rollDialect);

    const fl = id("foodList");
    if (fl) {
      fl.innerHTML = window.CHQ.FOOD.map(x =>
        `<div class="fl-row"><div class="fl-n">${x.n}<em>${x.e}</em></div><div class="fl-d">${x.d}</div></div>`).join("");
    }
  }

  /* =========================================================
     三维模型
     ========================================================= */
  function bindModel() {
    const modes = id("mdModes");
    if (modes) {
      modes.addEventListener("click", e => {
        const b = e.target.closest(".mm");
        if (!b) return;
        modes.querySelectorAll(".mm").forEach(x => x.classList.remove("on"));
        b.classList.add("on");
        window.Landmark3D.switchTo(b.dataset.b);
      });
    }
    const spin = id("mdAuto");
    if (spin) spin.addEventListener("change", () => window.Landmark3D.setSpin(spin.checked));
  }

  /* =========================================================
     导航：区县下拉菜单
     ========================================================= */
  function buildNavMenu() {
    const menu = id("navMenu"), btn = id("navDist");
    if (!menu || !btn) return;
    menu.innerHTML = `<div class="nm-inner">` + ["主城", "新区", "渝东北", "渝东南"].map(c => {
      const list = window.CHQ.DISTRICTS.filter(d => d.c === c);
      return `<div class="nm-g"><h6>${c} · ${list.length}</h6><div class="nm-list">` +
        list.map(d => `<a class="nm-chip" href="district.html?d=${encodeURIComponent(d.n)}">${window.Emblems ? window.Emblems.mini(d.n, 17) : ""}<span>${d.n}</span></a>`).join("") +
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

  /* =========================================================
     区县印记墙（词云版块尾部）
     ========================================================= */
  function buildWall() {
    const box = id("emWall");
    if (!box || !window.Emblems) return;
    const CC = { "主城": "#ff8f7a", "新区": "#6fc0ff", "渝东北": "#f2c14e", "渝东南": "#3ecfa0" };
    box.innerHTML = window.CHQ.DISTRICTS.map(d => {
      const ec = (window.EMBLEM[d.n] || {}).c || "#ff7a45";
      return `<a class="em-card" href="district.html?d=${encodeURIComponent(d.n)}" style="--ec:${ec}">
        <span class="em-card-tag" style="color:${CC[d.c] || "var(--dim)"}">${d.c}</span>
        ${window.Emblems.seal(d.n, { size: 104 })}
        <span class="em-card-n">${d.n}</span>
      </a>`;
    }).join("");
  }

  /* =========================================================
     版块标题纹样条
     ========================================================= */
  function buildSecOrns() {
    if (!window.Emblems) return;
    $$(".sec-head").forEach(h => {
      if (h.querySelector(".em-head-strip")) return;
      const s = document.createElement("div");
      s.className = "em-head-strip";
      s.innerHTML = window.Emblems.cityStrip(300);
      h.appendChild(s);
    });
  }

  /* =========================================================
     导航 / 滚动
     ========================================================= */
  function bindNav() {
    const nav = id("nav");
    const burger = id("burger");
    const list = $(".nav-list");

    window.addEventListener("scroll", () => {
      nav.classList.toggle("solid", window.scrollY > 40);
    }, { passive: true });

    if (burger) {
      burger.addEventListener("click", () => {
        burger.classList.toggle("x");
        list.classList.toggle("open");
      });
      list.addEventListener("click", e => {
        if (e.target.closest(".nl")) {
          burger.classList.remove("x");
          list.classList.remove("open");
        }
      });
    }

    // 区块高亮
    const secs = ["hero", "history", "terrain", "rail", "cloud", "stay", "culture", "folk", "model3d", "guess"];
    const links = $$(".nl");
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(l => l.classList.toggle("on", l.getAttribute("href") === "#" + e.target.id));
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    secs.forEach(s => { const el = id(s); if (el) io.observe(el); });

    // 入场动画
    const io2 = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("in"); io2.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    $$(".reveal").forEach(el => io2.observe(el));
  }

  /* =========================================================
     启动
     ========================================================= */

  /* ---------- boot 遮罩：错误态 / 跳过按钮 ---------- */
  function ensureSkipBtn(mask) {
    if (!mask || mask.querySelector(".boot-skip")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "boot-skip";
    b.textContent = "跳过动画，直接进入";
    b.addEventListener("click", () => {
      mask.classList.add("gone");
      setTimeout(() => mask.remove(), 700);
    });
    const inner = mask.querySelector(".boot-inner");
    if (inner) inner.appendChild(b);
  }

  function showBootError(msg) {
    const mask = id("boot"), tip = $(".boot-tip");
    if (mask) mask.classList.add("err");
    if (tip) tip.textContent = msg;
    ensureSkipBtn(mask);
    // 错误态也不能把人困在遮罩里：5 秒后自动放行
    setTimeout(() => {
      if (mask && mask.parentNode) { mask.classList.add("gone"); setTimeout(() => mask.remove(), 800); }
    }, 5000);
  }

  function boot() {
    const mask = id("boot"), tip = $(".boot-tip");
    try {
      buildHero();
      bindNav();
      buildNavMenu();
      try { window.History.init(); } catch (e) { console.error("history:", e); }
      buildCloud();
      buildWall();
      buildSecOrns();
      buildStays();
      buildCulture();
      try { window.FolkKit.init(); } catch (e) { console.error("folk:", e); }
      bindTerrain();
      bindModel();

      if (tip) tip.textContent = "装配模块…";

      // 慢网提示：8 秒还没装配完就提醒，并给出跳过入口
      const slowTip = setTimeout(() => {
        if (mask && mask.parentNode && tip) tip.textContent = "加载较慢，请检查网络…";
        ensureSkipBtn(mask);
      }, 8000);

      // 三维延迟初始化，避免挡住首屏
      setTimeout(() => {
        clearTimeout(slowTip);
        if (tip) tip.textContent = "生成三维地形…";
        const engineOk = typeof THREE !== "undefined";
        if (!engineOk) {
          // 引擎文件加载失败：二维内容照常可用，三维部分给出明确提示；
          // 遮罩保留错误文案，由用户点"跳过"或 6 秒兜底放行
          if (mask) mask.classList.add("err");
          if (tip) tip.textContent = "三维引擎加载失败，请检查网络后刷新重试（其余内容可正常浏览）";
          ensureSkipBtn(mask);
        }
        // 各模块自身均有 THREE 缺失保护，失败只影响对应模块
        window.__startTerrain = function () {
          if (window.__terrainStarted) return;
          window.__terrainStarted = true;
          try { window.Terrain.init(); } catch (e) { console.error("terrain:", e); }
        };
        // 地形数据尚未加载时不初始化，等 terrain-loader 加载完再调用
        if (window.CHQ_DEM) window.__startTerrain();
        try { window.Landmark3D.init(); } catch (e) { console.error("model:", e); }
        try { window.Guess.init(); } catch (e) { console.error("guess:", e); }
        try { window.RailMap.init(); } catch (e) { console.error("rail:", e); }
        try { window.ModelHub.init(); } catch (e) { console.error("models:", e); }
        // 引擎正常才立即收起遮罩；缺失时保留错误提示
        if (mask && engineOk) { mask.classList.add("gone"); setTimeout(() => mask.remove(), 800); }
      }, 420);

      // 兜底：即使三维初始化失败也要露出页面
      setTimeout(() => { if (mask && mask.parentNode) { mask.classList.add("gone"); setTimeout(() => mask.remove(), 800); } }, 6000);
    } catch (e) {
      console.error("[boot] 装配失败:", e);
      showBootError("页面装配出错：" + (e && e.message ? e.message : e) + "。已跳过出错的模块，可点下方按钮进入");
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

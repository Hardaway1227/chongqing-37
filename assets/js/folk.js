/* ==========================================================
   folk.js — 民族 · 节庆 · 非遗 渲染与交互
   ========================================================== */
(function () {
  "use strict";
  const id = s => document.getElementById(s);
  const F = window.FOLK;

  /* =======================================================
     民族纹样（程序化 SVG）
     ======================================================= */
  function pattern(kind, c) {
    const W = 320, H = 118;
    let g = `<defs>
      <linearGradient id="pg-${kind}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c}" stop-opacity=".30"/>
        <stop offset="100%" stop-color="${c}" stop-opacity=".03"/>
      </linearGradient>
      <clipPath id="pc-${kind}"><rect width="${W}" height="${H}"/></clipPath>
    </defs>`;
    g += `<rect width="${W}" height="${H}" fill="#0d131b"/>`;
    g += `<rect width="${W}" height="${H}" fill="url(#pg-${kind})"/>`;
    g += `<g clip-path="url(#pc-${kind})">`;

    const f = n => Math.round(n * 10) / 10;

    if (kind === "tujia") {
      // 西兰卡普：四十八勾菱形连缀
      g += `<rect width="${W}" height="${H}" fill="#1a0f0c"/>`;
      for (let r = 0; r < 5; r++) {
        for (let c2 = -1; c2 < 8; c2++) {
          const x = c2 * 40 + (r % 2 ? 20 : 0), y = r * 26 - 6;
          const s = 15;
          g += `<path d="M${f(x)},${f(y)} L${f(x + s)},${f(y + s)} L${f(x)},${f(y + 2 * s)} L${f(x - s)},${f(y + s)} Z"
                  fill="none" stroke="${c}" stroke-width="1.3" opacity=".75"/>`;
          g += `<path d="M${f(x)},${f(y + 6)} L${f(x + s - 6)},${f(y + s)} L${f(x)},${f(y + 2 * s - 6)} L${f(x - s + 6)},${f(y + s)} Z"
                  fill="${c}" opacity=".20"/>`;
          // 勾角
          for (let k = 0; k < 4; k++) {
            const ax = x + [0, s, 0, -s][k] * 0.62, ay = y + s + [0, s, 0, -s][k] * 0.62 * 0;
            const ang = k * 90;
            g += `<path d="M${f(ax)},${f(ay)} l5,0 l0,5" fill="none" stroke="#f5e6d0" stroke-width="1.1" opacity=".55"
                    transform="rotate(${ang} ${f(ax)} ${f(ay)})"/>`;
          }
        }
      }
      g += `<rect width="${W}" height="${H}" fill="none" stroke="${c}" stroke-width="0" />`;
    } else if (kind === "miao") {
      // 苗：蝴蝶妈妈 + 银饰同心弧
      g += `<rect width="${W}" height="${H}" fill="#0c1a16"/>`;
      for (let i = 0; i < 4; i++) {
        const cx = 40 + i * 80, cy = H / 2;
        // 同心弧（银项圈）
        for (let a = 0; a < 4; a++) {
          g += `<path d="M${f(cx - 34 + a * 6)},${f(cy + 30)} A${f(34 - a * 6)},${f(34 - a * 6)} 0 0 1 ${f(cx + 34 - a * 6)},${f(cy + 30)}"
                  fill="none" stroke="${c}" stroke-width="1.2" opacity="${f(0.7 - a * 0.13)}"/>`;
        }
        // 蝴蝶
        const bw = 22;
        g += `<path d="M${f(cx)},${f(cy - 4)}
                C${f(cx - bw)},${f(cy - 30)} ${f(cx - bw - 6)},${f(cy + 4)} ${f(cx - 4)},${f(cy + 6)}
                C${f(cx + 4)},${f(cy + 6)} ${f(cx + bw + 6)},${f(cy + 4)} ${f(cx + bw)},${f(cy - 30)}
                C${f(cx + bw)},${f(cy - 30)} ${f(cx)},${f(cy - 22)} ${f(cx)},${f(cy - 4)} Z"
                fill="${c}" opacity=".55"/>`;
        g += `<path d="M${f(cx)},${f(cy - 4)} L${f(cx)},${f(cy + 10)}" stroke="#eafff6" stroke-width="1.4" opacity=".7"/>`;
        g += `<circle cx="${f(cx - 9)}" cy="${f(cy - 12)}" r="2.4" fill="#eafff6" opacity=".55"/>`;
        g += `<circle cx="${f(cx + 9)}" cy="${f(cy - 12)}" r="2.4" fill="#eafff6" opacity=".55"/>`;
      }
      g += `<rect x="0" y="${H - 3}" width="${W}" height="3" fill="${c}" opacity=".35"/>`;
    } else if (kind === "hui") {
      // 回：星月 + 八角几何
      g += `<rect width="${W}" height="${H}" fill="#0b1620"/>`;
      for (let i = 0; i < 4; i++) {
        const cx = 40 + i * 80, cy = H / 2;
        g += `<g stroke="${c}" fill="none" stroke-width="1.2" opacity=".62">`;
        g += `<rect x="${f(cx - 24)}" y="${f(cy - 24)}" width="48" height="48" transform="rotate(45 ${f(cx)} ${f(cy)})"/>`;
        g += `<rect x="${f(cx - 15)}" y="${f(cy - 15)}" width="30" height="30" transform="rotate(45 ${f(cx)} ${f(cy)})"/>`;
        g += `</g>`;
        // 星月
        g += `<path d="M${f(cx + 4)},${f(cy - 11)} a11,11 0 1 0 ${f(-2)},${f(20)} a9,9 0 1 1 ${f(4)},${f(-20)} Z"
                fill="${c}" opacity=".8"/>`;
        g += `<circle cx="${f(cx + 13)}" cy="${f(cy - 13)}" r="2.6" fill="#dff0ff" opacity=".85"/>`;
      }
      for (let i = 0; i < 10; i++) {
        g += `<circle cx="${f(i * 34 + 8)}" cy="${f(H - 8)}" r="1.6" fill="${c}" opacity=".3"/>`;
      }
    } else if (kind === "meng") {
      // 蒙古：哈木尔云纹 + 盘长
      g += `<rect width="${W}" height="${H}" fill="#181306"/>`;
      for (let i = 0; i < 5; i++) {
        const cx = 32 + i * 64, cy = 34 + (i % 2) * 46;
        g += `<path d="M${f(cx)},${f(cy)}
                c0,-8 5,-13 11,-13 c7,0 11,6 9,12
                c8,-2 15,3 14,10 c-1,6 -8,9 -14,6
                c1,7 -4,13 -11,12 c-6,-1 -9,-7 -7,-13
                c-7,2 -13,-4 -12,-11 z"
                fill="none" stroke="${c}" stroke-width="1.4" opacity=".7"/>`;
        g += `<circle cx="${f(cx)}" cy="${f(cy)}" r="3.2" fill="${c}" opacity=".55"/>`;
      }
      g += `<path d="M0,${f(H - 10)} h${W}" stroke="${c}" stroke-width="1" opacity=".3"/>`;
    } else {
      // 多民族：五彩拼布
      g += `<rect width="${W}" height="${H}" fill="#150f1c"/>`;
      const cols = ["#ff6b3d", "#3ecfa0", "#6fc0ff", "#f2c14e", "#c99bff", "#ff7a45"];
      for (let r = 0; r < 3; r++) {
        for (let c2 = 0; c2 < 8; c2++) {
          const x = c2 * 40, y = r * 40 - 4;
          const col = cols[(r * 8 + c2) % cols.length];
          const t = (r * 8 + c2) % 3;
          if (t === 0) {
            g += `<path d="M${x},${y} L${x + 40},${y} L${x},${y + 40} Z" fill="${col}" opacity=".30"/>`;
          } else if (t === 1) {
            g += `<circle cx="${x + 20}" cy="${y + 20}" r="15" fill="${col}" opacity=".26"/>`;
          } else {
            g += `<rect x="${x + 6}" y="${y + 6}" width="28" height="28" fill="${col}" opacity=".24" transform="rotate(45 ${x + 20} ${y + 20})"/>`;
          }
        }
      }
    }
    g += `</g>`;
    // 暗角
    g += `<rect width="${W}" height="${H}" fill="#0a0d12" opacity=".28"/>`;
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
  }

  /* =======================================================
     1. 世居民族
     ======================================================= */
  let curEth = null;

  function renderEthnic() {
    const box = id("fkEth");
    if (!box) return;

    box.innerHTML = F.ETHNIC.map((e, i) => `
      <article class="eth-card" data-k="${e.k}" style="--ec:${e.color}">
        <div class="eth-vis">${pattern(e.k, e.color)}
          <img class="eth-photo" src="assets/pic/folk/${e.k}.jpg" alt="${e.n}" loading="lazy"
               onerror="this.remove()">
          <span class="eth-pop">${e.pop}</span>
        </div>
        <div class="eth-body">
          <div class="eth-top">
            <h4 class="eth-name">${e.n}</h4>
            <span class="eth-self">自称 ${e.self} <em>${e.self2}</em></span>
          </div>
          <div class="eth-rank">${e.rank}</div>
          <p class="eth-desc">${e.d}</p>
          <div class="eth-marks">${e.marks.map(m => `<span>${m}</span>`).join("")}</div>
          <button class="eth-more" data-i="${i}">展开档案 ▾</button>
          <div class="eth-facts">
            <div class="ef-row"><span>人口/规模</span><b>${e.facts[0][1]}</b></div>
            <div class="ef-row"><span>聚居地</span><b>${e.loc}</b></div>
            <div class="ef-row"><span>语言</span><b>${e.lang}</b></div>
            <div class="ef-row"><span>民居</span><b>${e.home}</b></div>
            <div class="ef-row"><span>信仰</span><b>${e.faith}</b></div>
            <div class="ef-row"><span>文化符号</span><b>${e.facts[4][1]}</b></div>
          </div>
        </div>
      </article>`).join("");

    box.addEventListener("click", ev => {
      const b = ev.target.closest(".eth-more");
      if (!b) return;
      const card = b.closest(".eth-card");
      const open = card.classList.toggle("open");
      b.textContent = open ? "收起档案 ▴" : "展开档案 ▾";
    });
  }

  function renderAuton() {
    const box = id("fkAuton");
    if (!box) return;
    box.innerHTML = `<span class="au-tag">自治地方</span>` + F.AUTON.map(a =>
      `<span class="au-item" title="${a.s}"><b>${a.n}</b><em>${a.y} · ${a.e} · ${a.s}</em></span>`
    ).join("");
  }

  /* =======================================================
     2. 节庆年轮
     ======================================================= */
  function polar(cx, cy, r, deg) {
    const a = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }
  function f1(n) { return Math.round(n * 10) / 10; }

  function ring(cx, cy, r1, r2, a0, a1) {
    const A = polar(cx, cy, r2, a0), B = polar(cx, cy, r2, a1);
    const C = polar(cx, cy, r1, a1), D = polar(cx, cy, r1, a0);
    const laf = (a1 - a0) > 180 ? 1 : 0;
    return `M${f1(A[0])},${f1(A[1])} A${r2},${r2} 0 ${laf},1 ${f1(B[0])},${f1(B[1])}` +
           ` L${f1(C[0])},${f1(C[1])} A${r1},${r1} 0 ${laf},0 ${f1(D[0])},${f1(D[1])} Z`;
  }

  let curMonth = 0;

  function renderWheel() {
    const box = id("fkWheel");
    if (!box) return;
    const CX = 180, CY = 180, R1 = 96, R2 = 152;

    const counts = F.MONTHS.map((_, i) => F.FESTS.filter(x => x.m === i).length);

    let g = `<defs>
      <radialGradient id="wc-c" cx="50%" cy="45%">
        <stop offset="0%" stop-color="#1b2431"/><stop offset="100%" stop-color="#0b0f15"/>
      </radialGradient>
    </defs>`;
    g += `<circle cx="${CX}" cy="${CY}" r="${R2 + 16}" fill="#0d1219" stroke="rgba(255,255,255,.07)"/>`;
    g += `<circle cx="${CX}" cy="${CY}" r="${R1 - 8}" fill="url(#wc-c)" stroke="rgba(255,255,255,.10)"/>`;

    // 色带（按节庆数着色）
    const hot = [255, 77, 46], cool = [63, 143, 224];
    for (let i = 0; i < 12; i++) {
      const a0 = i * 30 + 1, a1 = (i + 1) * 30 - 1;
      const t = counts[i] ? Math.min(1, counts[i] / 2) : 0;
      const col = `rgb(${Math.round(cool[0] + (hot[0] - cool[0]) * t)},${Math.round(cool[1] + (hot[1] - cool[1]) * t)},${Math.round(cool[2] + (hot[2] - cool[2]) * t)})`;
      g += `<path class="wh-sec" data-i="${i}" d="${ring(CX, CY, R1, R2, a0, a1)}"
              fill="${col}" fill-opacity="${counts[i] ? 0.20 + t * 0.42 : 0.06}"
              stroke="rgba(255,255,255,.14)" stroke-width="1"/>`;
    }
    // 月份标签
    for (let i = 0; i < 12; i++) {
      const p = polar(CX, CY, (R1 + R2) / 2, i * 30 + 15);
      const big = counts[i] >= 2;
      g += `<text class="wh-lab" data-i="${i}" x="${f1(p[0])}" y="${f1(p[1])}"
              text-anchor="middle" dominant-baseline="central"
              font-size="${big ? 17 : 15}" font-weight="${big ? 700 : 500}"
              fill="${counts[i] ? "#e9eef7" : "#5f6a7a"}">${F.MONTHS[i]}</text>`;
      if (counts[i]) {
        const q = polar(CX, CY, (R1 + R2) / 2 + (big ? 17 : 16), i * 30 + 15);
        g += `<text class="wh-num" data-i="${i}" x="${f1(q[0])}" y="${f1(q[1])}"
                text-anchor="middle" dominant-baseline="central"
                font-size="10" fill="#ff8a5c">${counts[i]} 个节</text>`;
      }
    }
    // 中心
    g += `<text id="whMid1" x="${CX}" y="${CY - 12}" text-anchor="middle"
            font-size="26" font-weight="800" fill="#ff9a4a">${F.MONTHS[0]}</text>`;
    g += `<text id="whMid2" x="${CX}" y="${CY + 16}" text-anchor="middle"
            font-size="12" fill="#7d8798">农历</text>`;
    // 指针
    g += `<g id="whPtr" style="transform-origin:${CX}px ${CY}px">
            <path d="M${CX},${CY - R2 - 12} l-7,-13 l14,0 Z" fill="#ff6b3d"/>
          </g>`;
    // 外圈刻度
    for (let i = 0; i < 72; i++) {
      const a = i * 5, A = polar(CX, CY, R2 + 6, a), B = polar(CX, CY, R2 + (i % 6 === 0 ? 13 : 10), a);
      g += `<line x1="${f1(A[0])}" y1="${f1(A[1])}" x2="${f1(B[0])}" y2="${f1(B[1])}"
              stroke="rgba(255,255,255,${i % 6 === 0 ? 0.28 : 0.12})" stroke-width="1"/>`;
    }
    box.innerHTML = `<svg viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;

    box.addEventListener("click", ev => {
      const el = ev.target.closest(".wh-sec,.wh-lab,.wh-num");
      if (!el) return;
      selectMonth(+el.dataset.i);
    });
    box.addEventListener("mouseover", ev => {
      const el = ev.target.closest(".wh-sec,.wh-lab,.wh-num");
      if (!el) return;
      const i = +el.dataset.i;
      box.querySelectorAll(`.wh-sec[data-i="${i}"]`).forEach(s => s.setAttribute("stroke", "#ff9a4a"));
    });
    box.addEventListener("mouseout", ev => {
      const el = ev.target.closest(".wh-sec,.wh-lab,.wh-num");
      if (!el) return;
      box.querySelectorAll(`.wh-sec[data-i="${+el.dataset.i}"]`).forEach(s => s.setAttribute("stroke", "rgba(255,255,255,.14)"));
    });

    selectMonth(0);
  }

  function selectMonth(i) {
    curMonth = i;
    const box = id("fkWheel");
    box.querySelectorAll(".wh-sec.on").forEach(s => s.classList.remove("on"));
    const sec = box.querySelector(`.wh-sec[data-i="${i}"]`);
    if (sec) sec.classList.add("on");
    const ptr = box.querySelector("#whPtr");
    if (ptr) ptr.style.transform = `rotate(${i * 30 + 15}deg)`;
    const m1 = box.querySelector("#whMid1");
    if (m1) m1.textContent = F.MONTHS[i];

    const list = F.FESTS.filter(x => x.m === i);
    const panel = id("fkMonth");
    panel.innerHTML =
      `<div class="fm-head">
         <h4>${F.MONTHS[i]}<em>农历</em></h4>
         <span class="fm-cnt">${list.length ? list.length + " 个节庆" : "农事间隙"}</span>
       </div>` +
      (list.length ? list.map((x, k) => `
        <div class="fm-item" style="animation-delay:${k * 70}ms">
          <div class="fm-i-top">
            <h5>${x.n}</h5>
            <span class="fm-e">${x.e}</span>
          </div>
          <div class="fm-meta">${x.t} · ${x.loc}</div>
          <p class="fm-d">${x.d}</p>
          <div class="fm-do">${x.do.map(t => `<span>${t}</span>`).join("")}</div>
        </div>`).join("")
        : `<div class="fm-none">这个月山里人赶农活，没有大节 —— 但场镇上照样赶场。</div>`);
  }

  /* =======================================================
     3. 非遗图鉴
     ======================================================= */
  function renderICH() {
    const bar = id("fkFilter"), grid = id("fkGrid");
    if (!grid) return;

    const counts = {};
    F.ICH.forEach(x => counts[x.cat] = (counts[x.cat] || 0) + 1);
    bar.innerHTML = F.ICH_CATS.map(c =>
      `<button class="fb${c.k === "all" ? " on" : ""}" data-k="${c.k}">${c.n}<em>${c.k === "all" ? F.ICH.length : (counts[c.k] || 0)}</em></button>`
    ).join("");

    const LV = { "国家级": "#ff6b3d", "市级": "#6fc0ff" };

    const paint = k => {
      const list = k === "all" ? F.ICH : F.ICH.filter(x => x.cat === k);
      grid.innerHTML = list.map((x, i) => `
        <article class="ich-card" data-i="${i}" data-n="${x.n}" style="--lc:${LV[x.lv] || "#8b95a5"}">
          <div class="ich-top">
            <h4>${x.n}</h4>
            <span class="ich-lv">${x.lv}</span>
          </div>
          <div class="ich-meta">${x.loc} · ${x.y} 年列入</div>
          <p class="ich-brief">${x.d.slice(0, 42)}…</p>
          <div class="ich-full">
            <p>${x.d}</p>
            <div class="ich-tags">${x.tag.map(t => `<span>${t}</span>`).join("")}</div>
          </div>
          <span class="ich-hint">点击看详情 ▾</span>
        </article>`).join("");
    };
    paint("all");

    bar.addEventListener("click", ev => {
      const b = ev.target.closest(".fb");
      if (!b) return;
      bar.querySelectorAll(".fb").forEach(x => x.classList.remove("on"));
      b.classList.add("on");
      paint(b.dataset.k);
    });

    grid.addEventListener("click", ev => {
      const c = ev.target.closest(".ich-card");
      if (!c) return;
      const open = c.classList.toggle("open");
      const h = c.querySelector(".ich-hint");
      if (h) h.textContent = open ? "收起 ▴" : "点击看详情 ▾";
    });

    // 计数条
    const st = id("fkStat");
    if (st) {
      const nat = F.ICH.filter(x => x.lv === "国家级").length;
      st.innerHTML = `<span>收录 <b>${F.ICH.length}</b> 项</span>
        <span>国家级 <b>${nat}</b></span>
        <span>市级 <b>${F.ICH.length - nat}</b></span>
        <span>类别 <b>${F.ICH_CATS.length - 1}</b></span>`;
    }
  }

  /* =======================================================
     4. 活在日常里的民俗
     ======================================================= */
  function renderLife() {
    const box = id("fkLife");
    if (!box) return;
    box.innerHTML = F.LIFE.map((x, i) => `
      <div class="lf-card" style="animation-delay:${(i % 8) * 45}ms">
        <div class="lf-i">${x.i}</div>
        <div class="lf-n">${x.n}<em>${x.e}</em></div>
        <p class="lf-d">${x.d}</p>
      </div>`).join("");
  }

  /* ======================================================= */
  function init() {
    if (!F) return;
    renderEthnic();
    renderAuton();
    renderWheel();
    renderICH();
    renderLife();
  }

  window.FolkKit = { init };
})();

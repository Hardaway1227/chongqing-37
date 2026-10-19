/* ==========================================================
   rail.js — 重庆铁路 / 高铁线路图（SVG 绘制 + 列车巡航动效）
   ========================================================== */
(function () {
  "use strict";
  const CHQ = window.CHQ, R = window.RAIL;
  const id = s => document.getElementById(s);
  const SVGNS = "http://www.w3.org/2000/svg";

  const B = CHQ.BOUND;
  const W = 1000, H = 830, PAD = 46;
  const X = lon => PAD + (lon - B.lon0) / (B.lon1 - B.lon0) * W;
  const Y = lat => PAD + (1 - (lat - B.lat0) / (B.lat1 - B.lat0)) * H;
  const f1 = n => Math.round(n * 10) / 10;

  let svg, gLines, gTrains, gStations, tip, panel;
  let playing = true, showLabels = false, curFilter = "all";
  let lineEls = [], trains = [], started = false;

  /* ---------- 平滑曲线（Catmull-Rom → 三次贝塞尔） ---------- */
  function smooth(pts, off) {
    const p = pts.map(q => [q[0] + (off ? off[0] : 0), q[1] + (off ? off[1] : 0)]);
    if (p.length < 2) return "";
    const xy = p.map(q => [X(q[0]), Y(q[1])]);
    let d = `M${f1(xy[0][0])},${f1(xy[0][1])}`;
    for (let i = 0; i < xy.length - 1; i++) {
      const p0 = xy[i - 1] || xy[i], p1 = xy[i], p2 = xy[i + 1], p3 = xy[i + 2] || xy[i + 1];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${f1(c1x)},${f1(c1y)} ${f1(c2x)},${f1(c2y)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return d;
  }

  function poly(pts) {
    let d = `M${f1(X(pts[0][0]))},${f1(Y(pts[0][1]))}`;
    for (let i = 1; i < pts.length; i++) d += ` L${f1(X(pts[i][0]))},${f1(Y(pts[i][1]))}`;
    return d;
  }

  function el(tag, attrs) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* =======================================================
     底图：轮廓 + 两江 + 区县点
     ======================================================= */
  function drawBase() {
    const g = el("g", { class: "rbase" });

    g.appendChild(el("rect", {
      x: 0, y: 0, width: W + PAD * 2, height: H + PAD * 2, fill: "#0b1017", rx: 8
    }));

    // 市域轮廓
    g.appendChild(el("path", {
      d: poly(CHQ.OUTLINE) + " Z",
      fill: "rgba(63,143,224,.045)", stroke: "rgba(255,255,255,.14)",
      "stroke-width": 1.4, "stroke-dasharray": "5 4"
    }));

    // 主要河流
    const rv = CHQ.RIVERS.filter(r => ["长江", "嘉陵江", "乌江"].indexOf(r.name) >= 0);
    rv.forEach(r => {
      g.appendChild(el("path", {
        d: poly(r.path), fill: "none", stroke: "rgba(111,192,255,.30)",
        "stroke-width": r.w * 0.9, "stroke-linecap": "round", "stroke-linejoin": "round"
      }));
    });

    // 区县点
    CHQ.DISTRICTS.forEach(d => {
      g.appendChild(el("circle", {
        cx: f1(X(d.lon)), cy: f1(Y(d.lat)), r: 2.2,
        fill: "rgba(255,255,255,.20)"
      }));
    });

    svg.appendChild(g);
  }

  /* =======================================================
     线路
     ======================================================= */
  function drawLines() {
    gLines = el("g", { class: "rlines" });
    svg.appendChild(gLines);

    R.RAIL.forEach((r, i) => {
      const d = smooth(r.path, r.off);
      const p = el("path", {
        d, class: "rl rl-" + r.k, "data-i": i,
        fill: "none", stroke: r.c, "stroke-width": r.k === "high" ? 4.2 : r.k === "build" ? 2.8 : 3.2,
        "stroke-linecap": "round", "stroke-linejoin": "round",
        opacity: r.k === "build" ? 0.92 : 1
      });
      if (r.k === "build") p.setAttribute("stroke-dasharray", "9 7");
      gLines.appendChild(p);
      lineEls.push({ el: p, data: r, len: 0 });
    });
  }

  function startDraw() {
    if (started) return;
    started = true;
    lineEls.forEach((L, i) => {
      const len = L.el.getTotalLength();
      L.len = len;
      L.el.style.setProperty("--L", len);
      L.el.classList.add("draw");
      setTimeout(() => {
        L.el.classList.add("in");
        if (L.data.k === "build") setTimeout(() => L.el.classList.add("flow"), 1700);
      }, 90 + i * 110);
    });
    // 铺轨动画开始后收起 loading
    const load = document.querySelector(".rail-loading");
    if (load) { load.classList.add("gone"); setTimeout(() => load.remove(), 700); }

    // 描线结束后放列车
    setTimeout(() => { makeTrains(); startTick(); }, 900 + lineEls.length * 110);
  }

  /* =======================================================
     列车
     ======================================================= */
  function makeTrains() {
    gTrains = el("g", { class: "rtrains" });
    svg.appendChild(gTrains);

    lineEls.forEach(L => {
      if (L.data.k === "build") return;
      const n = L.len > 700 ? 3 : 2;
      for (let t = 0; t < n; t++) {
        const g = el("g", { class: "rtrain" });
        const halo = el("circle", { r: 9, fill: L.data.c, opacity: .18 });
        const core = el("circle", { r: 3.6, fill: "#fff" });
        const ring = el("circle", { r: 5.6, fill: "none", stroke: L.data.c, "stroke-width": 2 });
        g.appendChild(halo); g.appendChild(ring); g.appendChild(core);
        gTrains.appendChild(g);
        trains.push({
          g, path: L.el, len: L.len,
          spd: (26 + L.data.sp * 0.17) * (L.data.k === "high" ? 1.25 : 1),
          pos: (L.len / n) * t + (Math.random() * 40),
          line: L.data
        });
      }
    });
  }

  let last = 0, raf = null, tickRunning = false;
  function tick(ts) {
    if (!tickRunning) return;
    if (!last) last = ts || 0;
    const dt = Math.min(0.05, ((ts || 0) - last) / 1000);
    last = ts || 0;
    if (playing) {
      trains.forEach(t => {
        t.pos = (t.pos + t.spd * dt) % t.len;
        const p = t.path.getPointAtLength(t.pos);
        t.g.setAttribute("transform", `translate(${f1(p.x)},${f1(p.y)})`);
        t.g.style.opacity = t.line.hidden ? 0.12 : 1;
      });
    }
    raf = requestAnimationFrame(tick);
  }
  /* 视口节流：离开视口暂停列车循环（dt 重置，回到视口不跳变） */
  function startTick() {
    if (tickRunning) return;
    tickRunning = true; last = 0;
    raf = requestAnimationFrame(tick);
  }
  function stopTick() {
    tickRunning = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  /* =======================================================
     站点
     ======================================================= */
  function drawStations() {
    gStations = el("g", { class: "rstations" });
    svg.appendChild(gStations);

    R.STATIONS.forEach((s, i) => {
      const x = X(s.lon), y = Y(s.lat);
      const g = el("g", { class: "rst rst-" + s.lv, "data-i": i });
      if (s.lv === "hub") {
        const pulse = el("circle", { cx: f1(x), cy: f1(y), r: 9, fill: "none", stroke: "#ffb066", "stroke-width": 1.6, class: "rpulse" });
        g.appendChild(pulse);
      }
      if (s.lv === "build") {
        g.appendChild(el("circle", { cx: f1(x), cy: f1(y), r: 6.4, fill: "none", stroke: "#f2c14e", "stroke-width": 1.6, "stroke-dasharray": "3 2.4" }));
        g.appendChild(el("circle", { cx: f1(x), cy: f1(y), r: 3, fill: "#f2c14e" }));
      } else {
        const r = s.lv === "hub" ? 5.2 : s.lv === "main" ? 4.2 : 3.2;
        g.appendChild(el("circle", { cx: f1(x), cy: f1(y), r, fill: "#0d131b", stroke: "#e9eef7", "stroke-width": s.lv === "hub" ? 2.2 : 1.5 }));
        if (s.lv === "hub") g.appendChild(el("circle", { cx: f1(x), cy: f1(y), r: 2, fill: "#ff8a5c" }));
      }
      // 标签
      const big = s.lv === "hub" || s.lv === "main";
      const anchor = x > W * 0.72 ? "end" : "start";
      const dx = anchor === "end" ? -9 : 9;
      const tx = el("text", {
        x: f1(x + dx), y: f1(y + 4), class: "rslab" + (big ? " big" : ""),
        "text-anchor": anchor, fill: s.lv === "build" ? "#f2c14e" : big ? "#e9eef7" : "#93a0b2",
        "font-size": big ? 13.5 : 11
      });
      tx.textContent = s.n;
      if (!big) tx.setAttribute("opacity", "0");
      g.appendChild(tx);

      g.addEventListener("mouseenter", () => { showTip(s.n + (s.d ? " · " + s.d : ""), s.lines.join(" / "), x, y); });
      g.addEventListener("mouseleave", hideTip);
      g.addEventListener("click", ev => { ev.stopPropagation(); showStation(s); });
      gStations.appendChild(g);
    });
  }

  /* =======================================================
     提示条
     ======================================================= */
  function showTip(t, sub, x, y) {
    tip.innerHTML = `<b>${t}</b>` + (sub ? `<span>${sub}</span>` : "");
    tip.classList.add("show");
    tip.style.left = (x / (W + PAD * 2) * 100) + "%";
    tip.style.top = (y / (H + PAD * 2) * 100) + "%";
  }
  function hideTip() { tip.classList.remove("show"); }

  /* =======================================================
     面板
     ======================================================= */
  function panelOverview() {
    panel.innerHTML = `
      <div class="rp-top"><h3>重庆铁路网</h3><span class="rp-tag">枢纽城市</span></div>
      <div class="rp-facts">${R.FACTS.map(x =>
        `<div class="rp-fact"><div class="rf-v">${x.v}<em>${x.u}</em></div><div class="rf-n">${x.n}</div><div class="rf-d">${x.d}</div></div>`
      ).join("")}</div>
      <p class="rp-hint">点一条线路或一个车站，这里出详情。<br>红的是 350 高铁，金色虚线是在建的。</p>`;
  }

  function showLine(r) {
    panel.innerHTML = `
      <div class="rp-top">
        <h3><i style="background:${r.c}"></i>${r.n}</h3>
        <span class="rp-tag" style="color:${r.c};border-color:${r.c}66;background:${r.c}1a">${r.k === "build" ? "在建" : r.year + " 年通车"}</span>
      </div>
      <div class="rp-grid">
        <div class="rp-cell"><span>设计时速</span><b>${r.sp} km/h</b></div>
        <div class="rp-cell"><span>线路全长</span><b>${r.len} km</b></div>
        <div class="rp-cell"><span>起讫</span><b>${r.from} — ${r.to}</b></div>
        <div class="rp-cell"><span>境内</span><b>${r.qj}</b></div>
      </div>
      <p class="rp-d">${r.d}</p>
      <div class="rp-sec">途经站点</div>
      <div class="rp-stops">${r.stops.map(s => `<span>${s}</span>`).join("")}</div>`;
  }

  function showStation(s) {
    const lv = { hub: "枢纽站", main: "主要站", mid: "中间站", build: "在建站" }[s.lv];
    panel.innerHTML = `
      <div class="rp-top"><h3>${s.n}</h3><span class="rp-tag">${lv}</span></div>
      <p class="rp-d">${s.d || "位于" + s.n.replace(/站$/, "") + "，接入 " + s.lines.length + " 条线路。"}</p>
      <div class="rp-sec">接入线路</div>
      <div class="rp-lines">${s.lines.map(n => {
        const r = R.RAIL.find(x => x.n === n);
        return `<button class="rpl" data-n="${n}" style="--c:${r ? r.c : "#8b95a5"}">${n}</button>`;
      }).join("")}</div>`;
    panel.querySelectorAll(".rpl").forEach(b => b.addEventListener("click", () => {
      const r = R.RAIL.find(x => x.n === b.dataset.n);
      if (r) { highlight(r.n); showLine(r); }
    }));
  }

  /* =======================================================
     高亮 / 筛选
     ======================================================= */
  function highlight(name) {
    R.RAIL.forEach((r, i) => {
      const L = lineEls[i];
      const on = !name || r.n === name;
      L.data.hidden = name ? r.n !== name : false;
      L.el.classList.toggle("dim", !!name && r.n !== name);
      L.el.classList.toggle("on", !!name && r.n === name);
    });
    trains.forEach(t => { t.g.style.opacity = (name && t.line.n !== name) ? 0.12 : 1; });
    // 卡片
    document.querySelectorAll(".rc").forEach(c =>
      c.classList.toggle("on", !!name && c.dataset.n === name));
  }

  function applyFilter(k) {
    curFilter = k;
    R.RAIL.forEach((r, i) => {
      const hide = k !== "all" && r.k !== k;
      lineEls[i].data.hidden = hide;
      lineEls[i].el.classList.toggle("off", hide);
    });
    trains.forEach(t => { t.g.style.opacity = t.line.hidden ? 0 : 1; });
    gStations.querySelectorAll(".rst").forEach(g => {
      const s = R.STATIONS[+g.dataset.i];
      const ok = k === "all" || s.lines.some(n => {
        const r = R.RAIL.find(x => x.n === n);
        return r && r.k === k;
      });
      g.classList.toggle("off", !ok);
    });
  }

  /* =======================================================
     线路卡片
     ======================================================= */
  function buildCards() {
    const box = id("railCards");
    if (!box) return;
    box.innerHTML = R.RAIL.map(r => `
      <button class="rc${r.k === "build" ? " build" : ""}" data-n="${r.n}" style="--c:${r.c}">
        <span class="rc-bar"></span>
        <span class="rc-n">${r.n}</span>
        <span class="rc-m">${r.sp} km/h · ${r.len} km · ${r.k === "build" ? "在建" : r.year}</span>
      </button>`).join("");
    box.addEventListener("click", e => {
      const b = e.target.closest(".rc");
      if (!b) return;
      const n = b.dataset.n;
      if (document.querySelector(".rc.on") && document.querySelector(".rc.on").dataset.n === n) {
        highlight(null); panelOverview(); return;
      }
      applyFilter("all");
      document.querySelectorAll("#railLegend .fb").forEach(x => x.classList.remove("on"));
      const first = document.querySelector("#railLegend .fb");
      if (first) first.classList.add("on");
      highlight(n);
      showLine(R.RAIL.find(x => x.n === n));
    });
  }

  /* =======================================================
     HUD
     ======================================================= */
  function buildHud() {
    const lg = id("railLegend");
    if (lg) {
      lg.innerHTML = R.RAIL_CATS.map(c =>
        `<button class="fb${c.k === "all" ? " on" : ""}" data-k="${c.k}"><i style="background:${c.c}"></i>${c.n}</button>`).join("");
      lg.addEventListener("click", e => {
        const b = e.target.closest(".fb");
        if (!b) return;
        lg.querySelectorAll(".fb").forEach(x => x.classList.remove("on"));
        b.classList.add("on");
        highlight(null);
        panelOverview();
        applyFilter(b.dataset.k);
      });
    }

    const play = id("railPlay");
    if (play) play.addEventListener("click", () => {
      playing = !playing;
      play.textContent = playing ? "⏸ 暂停列车" : "▶ 启动列车";
      play.classList.toggle("paused", !playing);
    });

    const lab = id("railLabels");
    if (lab) lab.addEventListener("click", () => {
      showLabels = !showLabels;
      lab.textContent = showLabels ? "隐藏站名" : "显示全部站名";
      lab.classList.toggle("on", showLabels);
      svg.classList.toggle("show-all-labels", showLabels);
    });

    // 点空白取消高亮
    svg.addEventListener("click", e => {
      if (!e.target.closest(".rl") && !e.target.closest(".rst")) {
        highlight(null); panelOverview();
      }
    });
    // 线路 hover / click
    lineEls.forEach(L => {
      L.el.addEventListener("mouseenter", () => {
        const mid = L.el.getPointAtLength(L.len / 2);
        showTip(L.data.n, L.data.sp + " km/h · " + L.data.from + "—" + L.data.to, mid.x, mid.y);
      });
      L.el.addEventListener("mouseleave", hideTip);
      L.el.addEventListener("click", ev => {
        ev.stopPropagation();
        highlight(L.data.n === (document.querySelector(".rl.on") ? L.data.n : null) ? null : L.data.n);
        const on = document.querySelector(".rl.on");
        if (on) showLine(R.RAIL[+on.dataset.i]); else panelOverview();
      });
    });
  }

  /* ======================================================= */
  function init() {
    const stage = id("railStage");
    if (!stage || !R) return;
    tip = id("railTip"); panel = id("railPanel");

    svg = el("svg", {
      viewBox: `0 0 ${W + PAD * 2} ${H + PAD * 2}`,
      class: "rsvg", xmlns: SVGNS
    });
    const old = stage.querySelector("svg");
    if (old) old.remove();          // 只清旧的 svg，保留 .rail-tip 等子元素
    stage.appendChild(svg);

    drawBase();
    drawLines();
    drawStations();
    buildHud();
    buildCards();
    panelOverview();

    // 进入视口再启动动画
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { startDraw(); io.disconnect(); } });
    }, { threshold: 0.18 });
    io.observe(stage);

    // 离屏暂停 / 回屏恢复（持续生效）
    if (window.CHQ_PERF && window.CHQ_PERF.onVisible) {
      window.CHQ_PERF.onVisible(document.getElementById("rail") || stage, startTick, stopTick);
    }
    // 系统偏好减少动效时默认不自动跑车（仍可手动点"启动列车"）
    if (window.CHQ_PERF && window.CHQ_PERF.reducedMotion()) {
      playing = false;
      const pb = id("railPlay");
      if (pb) { pb.textContent = "▶ 启动列车"; pb.classList.add("paused"); }
    }
  }

  window.RailMap = { init };
})();

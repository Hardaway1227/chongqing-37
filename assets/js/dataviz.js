/* =========================================================
   dataviz.js · 37 区县数据对比
   纯 SVG，无第三方库：海拔排行 / 海拔-高差散点 / 片区构成
   数据来自 window.CHQ.DISTRICTS（海拔 e、高差 r、词条 t、坐标）
   ========================================================= */
(function () {
  "use strict";

  var D = (window.CHQ && window.CHQ.DISTRICTS) || [];
  var SRC = (window.DISTRICT_SLUGS || {});
  var COLORS = { "主城": "#ff7a45", "新区": "#5aa8ff", "渝东北": "#f2c14e", "渝东南": "#3ecfa0" };

  function slugOf(name) {
    if (window.districtURL) {
      var u = window.districtURL(name);
      if (u) return u;
    }
    return null;
  }
  function range(d) {
    var m = String(d.r || "").match(/(\d+)\D+(\d+)/);
    return m ? { lo: +m[1], hi: +m[2], span: +m[2] - +m[1] } : null;
  }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  /* ---------- 1) 横向排行 ---------- */
  var ROW = 26, PADL = 62, PADR = 46;

  function bars(metric) {
    var key = metric === "span" ? function (d) { var r = range(d); return r ? r.span : 0; }
      : metric === "tags" ? function (d) { return (d.t || []).length; }
        : function (d) { return d.e || 0; };
    var rows = D.slice().sort(function (a, b) { return key(b) - key(a); });
    var max = key(rows[0]) || 1;
    var W = 760, H = rows.length * ROW + 24;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="dv-bars" role="img" aria-label="区县排行">';
    rows.forEach(function (d, i) {
      var y = 12 + i * ROW, v = key(d), w = (v / max) * (W - PADL - PADR);
      var c = COLORS[d.c] || "#888";
      svg += '<g class="dv-row" data-n="' + esc(d.n) + '">';
      svg += '<rect x="0" y="' + (y - 2) + '" width="' + W + '" height="' + (ROW - 4) + '" fill="transparent"/>';
      svg += '<text x="0" y="' + (y + 12) + '" font-size="11.5" fill="#aeb9c9">' + esc(d.n) + '</text>';
      svg += '<rect x="' + PADL + '" y="' + (y + 1) + '" width="' + Math.max(2, w) + '" height="12" rx="6" fill="' + c + '" opacity=".72"/>';
      svg += '<text x="' + (PADL + w + 8) + '" y="' + (y + 12) + '" font-size="11" fill="#7d8798">' + v + (metric === "tags" ? "" : metric === "span" ? " m" : " m") + '</text>';
      svg += '</g>';
    });
    svg += '</svg>';
    return svg;
  }

  /* ---------- 2) 散点：海拔 × 高差 ---------- */
  function scatter() {
    var W = 560, H = 360, P = 42;
    var pts = D.map(function (d) { var r = range(d); return r ? { d: d, x: d.e, y: r.span } : null; }).filter(Boolean);
    var xMax = Math.max.apply(null, pts.map(function (p) { return p.x; })) * 1.1;
    var yMax = Math.max.apply(null, pts.map(function (p) { return p.y; })) * 1.1;
    function X(v) { return P + v / xMax * (W - P * 1.4); }
    function Y(v) { return H - P - v / yMax * (H - P * 1.5); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="dv-scatter" role="img" aria-label="海拔与高差分布">';
    s += '<line x1="' + P + '" y1="' + (H - P) + '" x2="' + (W - P * .4) + '" y2="' + (H - P) + '" stroke="rgba(255,255,255,.14)"/>';
    s += '<line x1="' + P + '" y1="' + P * .6 + '" x2="' + P + '" y2="' + (H - P) + '" stroke="rgba(255,255,255,.14)"/>';
    s += '<text x="' + (W - P) + '" y="' + (H - P + 20) + '" font-size="10" fill="#7d8798" text-anchor="end">平均海拔 m</text>';
    s += '<text x="' + (P - 12) + '" y="' + (P * .6 - 8) + '" font-size="10" fill="#7d8798">高差 m</text>';
    pts.forEach(function (p) {
      var c = COLORS[p.d.c] || "#888";
      s += '<circle class="dv-pt" data-n="' + esc(p.d.n) + '" cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="6" fill="' + c + '" opacity=".8"/>';
      s += '<title>' + esc(p.d.n) + '：海拔 ' + p.x + ' m，高差 ' + p.y + ' m</title>';
    });
    s += '</svg>';
    return s;
  }

  /* ---------- 3) 片区构成 ---------- */
  function groups() {
    var g = {};
    D.forEach(function (d) { g[d.c] = (g[d.c] || 0) + 1; });
    var order = ["主城", "新区", "渝东北", "渝东南"];
    var W = 560, H = 54, x = 0, total = D.length;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="dv-groups" role="img" aria-label="片区构成">';
    order.forEach(function (k) {
      if (!g[k]) return;
      var w = g[k] / total * W;
      s += '<rect x="' + x + '" y="6" width="' + (w - 3) + '" height="18" rx="9" fill="' + COLORS[k] + '" opacity=".8"><title>' + k + ' ' + g[k] + ' 个</title></rect>';
      s += '<text x="' + (x + 2) + '" y="44" font-size="10.5" fill="#7d8798">' + k + ' ' + g[k] + '</text>';
      x += w;
    });
    s += '</svg>';
    return s;
  }

  /* ---------- 交互 ---------- */
  function bind(root) {
    root.addEventListener("click", function (e) {
      var t = e.target.closest("[data-n]");
      if (!t) return;
      var url = slugOf(t.dataset.n);
      if (url) location.href = url;
    });
  }

  function render(metric) {
    var box = document.getElementById("dvBars");
    if (!box) return;
    box.innerHTML = bars(metric);
    var note = document.getElementById("dvNote");
    if (note) {
      note.textContent = metric === "span" ? "按地势起伏（最高−最低）排序"
        : metric === "tags" ? "按收录词条数量排序"
          : "按县城平均海拔排序";
    }
  }

  function init() {
    document.getElementById("dvScatter").innerHTML = scatter();
    document.getElementById("dvGroups").innerHTML = groups();
    bind(document.body);

    var seg = document.getElementById("dvSeg");
    if (seg) {
      seg.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-m]");
        if (!b) return;
        seg.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); });
        render(b.dataset.m);
      });
    }
    render("elev");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();

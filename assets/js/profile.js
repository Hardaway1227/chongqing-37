/* =========================================================
   profile.js · 沿江纵剖面
   沿长江主干的区县坐标连线取样真实高程（SRTM 30m），
   画成 0→700 km 的海拔曲线，并标出途经区县。
   ========================================================= */
(function () {
  "use strict";

  var D = (window.CHQ && window.CHQ.DISTRICTS) || [];
  var ROUTE = ["江津区", "巴南区", "渝中区", "长寿区", "涪陵区", "丰都县", "忠县", "万州区", "云阳县", "奉节县"];

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function rad(x) { return x * Math.PI / 180; }
  function km(a, b) {
    var dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  }

  /* ---------- 载入高程数据 ---------- */
  function loadDEM() {
    return new Promise(function (res, rej) {
      if (window.CHQ_DEM) return res(window.CHQ_DEM);
      var s = document.createElement("script");
      s.src = "assets/js/dem-data.js";
      s.onload = function () { window.CHQ_DEM ? res(window.CHQ_DEM) : rej(new Error("no DEM")); };
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  function decode(dem) {
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () {
        var n = dem.meta.size || img.width;
        var c = document.createElement("canvas");
        c.width = n; c.height = n;
        var ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, n, n);
        var px = ctx.getImageData(0, 0, n, n).data;
        var step = (dem.meta && dem.meta.step) || 2;
        var h = new Float32Array(n * n);
        for (var i = 0, j = 0; i < h.length; i++, j += 4) {
          h[i] = (px[j] * 256 + px[j + 1]) * step;
        }
        res({ h: h, n: n, bound: dem.meta.bound, step: step });
      };
      img.onerror = rej;
      img.src = dem.png;
    });
  }

  function sampler(grid) {
    var n = grid.n, b = grid.bound, h = grid.h;
    return function (lon, lat) {
      var u = (lon - b.lon0) / (b.lon1 - b.lon0);
      var v = (b.lat1 - lat) / (b.lat1 - b.lat0);
      var fx = Math.max(0, Math.min(n - 1, u * (n - 1)));
      var fy = Math.max(0, Math.min(n - 1, v * (n - 1)));
      var x0 = fx | 0, y0 = fy | 0;
      var x1 = x0 + 1 < n ? x0 + 1 : x0, y1 = y0 + 1 < n ? y0 + 1 : y0;
      var tx = fx - x0, ty = fy - y0;
      var a = h[y0 * n + x0], bb = h[y0 * n + x1], c = h[y1 * n + x0], d = h[y1 * n + x1];
      return (a * (1 - tx) + bb * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
    };
  }

  /* ---------- 取样 ---------- */
  function sampleRoute(asl) {
    var path = ROUTE.map(function (name) {
      for (var i = 0; i < D.length; i++) if (D[i].n === name) return D[i];
      return null;
    }).filter(Boolean);
    if (path.length < 2) return null;

    var pts = [], dist = 0;
    for (var i = 1; i < path.length; i++) {
      var a = path[i - 1], b = path[i];
      var seg = km(a, b);
      var steps = Math.max(8, Math.round(seg / 2));   // 约 2 km 一点
      for (var s = 0; s < steps; s++) {
        var t = s / steps;
        var lon = a.lon + (b.lon - a.lon) * t;
        var lat = a.lat + (b.lat - a.lat) * t;
        pts.push({ d: dist + seg * t, e: asl(lon, lat), lon: lon, lat: lat });
      }
      dist += seg;
    }
    var last = path[path.length - 1];
    pts.push({ d: dist, e: asl(last.lon, last.lat), lon: last.lon, lat: last.lat });

    var marks = [], acc = 0;
    marks.push({ name: path[0].n, d: 0, e: asl(path[0].lon, path[0].lat), span: path[0].r });
    for (var k = 1; k < path.length; k++) {
      acc += km(path[k - 1], path[k]);
      marks.push({ name: path[k].n, d: acc, e: asl(path[k].lon, path[k].lat), span: path[k].r });
    }
    return { pts: pts, marks: marks, total: dist };
  }

  /* ---------- 绘制 ---------- */
  function draw(data) {
    var W = 1100, H = 430, L = 46, R2 = 24, T = 26, B = 64;
    var maxE = 0, minE = 1e9;
    data.pts.forEach(function (p) { if (p.e > maxE) maxE = p.e; if (p.e < minE) minE = p.e; });
    var hi = Math.ceil((maxE + 120) / 500) * 500;
    var lo = Math.max(0, Math.floor((minE - 60) / 500) * 500);

    function X(d) { return L + d / data.total * (W - L - R2); }
    function Y(e) { return H - B - (e - lo) / (hi - lo) * (H - T - B); }

    var s = '<svg id="pv" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="从江津到奉节的沿线地表高程剖面">';
    s += '<defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#5aa8ff" stop-opacity=".55"/>' +
      '<stop offset="100%" stop-color="#5aa8ff" stop-opacity=".03"/></linearGradient></defs>';

    // 网格与刻度
    for (var e = lo; e <= hi; e += 500) {
      var y = Y(e);
      s += '<line x1="' + L + '" y1="' + y + '" x2="' + (W - R2) + '" y2="' + y + '" stroke="rgba(255,255,255,.07)"/>';
      s += '<text x="' + (L - 8) + '" y="' + (y + 4) + '" font-size="10" fill="#7d8798" text-anchor="end">' + e + '</text>';
    }
    // 曲线
    var dLine = data.pts.map(function (p, i) { return (i ? "L" : "M") + X(p.d).toFixed(1) + " " + Y(p.e).toFixed(1); }).join("");
    s += '<path d="' + dLine + 'L' + X(data.total) + ' ' + (H - B) + 'L' + L + ' ' + (H - B) + 'Z" fill="url(#pg)"/>';
    s += '<path d="' + dLine + '" fill="none" stroke="#5aa8ff" stroke-width="2" stroke-linejoin="round"/>';

    // 区县标记
    data.marks.forEach(function (m, i) {
      var x = X(m.d), y = Y(m.e);
      s += '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (H - B) + '" stroke="rgba(255,122,69,.35)" stroke-dasharray="3 4"/>';
      s += '<circle cx="' + x + '" cy="' + y + '" r="4.5" fill="#ff7a45"/>';
      var anchor = i === 0 ? "start" : (i === data.marks.length - 1 ? "end" : "middle");
      s += '<text x="' + x + '" y="' + (H - B + 22) + '" font-size="11" fill="#dfe9f5" text-anchor="' + anchor + '">' + m.name + '</text>';
      s += '<text x="' + x + '" y="' + (H - B + 38) + '" font-size="9.5" fill="#7d8798" text-anchor="' + anchor + '">' + Math.round(m.d) + ' km</text>';
      s += '<text x="' + x + '" y="' + (y - 9) + '" font-size="9.5" fill="#9fd0ff" text-anchor="' + anchor + '">' + Math.round(m.e) + ' m</text>';
    });

    // 轴
    s += '<line x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - R2) + '" y2="' + (H - B) + '" stroke="rgba(255,255,255,.18)"/>';
    s += '<text x="' + (L - 8) + '" y="' + (T - 8) + '" font-size="10" fill="#7d8798" text-anchor="end">m</text>';
    s += '</svg>';

    var box = document.getElementById("pvBox");
    box.innerHTML = s;

    // 统计
    var drop = data.marks[0].e - data.marks[data.marks.length - 1].e;
    var stats = document.getElementById("pvStats");
    stats.innerHTML =
      '<div class="stat"><p>连线累计距离</p><b>' + Math.round(data.total) + ' km</b></div>' +
      '<div class="stat"><p>起点海拔 · 江津</p><b>' + Math.round(data.marks[0].e) + ' m</b></div>' +
      '<div class="stat"><p>终点海拔 · 奉节</p><b>' + Math.round(data.marks[data.marks.length - 1].e) + ' m</b></div>' +
      '<div class="stat"><p>落差</p><b>' + (drop > 0 ? Math.round(drop) : Math.round(-drop)) + ' m</b></div>' +
      '<div class="stat"><p>沿线最高点</p><b>' + Math.round(maxE) + ' m</b></div>';
  }

  function fail(msg) {
    var box = document.getElementById("pvBox");
    if (box) box.innerHTML = '<div class="loading">' + msg + '</div>';
  }

  loadDEM().then(decode).then(function (grid) {
    var data = sampleRoute(sampler(grid));
    if (!data) return fail("取样失败：缺少区县坐标。");
    draw(data);
  }).catch(function (e) {
    console.warn("[profile]", e);
    fail("高程数据加载失败，请检查网络后刷新。");
  });
})();

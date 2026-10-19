/* =========================================================
   plan.js · 行程规划器
   选 2–5 个区县 → 最近邻排序 + 2-opt 优化 → 按天切分 → 里程/车时估算 → 导出海报
   ========================================================= */
(function () {
  "use strict";

  var MAX = 5;
  var ROAD = 1.32;          // 直线 → 公路 折算系数
  var SPEED = 52;           // 区县间平均车速 km/h
  var DAY_MAX_N = 3;        // 单日最多区县数
  var DAY_MAX_H = 5.5;      // 单日最长车时

  var DIST = (window.CHQ && window.CHQ.DISTRICTS) || [];
  var DEEP = window.DEEP || {};
  var picked = [];

  /* ---------- 工具 ---------- */
  function byName(n) {
    for (var i = 0; i < DIST.length; i++) if (DIST[i].n === n) return DIST[i];
    return null;
  }
  function rad(d) { return d * Math.PI / 180; }
  function haversine(a, b) {
    var R = 6371, dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function legKm(a, b) { return haversine(a, b) * ROAD; }
  function legH(km) { return km / SPEED; }
  function fmtH(h) {
    var m = Math.round(h * 60);
    return (m >= 60 ? Math.floor(m / 60) + " 小时" : "") + (m % 60 ? (m % 60) + " 分" : "") || "0 分";
  }

  /* ---------- 选点 ---------- */
  var selBox, listBox, tipsBox, outBox, svgBox;

  function buildPicker() {
    var groups = {};
    DIST.forEach(function (d) { (groups[d.c] = groups[d.c] || []).push(d); });
    var order = ["主城", "新区", "渝东北", "渝东南"];
    var html = "";
    order.forEach(function (g) {
      if (!groups[g]) return;
      html += '<div class="pl-g"><b>' + g + '</b><div class="pl-chips">';
      groups[g].forEach(function (d) {
        html += '<button type="button" class="pl-chip" data-n="' + d.n + '">' + d.n.replace(/[区县]$/, "") + '</button>';
      });
      html += '</div></div>';
    });
    listBox.innerHTML = html;
    listBox.addEventListener("click", function (e) {
      var b = e.target.closest(".pl-chip");
      if (!b) return;
      toggle(b.dataset.n, b);
    });
  }

  function toggle(name, btn) {
    var i = picked.indexOf(name);
    if (i >= 0) {
      picked.splice(i, 1);
      btn.classList.remove("on");
    } else {
      if (picked.length >= MAX) {
        flash("最多选 " + MAX + " 个区县");
        return;
      }
      picked.push(name);
      btn.classList.add("on");
    }
    renderPicked();
  }

  function flash(msg) {
    tipsBox.textContent = msg;
    tipsBox.classList.add("show");
    clearTimeout(flash._t);
    flash._t = setTimeout(function () { tipsBox.classList.remove("show"); }, 2200);
  }

  function renderPicked() {
    if (!picked.length) {
      selBox.innerHTML = '<span class="pl-empty">还没选，先从左边挑 2–5 个区县</span>';
    } else {
      selBox.innerHTML = picked.map(function (n, i) {
        return '<span class="pl-pick"><i>' + (i + 1) + '</i>' + n +
          '<em data-del="' + n + '" role="button" aria-label="移除">×</em></span>';
      }).join("");
    }
    var go = document.getElementById("plGo");
    if (go) {
      go.disabled = picked.length < 2;
      go.textContent = picked.length < 2 ? "再选 " + (2 - picked.length) + " 个" : "生成路线 →";
    }
  }

  /* ---------- 路线计算 ---------- */
  function optimize(names) {
    var pts = names.map(byName).filter(Boolean);
    if (pts.length <= 2) return pts;

    // 最近邻建初始解（固定起点为用户选择的第一个）
    var rest = pts.slice(1), route = [pts[0]];
    while (rest.length) {
      var last = route[route.length - 1], bi = 0, bd = Infinity;
      for (var i = 0; i < rest.length; i++) {
        var d = legKm(last, rest[i]);
        if (d < bd) { bd = d; bi = i; }
      }
      route.push(rest.splice(bi, 1)[0]);
    }

    // 开放路径 2-opt：只翻转中间段，边界单独处理
    function seg(a, b) { return a && b ? legKm(a, b) : 0; }
    var improved = true, guard = 0;
    while (improved && guard++ < 200) {
      improved = false;
      for (var a = 1; a < route.length - 1; a++) {   /* 固定起点，不翻转首段 */
        for (var b = a + 1; b < route.length; b++) {
          var p0 = route[a - 1], p1 = route[a], p2 = route[b], p3 = route[b + 1];
          var before = seg(p0, p1) + seg(p2, p3);
          var after = seg(p0, p2) + seg(p1, p3);
          if (after + 0.01 < before) {
            var mid = route.slice(a, b + 1).reverse();
            route = route.slice(0, a).concat(mid, route.slice(b + 1));
            improved = true;
          }
        }
      }
    }
    return route;
  }

  function splitDays(route) {
    var days = [], cur = [], h = 0, km = 0;
    for (var i = 0; i < route.length; i++) {
      var addKm = i > 0 ? legKm(route[i - 1], route[i]) : 0;
      var addH = legH(addKm);

      // 超限：先把当前天收尾，新的一天承接「从上一站开过来」的车程
      if (cur.length && (cur.length >= DAY_MAX_N || h + addH > DAY_MAX_H)) {
        days.push({ stops: cur, h: h, km: km });
        cur = []; h = 0; km = 0;
      }
      cur.push(route[i]);
      h += addH; km += addKm;
    }
    if (cur.length) days.push({ stops: cur, h: h, km: km });
    return days;
  }

  /* ---------- 渲染 ---------- */
  function renderPlan() {
    var route = optimize(picked);
    var days = splitDays(route);
    var totalKm = 0, totalH = 0;
    days.forEach(function (d) { totalKm += d.km; totalH += d.h; });

    var html = '<div class="pl-head">' +
      '<h2>你的重庆 · ' + route.length + ' 个区县 · ' + days.length + ' 天</h2>' +
      '<p>全程约 <b>' + Math.round(totalKm) + ' km</b> · 纯车程约 <b>' + fmtH(totalH) + '</b>' +
      '<span class="pl-note">按公路折算 1.32 倍、均速 ' + SPEED + ' km/h 估算</span></p></div>';

    days.forEach(function (d, di) {
      html += '<section class="pl-day"><div class="pl-day-h"><i>D' + (di + 1) + '</i>' +
        '<b>' + d.stops.length + ' 站</b><span>' + Math.round(d.km) + ' km · ' + fmtH(d.h) + '</span></div>';
      d.stops.forEach(function (st, si) {
        var deep = DEEP[st.n] || {};
        if (si === 0 && di > 0) {
          var from = days[di - 1].stops[days[di - 1].stops.length - 1];
          var km0 = legKm(from, st);
          html += '<div class="pl-leg from">↓ 从 ' + from.n + ' 出发 ' + Math.round(km0) + ' km · 约 ' + fmtH(legH(km0)) + '</div>';
        }
        var spots = (deep.spots || []).slice(0, 2).map(function (s) { return s.t; }).join(" · ");
        html += '<div class="pl-stop">' +
          '<div class="pl-stop-n">' + (si + 1) + '</div>' +
          '<div class="pl-stop-b"><b>' + st.n + '</b>' +
          '<span>' + (deep.slogan || "") + '</span>' +
          (spots ? '<em>看点：' + spots + '</em>' : "") + '</div>';
        if (si > 0) {
          var km = legKm(d.stops[si - 1], st);
          html += '<div class="pl-leg">↑ ' + Math.round(km) + ' km · 约 ' + fmtH(legH(km)) + '</div>';
        }
        html += '</div>';
      });
      html += '</section>';
    });

    html += '<div class="pl-actions"><button type="button" id="plPng">导出图片 ↓</button>' +
      '<button type="button" class="ghost" id="plReset">重选</button></div>';

    outBox.innerHTML = html;
    outBox.classList.add("has");
    drawMap(route, days);
    document.getElementById("plPng").addEventListener("click", exportPNG);
    document.getElementById("plReset").addEventListener("click", function () {
      picked = []; document.querySelectorAll(".pl-chip.on").forEach(function (b) { b.classList.remove("on"); });
      renderPicked(); outBox.innerHTML = '<div class="pl-empty">选好区县后点「生成路线」</div>'; outBox.classList.remove("has");
      svgBox.innerHTML = "";
    });
  }

  /* ---------- 示意地图 ---------- */
  function drawMap(route, days) {
    var W = 420, H = 360, pad = 26;
    var lons = route.map(function (d) { return d.lon; }), lats = route.map(function (d) { return d.lat; });
    var minLon = Math.min.apply(null, lons), maxLon = Math.max.apply(null, lons);
    var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats);
    var dx = Math.max(0.25, maxLon - minLon) * 1.16, dy = Math.max(0.25, maxLat - minLat) * 1.16;
    var cx = (minLon + maxLon) / 2, cy = (minLat + maxLat) / 2;
    minLon = cx - dx / 2; minLat = cy - dy / 2;
    function X(lon) { return pad + (lon - minLon) / dx * (W - pad * 2); }
    function Y(lat) { return H - pad - (lat - minLat) / dy * (H - pad * 2); }
    function LX(x, w) { return Math.min(W - w, Math.max(pad, x)); }

    var colors = ["#ff7a45", "#5aa8ff", "#3ecfa0"];
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="pl-map" role="img" aria-label="行程示意图">';
    s += '<rect width="' + W + '" height="' + H + '" rx="16" fill="rgba(255,255,255,.02)"/>';
    // 连线
    for (var i = 1; i < route.length; i++) {
      s += '<line x1="' + X(route[i - 1].lon) + '" y1="' + Y(route[i - 1].lat) + '" x2="' + X(route[i].lon) + '" y2="' + Y(route[i].lat) +
        '" stroke="rgba(255,255,255,.16)" stroke-width="1.4" stroke-dasharray="5 5"/>';
    }
    // 点
    var dayOf = {};
    days.forEach(function (d, di) { d.stops.forEach(function (st) { dayOf[st.n] = di; }); });
    route.forEach(function (d, i) {
      var c = colors[(dayOf[d.n] || 0) % colors.length];
      s += '<circle cx="' + X(d.lon) + '" cy="' + Y(d.lat) + '" r="14" fill="' + c + '" opacity=".14"/>';
      s += '<circle cx="' + X(d.lon) + '" cy="' + Y(d.lat) + '" r="5.5" fill="' + c + '"/>';
      var lx = LX(X(d.lon) + 10, 62);
      s += '<text x="' + lx + '" y="' + (Y(d.lat) + 4) + '" font-size="11" fill="#e7eef7">' + d.n + '</text>';
    });
    s += '</svg>';
    svgBox.innerHTML = s;
  }

  /* ---------- 导出海报 ---------- */
  function exportPNG() {
    var route = optimize(picked), days = splitDays(route);
    var W = 1080, H = 1440;
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var x = cv.getContext("2d");

    var g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#111826"); g.addColorStop(0.55, "#0a0d12"); g.addColorStop(1, "#151019");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    var rg = x.createRadialGradient(W * 0.82, -60, 40, W * 0.82, -60, 720);
    rg.addColorStop(0, "rgba(255,122,69,.30)"); rg.addColorStop(1, "rgba(255,122,69,0)");
    x.fillStyle = rg; x.fillRect(0, 0, W, H);

    x.fillStyle = "#ff8a5c";
    x.font = '700 22px "PingFang SC","Microsoft YaHei",sans-serif';
    x.fillText("CHONGQING  ·  行程单", 72, 96);

    x.fillStyle = "#f2f6fb";
    x.font = '400 64px "Ma Shan Zheng","STKaiti",serif';
    x.fillText(route[0].n + " 出发", 72, 180);

    x.fillStyle = "rgba(200,214,230,.62)";
    x.font = '400 22px "PingFang SC","Microsoft YaHei",sans-serif';
    var totalKm = 0, totalH = 0;
    days.forEach(function (d) { totalKm += d.km; totalH += d.h; });
    x.fillText(days.length + " 天 · " + route.length + " 站 · 约 " + Math.round(totalKm) + " km · 车程 " + fmtH(totalH), 72, 222);

    var y = 300;
    days.forEach(function (d, di) {
      x.fillStyle = "#ff8a5c";
      x.font = '700 24px "PingFang SC","Microsoft YaHei",sans-serif';
      x.fillText("D" + (di + 1), 72, y);
      x.fillStyle = "rgba(160,180,200,.7)";
      x.font = '400 19px "PingFang SC","Microsoft YaHei",sans-serif';
      x.fillText(Math.round(d.km) + " km · " + fmtH(d.h), 120, y);

      var sy = y + 42;
      d.stops.forEach(function (st, si) {
        var deep = DEEP[st.n] || {};
        x.fillStyle = "#eaf0f8";
        x.font = '700 30px "PingFang SC","Microsoft YaHei",sans-serif';
        x.fillText(st.n, 108, sy);
        x.fillStyle = "rgba(170,190,210,.75)";
        x.font = '400 18px "PingFang SC","Microsoft YaHei",sans-serif';
        x.fillText((deep.slogan || "").slice(0, 22), 108, sy + 26);
        var spots = (deep.spots || []).slice(0, 2).map(function (s) { return s.t; }).join(" · ");
        if (spots) {
          x.fillStyle = "rgba(140,160,180,.6)";
          x.font = '400 16px "PingFang SC","Microsoft YaHei",sans-serif';
          x.fillText("看点：" + spots, 108, sy + 50);
        }
        x.beginPath();
        x.arc(78, sy - 9, 9, 0, 6.2832);
        x.fillStyle = di === 0 ? "#ff7a45" : di === 1 ? "#5aa8ff" : "#3ecfa0";
        x.fill();
        x.fillStyle = "#0a0d12";
        x.font = '700 12px "PingFang SC",sans-serif';
        x.textAlign = "center";
        x.fillText(String(si + 1), 78, sy - 4);
        x.textAlign = "left";
        sy += 100;
      });
      y = sy + 26;
    });

    x.strokeStyle = "rgba(255,255,255,.10)";
    x.beginPath(); x.moveTo(72, H - 118); x.lineTo(W - 72, H - 118); x.stroke();
    x.fillStyle = "rgba(150,170,190,.55)";
    x.font = '400 16px "PingFang SC","Microsoft YaHei",sans-serif';
    x.fillText("山城重庆 · 37 区县数字志　|　里程与车时为估算，实际以导航为准", 72, H - 74);
    x.fillStyle = "#ff8a5c";
    x.font = '400 26px "Ma Shan Zheng","STKaiti",serif';
    x.fillText("一城山水，一区一性格", W - 72 - 220, H - 70);

    cv.toBlob(function (blob) {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "重庆行程-" + route[0].n + "-" + days.length + "天.png";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    }, "image/png");
  }

  /* ---------- 启动 ---------- */
  function init() {
    listBox = document.getElementById("plList");
    selBox = document.getElementById("plSel");
    tipsBox = document.getElementById("plTips");
    outBox = document.getElementById("plOut");
    svgBox = document.getElementById("plMap");
    buildPicker();
    // 向导可能已经预选好区县
    try {
      var pre = JSON.parse(localStorage.getItem("chq.plan.pick") || "[]");
      if (Array.isArray(pre) && pre.length) {
        pre.slice(0, MAX).forEach(function (n) {
          picked.push(n);
          var chip = listBox.querySelector('.pl-chip[data-n="' + n + '"]');
          if (chip) chip.classList.add("on");
        });
      }
    } catch (e) { }
    renderPicked();
    selBox.addEventListener("click", function (e) {
      var d = e.target.closest("[data-del]");
      if (!d) return;
      var n = d.dataset.del;
      picked = picked.filter(function (x) { return x !== n; });
      var chip = listBox.querySelector('.pl-chip[data-n="' + n + '"]');
      if (chip) chip.classList.remove("on");
      renderPicked();
    });
    document.getElementById("plGo").addEventListener("click", renderPlan);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();

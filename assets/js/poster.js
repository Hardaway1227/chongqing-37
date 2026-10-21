/* =========================================================
   poster.js · 我的足迹海报
   读取 localStorage 里记录过的区县，画成 1080×1440 可保存的图。
   ========================================================= */
(function () {
  "use strict";

  var D = (window.CHQ && window.CHQ.DISTRICTS) || [];
  var KEY = "chq.visited";

  function load() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }

  var COLORS = { "主城": "#ff7a45", "新区": "#5aa8ff", "渝东北": "#f2c14e", "渝东南": "#3ecfa0" };

  function draw() {
    var cv = document.getElementById("cv");
    if (!cv) return;
    var ctx = cv.getContext("2d");
    var W = cv.width, H = cv.height;
    var seen = load();
    var seenSet = {};
    seen.forEach(function (x) { if (x.s) seenSet[x.s] = true; if (x.n) seenSet[x.n] = true; });

    // 背景
    ctx.fillStyle = "#0a0d12";
    ctx.fillRect(0, 0, W, H);
    var g = ctx.createRadialGradient(W * 0.8, -H * 0.1, 40, W * 0.8, -H * 0.1, H * 0.9);
    g.addColorStop(0, "rgba(255,122,69,.22)");
    g.addColorStop(1, "rgba(10,13,18,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 标题
    ctx.fillStyle = "#eaf0f8";
    ctx.font = '600 34px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText("山城重庆 · 我的足迹", 72, 116);
    ctx.fillStyle = "#7d8798";
    ctx.font = '400 22px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText("THIRTY-EIGHT DISTRICTS · CHONGQING", 72, 156);

    // 进度环
    var total = D.length || 38;
    var n = seen.length;
    var cx = 200, cy = 340, r = 86;
    ctx.lineWidth = 14;
    ctx.strokeStyle = "rgba(255,255,255,.09)";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    if (n) {
      ctx.strokeStyle = "#ff7a45";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, n / total));
      ctx.stroke();
    }
    ctx.fillStyle = "#fff";
    ctx.font = '700 64px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(String(n), cx, cy + 12);
    ctx.font = '400 20px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle = "#7d8798";
    ctx.fillText("/ " + total + " 区县", cx, cy + 48);
    ctx.textAlign = "left";

    // 右侧说明
    ctx.fillStyle = "#aeb9c9";
    ctx.font = '400 22px "PingFang SC","Microsoft YaHei",sans-serif';
    var tips = n === 0
      ? ["还没有足迹。", "去首页点开任意一个区县，", "这里就会记录下来。"]
      : ["已走过 " + n + " 个区县，", "还有 " + (total - n) + " 个在山里等着。"];
    tips.forEach(function (t, i) { ctx.fillText(t, 340, 320 + i * 36); });

    // 区县网格
    var cols = 6, cell = 104, gap = 12;
    var startX = 84, startY = 452;
    D.slice(0, 36).forEach(function (d, i) {
      var c = i % cols, r2 = Math.floor(i / cols);
      var x = startX + c * (cell + gap), y = startY + r2 * (cell + gap);
      var on = !!seenSet[d.n] || !!seenSet[_slugOf(d.n)];
      ctx.fillStyle = on ? (COLORS[d.c] || "#ff7a45") : "rgba(255,255,255,.05)";
      ctx.globalAlpha = on ? 0.92 : 1;
      roundRect(ctx, x, y, cell, cell, 14);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = on ? "#0a0d12" : "#5f7286";
      ctx.font = '600 19px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = "center";
      var short = d.n.replace(/[区县]$/, ""); if (short.length < 2) short = d.n;
      ctx.fillText(short, x + cell / 2, y + cell / 2 + 6);
      ctx.textAlign = "left";
    });

    // 城市剪影
    drawSkyline(ctx, W, H);

    // 页脚
    ctx.fillStyle = "#7d8798";
    ctx.font = '400 20px "PingFang SC","Microsoft YaHei",sans-serif';
    var dt = new Date();
    ctx.fillText("hardaway1227.github.io/chongqing-37　·　" +
      dt.getFullYear() + "." + String(dt.getMonth() + 1).padStart(2, "0") + "." + String(dt.getDate()).padStart(2, "0"), 72, H - 54);
  }

  function _slugOf(name) {
    if (window.districtSlug) return window.districtSlug(name);
    return "";
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawSkyline(ctx, W, H) {
    var base = H - 120;
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    ctx.fillStyle = "rgba(255,255,255,.06)";
    var x = 0;
    while (x < W) {
      var w = 26 + rnd() * 46;
      var h = 40 + rnd() * 150;
      ctx.fillRect(x, base - h, w - 4, h);
      // 窗
      ctx.fillStyle = "rgba(255,190,120,.35)";
      for (var wy = base - h + 12; wy < base - 10; wy += 18) {
        for (var wx = x + 6; wx < x + w - 10; wx += 14) {
          if (rnd() > 0.55) ctx.fillRect(wx, wy, 4, 6);
        }
      }
      ctx.fillStyle = "rgba(255,255,255,.06)";
      x += w;
    }
  }

  function renderList() {
    var box = document.getElementById("list");
    var seen = load();
    if (!box) return;
    if (!seen.length) {
      box.innerHTML = '<div class="empty">还没有足迹。<br>去 <a href="index.html" style="color:var(--ac)">首页</a> 点开任意区县，这里会记录下来。</div>';
      return;
    }
    var names = seen.slice(-12).reverse().map(function (x) { return x.n || x.s; });
    box.innerHTML = "最近走过：<br><b>" + names.join("</b> · <b>") + "</b>" +
      (seen.length > 12 ? "<br>… 共 " + seen.length + " 个区县" : "");
  }

  function init() {
    draw();
    renderList();
    var dl = document.getElementById("dl");
    if (dl) dl.addEventListener("click", function () {
      var cv = document.getElementById("cv");
      var a = document.createElement("a");
      a.download = "重庆足迹-" + new Date().toISOString().slice(0, 10) + ".png";
      a.href = cv.toDataURL("image/png");
      a.click();
    });
    var rs = document.getElementById("reset");
    if (rs) rs.addEventListener("click", function () {
      try { localStorage.removeItem(KEY); } catch (e) { }
      draw(); renderList();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();

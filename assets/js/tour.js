/* =========================================================
   tour.js · 演示模式（录制用）
   用法：index.html?tour=1
   行为：自动逐段滚动、右下角显示章节字幕、空格暂停、→ 下一段、Esc 退出
   ========================================================= */
(function () {
  "use strict";

  var qs = location.search;
  if (!/(^|[?&])tour=1/.test(qs)) return;

  var STOPS = [
    { id: "hero", no: "01", name: "序章 · 一座建在褶皱上的城", hold: 7000 },
    { id: "history", no: "02", name: "山城千年 · 时间轴", hold: 6000 },
    { id: "terrain", no: "03", name: "立体地形 · 真实 SRTM 高程", hold: 12000 },
    { id: "rail", no: "04", name: "铁路脉络 · 八十年铺轨", hold: 6000 },
    { id: "cloud", no: "05", name: "地貌词云 · 一区一形", hold: 6000 },
    { id: "culture", no: "06", name: "人文色彩 · 方言与味觉", hold: 6000 },
    { id: "folk", no: "07", name: "民族 · 节庆 · 非遗", hold: 6000 },
    { id: "model3d", no: "08", name: "三维地标 · 1:1 米制建模", hold: 12000 },
    { id: "guess", no: "09", name: "猜地方 · 老照片今昔", hold: 7000 },
    { id: "districts", no: "10", name: "三十八枚区县印记", hold: 6000 }
  ];

  var i = 0, timer = null, paused = false, running = false;

  var box = document.createElement("div");
  box.className = "tour-hud";
  box.innerHTML = '<div class="tour-no"></div><div class="tour-name"></div>' +
    '<div class="tour-bar"><i></i></div><div class="tour-tip">空格 暂停 · → 下一段 · Esc 退出</div>';
  document.body.appendChild(box);

  var st = document.createElement("style");
  st.textContent = [
    '.tour-hud{position:fixed;left:50%;bottom:34px;transform:translateX(-50%);z-index:300;',
    'min-width:min(560px,86vw);padding:14px 22px 12px;border-radius:14px;text-align:center;',
    'background:rgba(8,11,16,.86);border:1px solid rgba(255,140,92,.35);backdrop-filter:blur(12px);',
    'box-shadow:0 18px 50px rgba(0,0,0,.55);font-family:"PingFang SC","Microsoft YaHei",sans-serif}',
    '.tour-no{font-size:11px;letter-spacing:.28em;color:#ff7a45}',
    '.tour-name{font-size:15px;color:#eaf0f8;margin-top:3px;letter-spacing:.02em}',
    '.tour-bar{height:2px;background:rgba(255,255,255,.12);border-radius:2px;margin:10px 0 8px;overflow:hidden}',
    '.tour-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff7a45,#ffb08a)}',
    '.tour-tip{font-size:10.5px;color:#6f8398;letter-spacing:.08em}',
    '.tour-hud.paused .tour-bar i{background:#7d8798}'
  ].join("");
  document.head.appendChild(st);

  var noEl = box.querySelector(".tour-no");
  var nameEl = box.querySelector(".tour-name");
  var barEl = box.querySelector(".tour-bar i");

  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  // 关掉 CSS 平滑滚动，改为自己分步滚动，保证滚动触发动画能被激活
  try { document.documentElement.style.scrollBehavior = "auto"; } catch (e) { }

  function scrollToY(target, dur, done) {
    var start = window.pageYOffset, delta = target - start, t0 = performance.now();
    function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, start + delta * ease(p));
      window.dispatchEvent(new Event("scroll"));
      if (p < 1) requestAnimationFrame(step);
      else if (done) done();
    }
    requestAnimationFrame(step);
  }

  function go(idx) {
    i = Math.max(0, Math.min(STOPS.length - 1, idx));
    var s = STOPS[i];
    var el = document.getElementById(s.id);
    noEl.textContent = "0" + s.no.slice(-1) === s.no ? s.no : s.no;
    noEl.textContent = s.no + " / " + String(STOPS.length).padStart(2, "0");
    nameEl.textContent = s.name;

    if (el) {
      var y = el.getBoundingClientRect().top + window.pageYOffset;
      scrollToY(y, 1400);
    }
    setTimeout(function () {
      window.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(new Event("resize"));
    }, 1500);
    runHold(s.hold);
  }

  function runHold(ms) {
    clearTimeout(timer);
    barEl.style.transition = "none";
    barEl.style.width = "0%";
    // 进度条
    requestAnimationFrame(function () {
      barEl.style.transition = "width " + ms + "ms linear";
      barEl.style.width = "100%";
    });
    if (paused) return;
    timer = setTimeout(function () {
      if (i < STOPS.length - 1) go(i + 1);
      else finish();
    }, ms);
  }

  function finish() {
    running = false;
    nameEl.textContent = "演示结束 · 感谢观看";
    noEl.textContent = "END";
    barEl.style.width = "100%";
  }

  function toggle() {
    paused = !paused;
    box.classList.toggle("paused", paused);
    if (paused) { clearTimeout(timer); barEl.style.transition = "none"; }
    else runHold(STOPS[i].hold);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === " ") { e.preventDefault(); toggle(); }
    else if (e.key === "ArrowRight") { go(i + 1); }
    else if (e.key === "ArrowLeft") { go(i - 1); }
    else if (e.key === "Escape") {
      clearTimeout(timer);
      box.remove();
      running = false;
    }
  });

  running = true;
  // 首屏先停 1.2s 再开始，方便片头
  setTimeout(function () { go(0); }, 1200);
})();

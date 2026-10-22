/* =========================================================
   一条江 · 叙事主线导航
   把 10 个并列板块挂到同一条「江」上：左侧固定江线，
   滚动时线随进度生长，当前站点亮，点击直达。
   ========================================================= */
(function () {
  "use strict";

  var STOPS = [
    { id: "hero",    no: "01", name: "江之源",   line: "长江自江津入境，一路东去" },
    { id: "history", no: "02", name: "逐水而居", line: "巴人悬棺于峡，开埠于码头" },
    { id: "terrain", no: "03", name: "峡江大地", line: "平行岭谷，被两江切成三块" },
    { id: "rail",    no: "04", name: "铁水联运", line: "铁路沿江走，索道横江过" },
    { id: "cloud",   no: "05", name: "云雨巫山", line: "除却巫山不是云" },
    { id: "stay",    no: "06", name: "江畔人家", line: "吊脚楼挑在崖上，夜里点灯" },
    { id: "culture", no: "07", name: "码头人文", line: "袍哥、纤夫、川江号子" },
    { id: "folk",    no: "08", name: "沿江百族", line: "土家苗寨，摆手舞与西兰卡普" },
    { id: "model3d", no: "09", name: "江城地标", line: "九座地标，按米建造" },
    { id: "guess",   no: "10", name: "归舟",     line: "认一认，这是哪儿" }
  ];

  var KEY = "chq.river.visited";
  function loadSeen() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function saveSeen(v) {
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { }
  }
  function resumeChip() {
    var seen = loadSeen();
    if (seen.length < 2) return;
    var last = "";
    try { last = localStorage.getItem("chq.river.last") || ""; } catch (e) { }
    if (!last) last = seen[seen.length - 1];
    var idx = -1;
    for (var i = 0; i < STOPS.length; i++) if (STOPS[i].id === last) idx = i;
    if (idx < 1) return;
    var box = document.createElement("button");
    box.type = "button";
    box.className = "rv-resume";
    box.innerHTML = '<i>继续上次</i><b>' + STOPS[idx].name + '</b>';
    box.addEventListener("click", function () {
      var el = document.getElementById(STOPS[idx].id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      box.remove();
    });
    document.body.appendChild(box);
  }

  function build() {
    var rail = document.createElement("nav");
    rail.className = "rv-rail";
    rail.setAttribute("aria-label", "江线导航");

    var track = document.createElement("div");
    track.className = "rv-track";
    var fill = document.createElement("i");
    fill.className = "rv-fill";
    track.appendChild(fill);
    rail.appendChild(track);

    var items = [];
    STOPS.forEach(function (s, i) {
      var a = document.createElement("button");
      a.type = "button";
      a.className = "rv-stop";
      a.dataset.idx = String(i);
      a.innerHTML = '<span class="rv-dot"></span>' +
                    '<span class="rv-txt"><b>' + s.name + '</b>' +
                    '<i>' + s.line + '</i></span>';
      a.addEventListener("click", function () {
        var el = document.getElementById(s.id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      track.appendChild(a);
      items.push(a);
    });

    var hud = document.createElement("div");
    hud.className = "rv-hud";
    hud.innerHTML = '<b class="rv-cur">01</b><span>江之源</span><em class="rv-seen"></em>';
    rail.appendChild(hud);

    document.body.appendChild(rail);

    var cur = hud.querySelector(".rv-cur");
    var hudBar = hud.querySelector(".rv-seen");
    var curName = hud.querySelector("span");
    var lastActive = -1, ticking = false;

    function update() {
      ticking = false;
      var vh = window.innerHeight;
      var y = window.pageYOffset || document.documentElement.scrollTop;
      var docH = Math.max(1, document.documentElement.scrollHeight - vh);
      var p = Math.min(1, Math.max(0, y / docH));
      fill.style.height = (p * 100).toFixed(2) + "%";

      // 当前站点：以视口中线为准，取最后一个已越过的板块
      var mid = y + vh * 0.42;
      var active = 0;
      for (var i = 0; i < STOPS.length; i++) {
        var el = document.getElementById(STOPS[i].id);
        if (!el) continue;
        var top = el.getBoundingClientRect().top + y;
        if (top - 40 <= mid) active = i;
      }
      if (active !== lastActive) {
        for (var k = 0; k < items.length; k++) items[k].classList.toggle("on", k === active);
        cur.textContent = "";
        curName.textContent = STOPS[active].name;

        // 旅程存档：记下走过的站点
        var sid = STOPS[active].id;
        var seen = loadSeen();
        if (seen.indexOf(sid) < 0) { seen.push(sid); saveSeen(seen); }
        try { localStorage.setItem("chq.river.last", sid); } catch (e) { }
        for (var q = 0; q < items.length; q++) {
          items[q].classList.toggle("seen", seen.indexOf(STOPS[q].id) >= 0);
        }
        if (hudBar) hudBar.textContent = "";
        lastActive = active;
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    // 键盘：1–0 直达，J / K 前后章节
    function goTo(i) {
      i = Math.max(0, Math.min(STOPS.length - 1, i));
      var el = document.getElementById(STOPS[i].id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    document.addEventListener("keydown", function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      var k = e.key;
      if (k && k.length === 1 && k >= "0" && k <= "9") {
        e.preventDefault();
        goTo(k === "0" ? 9 : (k.charCodeAt(0) - 49));
        return;
      }
      if (k === "j" || k === "J") { e.preventDefault(); goTo(lastActive + 1); }
      else if (k === "k" || k === "K") { e.preventDefault(); goTo(lastActive - 1); }
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    resumeChip();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();

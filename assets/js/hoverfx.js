/* =========================================================
   hoverfx.js · 全站悬停 / 点击反馈
   · 卡片：浮起 + 描边高亮 + 跟随鼠标的柔光
   · 按钮 / 标签：颜色渐变 + 按下回弹
   · 任意可点元素：点击涟漪
   只在支持 hover 的设备上启用，尊重 reduced-motion
   ========================================================= */
(function () {
  "use strict";

  var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var CSS = [
    /* 卡片基础态 */
    ".hv-card{position:relative;transition:transform .38s cubic-bezier(.23,1,.32,1),box-shadow .38s,border-color .38s}",
    ".hv-card::after{content:\"\";position:absolute;inset:0;border-radius:inherit;pointer-events:none;",
    "opacity:0;transition:opacity .38s;background:radial-gradient(220px 160px at var(--mx,50%) var(--my,50%),",
    "color-mix(in srgb,var(--ac,#ff7a45) 22%,transparent),transparent 70%)}",
    ".hv-card:hover::after,.hv-card:focus-visible::after{opacity:1}",
    ".hv-card:hover,.hv-card:focus-visible{transform:translateY(-6px);",
    "box-shadow:0 18px 44px rgba(0,0,0,.42),0 0 0 1px color-mix(in srgb,var(--ac,#ff7a45) 55%,transparent);",
    "border-color:color-mix(in srgb,var(--ac,#ff7a45) 60%,transparent)}",
    /* 卡片内图片轻微放大 */
    ".hv-card img{transition:transform .7s cubic-bezier(.23,1,.32,1),filter .5s}",
    ".hv-card:hover img{transform:scale(1.06);filter:saturate(1.12) brightness(1.05)}",
    /* 按钮 / 标签 */
    ".hv-btn{position:relative;overflow:hidden;transition:transform .22s,box-shadow .28s,filter .28s,background .3s,color .3s}",
    ".hv-btn:hover{filter:brightness(1.12);box-shadow:0 10px 24px color-mix(in srgb,var(--ac,#ff7a45) 35%,transparent)}",
    ".hv-btn:active{transform:scale(.97)}",
    /* 涟漪 */
    ".hv-ripple{position:absolute;border-radius:50%;pointer-events:none;",
    "background:radial-gradient(circle,rgba(255,255,255,.55),rgba(255,255,255,0) 70%);",
    "transform:translate(-50%,-50%) scale(0);animation:hvRip .62s ease-out forwards}",
    "@keyframes hvRip{to{transform:translate(-50%,-50%) scale(1);opacity:0}}",
    "@media (prefers-reduced-motion: reduce){.hv-card,.hv-card img,.hv-btn{transition:none!important}",
    ".hv-card:hover{transform:none}}"
  ].join("");

  function injectCSS() {
    if (document.getElementById("hv-css")) return;
    var s = document.createElement("style");
    s.id = "hv-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var CARD_SEL = [
    ".card", ".hcard", ".rcard", ".scard", ".fcard", ".spot", ".mcard", ".ecard",
    ".stay-card", ".em-cell", ".dv-row", ".lm-hot", ".c-item", ".tp-card", ".rv-resume"
  ].join(",");

  var BTN_SEL = [
    ".btn", ".pl-chip", ".ag-chip", ".ag-btn", ".ag-act", ".nl", ".tb-btn",
    ".mm", ".fbtn", ".c-dot", ".pg", ".side-toc a", ".topbar nav a", ".chip", ".tab"
  ].join(",");

  var pending = null;
  function onMove(e) {
    var el = e.target.closest ? e.target.closest(".hv-card") : null;
    if (!el) return;
    if (pending) return;
    pending = requestAnimationFrame(function () {
      pending = null;
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      el.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    });
  }

  function ripple(el, ev) {
    if (reduce) return;
    var r = el.getBoundingClientRect();
    var size = Math.max(r.width, r.height) * 2.2;
    var d = document.createElement("span");
    d.className = "hv-ripple";
    d.style.width = d.style.height = size + "px";
    d.style.left = (ev.clientX - r.left) + "px";
    d.style.top = (ev.clientY - r.top) + "px";
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    el.appendChild(d);
    setTimeout(function () { d.remove(); }, 640);
  }

  function mark() {
    var i = 0;
    document.querySelectorAll(CARD_SEL).forEach(function (el) {
      if (!el.classList.contains("hv-card")) { el.classList.add("hv-card"); i++; }
    });
    document.querySelectorAll(BTN_SEL).forEach(function (el) {
      if (!el.classList.contains("hv-btn")) { el.classList.add("hv-btn"); i++; }
    });
    return i;
  }

  function bind() {
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerdown", function (e) {
      var t = e.target.closest && e.target.closest(".hv-btn,.hv-card");
      if (t) ripple(t, e);
    }, { passive: true });
  }

  function init() {
    injectCSS();
    mark();
    if (canHover) bind();
    // 动态内容（tab 切换、模态）补标
    var mo = new MutationObserver(function () {
      clearTimeout(init._t);
      init._t = setTimeout(mark, 260);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();

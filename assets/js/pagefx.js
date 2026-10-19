/* =========================================================
   pagefx.js · 全站动态层
   1) 区县专属转场：主色幕布 + 该区县纹样剪影 + 区名（进场揭开 / 出场覆盖）
   2) 顶部滚动进度条：用当前页主色渐变
   3) 首屏图视差：hero 图片随滚动轻微位移
   全部颜色取自页面既有变量 --ac / --ac2 / .bgdeco[data-t]，不改任何页面 HTML
   ========================================================= */
(function () {
  "use strict";

  if (window.__pfx) return;
  window.__pfx = true;

  var REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------- 纹样剪影 ---------- */
  var SIL = {
    mountain: 'M0 200 L0 150 L90 96 L170 132 L250 74 L340 128 L420 92 L520 140 L610 88 L700 130 L800 96 L900 138 L1000 84 L1100 126 L1200 94 L1300 134 L1400 88 L1440 118 L1440 200 Z',
    river: 'M0 200 L0 168 C140 150 250 178 380 168 C520 157 610 182 740 172 C880 161 980 184 1120 174 C1250 165 1350 182 1440 172 L1440 200 Z',
    karst: 'M0 200 L0 158 L70 158 L92 104 L150 104 L168 158 L250 158 L268 128 L330 128 L348 158 L470 158 L492 92 L556 92 L574 158 L700 158 L716 136 L790 136 L806 158 L930 158 L948 108 L1010 108 L1028 158 L1150 158 L1166 130 L1240 130 L1258 158 L1440 158 L1440 200 Z',
    ancient: 'M0 200 L0 160 L120 160 L120 132 L200 132 L200 160 L330 160 L330 118 L410 118 L410 160 L560 160 L560 138 L640 138 L640 160 L800 160 L800 124 L880 124 L880 160 L1010 160 L1010 140 L1090 140 L1090 160 L1230 160 L1230 128 L1310 128 L1310 160 L1440 160 L1440 200 Z',
    terrace: 'M0 200 L0 150 L160 150 L160 162 L330 162 L330 150 L500 150 L500 164 L680 164 L680 152 L860 152 L860 166 L1040 166 L1040 154 L1220 154 L1220 168 L1440 168 L1440 200 Z',
    urban: 'M0 200 L0 156 L60 156 L60 120 L110 120 L110 156 L150 156 L150 96 L190 96 L190 156 L250 156 L250 132 L300 132 L300 156 L360 156 L360 78 L400 78 L400 156 L470 156 L470 112 L520 112 L520 156 L600 156 L600 142 L660 142 L660 156 L730 156 L730 90 L770 90 L770 156 L850 156 L850 126 L900 126 L900 156 L980 156 L980 104 L1020 104 L1020 156 L1100 156 L1100 136 L1160 136 L1160 156 L1240 156 L1240 88 L1280 88 L1280 156 L1360 156 L1360 128 L1410 128 L1410 156 L1440 156 L1440 200 Z'
  };

  var CSS = [
    /* 转场幕布 */
    '.pfx{position:fixed;inset:0;z-index:9990;pointer-events:none;overflow:hidden;contain:strict}',
    '.pfx-in{position:absolute;inset:0;background:radial-gradient(135% 105% at 82% -8%,color-mix(in srgb,var(--pfx-a) 88%,#0a1017) 0%,color-mix(in srgb,var(--pfx-a) 34%,#070a0f) 40%,#06080d 78%);transform:translateY(100.5%);transition:transform .66s cubic-bezier(.76,0,.24,1);will-change:transform}',
    '.pfx.cover .pfx-in{transform:translateY(0)}',
    '.pfx.out .pfx-in{transform:translateY(-100.5%)}',
    '.pfx-sil{position:absolute;left:-2%;right:-2%;bottom:-2px;width:104%;height:26vh;max-height:230px;min-height:110px;fill:rgba(255,255,255,.07);transition:transform .66s cubic-bezier(.76,0,.24,1)}',
    '.pfx.out .pfx-sil{transform:translateY(-42%)}',
    '.pfx-name{position:absolute;left:0;right:0;bottom:calc(26vh + 16px);text-align:center;font-family:"Ma Shan Zheng","STKaiti","KaiTi",cursive;font-size:clamp(34px,7vw,76px);color:rgba(255,255,255,.62);letter-spacing:.14em;text-shadow:0 2px 26px rgba(0,0,0,.5);opacity:0;transform:translateY(14px);transition:opacity .3s,transform .66s}',
    '.pfx.cover .pfx-name{opacity:1;transform:none;transition-delay:.1s}',
    '.pfx.out .pfx-name{opacity:0;transform:translateY(-16px);transition-delay:0s}',
    /* 滚动进度条 */
    '.pfx-bar{position:fixed;left:0;top:0;height:2px;width:100%;z-index:9995;pointer-events:none;transform:scaleX(0);transform-origin:0 50%;',
    'background:linear-gradient(90deg,var(--ac,#ff7a45),var(--ac2,#ffb08f));box-shadow:0 0 12px color-mix(in srgb,var(--ac,#ff7a45) 60%,transparent);transition:transform .1s linear}'
    ,
    /* 滚动进场 */
    '.pfx-io{opacity:0;transition:opacity .62s ease}',
    '.pfx-io.pfx-show{opacity:1}',
    '.pfx-io .stat,.pfx-io .rcard,.pfx-io .pg{opacity:0;transition:opacity .5s ease}',
    '.pfx-io.pfx-show .stat,.pfx-io.pfx-show .rcard,.pfx-io.pfx-show .pg{opacity:1}',
    '.pfx-io.pfx-show .stat:nth-child(2),.pfx-io.pfx-show .rcard:nth-child(2),.pfx-io.pfx-show .pg:nth-child(2){transition-delay:.07s}',
    '.pfx-io.pfx-show .stat:nth-child(3),.pfx-io.pfx-show .rcard:nth-child(3),.pfx-io.pfx-show .pg:nth-child(3){transition-delay:.14s}',
    '.pfx-io.pfx-show .stat:nth-child(4),.pfx-io.pfx-show .rcard:nth-child(4){transition-delay:.21s}',
    /* 首屏编排 */
    '.pfx-rise{opacity:0;transform:translateY(16px);animation:pfxRise .72s cubic-bezier(.22,.7,.2,1) forwards;animation-delay:var(--d,0ms)}',
    '@keyframes pfxRise{to{opacity:1;transform:none}}',
    '@media (prefers-reduced-motion: reduce){.pfx-io,.pfx-io .stat,.pfx-io .rcard,.pfx-io .pg,.pfx-rise{opacity:1!important;transform:none!important;animation:none!important;transition:none!important}}'
    ,
    /* 排版修正（区县页 / 子页 / 人文页） */
    '.pfx-typo h1,.pfx-typo h2,.pfx-typo h3,.pfx-typo .sec-head h2,.pfx-typo .sec-head .idx{line-height:1.2}',
    '.pfx-typo h1,.pfx-typo h2{text-wrap:balance;letter-spacing:.01em}',
    '.pfx-typo .prose,.pfx-typo .prose p{max-width:40em}',
    '.pfx-typo .prose p+p{margin-top:.85em}',
    '.pfx-typo p{text-wrap:pretty}',
    '.pfx-typo .stat span,.pfx-typo .stat b,.pfx-typo .tp-cell .tc-v,.pfx-typo .mf-row span{font-variant-numeric:tabular-nums}',
    '.pfx-typo .hero .note,.pfx-typo .hero .slogan{max-width:30em}',
    '.pfx-typo .rcard p,.pfx-typo .tipbox p{max-width:34em}' 
    ,
    /* 语音合成按钮 */
    '.pfx-voice{position:fixed;right:20px;bottom:78px;z-index:58;display:flex;align-items:center;gap:7px;',
    'padding:9px 14px;border-radius:99px;cursor:pointer;font:inherit;font-size:12.5px;',
    'color:#dfe9f5;background:rgba(9,13,20,.86);border:1px solid rgba(120,160,210,.26);',
    'backdrop-filter:blur(10px);box-shadow:0 12px 30px rgba(0,0,0,.4);transition:.22s}',
    '.pfx-voice:hover{border-color:rgba(150,200,255,.55);transform:translateY(-2px)}',
    '.pfx-voice i{font-style:normal;font-size:13px;color:var(--ac,#ff7a45)}',
    '.pfx-voice.speaking{background:rgba(255,122,69,.16);border-color:rgba(255,140,92,.6);color:#fff}',
    '.pfx-voice.speaking i{animation:pfxEq .9s ease-in-out infinite}',
    '@keyframes pfxEq{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.5)}}',
    '@media(max-width:620px){.pfx-voice span{display:none}.pfx-voice{padding:10px;border-radius:50%}}'
  ].join("");

  function ensureStyle() {
    if (document.getElementById("pfx-css")) return;
    var st = document.createElement("style");
    st.id = "pfx-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function theme(el) {
    var cs = getComputedStyle(document.documentElement);
    var a = (cs.getPropertyValue("--ac") || "").trim();
    var b = (cs.getPropertyValue("--ac2") || "").trim();
    // 首页的区县卡片带着自己的 --ec，点击时就地取色
    if (el) {
      var cur = getComputedStyle(el);
      var ec = (cur.getPropertyValue("--ec") || "").trim();
      if (ec) { a = ec; b = ec; }
      var lac = (cur.getPropertyValue("--ac") || "").trim();
      if (lac) { a = lac; b = (cur.getPropertyValue("--ac2") || "").trim() || lac; }
    }
    if (!a) a = "#ff7a45";
    if (!b) b = a;
    var deco = document.querySelector(".bgdeco");
    var motif = deco ? (deco.getAttribute("data-t") || "") : "";
    if (!SIL[motif]) motif = "mountain";
    var h1 = document.querySelector("h1");
    var nm = h1 ? h1.textContent.trim() : "";
    if (!nm) {
      var br = document.querySelector(".brand");
      nm = br ? br.textContent.replace(/^[\u2039\u203a\s]+/, "").trim() : "";
      if (nm === "山城重庆") nm = "";
    }
    return { a: a, b: b, motif: motif, name: nm };
  }

  function build(t) {
    ensureStyle();
    var el = document.createElement("div");
    el.className = "pfx";
    el.style.setProperty("--pfx-a", t.a);
    el.style.setProperty("--pfx-b", t.b);
    el.innerHTML =
      '<div class="pfx-in"></div>' +
      '<svg class="pfx-sil" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true"><path d="' + SIL[t.motif] + '"/></svg>' +
      (t.name ? '<div class="pfx-name">' + t.name.replace(/[<>&]/g, "") + "</div>" : "");
    document.body.appendChild(el);
    return el;
  }

  var busy = false;

  function enter() {
    var el = build(theme());
    el.classList.add("cover");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.add("out");
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 780);
      });
    });
  }

  function exit(href, fromEl) {
    if (busy) return;
    busy = true;
    var el = build(theme(fromEl));
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.add("cover");
        setTimeout(function () { location.href = href; }, 600);
      });
    });
    setTimeout(function () { location.href = href; }, 1500);
  }

  function targetOf(a) {
    if (!a || !a.href) return null;
    if (a.target && a.target !== "_self") return null;
    if (a.hasAttribute("download")) return null;
    var raw = a.getAttribute("href");
    if (!raw || raw.charAt(0) === "#") return null;
    if (/^(mailto:|tel:|javascript:|data:)/i.test(raw)) return null;
    var url;
    try { url = new URL(raw, location.href); } catch (e) { return null; }
    if (url.origin !== location.origin) return null;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return null;
    return url.href;
  }

  /* ---------- 滚动进度条 ---------- */
  function mountBar() {
    ensureStyle();
    var bar = document.createElement("i");
    bar.className = "pfx-bar";
    document.body.appendChild(bar);
    var tick = false;
    function upd() {
      tick = false;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, (window.pageYOffset || document.documentElement.scrollTop) / h)) : 0;
      bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
      bar.style.opacity = p > 0.002 ? "1" : "0";
    }
    window.addEventListener("scroll", function () {
      if (!tick) { tick = true; requestAnimationFrame(upd); }
    }, { passive: true });
    window.addEventListener("resize", upd);
    upd();
  }

  /* ---------- 首屏视差 ---------- */
  function mountParallax() {
    var imgs = [].slice.call(document.querySelectorAll(".hero img"));
    if (!imgs.length) return;
    var tick = false;
    function upd() {
      tick = false;
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (y > 900) return;
      var k = Math.min(1, y / 700);
      for (var i = 0; i < imgs.length; i++) {
        imgs[i].style.transform = "translate3d(0," + (y * 0.16).toFixed(1) + "px,0) scale(" + (1.03 + k * 0.05).toFixed(3) + ")";
      }
    }
    window.addEventListener("scroll", function () {
      if (!tick) { tick = true; requestAnimationFrame(upd); }
    }, { passive: true });
  }

  /* ---------- 排版修正层 ---------- */
  function typoPass() {
    var p = location.pathname;
    if (/\/(index\.html)?$/.test(p)) return;                 // 首页不介入
    if (document.documentElement.classList.contains('pfx-typo')) return;
    document.documentElement.classList.add('pfx-typo');
  }

  /* ---------- 语音朗读（合成音） ---------- */
  function voicePass() {
    if (!("speechSynthesis" in window)) return;
    var p = location.pathname;
    if (/\/(index\.html)?$/.test(p)) return;

    var text = "";
    var hero = document.querySelector(".hero .note");
    var slogan = document.querySelector(".hero .slogan");
    var prose = document.querySelector(".prose");
    if (hero) text = (slogan ? slogan.textContent.trim() + "。" : "") + hero.textContent.trim();
    else if (prose) text = prose.textContent.trim().replace(/\s+/g, " ");
    if (!text || text.length < 18) return;
    text = text.slice(0, 260);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pfx-voice";
    btn.title = "浏览器语音合成，音色由系统决定";
    btn.innerHTML = '<i>▶</i><span>朗读简介</span>';
    btn.setAttribute("aria-label", "朗读本页简介（语音合成）");

    var speaking = false;
    function stop() {
      speaking = false;
      try { window.speechSynthesis.cancel(); } catch (e) { }
      btn.classList.remove("speaking");
      btn.querySelector("i").textContent = "▶";
      btn.querySelector("span").textContent = "朗读简介";
    }
    btn.addEventListener("click", function () {
      if (speaking) { stop(); return; }
      try {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = "zh-CN";
        u.rate = 0.95;
        u.pitch = 1;
        u.onend = stop;
        u.onerror = stop;
        speaking = true;
        btn.classList.add("speaking");
        btn.querySelector("i").textContent = "■";
        btn.querySelector("span").textContent = "停止朗读";
        window.speechSynthesis.speak(u);
      } catch (e) { stop(); }
    });
    document.body.appendChild(btn);
    window.addEventListener("pagehide", stop);
  }

  /* ---------- 版式编排 ---------- */
  function choreograph() {
    var p = location.pathname;
    var isDistrict = /\/districts\/[a-z]+\.html$/.test(p);
    var isSub = /\/districts\/pages\//.test(p) || /\/culture\/c\d+\.html$/.test(p);

    if (isDistrict) {
      var items = ['.hero .tag', '.hero h1', '.hero .slogan', '.hero .note'];
      var d = 60;
      for (var i = 0; i < items.length; i++) {
        var el = document.querySelector(items[i]);
        if (!el) continue;
        el.classList.add('pfx-rise');
        el.style.setProperty('--d', d + 'ms');
        d += 95;
      }
      var grid = document.querySelector('.stats .grid');
      if (grid) {
        grid.classList.add('pfx-rise');
        grid.style.setProperty('--d', (d + 70) + 'ms');
      }
      // 兜底：动画没跑起来时不能让首屏一直透明
      setTimeout(function () {
        [].slice.call(document.querySelectorAll('.pfx-rise')).forEach(function (el) {
          if (parseFloat(getComputedStyle(el).opacity) < .5) el.classList.remove('pfx-rise');
        });
      }, 3200);
      return;
    }

    if (!isSub) return;
    var blocks = [].slice.call(document.querySelectorAll('.sec, .pager, .foot'));
    if (!blocks.length) return;
    blocks.forEach(function (b) { b.classList.add('pfx-io'); });

    var ticking = false;
    function scan() {
      ticking = false;
      var line = window.innerHeight * 0.88;
      for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        if (b.classList.contains('pfx-show')) continue;
        var top = b.getBoundingClientRect().top;
        if (top < line) b.classList.add('pfx-show');
      }
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(scan);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    scan();
  }

  /* ---------- 启动 ---------- */
  function boot() {
    mountBar();
    if (REDUCE) return;          // 减弱动效：只保留进度条
    mountParallax();

    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      var href = targetOf(a);
      if (!href) return;
      e.preventDefault();
      exit(href, a);
    }, true);

    var OUT_ONLY = (document.documentElement.getAttribute("data-pfx") || "") === "out";
    window.addEventListener("pageshow", function (ev) {
      if (!ev.persisted && !OUT_ONLY) enter();
    });
    if (!OUT_ONLY) enter();
    typoPass();
    voicePass();
    choreograph();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();

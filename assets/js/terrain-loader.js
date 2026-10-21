/* =========================================================
   terrain-loader.js · 地形数据惰性加载
   dem-data.js(1.1MB) + dem-sat.js(1.3MB) 是首屏最大头，
   滚动接近地形区（或点导航「地形」）时才加载，加载完再初始化地形。
   ========================================================= */
(function () {
  "use strict";
  var fired = false;

  function load(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  function fire() {
    if (fired) return;
    fired = true;
    load("assets/js/dem-data.js")
      .then(function () { return load("assets/js/dem-sat.js"); })
      .then(function () {
        if (window.__startTerrain) window.__startTerrain();
      })
      .catch(function (e) {
        console.warn("[terrain] 数据加载失败", e);
      });
  }

  function arm() {
    var el = document.getElementById("terrain");
    if (!el) { return; }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        for (var i = 0; i < es.length; i++) {
          if (es[i].isIntersecting) { io.disconnect(); fire(); return; }
        }
      }, { rootMargin: "900px 0px" });
      io.observe(el);
    } else {
      setTimeout(fire, 1500);
    }

    // 点导航或按钮跳到地形时立刻加载
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest('a[href="#terrain"]') : null;
      if (a) fire();
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arm, { once: true });
  } else { arm(); }
})();

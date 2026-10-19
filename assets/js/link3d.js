/* =========================================================
   地形 ↔ 三维 联动
   地形上点中区县 → 自动切到对应三维地标 + 底部提示条。
   ========================================================= */
(function () {
  "use strict";

  var MAP = {
    "渝中区": { k: "hongyadong", n: "洪崖洞" },
    "江北区": { k: "theatre",   n: "重庆大剧院" },
    "南岸区": { k: "suodao",    n: "长江索道" },
    "大足区": { k: "dazu",      n: "大足石刻" },
    "武隆区": { k: "tiankeng",  n: "天生三桥" },
    "奉节县": { k: "kuimen",    n: "夔门" },
    "石柱县": { k: "diaojiao",  n: "土家吊脚楼" },
    "酉阳县": { k: "diaojiao",  n: "土家吊脚楼" },
    "秀山县": { k: "diaojiao",  n: "土家吊脚楼" },
    "彭水县": { k: "diaojiao",  n: "土家吊脚楼" }
  };

  var box = null, hideTimer = null;

  function ensure() {
    if (box) return box;
    box = document.createElement("div");
    box.className = "l3d-toast";
    document.body.appendChild(box);
    return box;
  }

  function hide() {
    if (box) box.classList.remove("show");
  }

  function show(name, lm) {
    var el = ensure();
    el.innerHTML = '<i>地形联动</i><b>' + name + '</b><span>对应地标 · ' + lm + '</span>' +
                   '<button type="button">去看三维 ›</button>';
    el.querySelector("button").addEventListener("click", function () {
      var sec = document.getElementById("model3d");
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      hide();
    });
    el.classList.add("show");
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 7000);
  }

  document.addEventListener("chq:district", function (ev) {
    var d = (ev && ev.detail) || {};
    var m = MAP[d.name];
    if (!m || !window.Landmark3D) return;
    try {
      window.Landmark3D.switchTo(m.k);
    } catch (e) {
      return;
    }
    show(d.name, m.n);
  });
})();

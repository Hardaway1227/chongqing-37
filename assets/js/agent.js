/* =========================================================
   agent.js · 站内向导（本地意图识别 + 工具调用 + 过程可解释）
   设计要点：
     · 感知：从自然语言里抽槽位（天数 / 偏好 / 区域 / 区县名 / 地标名）
     · 决策：按槽位选择工具
     · 执行：调用站内既有能力（行程排序、模型切换、数据页、区县页）
     · 解释：每条回答都列出「调用了什么工具、依据哪条数据」
   不联网、不编数据；接入大模型是可选增强（window.CHQ_LLM）
   ========================================================= */
(function () {
  "use strict";

  var D = (window.CHQ && window.CHQ.DISTRICTS) || [];
  var DEEP = window.DEEP || {};
  if (!D.length) return;

  /* ---------- 知识 ---------- */
  var PREF = {
    "石刻": ["石刻", "佛像", "石窟", "大足"],
    "峡谷": ["峡谷", "天坑", "地缝", "喀斯特", "三桥"],
    "古镇": ["古镇", "老街", "码头", "吊脚楼"],
    "夜景": ["夜景", "灯火", "洪崖洞", "江景"],
    "温泉": ["温泉", "泡汤"],
    "红色": ["红色", "革命", "抗战", "遗址"],
    "山水": ["山", "湖", "森林", "草原"]
  };
  var REGION = { "主城": "主城", "渝东北": "渝东北", "渝东南": "渝东南", "新区": "新区" };
  var LANDMARK = {
    "洪崖洞": "hongyadong", "解放碑": "siyuan", "吊脚楼": "diaojiao", "大足石刻": "dazu",
    "索道": "suodao", "大礼堂": "litang", "大剧院": "theatre", "天坑": "tiankeng", "夔门": "kuimen",
    "天生三桥": "tiankeng"
  };

  var trace = [];

  /* DEEP 只在部分页面加载，缺省时用 data.js 的介绍与标签兜底 */
  function deepOf(n) {
    if (DEEP[n]) return DEEP[n];
    var d = null;
    for (var i = 0; i < D.length; i++) if (D[i].n === n) { d = D[i]; break; }
    if (!d) return { slogan: "", note: "", spots: [] };
    return { slogan: "", note: d.d || "", spots: [], tags: d.t || [] };
  }
  function textOf(d) {
    var deep = deepOf(d.n);
    return ((deep.slogan || "") + (deep.note || "") + (deep.tags || []).join("") +
      (deep.spots || []).map(function (s) { return s.t + (s.d || ""); }).join("")).toLowerCase();
  }

  /* ---------- 工具 ---------- */
  function toolPick(prefs, region, days) {
    trace.push("tool: pickDistricts");
    var scored = D.map(function (d) {
      var text = textOf(d), score = 0;
      prefs.forEach(function (p) {
        (PREF[p] || []).forEach(function (kw) { if (text.indexOf(kw) >= 0) score += 1; });
      });
      if (region && d.c === region) score += 2.5;
      if (!prefs.length && !region && d.n === "渝中区") score += 2;
      return { d: d, score: score };
    }).sort(function (a, b) { return b.score - a.score; });

    var n = Math.max(2, Math.min(5, (days || 2) + 1));
    var hit = scored.filter(function (x) { return x.score > 0; });
    if (!hit.length) hit = scored;                 // 没命中就用默认排序（主城优先）
    return hit.slice(0, n);
  }

  function toolPlan(picks) {
    trace.push("tool: planRoute");
    var pts = picks.map(function (p) { return p.d; });
    function rad(x) { return x * Math.PI / 180; }
    function km(a, b) {
      var dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
      var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      return 2 * 6371 * Math.asin(Math.sqrt(h)) * 1.32;
    }
    var rest = pts.slice(1), route = [pts[0]];
    while (rest.length) {
      var last = route[route.length - 1], bi = 0, bd = Infinity;
      for (var i = 0; i < rest.length; i++) { var d = km(last, rest[i]); if (d < bd) { bd = d; bi = i; } }
      route.push(rest.splice(bi, 1)[0]);
    }
    var total = 0;
    for (var j = 1; j < route.length; j++) total += km(route[j - 1], route[j]);
    return { route: route, km: Math.round(total), h: (total / 52) };
  }

  function toolGoto(url) {
    trace.push("tool: openPage(" + url + ")");
    return url;
  }

  /* ---------- 解析 ---------- */
  function parse(q) {
    var slots = { days: 0, prefs: [], region: "", districts: [], landmark: "" };
    var m = q.match(/([一二三四五1-5])\s*天/);
    if (m) {
      var map = { "一": 1, "二": 2, "三": 3, "四": 4, "五": 5 };
      slots.days = map[m[1]] || parseInt(m[1], 10) || 0;
    }
    Object.keys(PREF).forEach(function (p) {
      PREF[p].forEach(function (kw) { if (q.indexOf(kw) >= 0 && slots.prefs.indexOf(p) < 0) slots.prefs.push(p); });
    });
    Object.keys(REGION).forEach(function (r) { if (q.indexOf(r) >= 0) slots.region = REGION[r]; });
    D.forEach(function (d) { if (q.indexOf(d.n) >= 0) slots.districts.push(d.n); });
    Object.keys(LANDMARK).forEach(function (k) { if (q.indexOf(k) >= 0) slots.landmark = LANDMARK[k]; });
    return slots;
  }

  /* ---------- 回答 ---------- */
  function answer(q) {
    trace = [];
    var s = parse(q);
    q = q.trim();
    if (!q) return null;

    // 1) 指定地标 → 切 3D
    if (s.landmark && window.Landmark3D) {
      try { window.Landmark3D.switchTo(s.landmark); } catch (e) { }
      var sec = document.getElementById("model3d");
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      trace.push("tool: switchModel(" + s.landmark + ")");
      return {
        text: "已经把「三维地标」切到对应模型并滚过去了。想看细节可以拖拽旋转，右下角有关节点开关。",
        actions: [{ label: "看三维 →", href: "#model3d" }]
      };
    }

    // 2) 指定单个区县 → 给档案入口
    if (s.districts.length === 1 && !s.days) {
      var d = s.districts[0], deep = deepOf(d);
      var url = window.districtURL ? window.districtURL(d) : null;
      trace.push("tool: lookupDistrict(" + d + ")");
      return {
        text: d + "：" + (deep.slogan || "") + "。" + (deep.note || "") +
          ((deep.spots || []).length ? " 看点有 " + deep.spots.slice(0, 3).map(function (x) { return x.t; }).join("、") + "。" : ""),
        actions: url ? [{ label: "进 " + d + " 主页 →", href: url }] : []
      };
    }

    // 3) 行程规划
    if (s.days || s.prefs.length || s.region) {
      var picks = toolPick(s.prefs, s.region, s.days || 2);
      if (!picks.length) {
        return { text: "这个组合我没找到合适的区县，换个说法试试，比如「三天 想看石刻和峡谷」。" };
      }
      var plan = toolPlan(picks);
      try {
        localStorage.setItem("chq.plan.pick", JSON.stringify(plan.route.map(function (d) { return d.n; })));
      } catch (e) { }
      var names = plan.route.map(function (d) { return d.n; });
      return {
        text: "按「" + (s.prefs.length ? s.prefs.join("、") : (s.region || "综合")) + "」挑出 " + names.length +
          " 个区县，按距离排成一条线：\n" + names.join(" → ") +
          "\n全程约 " + plan.km + " km，纯车程约 " + Math.floor(plan.h) + " 小时 " + Math.round((plan.h % 1) * 60) + " 分。",
        actions: [{ label: "打开行程页（已预选）→", href: "plan.html" }]
      };
    }

    // 4) 数据类
    if (/海拔|最高|最低|对比|排行|数据/.test(q)) {
      trace.push("tool: openPage(data.html)");
      return {
        text: "站内有一页专门的对比：38 个区县的平均海拔、地势起伏、收录词条可以切换排序。海拔最高的是城口县，起伏最大的是巫山县。",
        actions: [{ label: "打开数据对比 →", href: "data.html" }]
      };
    }

    // 5) 知识兜底：按关键词找区县
    var kw = q.replace(/[，。？！,.?!\s]/g, "");
    var hit = null;
    D.forEach(function (d) {
      if (hit) return;
      var deep = DEEP[d.n] || {};
      var text = (deep.slogan || "") + (deep.note || "");
      if (kw.length >= 2 && text.indexOf(kw.slice(0, 2)) >= 0) hit = d;
    });
    if (hit) {
      var dd = deepOf(hit.n);
      trace.push("tool: lookupDistrict(" + hit.n + ")");
      return {
        text: hit.n + "：" + (dd.slogan || "") + "。" + (dd.note || ""),
        actions: window.districtURL ? [{ label: "进 " + hit.n + " 主页 →", href: window.districtURL(hit.n) }] : []
      };
    }

    return {
      text: "我可以做三件事：① 按天数/偏好排路线（例：三天 想看石刻）② 介绍某个区县 ③ 切到某座三维地标。也可以直接问我「最高海拔」这类数据。",
      actions: [{ label: "打开行程规划 →", href: "plan.html" }, { label: "数据对比 →", href: "data.html" }]
    };
  }

  /* ---------- UI ---------- */
  var css = [
    '.ag-btn{position:fixed;right:20px;bottom:20px;z-index:80;display:flex;align-items:center;gap:8px;',
    'padding:11px 16px;border-radius:99px;border:1px solid rgba(255,140,92,.45);cursor:pointer;font:inherit;font-size:13px;',
    'color:#fff;background:linear-gradient(135deg,#ff7a45,#ff5a2c);box-shadow:0 12px 30px rgba(255,90,44,.35);transition:.22s}',
    '.ag-btn:hover{transform:translateY(-2px)}',
    '.ag-panel{position:fixed;right:20px;bottom:76px;z-index:81;width:min(380px,calc(100vw - 40px));max-height:min(560px,70vh);',
    'display:none;flex-direction:column;border-radius:18px;overflow:hidden;background:rgba(9,13,20,.96);',
    'border:1px solid rgba(120,160,210,.28);box-shadow:0 24px 60px rgba(0,0,0,.6);backdrop-filter:blur(14px)}',
    '.ag-panel.open{display:flex}',
    '.ag-hd{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.08)}',
    '.ag-hd b{font-size:13px;letter-spacing:.1em;color:#eaf0f8}',
    '.ag-hd em{font-style:normal;font-size:10px;color:#7d8798;margin-left:8px}',
    '.ag-x{background:none;border:0;color:#7d8798;font-size:18px;cursor:pointer;line-height:1;padding:0 4px}',
    '.ag-body{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:12px}',
    '.ag-msg{max-width:88%;padding:9px 12px;border-radius:12px;font-size:13px;line-height:1.65;white-space:pre-wrap}',
    '.ag-me{align-self:flex-end;background:rgba(255,122,69,.16);border:1px solid rgba(255,122,69,.32);color:#ffe4d6}',
    '.ag-it{align-self:flex-start;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);color:#dfe9f5}',
    '.ag-tr{align-self:flex-start;font-size:10px;color:#5f7286;letter-spacing:.02em;margin:-6px 0 0 4px}',
    '.ag-acts{display:flex;flex-wrap:wrap;gap:7px;align-self:flex-start}',
    '.ag-act{font-size:12px;padding:6px 12px;border-radius:99px;border:1px solid rgba(120,160,210,.3);',
    'color:#9fd0ff;background:rgba(90,168,255,.08);text-decoration:none}',
    '.ag-act:hover{background:rgba(90,168,255,.16)}',
    '.ag-ft{display:flex;gap:8px;padding:11px 14px;border-top:1px solid rgba(255,255,255,.08)}',
    '.ag-in{flex:1;padding:9px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.12);',
    'background:rgba(255,255,255,.04);color:#eaf0f8;font:inherit;font-size:13px;outline:none}',
    '.ag-in:focus{border-color:rgba(255,140,92,.55)}',
    '.ag-go{padding:9px 15px;border-radius:10px;border:0;cursor:pointer;font:inherit;font-size:13px;font-weight:600;',
    'color:#fff;background:linear-gradient(135deg,#ff7a45,#ff5a2c)}',
    '.ag-chips{display:flex;gap:6px;flex-wrap:wrap;padding:0 14px 12px}',
    '.ag-chip{font-size:11.5px;padding:5px 10px;border-radius:99px;cursor:pointer;color:#aeb9c9;',
    'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1)}',
    '.ag-chip:hover{border-color:rgba(255,140,92,.5);color:#fff}'
  ].join("");

  function mount() {
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ag-btn";
    btn.innerHTML = "向导";
    btn.setAttribute("aria-label", "打开站内向导");

    var panel = document.createElement("div");
    panel.className = "ag-panel";
    panel.innerHTML =
      '<div class="ag-hd"><div><b>山城向导</b><em>站内知识 · 不联网</em></div><button class="ag-x" type="button" aria-label="关闭">×</button></div>' +
      '<div class="ag-body" id="agBody"></div>' +
      '<div class="ag-chips">' +
      '<span class="ag-chip">三天 想看石刻和峡谷</span>' +
      '<span class="ag-chip">渝东南有什么</span>' +
      '<span class="ag-chip">海拔最高的区县</span>' +
      '<span class="ag-chip">看看洪崖洞的三维</span>' +
      '</div>' +
      '<div class="ag-ft"><input class="ag-in" id="agIn" placeholder="说说你想怎么玩…" aria-label="输入问题"><button class="ag-go" type="button" id="agGo">发送</button></div>';

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    var body = panel.querySelector("#agBody");
    var input = panel.querySelector("#agIn");

    function push(cls, txt) {
      var el = document.createElement("div");
      el.className = "ag-msg " + cls;
      el.textContent = txt;
      body.appendChild(el);
      body.scrollTop = body.scrollHeight;
      return el;
    }
    function pushActions(acts) {
      if (!acts || !acts.length) return;
      var box = document.createElement("div");
      box.className = "ag-acts";
      acts.forEach(function (a) {
        var el = document.createElement("a");
        el.className = "ag-act";
        el.href = a.href;
        el.textContent = a.label;
        box.appendChild(el);
      });
      body.appendChild(box);
      body.scrollTop = body.scrollHeight;
    }
    function pushTrace() {
      if (!trace.length) return;
      var el = document.createElement("div");
      el.className = "ag-tr";
      el.textContent = "↳ " + trace.join(" · ");
      body.appendChild(el);
      body.scrollTop = body.scrollHeight;
    }

    function ask(q) {
      if (!q || !q.trim()) return;
      push("ag-me", q);
      input.value = "";
      var r = answer(q);
      if (!r) return;
      setTimeout(function () {
        push("ag-it", r.text);
        pushTrace();
        pushActions(r.actions);
      }, 160);
    }

    btn.addEventListener("click", function () {
      panel.classList.toggle("open");
      if (panel.classList.contains("open")) {
        if (!body.children.length) {
          push("ag-it", "我是站内向导。可以按天数/偏好排路线，也能介绍区县、切三维地标、查数据。全部基于站内内容，不联网。");
        }
        input.focus();
      }
    });
    panel.querySelector(".ag-x").addEventListener("click", function () { panel.classList.remove("open"); });
    panel.querySelector("#agGo").addEventListener("click", function () { ask(input.value); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") ask(input.value); });
    panel.querySelectorAll(".ag-chip").forEach(function (c) {
      c.addEventListener("click", function () { ask(c.textContent); });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();

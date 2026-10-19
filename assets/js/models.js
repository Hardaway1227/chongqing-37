/* ==========================================================
   models.js — 外部 3D 模型接入
   三通道：① 拖拽/选择 .glb（file:// 也能用） ② 在线 URL ③ 本地清单
   归一化后交给 Landmark3D.injectExternal 展示
   ========================================================== */
window.ModelHub = (function () {
  let loader = null, mixer = null, clock = null;
  let curAnim = null;

  const $ = s => document.querySelector(s);
  const status = (msg, kind) => {
    const el = $("#mhStatus");
    if (!el) return;
    el.textContent = msg;
    el.className = "mh-status " + (kind || "");
  };

  /* ---------- Poly Haven 贴图路径修正 ----------
     gltf 内引用 textures/xxx_1k.jpg，但 CDN 上该路径并不存在，
     真实地址是 Models/jpg/{res}/{slug}/xxx_1k.jpg（API 证实），
     用 LoadingManager 统一改写，避免 404 后模型变灰模。 */
  const PH_TEX = /(\/Models\/)gltf\/([^/]+\/[^/]+)\/textures\//;
  function phFix(url) {
    return typeof url === "string" ? url.replace(PH_TEX, "$1jpg/$2/") : url;
  }

  function ensureLoader() {
    if (loader) return loader;
    if (typeof THREE === "undefined" || !THREE.GLTFLoader) {
      status("GLTFLoader 未加载，无法读取外部模型", "bad");
      return null;
    }
    const manager = new THREE.LoadingManager();
    manager.setURLModifier(phFix);
    loader = new THREE.GLTFLoader(manager);
    return loader;
  }

  /* ---------- 材质规范化（r160 色彩空间 / 单面剔除） ---------- */
  function normalize(root) {
    root.traverse(o => {
      if (!o.isMesh) return;
      if (o.material) {
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
          ["map", "emissiveMap", "normalMap", "roughnessMap", "metalnessMap", "aoMap"].forEach(k => {
            if (m[k]) {
              if ("colorSpace" in m[k] && THREE.SRGBColorSpace) {
                if (k === "map" || k === "emissiveMap") m[k].colorSpace = THREE.SRGBColorSpace;
              } else if ("encoding" in m[k] && THREE.sRGBEncoding !== undefined) {
                if (k === "map" || k === "emissiveMap") m[k].encoding = THREE.sRGBEncoding;
              }
            }
          });
          m.needsUpdate = true;
        });
      }
    });
  }

  /* ---------- 统计信息 ---------- */
  function stats(root) {
    let tris = 0, meshes = 0, mats = new Set();
    root.traverse(o => {
      if (!o.isMesh) return;
      meshes++;
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m.uuid));
      const g = o.geometry;
      if (g) {
        if (g.index) tris += g.index.count / 3;
        else if (g.attributes.position) tris += g.attributes.position.count / 3;
      }
    });
    return { tris: Math.round(tris), meshes, mats: mats.size };
  }

  /* ---------- 装载到舞台 ---------- */
  function mount(gltf, info) {
    const root = gltf.scene || gltf.scenes[0];
    if (!root) { status("模型里没有可用场景", "bad"); return; }
    normalize(root);

    const st = stats(root);
    const facts = Object.assign({
      "三角面": st.tris.toLocaleString(),
      "网格数": st.meshes + " 个",
      "材质": st.mats + " 种"
    }, info.facts || {});
    if (gltf.animations && gltf.animations.length) facts["动画"] = gltf.animations.length + " 段";

    // 动画
    if (mixer) { mixer.stopAllAction(); mixer = null; curAnim = null; }
    if (gltf.animations && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(root);
      gltf.animations.forEach(a => mixer.clipAction(a).play());
      clock = clock || new THREE.Clock();
      curAnim = root;
      startTick();
    }

    window.Landmark3D.injectExternal(root, {
      name: info.name, meta: info.meta, desc: info.desc, facts
    });
    status("已载入：" + info.name + "（" + st.tris.toLocaleString() + " 面）", "ok");
  }

  let tickRunning = false;
  function tick() {
    if (!tickRunning) return;
    requestAnimationFrame(tick);
    if (!mixer) { tickRunning = false; return; }
    mixer.update(clock.getDelta());
  }
  function startTick() {
    if (tickRunning || !mixer) return;
    tickRunning = true;
    tick();
  }
  function stopTick() { tickRunning = false; }

  /* ---------- ① 文件（拖拽 / 选择） ---------- */
  function loadFile(file) {
    const L = ensureLoader(); if (!L) return;
    const name = file.name.replace(/\.[^.]+$/, "");
    const mb = (file.size / 1048576).toFixed(1);
    if (!/\.(glb|gltf)$/i.test(file.name)) {
      status("只支持 .glb / .gltf，收到的是 " + file.name.split(".").pop(), "bad");
      return;
    }
    status("读取 " + file.name + "（" + mb + " MB）…", "");
    const fr = new FileReader();
    fr.onload = () => {
      try {
        L.parse(fr.result, "", gltf => {
          mount(gltf, {
            name: name,
            meta: ["本地文件", mb + " MB", "GLB"],
            desc: "从本地载入的模型。拖动舞台可旋转、滚轮缩放；勾选自动旋转可持续巡航。",
            facts: { "文件": file.name, "大小": mb + " MB" }
          });
        }, err => { status("解析失败：" + (err && err.message ? err.message : err), "bad"); console.error(err); });
      } catch (e) { status("解析异常：" + e.message, "bad"); }
    };
    fr.onerror = () => status("文件读取失败", "bad");
    fr.readAsArrayBuffer(file);
  }

  /* ---------- ② 在线 URL ---------- */
  function loadURL(url) {
    const L = ensureLoader(); if (!L) return;
    if (!/^https?:\/\//i.test(url)) { status("请填 http(s) 开头的直链", "bad"); return; }
    const name = decodeURIComponent(url.split("/").pop() || "在线模型").replace(/\.[^.]+$/, "");
    status("下载中…（需对方允许跨域 CORS）", "");
    L.load(url, gltf => {
      mount(gltf, {
        name: name, meta: ["在线加载", "GLB", "需 CORS"],
        desc: "从网络直链载入的模型。链接失效或对方未开放 CORS 时会加载失败。",
        facts: { "来源": url.length > 46 ? url.slice(0, 46) + "…" : url }
      });
    }, p => {
      if (p.total) status("下载 " + Math.round(p.loaded / p.total * 100) + "%", "");
    }, err => {
      status("加载失败：链接失效，或对方服务器未开放跨域（CORS）。可先把 .glb 下载到本机，用上方「选择 .glb 文件」载入", "bad");
      console.error(err);
    });
  }

  /* ---------- ③ 本地清单 或 在线直链（在线项任何打开方式都能用） ---------- */
  function loadFromManifest(item) {
    const L = ensureLoader(); if (!L) return;
    const src = item.url || ("assets/models/" + item.file);
    status("载入 " + item.name + " …", "");
    L.load(src, gltf => {
      mount(gltf, item);
    }, p => { if (p.total) status("载入 " + Math.round(p.loaded / p.total * 100) + "%", ""); },
      err => {
        status(item.url
          ? "在线模型加载失败：链接失效或被跨域拦截"
          : "读不到 assets/models/" + item.file + "——清单里的本地模型需要用本地服务器打开（不能直接双击 html）", "bad");
        console.error(err);
      });
  }

  function renderList() {
    const box = $("#mhList");
    if (!box) return;
    const list = (window.CHQ_EXT_MODELS || []);
    if (!list.length) {
      box.innerHTML = `<p class="mh-empty">本地模型库是空的。从下面任一站点下载 <code>.glb</code> 后，
        直接拖到左边舞台即可预览；想长期保留就把文件放进 <code>assets/models/</code>
        并在 <code>assets/models/manifest.js</code> 里加一条。</p>`;
      return;
    }
    box.innerHTML = list.map((m, i) =>
      `<button class="mh-item" data-i="${i}">
         <span class="mh-i-n">${m.name}${m.url ? '<em class="mh-i-url">在线</em>' : ""}</span>
         <span class="mh-i-t">${(m.meta || []).join(" · ")}</span>
       </button>`).join("");
    box.querySelectorAll(".mh-item").forEach(b =>
      b.addEventListener("click", () => loadFromManifest(list[+b.dataset.i])));
  }

  /* ---------- 站点清单 ---------- */
  function renderSites() {
    const box = $("#mhSites");
    if (!box) return;
    const list = window.CHQ_MODEL_SITES || [];
    box.innerHTML = list.map(s => {
      const need = s.login !== "不需要";
      return `<div class="mh-site${need ? " need" : ""}">
        <div class="mh-s-top">
          <a class="mh-s-n" href="${s.url}" target="_blank" rel="noopener">${s.name}</a>
          <span class="mh-s-tag">${s.tag}</span>
        </div>
        <div class="mh-s-row"><b>登录</b><span>${s.login}${s.loginNote ? "（" + s.loginNote + "）" : ""}</span></div>
        <div class="mh-s-row"><b>授权</b><span>${s.license}</span></div>
        <div class="mh-s-row"><b>格式</b><span>${s.format}</span></div>
        <p class="mh-s-note">${s.note}</p>
      </div>`;
    }).join("");
  }

  /* ---------- 绑定 ---------- */
  function init() {
    const stage = $("#mdStage");
    const panel = $("#mhDrop");
    if (!stage) return;

    // 骨骼动画循环随舞台可见性启停
    if (window.CHQ_PERF && window.CHQ_PERF.onVisible) {
      window.CHQ_PERF.onVisible(document.getElementById("model3d") || stage, startTick, stopTick);
    }

    renderList();
    renderSites();

    // 文件选择
    const pick = $("#mhPick");
    const input = $("#mhFile");
    if (pick && input) {
      pick.addEventListener("click", () => input.click());
      input.addEventListener("change", () => {
        if (input.files && input.files[0]) loadFile(input.files[0]);
        input.value = "";
      });
    }

    // URL
    const goUrl = $("#mhGo");
    const urlIn = $("#mhUrl");
    if (goUrl && urlIn) {
      goUrl.addEventListener("click", () => loadURL(urlIn.value.trim()));
      urlIn.addEventListener("keydown", e => { if (e.key === "Enter") loadURL(urlIn.value.trim()); });
    }

    // 拖放
    let depth = 0;
    const onOver = e => { e.preventDefault(); e.stopPropagation(); if (!depth) stage.classList.add("dropping"); depth++; };
    const onLeave = e => { e.preventDefault(); depth = Math.max(0, depth - 1); if (!depth) stage.classList.remove("dropping"); };
    const onDrop = e => {
      e.preventDefault(); e.stopPropagation();
      depth = 0; stage.classList.remove("dropping");
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) loadFile(f);
    };
    stage.addEventListener("dragenter", onOver);
    stage.addEventListener("dragover", onOver);
    stage.addEventListener("dragleave", onLeave);
    stage.addEventListener("drop", onDrop);
    if (panel) {
      panel.addEventListener("dragenter", onOver);
      panel.addEventListener("dragover", onOver);
      panel.addEventListener("dragleave", onLeave);
      panel.addEventListener("drop", onDrop);
    }
    // 阻止浏览器默认打开文件
    ["dragover", "drop"].forEach(ev =>
      window.addEventListener(ev, e => { if (e.target !== urlIn) e.preventDefault(); }));
  }

  return { init, loadFile, loadURL };
})();

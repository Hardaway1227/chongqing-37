/* ==========================================================
   terrain.js — 重庆三维地形（Three.js）
   高度场 = 真实 SRTM/ALOS DEM（dem-data.js，1024²）优先，
   加载失败时回退到 高程控制点 IDW + 分形噪声 的程序化地形
   贴图 = 运行时从 DEM 计算 hillshade + 分层设色（含卫星影像模式）
   ========================================================== */
window.Terrain = (function () {
  const B = window.CHQ.BOUND;
  let GW = 1024, GH = 1024;            // 几何网格分辨率（真实 DEM；低端机由 perf.js 降半）
  const W = 100;                          // 世界宽度
  const D = 96;                           // 世界纵深（按纬度修正）
  const VS = 11;                          // 垂直夸张倍率（真实 DEM 峡谷陡峭，适度夸张）
  const BASE_Y = -1.6;                    // 底座高度

  // 真实 DEM 运行时状态
  let DEM = null;            // { elev, mask, n } 解码后的原始数据
  let HG = null;             // 高度网格（DEM 或程序化回退），供采样与贴图
  let texCache = {};         // mode -> THREE.CanvasTexture
  let satImg = null;         // 卫星影像 Image

  // 经纬度 -> 归一化
  const nx = lon => (lon - B.lon0) / (B.lon1 - B.lon0);
  const ny = lat => (lat - B.lat0) / (B.lat1 - B.lat0);
  // 归一化 -> 世界
  const wx = u => (u - 0.5) * W;
  const wz = v => -(v - 0.5) * D;
  // 世界/归一化 -> 经纬度（反向）
  const lonOf = u => B.lon0 + u * (B.lon1 - B.lon0);
  const latOf = v => B.lat0 + v * (B.lat1 - B.lat0);
  // 海拔 -> 世界高度
  const wy = m => (m / 2797) * VS;

  /* ---------- 真实 DEM 解码与采样 ---------- */
  function decodeDEM() {
    return new Promise(resolve => {
      try {
        const img = new Image();
        img.onload = () => {
          try {
            const n = img.width;
            const cv = document.createElement("canvas");
            cv.width = n; cv.height = n;
            const cx = cv.getContext("2d", { willReadFrequently: true });
            cx.drawImage(img, 0, 0);
            const px = cx.getImageData(0, 0, n, n).data;
            const step = (window.CHQ_DEM.meta && window.CHQ_DEM.meta.step) || 2;
            const elev = new Float32Array(n * n);
            const mask = new Uint8Array(n * n);
            for (let i = 0; i < n * n; i++) {
              elev[i] = (px[i * 4] * 256 + px[i * 4 + 1]) * step;
              mask[i] = px[i * 4 + 2] > 127 ? 1 : 0;
            }
            let mx = 0;
            for (let i = 0; i < n * n; i++) if (elev[i] > mx) mx = elev[i];
            console.log("[terrain] 真实 DEM 就绪 " + n + "x" + n + "，最高 " + Math.round(mx) + " m");
            resolve({ elev, mask, n });
          } catch (e) { console.warn("DEM 解码失败，回退程序化地形", e); resolve(null); }
        };
        img.onerror = () => { console.warn("DEM 加载失败，回退程序化地形"); resolve(null); };
        img.src = window.CHQ_DEM.png;
      } catch (e) { resolve(null); }
    });
  }

  // 双线性采样高度网格（u,v: 0..1，北在 v=1）
  function hgAt(u, v) {
    const n = HG.n;
    let fx = u * (n - 1), fy = (1 - v) * (n - 1);
    fx = fx < 0 ? 0 : fx > n - 1 ? n - 1 : fx;
    fy = fy < 0 ? 0 : fy > n - 1 ? n - 1 : fy;
    const x0 = fx | 0, y0 = fy | 0;
    const x1 = x0 + 1 < n ? x0 + 1 : x0, y1 = y0 + 1 < n ? y0 + 1 : y0;
    const tx = fx - x0, ty = fy - y0;
    const e = HG.elev;
    const a = e[y0 * n + x0], b = e[y0 * n + x1], c = e[y1 * n + x0], d = e[y1 * n + x1];
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
  }

  // 高度网格：真实 DEM 优先，否则由程序化高程采样生成
  function buildHeightGrid() {
    if (DEM) { HG = DEM; return; }
    const n = 1024;
    const e = new Float32Array(n * n), mk = new Uint8Array(n * n);
    for (let j = 0; j < n; j++) {
      const v = 1 - j / (n - 1);
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1);
        const ins = inPolyFast(u, v);
        mk[j * n + i] = ins ? 1 : 0;
        e[j * n + i] = ins ? elevProc(u, v) : 0;
      }
    }
    HG = { elev: e, mask: mk, n };
  }

  /* ---------- 噪声 ---------- */
  function hash(x, y) {
    let n = (x | 0) * 374761393 + (y | 0) * 668265263;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967295;
  }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  }
  function fbm(x, y, oct) {
    let s = 0, a = 0.5, f = 1, norm = 0;
    for (let i = 0; i < (oct || 5); i++) { s += a * vnoise(x * f, y * f); norm += a; f *= 2.03; a *= 0.5; }
    return s / norm;
  }

  /* ---------- 点是否在市域轮廓内 ---------- */
  const OUT = window.CHQ.OUTLINE.map(p => [nx(p[0]), ny(p[1])]);
  function polyTest(poly, px, py) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  function inPoly(px, py) { return polyTest(OUT, px, py); }

  // 精确轮廓有 600+ 点，百万级网格逐点判定太慢：
  // 运行时统一查 DEM 掩膜；程序化回退路径用抽稀轮廓
  const OUT_S = OUT.filter((_, i) => i % 12 === 0);
  function inPolyFast(px, py) { return polyTest(OUT_S, px, py); }

  function maskAt(u, v) {
    if (!HG) return inPoly(u, v);
    const n = HG.n;
    let i = Math.round(u * (n - 1)), j = Math.round((1 - v) * (n - 1));
    i = i < 0 ? 0 : i > n - 1 ? n - 1 : i;
    j = j < 0 ? 0 : j > n - 1 ? n - 1 : j;
    return HG.mask[j * n + i] === 1;
  }

  /* ---------- 点到线段距离 ---------- */
  function distSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = ax + t * dx, qy = ay + t * dy;
    return Math.hypot(px - qx, py - qy);
  }

  // 河流段（预归一化 + 包围盒，用于快速剔除）
  const RSEG = [];
  window.CHQ.RIVERS.forEach(r => {
    const p = r.path.map(q => [nx(q[0]), ny(q[1])]);
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1], rad = 0.030 * r.w;
      RSEG.push({
        a, b, w: r.w, rad,
        x0: Math.min(a[0], b[0]) - rad, x1: Math.max(a[0], b[0]) + rad,
        y0: Math.min(a[1], b[1]) - rad, y1: Math.max(a[1], b[1]) + rad
      });
    }
  });

  /* ---------- 程序化高程（DEM 不可用时的回退） ---------- */
  const PEAKS = window.CHQ.PEAKS.map(p => ({ u: nx(p[0]), v: ny(p[1]), e: p[2], r: p[3] / 5.0 }));
  function elevProc(u, v) {
    // 1. IDW
    let num = 0, den = 0;
    for (let i = 0; i < PEAKS.length; i++) {
      const p = PEAKS[i];
      const d2 = (u - p.u) * (u - p.u) + (v - p.v) * (v - p.v);
      const w = 1 / (d2 + p.r * p.r * 0.02);
      num += p.e * w; den += w;
    }
    let h = num / den;

    // 2. 分形细节（山区扰动更强）
    const rough = Math.min(1, h / 1600);
    h += (fbm(u * 15.5 + 3.1, v * 15.5 + 7.7, 5) - 0.5) * (170 + rough * 340);
    h += (fbm(u * 41 + 11.3, v * 41 + 2.9, 3) - 0.5) * (55 + rough * 90);

    // 3. 河流下切（先用包围盒剔除，避免逐段求距）
    let carve = 0;
    for (let i = 0; i < RSEG.length; i++) {
      const s = RSEG[i];
      if (u < s.x0 || u > s.x1 || v < s.y0 || v > s.y1) continue;
      const d = distSeg(u, v, s.a[0], s.a[1], s.b[0], s.b[1]);
      if (d < s.rad) {
        const t = 1 - d / s.rad;
        const target = 120 + 60 * s.w;         // 河面高度
        const c = t * t * (h - target);
        if (c > carve) carve = c;
      }
    }
    h -= carve;

    // 4. 中山带抬升（平行岭谷的条状感）
    h += Math.sin((u * 6.2 + v * 1.4) * 1.35) * 55 * (1 - Math.min(1, Math.abs(h - 700) / 900));

    return Math.max(75, Math.min(2850, h));
  }

  /* ---------- 权威掩膜采样（与贴图同源，消除条纹伪影） ---------- */
  function maskGrid(u, v) {
    if (!HG) return maskAt(u, v);
    const n = HG.n;
    const x = Math.max(0, Math.min(n - 1, Math.round(u * (n - 1))));
    const y = Math.max(0, Math.min(n - 1, Math.round((1 - v) * (n - 1))));
    return !!HG.mask[y * n + x];
  }

  /* ---------- 裙边掩膜：掩膜外扩 2 圈，用作沙盘基座侧壁 ---------- */
  let SKIRT = null;
  function buildSkirt() {
    if (!HG) return;
    const n = HG.n;
    let cur = HG.mask;
    for (let it = 0; it < 2; it++) {
      const nxt = new Uint8Array(n * n);
      for (let j = 0; j < n; j++) {
        const j0 = j > 0 ? j - 1 : 0, j1 = j < n - 1 ? j + 1 : n - 1;
        for (let i = 0; i < n; i++) {
          const i0 = i > 0 ? i - 1 : 0, i1 = i < n - 1 ? i + 1 : n - 1;
          nxt[j * n + i] = (cur[j * n + i] || cur[j * n + i0] || cur[j * n + i1] ||
            cur[j0 * n + i] || cur[j0 * n + i0] || cur[j0 * n + i1] ||
            cur[j1 * n + i] || cur[j1 * n + i0] || cur[j1 * n + i1]) ? 1 : 0;
        }
      }
      cur = nxt;
    }
    SKIRT = cur;
  }

  /* ---------- 高程入口 ---------- */
  function elevAt(u, v) {
    const h = hgAt(u, v);
    return h > 0 ? h : 60;
  }

  /* ---------- 模式设色（供运行时贴图生成使用） ---------- */
  const RAMPS = {
    terrain: [[0.00, 0x2f6b46], [0.10, 0x4f8f47], [0.22, 0x86a850], [0.36, 0xc0a84f],
              [0.50, 0xc98f4c], [0.64, 0xb5714a], [0.78, 0xa3948c], [0.90, 0xdcd8d2], [1.00, 0xffffff]],
    water:   [[0.00, 0x142330], [0.22, 0x1a3245], [0.45, 0x24485f], [0.68, 0x33607c],
              [0.86, 0x4f7f9c], [1.00, 0x86aec7]],
    night:   [[0.00, 0x0b1322], [0.30, 0x0e1a2c], [0.60, 0x142338], [1.00, 0x22374e]]
  };
  const LUTS = {};
  function makeLUT(ramp) {
    const lut = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      let c0 = ramp[0], c1 = ramp[ramp.length - 1];
      for (let k = 0; k < ramp.length - 1; k++) {
        if (t >= ramp[k][0] && t <= ramp[k + 1][0]) { c0 = ramp[k]; c1 = ramp[k + 1]; break; }
      }
      const kk = c1[0] > c0[0] ? (t - c0[0]) / (c1[0] - c0[0]) : 0;
      for (let ch = 0; ch < 3; ch++) {
        const a = (c0[1] >> (8 * (2 - ch))) & 255, b = (c1[1] >> (8 * (2 - ch))) & 255;
        lut[i * 3 + ch] = a + (b - a) * kk;
      }
    }
    return lut;
  }
  function lutOf(mode) {
    if (!LUTS[mode]) LUTS[mode] = makeLUT(RAMPS[mode] || RAMPS.terrain);
    return LUTS[mode];
  }

  const CAT_COLOR = { "主城": 0xff4d2e, "新区": 0x3f8fe0, "渝东北": 0xf2c14e, "渝东南": 0x3ecfa0 };

  /* =========================================================
     主体
     ========================================================= */
  let renderer, scene, camera, mesh, geo, riverMesh, riverBank, markers = [], outlineLine, nightPts, pickList = null;
  let mode = "terrain", selected = null, hovered = null;
  let cam = { theta: -0.62, phi: 0.92, r: 132, tT: -0.62, tP: 0.92, tR: 132 };
  let dragging = false, lastX = 0, lastY = 0, autoSpin = true, idleT = 0;
  let loopRunning = false;
  let H = null;               // 高度场缓存
  let W2H = null;             // 归一化->高度查询（双线性）
  let canvas, stage, raycaster, pointer;
  let normalTex = null;       // 由 DEM 生成的法线贴图（子网格细节）
  let boundLines = null;      // 区县边界线（淡色底图）
  let districtGroups = [];    // 每个区县：轮廓线 + 可填充高亮面
  let pickRegions = [];       // 悬停/点击拾取面
  let hoveredRegion = null;   // 当前悬停区县索引
  let tipEl = null;           // 浮动区县名提示
  let labelLayer = null, labels = [], showLabels = true, leadSvg = null, leadPath = null;

  function sampleH(u, v) {
    u = u < 0 ? 0 : u > 1 ? 1 : u;
    v = v < 0 ? 0 : v > 1 ? 1 : v;
    const fx = u * (GW - 1), fy = v * (GH - 1);
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const x1 = Math.min(GW - 1, x0 + 1), y1 = Math.min(GH - 1, y0 + 1);
    const tx = fx - x0, ty = fy - y0;
    const a = H[y0 * GW + x0], b = H[y0 * GW + x1], c = H[y1 * GW + x0], d = H[y1 * GW + x1];
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
  }

  /* ---------- 法线贴图（把 DEM 的 234m 级细节压到光照上） ---------- */
  function buildNormalTex() {
    if (normalTex || !HG) return normalTex;
    const n = HG.n;
    const cv = document.createElement("canvas");
    cv.width = n; cv.height = n;
    const cx = cv.getContext("2d");
    const img = cx.createImageData(n, n);
    const d = img.data;
    const e = HG.elev, mk = HG.mask;
    // 米 -> 世界单位 的换算（水平 / 垂直），保证法线与几何连续
    const latMid = (B.lat0 + B.lat1) / 2 * Math.PI / 180;
    const spanX = (B.lon1 - B.lon0) * 111320 * Math.cos(latMid);
    const spanY = (B.lat1 - B.lat0) * 111320;
    const uPerM = W / spanX, yPerM = VS / 2797;
    const kx = (yPerM / uPerM) / (2 * spanX / n);   // 每像素 x 向坡度 -> 世界斜率
    const ky = (yPerM / uPerM) / (2 * spanY / n);
    const S = 0.55;                                  // 强度（大尺度坡度已由几何表达）
    for (let j = 0; j < n; j++) {
      const jn = j > 0 ? j - 1 : 0, jx = j < n - 1 ? j + 1 : n - 1;
      for (let i = 0; i < n; i++) {
        const k = j * n + i, o = k * 4;
        if (!mk[k]) { d[o] = 128; d[o + 1] = 128; d[o + 2] = 255; d[o + 3] = 255; continue; }
        const i0 = i > 0 ? i - 1 : 0, i1 = i < n - 1 ? i + 1 : n - 1;
        // 采样被遮挡处（掩膜外）时退化为单侧差分
        const ex = i1 === i ? 0 : (e[j * n + i1] - e[j * n + i0]) * (i1 - i0 === 2 ? 1 : 2);
        const ey = jx === j ? 0 : (e[jx * n + i] - e[jn * n + i]) * (jx - jn === 2 ? 1 : 2);
        let nx3 = -ex * kx * S, ny3 = ey * ky * S, nz = 1;
        const L = Math.sqrt(nx3 * nx3 + ny3 * ny3 + 1);
        d[o] = Math.round((nx3 / L * 0.5 + 0.5) * 255);
        d[o + 1] = Math.round((ny3 / L * 0.5 + 0.5) * 255);
        d[o + 2] = Math.round((nz / L * 0.5 + 0.5) * 255);
        d[o + 3] = 255;
      }
    }
    cx.putImageData(img, 0, 0);
    normalTex = new THREE.CanvasTexture(cv);
    normalTex.colorSpace = THREE.NoColorSpace;
    normalTex.anisotropy = 4;
    return normalTex;
  }

  /* ---------- 区县标签（DOM，文字最清晰） ---------- */
  const CAT_CSS = { "主城": "m", "新区": "n", "渝东北": "ne", "渝东南": "se" };
  function buildLabels() {
    if (!stage) return;
    labelLayer = document.createElement("div");
    labelLayer.className = "tv-labels";
    stage.appendChild(labelLayer);
    // 引线层：被让位的标签用它连回真实地理点
    const NS = "http://www.w3.org/2000/svg";
    leadSvg = document.createElementNS(NS, "svg");
    leadSvg.setAttribute("class", "tv-leaders");
    leadSvg.setAttribute("aria-hidden", "true");
    leadPath = document.createElementNS(NS, "path");
    leadSvg.appendChild(leadPath);
    labelLayer.appendChild(leadSvg);
    labels = window.CHQ.DISTRICTS.map((d, i) => {
      const el = document.createElement("div");
      el.className = "tv-lab " + (CAT_CSS[d.c] || "");
      el.dataset.i = i;
      el.innerHTML = "<i></i><b>" + d.n + "</b>";
      el.title = d.n + " · " + d.e + "m（点击查看档案）";
      el.addEventListener("pointerdown", e => e.stopPropagation());
      el.addEventListener("pointerup", e => {
        e.stopPropagation();
        select(i);
      });
      labelLayer.appendChild(el);
      const main = d.c === "主城";
      const lw = el.offsetWidth || 64, lh = el.offsetHeight || 20;
      return { el, i, name: d.n, main, prio: main ? 3 : (d.c === "新区" ? 2 : 1), lw: lw + 4, lh: lh + 2 };
    });
  }

  // 每帧投影 + 避让：主城/新区/选中优先占位；冲突者先「平移让位 + 引线连回地理点」，
  // 只有在可视区内找不到空位时才淡出。这样主城密集区（北碚/渝北/巴南）不再叠成一团。
  // 让位候选：按「总位移最小」排序，先试近处，再逐步外推（半径 px，切向档位）
  const LEAD_CANDS = (() => {
    const a = [];
    for (const rad of [12, 20, 30, 42, 56, 72, 88]) {
      for (const kk of [0, 1, -1, 2, -2, 3, -3]) a.push([rad, kk]);
    }
    a.sort((p, q) => (Math.abs(p[0]) + Math.abs(p[1]) * 34) - (Math.abs(q[0]) + Math.abs(q[1]) * 34));
    return a;
  })();
  function labelHits(boxes, r) {
    for (let q = 0; q < boxes.length; q++) {
      const b = boxes[q];
      if (r.x < b.x + b.w + 2 && r.x + r.w + 2 > b.x &&
          r.y < b.y + b.h + 2 && r.y + r.h + 2 > b.y) return true;
    }
    return false;
  }
  function updateLabels() {
    if (!labelLayer || !labels.length || !showLabels) {
      if (labelLayer) labelLayer.style.display = "none";
      return;
    }
    labelLayer.style.display = "";
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    // 分级显示：远→主城，中→+新区，近→全部（舞台只有约 1000×620，默认档只留主城，避免糊成一团）
    const minPrio = cam.r < 80 ? 1 : cam.r < 120 ? 2 : 3;
    const v = new THREE.Vector3();
    const items = [];
    for (let k = 0; k < labels.length; k++) {
      const L = labels[k];
      const d = window.CHQ.DISTRICTS[k];
      const u = nx(d.lon), vv = ny(d.lat);
      v.set(wx(u), wy(sampleH(u, vv)) + 2.2, wz(vv));
      v.project(camera);
      const allow = L.prio >= minPrio || L.i === selected || L.i === hoveredRegion;
      if (!allow || v.z > 1 || v.z < -1) { L.el.style.display = "none"; continue; }
      const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
      if (x < -60 || x > w + 60 || y < -30 || y > h + 30) { L.el.style.display = "none"; continue; }
      L.el.style.display = "";
      items.push({ L, ax: x, ay: y, w: L.lw, h: L.lh, dx: 8, dy: L.lh / 2, depth: v.z });
    }
    // 已选中者 > 主城 > 离观察者更近（先占位的更稳，不被后来者挤走）
    items.sort((a, b) => {
      const pa = (a.L.i === selected ? 100 : 0) + (a.L.main ? 50 : 0) + (1 - a.depth) * 20;
      const pb = (b.L.i === selected ? 100 : 0) + (b.L.main ? 50 : 0) + (1 - b.depth) * 20;
      return pb - pa;
    });
    // 密集片区中心：被挤的标签统一朝「背离片区中心」的方向让位，
    // 引线呈放射状互不交叉，读起来像地图标注而不是一团乱线。
    let sx = 0, sy = 0, sn = 0;
    for (let k = 0; k < items.length; k++) {
      if (items[k].L.prio >= 2) { sx += items[k].ax; sy += items[k].ay; sn++; }
    }
    const ccx = sn ? sx / sn : 0, ccy = sn ? sy / sn : 0;
    const boxes = [];
    let leadD = "";
    for (let k = 0; k < items.length; k++) {
      const it = items[k], L = it.L;
      const home = { x: it.ax - it.dx, y: it.ay - it.dy, w: it.w, h: it.h };
      let r = home;
      if (labelHits(boxes, r)) {
        const mayShift = L.prio >= 2 || L.i === selected || L.i === hoveredRegion;
        let placed = false;
        if (mayShift) {
          let ux = it.ax - ccx, uy = it.ay - ccy;
          const ul = Math.sqrt(ux * ux + uy * uy);
          if (ul < 0.001) { ux = 0; uy = -1; } else { ux /= ul; uy /= ul; }
          const tx = -uy, ty = ux;                      // 切向：背离中心再错开，引线呈放射状
          const span = Math.abs(tx) > Math.abs(ty) ? it.w + 8 : it.h + 8;
          for (let ci = 0; ci < LEAD_CANDS.length && !placed; ci++) {
            const rad = LEAD_CANDS[ci][0], kk = LEAD_CANDS[ci][1];
            const c = {
              x: home.x + ux * rad + tx * kk * span,
              y: home.y + uy * rad + ty * kk * span,
              w: it.w, h: it.h
            };
            if (c.x < 2 || c.y < 2 || c.x + c.w > w - 2 || c.y + c.h > h - 2) continue;
            if (labelHits(boxes, c)) continue;
            r = c; placed = true;
          }
        }
        if (!placed && L.prio < 2 && L.i !== selected) {
          L.el.style.opacity = "0";
          L.el.style.transform = "translate(" + home.x.toFixed(1) + "px," + home.y.toFixed(1) + "px)";
          continue;
        }
      }
      // 让位后画一根虚线引线：地理点 → 标签最近边（未让位时长度为 0，跳过）
      if (r.x !== home.x || r.y !== home.y) {
        const cx = Math.max(r.x, Math.min(it.ax, r.x + r.w));
        const cy = Math.max(r.y, Math.min(it.ay, r.y + r.h));
        leadD += "M" + it.ax.toFixed(1) + " " + it.ay.toFixed(1) +
                 "L" + cx.toFixed(1) + " " + cy.toFixed(1);
      }
      L.el.style.transform = "translate(" + r.x.toFixed(1) + "px," + r.y.toFixed(1) + "px)";
      L.el.style.opacity = "1";
      boxes.push(r);
    }
    if (leadPath) leadPath.setAttribute("d", leadD);
  }

  /* ---------- 区县行政边界线 ---------- */
  function buildBounds() {
    const B = window.CHQ_BOUNDS;
    if (!B) return;
    const pos = [], col = [];
    const base = new THREE.Color(0x5b8fd6), hi = new THREE.Color(0xffd08a);
    const owner = [];
    const idxOf = {};
    window.CHQ.DISTRICTS.forEach((d, i) => idxOf[d.n] = i);
    const names = Object.keys(B);
    names.forEach((nm, ni) => {
      const rings = B[nm];
      const di = idxOf[nm] != null ? idxOf[nm] : -1;
      rings.forEach(r => {
        for (let i = 0; i < r.length; i++) {
          const a = r[i], b = r[(i + 1) % r.length];
          const ua = nx(a[0]), va = ny(a[1]), ub = nx(b[0]), vb = ny(b[1]);
          pos.push(wx(ua), wy(sampleH(ua, va)) + 0.34, wz(va));
          pos.push(wx(ub), wy(sampleH(ub, vb)) + 0.34, wz(vb));
          col.push(base.r, base.g, base.b, base.r, base.g, base.b);
          owner.push(di, di);
        }
      });
    });
    if (!pos.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.16 });
    boundLines = new THREE.LineSegments(g, m);
    boundLines.renderOrder = 2;
    boundLines.userData = { owner, base: { r: base.r, g: base.g, b: base.b }, hi: { r: hi.r, g: hi.g, b: hi.b } };
    scene.add(boundLines);
  }

  function highlightBounds(i) {
    if (!boundLines) return;
    const ud = boundLines.userData;
    const arr = boundLines.geometry.attributes.color.array;
    for (let k = 0; k < ud.owner.length; k++) {
      const on = i != null && ud.owner[k] === i;
      const c = on ? ud.hi : ud.base;
      arr[k * 3] = c.r; arr[k * 3 + 1] = c.g; arr[k * 3 + 2] = c.b;
    }
    boundLines.geometry.attributes.color.needsUpdate = true;
    boundLines.material.opacity = i != null ? 0.8 : 0.16;
  }

  /* ---------- 每区县独立轮廓 + 可填充高亮面 ---------- */
  const CAT_COLOR_BRIGHT = {
    "主城": 0xff6a48, "新区": 0x5aa8ff, "渝东北": 0xffd35e, "渝东南": 0x46e0ad
  };
  function drape(lon, lat, lift) {
    const u = nx(lon), v = ny(lat);
    return new THREE.Vector3(wx(u), wy(sampleH(u, v)) + (lift || 0), wz(v));
  }

  function buildDistricts() {
    if (!window.CHQ_BOUNDS) return;
    const idxOf = {};
    window.CHQ.DISTRICTS.forEach((d, i) => idxOf[d.n] = i);
    const geoCache = {};   // 缓存已构建的外环填充几何（同区县只用外环）

    window.CHQ.DISTRICTS.forEach((d, i) => {
      const rings = window.CHQ_BOUNDS[d.n];
      if (!rings || !rings.length) return;
      const col = new THREE.Color(CAT_COLOR_BRIGHT[d.c] || 0xffffff);
      const grp = new THREE.Group();
      grp.userData = {
        i, name: d.n, cat: d.c, col,
        selFill: 0.52, hovFill: 0.24
      };
      const outlineMats = [];

      // 轮廓线（每个环一条 LineLoop，沿地形起伏）
      rings.forEach(ring => {
        const pts = [];
        for (let k = 0; k < ring.length; k++) {
          const a = ring[k], b = ring[(k + 1) % ring.length];
          const seg = Math.max(2, Math.ceil(Math.hypot(nx(b[0]) - nx(a[0]), ny(b[1]) - ny(a[1])) * 46));
          for (let s = 0; s < seg; s++) {
            const t = s / seg;
            pts.push(drape(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0.55));
          }
        }
        if (pts.length < 2) return;
        pts.push(pts[0].clone());
        const g = new THREE.BufferGeometry().setFromPoints(pts);
        const m = new THREE.LineBasicMaterial({ color: col.clone(), transparent: true, opacity: 0.38 });
        const line = new THREE.Line(g, m);
        line.renderOrder = 5;
        grp.add(line); outlineMats.push(m);
      });

      // 填充面（外环 centroid fan，drape 在地形上）
      const outer = rings[0];
      let cLon = 0, cLat = 0;
      outer.forEach(p => { cLon += p[0]; cLat += p[1]; });
      cLon /= outer.length; cLat /= outer.length;
      const cPt = drape(cLon, cLat, 0.42);
      const fpos = [], fcol = [];
      for (let k = 0; k < outer.length; k++) {
        const a = outer[k], b = outer[(k + 1) % outer.length];
        const pa = drape(a[0], a[1], 0.42), pb = drape(b[0], b[1], 0.42);
        fpos.push(cPt.x, cPt.y, cPt.z, pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
        fcol.push(col.r, col.g, col.b, col.r, col.g, col.b, col.r, col.g, col.b);
      }
      const fg = new THREE.BufferGeometry();
      fg.setAttribute("position", new THREE.Float32BufferAttribute(fpos, 3));
      fg.setAttribute("color", new THREE.Float32BufferAttribute(fcol, 3));
      const fm = new THREE.MeshBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0, depthWrite: false,
        side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3
      });
      const fill = new THREE.Mesh(fg, fm);
      fill.renderOrder = 4; fill.userData = { i };
      grp.add(fill);
      grp.userData.outlineMats = outlineMats;
      grp.userData.fill = fm;
      scene.add(grp);
      districtGroups.push(grp);
      pickRegions.push(fill);
    });
  }

  function refreshHighlights() {
    districtGroups.forEach(grp => {
      const i = grp.userData.i;
      const sel = i === selected;
      const hov = (i === hoveredRegion && !sel);
      grp.userData.fill.opacity = sel ? grp.userData.selFill : (hov ? grp.userData.hovFill : 0);
      const lo = sel ? 1.0 : (hov ? 0.78 : 0.38);
      grp.userData.outlineMats.forEach(m => { m.opacity = lo; });
    });
    if (boundLines) highlightBounds(selected);
  }

  /* ---------- 构建网格 ---------- */
  function erode(a) {
    const b = new Uint8Array(a.length);
    for (let j = 0; j < GH; j++) {
      for (let i = 0; i < GW; i++) {
        const k = j * GW + i;
        if (!a[k]) continue;
        let ok = 1;
        for (let dj = -1; dj <= 1 && ok; dj++) {
          const jj = j + dj;
          if (jj < 0 || jj >= GH) { ok = 0; break; }
          for (let di = -1; di <= 1; di++) {
            const ii = i + di;
            if (ii < 0 || ii >= GW || !a[jj * GW + ii]) { ok = 0; break; }
          }
        }
        b[k] = ok;
      }
    }
    return b;
  }

  function buildMesh() {
    const vcount = GW * GH;
    H = new Float32Array(vcount);
    const pos = new Float32Array(vcount * 3);
    const uv = new Float32Array(vcount * 2);
    const insideArr = new Uint8Array(vcount);

    for (let j = 0; j < GH; j++) {
      const v = j / (GH - 1);
      for (let i = 0; i < GW; i++) {
        const u = i / (GW - 1);
        const k = j * GW + i;
        const ins = maskGrid(u, v);
        insideArr[k] = ins ? 1 : 0;
        const m = ins ? elevAt(u, v) : 0;
        H[k] = m;
        uv[k * 2] = u;
        uv[k * 2 + 1] = v;
        pos[k * 3] = wx(u);
        pos[k * 3 + 1] = ins ? wy(m) : BASE_Y;
        pos[k * 3 + 2] = wz(v);
      }
    }

    // 轻度平滑：削减单格高差毛刺（市域外不参与）
    {
      const H2 = new Float32Array(H);
      for (let j = 1; j < GH - 1; j++) {
        for (let i = 1; i < GW - 1; i++) {
          const k = j * GW + i;
          if (!insideArr[k]) continue;
          const nb = idx => (insideArr[idx] ? H2[idx] : H2[k]);
          H[k] = (H2[k] * 4 + nb(k - 1) + nb(k + 1) + nb(k - GW) + nb(k + GW)) / 8;
        }
      }
    }

    // 边缘羽化：由轮廓向内 4 层，高度从底座平滑升到真实值
    const edgeK = new Float32Array(vcount).fill(1);
    {
      let cur = insideArr;
      const layers = [];
      for (let it = 0; it < 4; it++) { cur = erode(cur); layers.push(cur); }
      for (let k = 0; k < vcount; k++) {
        if (!insideArr[k]) continue;
        if (layers[0][k] && layers[1][k] && layers[2][k]) edgeK[k] = 1;
        else if (layers[0][k] && layers[1][k]) edgeK[k] = 0.72;
        else if (layers[0][k]) edgeK[k] = 0.46;
        else edgeK[k] = 0.2;
      }
    }
    for (let k = 0; k < vcount; k++) {
      if (!insideArr[k]) continue;
      const e = edgeK[k];
      if (e < 1) pos[k * 3 + 1] = BASE_Y + (wy(H[k]) - BASE_Y) * e;
    }

    // 索引（Uint32，512² 网格超过 65535 顶点）
    const idx = new Uint32Array((GW - 1) * (GH - 1) * 6);
    let p = 0;
    for (let j = 0; j < GH - 1; j++) {
      for (let i = 0; i < GW - 1; i++) {
        const a = j * GW + i, b = a + 1, c = a + GW, d = c + 1;
        idx[p++] = a; idx[p++] = c; idx[p++] = b;
        idx[p++] = b; idx[p++] = c; idx[p++] = d;
      }
    }

    geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      map: getModeTex(mode, contourOn), normalMap: buildNormalTex(),
      normalScale: new THREE.Vector2(1, 1),
      roughness: 0.96, metalness: 0.0,
      alphaTest: 0.5,
      side: THREE.DoubleSide
    });
    mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    return { insideArr };
  }

  /* ---------- 运行时贴图（hillshade + 分层设色 / 卫星影像） ---------- */
  function drawCityGlow(cx, n) {
    window.CHQ.DISTRICTS.forEach(dd => {
      const x = (dd.lon - B.lon0) / (B.lon1 - B.lon0) * n;
      const y = (1 - (dd.lat - B.lat0) / (B.lat1 - B.lat0)) * n;
      const rad = (dd.c === "主城" ? 30 : 13) * (n / 1024);
      const g = cx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, "rgba(255,196,120,0.50)");
      g.addColorStop(0.5, "rgba(255,150,60,0.16)");
      g.addColorStop(1, "rgba(255,150,60,0)");
      cx.fillStyle = g;
      cx.beginPath(); cx.arc(x, y, rad, 0, 6.2832); cx.fill();
    });
  }

  function buildModeCanvas(m, withContours) {
    // 贴图分辨率可低于 DEM 数据分辨率：必须按数据分辨率重采样索引
    const n = (window.CHQ_PERF && window.CHQ_PERF.texSize) ? window.CHQ_PERF.texSize(HG.n) : HG.n;
    const N = HG.n;
    const sStep = (N - 1) / (n - 1);
    const sx = i => Math.min(N - 1, Math.round(i * sStep));
    const kE = (j, i) => sy_(j) * N + sx(i);
    function sy_(j) { return Math.min(N - 1, Math.round(j * sStep)); }

    const cv = document.createElement("canvas");
    cv.width = n; cv.height = n;
    const cx = cv.getContext("2d");
    const skirt = SKIRT;

    // 山影（西北光 315°/45°）
    const RAD = Math.PI / 180;
    const az = 315 * RAD, alt = 45 * RAD;
    const cosA = Math.cos(alt), sinA = Math.sin(alt);
    const cellX = (B.lon1 - B.lon0) / N * 111320 * Math.cos((B.lat0 + B.lat1) / 2 * RAD);
    const cellY = (B.lat1 - B.lat0) / N * 111320;
    const e = HG.elev, mk = HG.mask;

    function grad(j, i) {
      const i0 = sx(Math.max(0, i - 1)), i1 = sx(Math.min(n - 1, i + 1));
      const jn = sy_(Math.max(0, j - 1)), jx = sy_(Math.min(n - 1, j + 1));
      const dxs = Math.max(1e-6, (i1 - i0) * sStep), dys = Math.max(1e-6, (jx - jn) * sStep);
      return [(e[kE(j, i1)] - e[kE(j, i0)]) / (2 * dxs * cellX),
              (e[kE(jx, i)] - e[kE(jn, i)]) / (2 * dys * cellY)];
    }

    /* 卫星影像：真实影像 + 山影浮雕 + 裙边 */
    if (m === "sat" && satImg) {
      cx.drawImage(satImg, 0, 0, n, n);
      cx.fillStyle = "rgba(10,13,20,0.14)";
      cx.fillRect(0, 0, n, n);
      const img = cx.getImageData(0, 0, n, n), d = img.data;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const o = (j * n + i) * 4, ks = kE(j, i);
        if (!mk[ks]) {
          if (skirt && skirt[ks]) { d[o] = 12; d[o + 1] = 17; d[o + 2] = 24; d[o + 3] = 255; }
          else d[o + 3] = 0;
          continue;
        }
        const g2 = grad(j, i);
        const slope = Math.atan(2.1 * Math.hypot(g2[0], g2[1]));
        let sh = cosA * Math.cos(slope) + sinA * Math.sin(slope) * Math.cos(az - Math.atan2(g2[1], -g2[0]));
        sh = sh < 0 ? 0 : sh > 1 ? 1 : sh;
        const li = 0.74 + 0.5 * sh;
        d[o] = Math.min(255, d[o] * li); d[o + 1] = Math.min(255, d[o + 1] * li); d[o + 2] = Math.min(255, d[o + 2] * li);
        d[o + 3] = 255;
      }
      cx.putImageData(img, 0, 0);
      return cv;
    }

    const img = cx.createImageData(n, n);
    const d = img.data;
    const lut = lutOf(m);
    const liLo = m === "night" ? 0.55 : 0.60, liHi = m === "night" ? 0.45 : 0.62;
    const INTERV = 250;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const o = (j * n + i) * 4, ks = kE(j, i);
      if (!mk[ks]) {
        if (skirt && skirt[ks]) { d[o] = 13; d[o + 1] = 18; d[o + 2] = 26; d[o + 3] = 255; }
        else { d[o] = 0; d[o + 1] = 0; d[o + 2] = 0; d[o + 3] = 0; }
        continue;
      }
      const g2 = grad(j, i);
      const slope = Math.atan(2.1 * Math.hypot(g2[0], g2[1]));
      let shade = cosA * Math.cos(slope) + sinA * Math.sin(slope) * Math.cos(az - Math.atan2(g2[1], -g2[0]));
      shade = shade < 0 ? 0 : shade > 1 ? 1 : shade;
      const t = Math.min(255, (e[ks] / 2797 * 255) | 0) * 3;
      let li = liLo + liHi * shade;
      let r = lut[t] * li, gg = lut[t + 1] * li, bb = lut[t + 2] * li;
      if (withContours && m === "terrain") {
        const gradM = Math.hypot(g2[0], g2[1]) * 2 * cellX * sStep;   // 米/贴图格
        const wcell = Math.max(0.05, Math.min(0.85, 1.8 * gradM / INTERV));
        const f0 = (e[ks] % INTERV) / INTERV;
        if (f0 < wcell) { r = r * 0.30 + 90; gg = gg * 0.30 + 78; bb = bb * 0.30 + 40; }   // 暗底 + 暖色描边
      }
      d[o] = r; d[o + 1] = gg; d[o + 2] = bb;
      d[o + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    if (m === "night") drawCityGlow(cx, n);
    return cv;
  }

  let contourOn = false;
  function getModeTex(m, withContours) {
    const key = m + (withContours ? "#c" : "");
    if (!texCache[key]) {
      const tex = new THREE.CanvasTexture(buildModeCanvas(m, withContours));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      texCache[key] = tex;
    }
    return texCache[key];
  }

  function applyModeMap() {
    if (!mesh || !HG) return;
    mesh.material.map = getModeTex(mode, contourOn);
    mesh.material.needsUpdate = true;
  }

  function setContours(v) {
    contourOn = !!v;
    applyModeMap();
  }

  /* ---------- 河流带：主河道 + 湿岸外带，按市域掩膜分段裁剪 ---------- */
  function buildRivers() {
    const posC = [], colC = [], idxC = [], posB = [], idxB = [];
    const cRiver = new THREE.Color(0x3f92e0), cRiver2 = new THREE.Color(0x9fe0ff);

    window.CHQ.RIVERS.forEach(rv => {
      const pts = rv.path.map(p => [nx(p[0]), ny(p[1])]);
      const half = 0.0042 * rv.w;
      const inside = pts.map(p => maskGrid(p[0], p[1]));

      // 把连续在市域内的点切成若干段，避免河道飘到界外
      const runs = [];
      let st = -1;
      for (let i = 0; i <= pts.length; i++) {
        if (i < pts.length && inside[i]) { if (st < 0) st = i; }
        else if (st >= 0) { if (i - st >= 2) runs.push([st, i]); st = -1; }
      }

      runs.forEach(([a, b]) => {
        function strip(k) {
          const L = [], R = [];
          for (let i = a; i < b; i++) {
            const p = pts[i];
            const prev = pts[Math.max(a, i - 1)], nxt = pts[Math.min(b - 1, i + 1)];
            let dx = nxt[0] - prev[0], dy = nxt[1] - prev[1];
            const len = Math.hypot(dx, dy) || 1;
            dx /= len; dy /= len;
            const wob = 1 + 0.28 * (fbm(p[0] * 26, p[1] * 26, 3) - 0.5) * 2;
            L.push([p[0] - dy * half * k * wob, p[1] + dx * half * k * wob]);
            R.push([p[0] + dy * half * k * wob, p[1] - dx * half * k * wob]);
          }
          return { L, R };
        }
        const core = strip(1), bank = strip(1.9);
        const bc = posC.length / 3, bb = posB.length / 3, n = b - a;
        for (let i = 0; i < n; i++) {
          const yL = wy(sampleH(core.L[i][0], core.L[i][1])) + 0.18;
          const yR = wy(sampleH(core.R[i][0], core.R[i][1])) + 0.18;
          posC.push(wx(core.L[i][0]), yL, wz(core.L[i][1]));
          posC.push(wx(core.R[i][0]), yR, wz(core.R[i][1]));
          colC.push(cRiver2.r, cRiver2.g, cRiver2.b, cRiver.r, cRiver.g, cRiver.b);
          const bL = wy(sampleH(bank.L[i][0], bank.L[i][1])) + 0.02;
          const bR = wy(sampleH(bank.R[i][0], bank.R[i][1])) + 0.02;
          posB.push(wx(bank.L[i][0]), bL, wz(bank.L[i][1]));
          posB.push(wx(bank.R[i][0]), bR, wz(bank.R[i][1]));
        }
        for (let i = 0; i < n - 1; i++) {
          const c1 = bc + i * 2, c2 = c1 + 1, c3 = c1 + 2, c4 = c1 + 3;
          idxC.push(c1, c3, c2, c2, c3, c4);
          const k1 = bb + i * 2, k2 = k1 + 1, k3 = k1 + 2, k4 = k1 + 3;
          idxB.push(k1, k3, k2, k2, k3, k4);
        }
      });
    });

    const gC = new THREE.BufferGeometry();
    gC.setAttribute("position", new THREE.Float32BufferAttribute(posC, 3));
    gC.setAttribute("color", new THREE.Float32BufferAttribute(colC, 3));
    gC.setIndex(idxC); gC.computeVertexNormals();
    riverMesh = new THREE.Mesh(gC, new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.9,
      side: THREE.DoubleSide, depthWrite: false
    }));
    riverMesh.renderOrder = 2; scene.add(riverMesh);

    const gB = new THREE.BufferGeometry();
    gB.setAttribute("position", new THREE.Float32BufferAttribute(posB, 3));
    gB.setIndex(idxB); gB.computeVertexNormals();
    riverBank = new THREE.Mesh(gB, new THREE.MeshBasicMaterial({
      color: 0x1d4a7a, transparent: true, opacity: 0.15,
      side: THREE.DoubleSide, depthWrite: false
    }));
    riverBank.renderOrder = 1; scene.add(riverBank);
  }

  /* ---------- 市界轮廓线 ---------- */
  function buildOutline() {
    const pts = [];
    for (let i = 0; i < OUT.length; i++) {
      const a = OUT[i], b = OUT[(i + 1) % OUT.length];
      const seg = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 90));
      for (let s = 0; s < seg; s++) {
        const t = s / seg;
        const u = a[0] + (b[0] - a[0]) * t, v = a[1] + (b[1] - a[1]) * t;
        pts.push(new THREE.Vector3(wx(u), wy(sampleH(u, v)) + 0.55, wz(v)));
      }
    }
    pts.push(pts[0].clone());
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0xffb066, transparent: true, opacity: 0.75 });
    outlineLine = new THREE.Line(g, mat);
    outlineLine.renderOrder = 3;
    scene.add(outlineLine);
  }

  /* ---------- 区县标记 ---------- */
  function glowTex(hex) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    const col = new THREE.Color(hex);
    const r = Math.round(col.r * 255), gg = Math.round(col.g * 255), b = Math.round(col.b * 255);
    g.addColorStop(0, `rgba(255,255,255,.95)`);
    g.addColorStop(0.22, `rgba(${r},${gg},${b},.85)`);
    g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function buildMarkers() {
    const grp = new THREE.Group();
    pickList = [];
    window.CHQ.DISTRICTS.forEach((d, i) => {
      const u = nx(d.lon), v = ny(d.lat);
      const y = wy(sampleH(u, v));
      const hex = CAT_COLOR[d.c] || 0xffffff;
      const main = d.c === "主城";
      const m = new THREE.Group();

      const core = new THREE.Mesh(
        new THREE.SphereGeometry(main ? 1.45 : 1.05, 14, 12),
        new THREE.MeshBasicMaterial({ color: hex })
      );
      m.add(core);

      // 不可见的放大命中体，让点击更容易
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(main ? 3.1 : 2.6, 8, 6),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      hit.userData = { i };
      m.add(hit);
      pickList.push(hit);

      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex(hex), transparent: true, opacity: 0.75,
        blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false
      }));
      halo.scale.set(main ? 7.5 : 5.4, main ? 7.5 : 5.4, 1);
      m.add(halo);

      // 从地面拉起的柱子，便于定位
      const h = Math.max(0.4, y + 1.6);
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, h, 6),
        new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.42 })
      );
      rod.position.y = -h / 2;
      m.add(rod);

      m.position.set(wx(u), y + 1.6, wz(v));
      m.userData = { i, name: d.n, hex, halo, baseHalo: main ? 7.5 : 5.4 };
      grp.add(m);
      markers.push(m);
    });
    scene.add(grp);
  }

  /* ---------- 夜景灯光点 ---------- */
  function buildNightLights() {
    const pos = [], cols = [];
    const c = new THREE.Color();
    window.CHQ.DISTRICTS.forEach(d => {
      const main = d.c === "主城";
      const towns = main ? 6 : 2 + ((d.n.length * 7) % 3);   // 聚落数量
      for (let t = 0; t < towns; t++) {
        const ca = Math.random() * 6.283, cr = Math.pow(Math.random(), 1.6) * (main ? 3.2 : 2.0);
        const cu = nx(d.lon) + Math.cos(ca) * cr * 0.010, cvv = ny(d.lat) + Math.sin(ca) * cr * 0.010;
        const size = main ? 24 : 9 + (t === 0 ? 9 : 0);
        for (let i = 0; i < size; i++) {
          const ang = Math.random() * 6.283, rr = Math.pow(Math.random(), 0.6);
          const u = cu + Math.cos(ang) * rr * (main ? 0.017 : 0.009);
          const v = cvv + Math.sin(ang) * rr * (main ? 0.017 : 0.009);
          if (!maskAt(u, v)) continue;
          pos.push(wx(u), wy(sampleH(u, v)) + 0.4, wz(v));
          const hot = 1 - rr * 0.55;                            // 越靠聚落中心越亮
          c.setHSL(0.09 + Math.random() * 0.05, 0.85, 0.46 + hot * 0.30);
          cols.push(c.r, c.g, c.b);
        }
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    const m = new THREE.PointsMaterial({
      size: 1.5, vertexColors: true, transparent: true, opacity: 0.9,
      map: glowTex(0xffc46b), blending: THREE.AdditiveBlending,
      depthTest: false, depthWrite: false, sizeAttenuation: true
    });
    nightPts = new THREE.Points(g, m);
    nightPts.visible = false;
    scene.add(nightPts);
  }

  /* ---------- 相机 ---------- */
  function updateCam() {
    const r = cam.r, p = cam.phi, t = cam.theta;
    camera.position.set(
      r * Math.sin(p) * Math.sin(t),
      r * Math.cos(p),
      r * Math.sin(p) * Math.cos(t)
    );
    camera.lookAt(0, 3, 0);
  }

  /* ---------- 交互 ---------- */
  function bindInput() {
    const el = canvas;
    const start = (x, y) => { dragging = true; lastX = x; lastY = y; idleT = 0; el.classList.add("drag"); };
    const move = (x, y) => {
      if (!dragging) return;
      cam.tT -= (x - lastX) * 0.006;
      cam.tP -= (y - lastY) * 0.005;
      cam.tP = Math.max(0.16, Math.min(1.45, cam.tP));
      lastX = x; lastY = y; idleT = 0;
    };
    const end = () => { dragging = false; el.classList.remove("drag"); };

    el.addEventListener("mousedown", e => start(e.clientX, e.clientY));
    window.addEventListener("mousemove", e => {
      if (dragging) move(e.clientX, e.clientY);
      else pick(e);
    });
    window.addEventListener("mouseup", end);
    el.addEventListener("mouseleave", end);

    el.addEventListener("wheel", e => {
      e.preventDefault();
      cam.tR = Math.max(52, Math.min(230, cam.tR + e.deltaY * 0.075));
      idleT = 0;
    }, { passive: false });

    // 触摸
    el.addEventListener("touchstart", e => {
      if (e.touches.length === 1) start(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    el.addEventListener("touchmove", e => {
      if (e.touches.length === 1) { move(e.touches[0].clientX, e.touches[0].clientY); }
    }, { passive: true });
    el.addEventListener("touchend", end);

    // 点击选择
    let downX = 0, downY = 0, downT = 0;
    el.addEventListener("pointerdown", e => { downX = e.clientX; downY = e.clientY; downT = Date.now(); });
    el.addEventListener("pointerup", e => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) < 5 && Date.now() - downT < 600) {
        if (profileOn) { addProfilePoint(e); return; }
        if (hovered != null) select(hovered);
      }
    });
  }

  function pick(e) {
    if (!renderer || !pickList) return;
    const r = canvas.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
      if (hovered !== null || hoveredRegion !== null) {
        hovered = null; hoveredRegion = null; canvas.style.cursor = "";
        if (tipEl) tipEl.style.opacity = "0";
        refreshHighlights();
      }
      return;
    }
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickList.concat(pickRegions), false);
    const found = hits.length ? hits[0].object.userData.i : null;
    if (found !== hovered) {
      hovered = found;
      canvas.style.cursor = found != null ? "pointer" : "";
    }
    if (found !== hoveredRegion) {
      hoveredRegion = found;
      refreshHighlights();
    }
    // 浮动名字提示
    if (tipEl) {
      if (found != null) {
        const d = window.CHQ.DISTRICTS[found];
        const sr = stage.getBoundingClientRect();
        tipEl.textContent = d.n;
        tipEl.style.left = (e.clientX - sr.left + 14) + "px";
        tipEl.style.top = (e.clientY - sr.top + 14) + "px";
        tipEl.style.opacity = "1";
      } else {
        tipEl.style.opacity = "0";
      }
    }
  }

  /* ---------- 地形取点：射线步进求交高程场（比网格求交快且稳定） ---------- */
  function groundAt(x, z) {
    const u = x / W + 0.5, v = 0.5 - z / D;
    if (u < 0 || u > 1 || v < 0 || v > 1) return -99;
    if (!maskGrid(u, v)) return -99;      // 市域外没有地形，射线直接穿过
    return wy(sampleH(u, v));
  }
  function pickTerrain(clientX, clientY, dbg) {
    const D0 = dbg || {};
    const rect = canvas.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
    // 与 updateCam 同源：由 theta/phi/r 直接构造相机位姿与射线
    const rr = cam.r, pp = cam.phi, tt = cam.theta, cy = 3;
    const pos = new THREE.Vector3(rr * Math.sin(pp) * Math.sin(tt), rr * Math.cos(pp), rr * Math.sin(pp) * Math.cos(tt));
    const zAx = new THREE.Vector3(pos.x, pos.y - cy, pos.z).normalize();          // 相机指向后方
    const xAx = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), zAx).normalize();
    const yAx = new THREE.Vector3().crossVectors(zAx, xAx).normalize();
    const tanV = Math.tan(camera.fov * Math.PI / 360), tanH = tanV * camera.aspect;
    const ro = pos, rd = new THREE.Vector3()
      .addScaledVector(xAx, ndcX * tanH)
      .addScaledVector(yAx, ndcY * tanV)
      .addScaledVector(zAx, -1).normalize();
    let t = 0, step = 1.0;
    for (let i = 0; i < 700; i++) {
      const px = ro.x + rd.x * t, py = ro.y + rd.y * t, pz = ro.z + rd.z * t;
      if (py - groundAt(px, pz) <= 0) {
        let lo = Math.max(0, t - step), hi = t;
        for (let k = 0; k < 20; k++) {
          const mid = (lo + hi) / 2;
          const qx = ro.x + rd.x * mid, qy = ro.y + rd.y * mid, qz = ro.z + rd.z * mid;
          if (qy - groundAt(qx, qz) <= 0) hi = mid; else lo = mid;
        }
        const fx = ro.x + rd.x * hi, fz = ro.z + rd.z * hi;
        const u = fx / W + 0.5, v = 0.5 - fz / D;
        D0.hit = [ +fx.toFixed(1), +fz.toFixed(1) ]; D0.uv = [ +u.toFixed(3), +v.toFixed(3) ];
        if (u < 0 || u > 1 || v < 0 || v > 1) return null;
        return [u, v];
      }
      t += step; step = Math.min(3.0, step * 1.02);
      if (t > 1400) break;
    }
    D0.noHit = true; D0.t = +t.toFixed(1);
    D0.ro = [ +ro.x.toFixed(1), +ro.y.toFixed(1), +ro.z.toFixed(1) ];
    D0.rd = [ +rd.x.toFixed(2), +rd.y.toFixed(2), +rd.z.toFixed(2) ];
    return null;
  }

  /* ---------- 高程剖面：点两点，画线 + 出图 ---------- */
  let profileOn = false, profA = null, profB = null, profLine = null, profDots = [];
  function setProfile(v) {
    profileOn = !!v;
    profA = profB = null;
    clearProfile();
    const panel = document.getElementById("profPanel");
    if (panel) panel.hidden = !profileOn;
    if (canvas) canvas.style.cursor = profileOn ? "crosshair" : "";
  }
  function clearProfile() {
    if (profLine) { scene.remove(profLine); profLine.geometry.dispose(); profLine.material.dispose(); profLine = null; }
    profDots.forEach(o => { scene.remove(o); o.geometry.dispose(); o.material.dispose(); });
    profDots = [];
    const cv = document.getElementById("profCanvas");
    if (cv) cv.getContext("2d").clearRect(0, 0, cv.width, cv.height);
    const foot = document.getElementById("profFoot");
    if (foot) foot.textContent = "在地形上点两点";
  }
  function addProfilePoint(e) {
    const uv = pickTerrain(e.clientX, e.clientY);
    if (!uv) return;
    if (!profA) {
      profA = uv; profB = null; clearProfile();
      const f = document.getElementById("profFoot");
      if (f) f.textContent = "已选起点，再点一点";
      return;
    }
    profB = uv;
    drawProfile();
  }
  function drawProfile() {
    clearProfile();
    const N = 150, pts = [];
    let dmin = 1e9, dmax = -1e9, lastH = null;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const u = profA[0] + (profB[0] - profA[0]) * t;
      const v = profA[1] + (profB[1] - profA[1]) * t;
      const inside = maskGrid(u, v);
      const h = inside ? sampleH(u, v) : (lastH == null ? 0 : lastH);
      if (inside) { lastH = h; if (h < dmin) dmin = h; if (h > dmax) dmax = h; }
      pts.push([u, v, h]);
    }
    if (dmin > dmax) { dmin = 0; dmax = 0; }
    const gpts = pts.map(q => new THREE.Vector3(wx(q[0]), wy(q[2]) + 0.7, wz(q[1])));
    profLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(gpts),
      new THREE.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.95 }));
    profLine.renderOrder = 6; scene.add(profLine);
    [profA, profB].forEach(uv => {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
      dot.position.set(wx(uv[0]), wy(sampleH(uv[0], uv[1])) + 1.1, wz(uv[1]));
      scene.add(dot); profDots.push(dot);
    });
    const latMid = (B.lat0 + B.lat1) / 2 * Math.PI / 180;
    const dKm = Math.hypot((profB[0] - profA[0]) * (B.lon1 - B.lon0) * 111320 * Math.cos(latMid),
      (profB[1] - profA[1]) * (B.lat1 - B.lat0) * 111320) / 1000;
    const cv = document.getElementById("profCanvas");
    if (cv) {
      const x = cv.getContext("2d"), W2 = cv.width, H2 = cv.height, pad = 7, lo = 60, hi = 2800;
      const X = i => pad + i / (pts.length - 1) * (W2 - 2 * pad);
      const Y = h => H2 - pad - (Math.max(lo, Math.min(hi, h)) - lo) / (hi - lo) * (H2 - 2 * pad);
      x.beginPath(); x.moveTo(X(0), H2 - pad);
      pts.forEach((q, i) => x.lineTo(X(i), Y(q[2])));
      x.lineTo(X(pts.length - 1), H2 - pad); x.closePath();
      const gr = x.createLinearGradient(0, 0, 0, H2);
      gr.addColorStop(0, "rgba(255,224,138,.42)"); gr.addColorStop(1, "rgba(255,224,138,.05)");
      x.fillStyle = gr; x.fill();
      x.beginPath();
      pts.forEach((q, i) => i ? x.lineTo(X(i), Y(q[2])) : x.moveTo(X(i), Y(q[2])));
      x.strokeStyle = "#ffe08a"; x.lineWidth = 1.6; x.stroke();
    }
    const foot = document.getElementById("profFoot");
    if (foot) foot.textContent = "全长 " + dKm.toFixed(1) + " km · 最低 " + Math.round(dmin) + " m · 最高 " + Math.round(dmax) + " m";
  }

  /* ---------- 制图要素：指北针 + 比例尺 ---------- */
  let northEl = null, scaleEl = null;
  function updateOverlays() {
    if (northEl) northEl.style.transform = "rotate(" + (-cam.theta * 180 / Math.PI).toFixed(1) + "deg)";
    if (!scaleEl || !stage) return;
    const latMid = (B.lat0 + B.lat1) / 2 * Math.PI / 180;
    const mapMeters = (B.lon1 - B.lon0) * 111320 * Math.cos(latMid);
    const a = new THREE.Vector3(-W / 2, 3, 0).project(camera);
    const b = new THREE.Vector3(W / 2, 3, 0).project(camera);
    const pxHalf = Math.abs(b.x - a.x) * 0.5 * stage.clientWidth;
    if (!(pxHalf > 4)) return;
    const mPerPx = (mapMeters / 2) / pxHalf;
    let km = 10;
    for (const o of [10, 20, 50, 100, 200]) { const px = o * 1000 / mPerPx; if (px >= 46 && px <= 130) { km = o; break; } }
    scaleEl.style.width = Math.round(km * 1000 / mPerPx) + "px";
    const lb = scaleEl.querySelector("span");
    if (lb) lb.textContent = km + " km";
  }

  /* ---------- 选中 ---------- */
  function select(i) {
    selected = i;
    const d = window.CHQ.DISTRICTS[i];
    markers.forEach((m, k) => {
      const on = k === i;
      const halo = m.userData.halo;
      halo.material.opacity = on ? 1 : 0.75;
      halo.scale.set(on ? m.userData.baseHalo * 1.75 : m.userData.baseHalo,
        on ? m.userData.baseHalo * 1.75 : m.userData.baseHalo, 1);
    });
    highlightBounds(i);
    refreshHighlights();
    if (labels.length) {
      labels.forEach(L => L.el.classList.toggle("sel", L.i === i));
    }
    // 相机轻轻看向该点
    const u = nx(d.lon), v = ny(d.lat);
    cam.tT = Math.atan2(wx(u), wz(v));
    cam.tP = 1.0;
    cam.tR = 82;

    fillPanel(d);
    // 广播：板块之间靠事件解耦（三维联动等）
    try { document.dispatchEvent(new CustomEvent("chq:district", { detail: { name: d.n, idx: i } })); } catch (e) { }
  }

  function fillPanel(d) {
    const empty = document.getElementById("tpEmpty");
    const body = document.getElementById("tpBody");
    if (!empty || !body) return;
    empty.hidden = true; body.hidden = false;
    document.getElementById("tpName").textContent = d.n;
    const tag = document.getElementById("tpTag");
    tag.textContent = d.c;
    tag.style.background = d.c === "主城" ? "rgba(255,77,46,.16)" :
      d.c === "新区" ? "rgba(63,143,224,.16)" :
        d.c === "渝东北" ? "rgba(242,193,78,.16)" : "rgba(62,207,160,.16)";
    tag.style.borderColor = "currentColor";
    tag.style.color = d.c === "主城" ? "#ff8f7a" : d.c === "新区" ? "#6fc0ff" :
      d.c === "渝东北" ? "#f2c14e" : "#3ecfa0";

    document.getElementById("tpGrid").innerHTML = [
      ["县城海拔", d.e + " m"], ["海拔幅度", d.r],
      ["东经", d.lon.toFixed(2) + "°"], ["北纬", d.lat.toFixed(2) + "°"]
    ].map(x => `<div class="tp-cell"><div class="tc-k">${x[0]}</div><div class="tc-v">${x[1]}</div></div>`).join("");

    document.getElementById("tpDesc").textContent = d.d;
    document.getElementById("tpMarks").innerHTML = d.t.map(t => `<span>${t}</span>`).join("");
    const enter = document.getElementById("tpEnter");
    if (enter) enter.href = (window.districtURL ? window.districtURL(d.n) : null) || "district.html?d=" + encodeURIComponent(d.n);
  }

  function clearSel() {
    selected = null;
    const empty = document.getElementById("tpEmpty");
    const body = document.getElementById("tpBody");
    if (empty) { empty.hidden = false; body.hidden = true; }
    markers.forEach(m => {
      const halo = m.userData.halo;
      halo.material.opacity = 0.75;
      halo.scale.set(m.userData.baseHalo, m.userData.baseHalo, 1);
    });
    highlightBounds(null);
    refreshHighlights();
    if (labels.length) labels.forEach(L => L.el.classList.remove("sel"));
  }

  /* ---------- 模式 / 视角 ---------- */
  function setMode(m) {
    mode = m;
    applyModeMap();
    if (mesh && mesh.material.normalMap) {
      // 夜景/水系模式压低细节，突出整体氛围
      const s = m === "night" ? 0.35 : m === "water" ? 0.6 : 1;
      mesh.material.normalScale.set(s, s);
    }
    if (boundLines) boundLines.material.opacity = m === "night" ? 0.22 : (selected != null ? 0.95 : 0.42);
    if (nightPts) nightPts.visible = (m === "night");
    if (riverMesh) {
      riverMesh.material.opacity = m === "water" ? 1 : m === "night" ? 0.55 : 0.85;
    }
    if (riverBank) riverBank.material.opacity = m === "water" ? 0.45 : 0.28;
    if (outlineLine) outlineLine.material.opacity = m === "night" ? 0.35 : 0.75;
    scene.fog.color.setHex(m === "night" ? 0x05080d : 0x0a0d12);
    renderer.setClearColor(m === "night" ? 0x05080d : 0x080b10, 1);
  }

  function setView(v) {
    const map = { south: [-0.02, 1.15, 130], east: [1.42, 1.05, 128], top: [0, 0.18, 150], iso: [-0.62, 0.92, 132] };
    const s = map[v] || map.iso;
    cam.tT = s[0]; cam.tP = s[1]; cam.tR = s[2];
    idleT = -4000;
  }

  /* ---------- 循环 ---------- */
  function loop() {
    if (!loopRunning) return;
    requestAnimationFrame(loop);
    cam.theta += (cam.tT - cam.theta) * 0.09;
    cam.phi += (cam.tP - cam.phi) * 0.09;
    cam.r += (cam.tR - cam.r) * 0.08;

    idleT++;
    if (autoSpin && !dragging && idleT > 260) cam.tT += 0.0016;

    updateCam();

    // 选中点脉冲
    if (selected != null && markers[selected]) {
      const s = 1.55 + Math.sin(performance.now() * 0.004) * 0.22;
      const h = markers[selected].userData.baseHalo * s;
      markers[selected].userData.halo.scale.set(h, h, 1);
    }
    // 选中区县轮廓填色脉冲
    if (selected != null && districtGroups[selected]) {
      const g = districtGroups[selected].userData;
      const base = g.selFill;
      g.fill.opacity = base + Math.sin(performance.now() * 0.004) * (base * 0.16);
      const lo = 0.86 + Math.sin(performance.now() * 0.004) * 0.14;
      g.outlineMats.forEach(m => m.opacity = lo);
    }
    updateLabels();
    updateOverlays();
    renderer.render(scene, camera);
  }

  function onResize() {
    if (!renderer) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* ---------- 初始化 ---------- */
  function loadSat() {
    return new Promise(resolve => {
      if (!window.CHQ_SAT || !window.CHQ_SAT.jpg) return resolve(null);
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => resolve(null);
      im.src = window.CHQ_SAT.jpg;
    });
  }

  async function init() {
    try {
      await initInner();
    } catch (e) {
      console.error("[terrain] init 失败:", e && (e.stack || e.message) || e);
      const ld = document.getElementById("terraLoading");
      if (ld) { ld.classList.add("gone"); setTimeout(() => ld.remove(), 600); }
    }
  }

  async function initInner() {
    canvas = document.getElementById("terraCanvas");
    stage = document.getElementById("terraStage");
    if (!canvas || !stage || typeof THREE === "undefined") return;

    // 性能分级：低端机降网格分辨率与像素比；系统偏好减少动效时关闭自动旋转
    const PERF = window.CHQ_PERF;
    if (PERF) {
      GW = GH = PERF.gridSize(1024);
      if (PERF.reducedMotion()) autoSpin = false;
    }
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !PERF || !PERF.isLow(), alpha: false });
    renderer.setPixelRatio(PERF ? PERF.pixelRatio(2) : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(stage.clientWidth, stage.clientHeight, false);
    renderer.setClearColor(0x080b10, 1);

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0d12, 120, 330);

    camera = new THREE.PerspectiveCamera(42, stage.clientWidth / stage.clientHeight, 0.5, 900);
    raycaster = new THREE.Raycaster();
    raycaster.params.Sprite = { threshold: 0.1 };
    pointer = new THREE.Vector2();

    scene.add(new THREE.HemisphereLight(0xbcd8ff, 0x2a2f38, 0.55));
    const d1 = new THREE.DirectionalLight(0xfff2e0, 0.85);
    d1.position.set(60, 95, 42); scene.add(d1);
    const d2 = new THREE.DirectionalLight(0x5c9be0, 0.28);
    d2.position.set(-58, 34, -46); scene.add(d2);

    // 真实数据（SRTM/ALOS DEM + Esri 卫星影像），失败自动回退程序化地形
    if (window.CHQ_DEM) DEM = await decodeDEM();
    satImg = await loadSat();
    buildHeightGrid();
    buildSkirt();
    console.log("[terrain] 高度网格 " + HG.n + "²，数据源：" + (DEM ? "真实 DEM" : "程序化"));

    buildMesh();
    buildRivers();
    buildOutline();
    buildMarkers();
    buildNightLights();
    buildBounds();
    buildDistricts();
    buildLabels();
    tipEl = document.getElementById("tvTip");
    northEl = document.getElementById("terraNorth");
    scaleEl = document.getElementById("terraScale");

    bindInput();
    updateCam();

    // 视口节流：地形不可见时不启动渲染循环，进入视口（含 160px 预热）才起，离开立即停
    function startLoop() {
      if (loopRunning) return;
      loopRunning = true;
      updateCam();
      loop();
    }
    function stopLoop() { loopRunning = false; }
    if (window.CHQ_PERF && window.CHQ_PERF.onVisible) {
      window.CHQ_PERF.onVisible(document.getElementById("terrain") || stage, startLoop, stopLoop);
    } else {
      startLoop(); // 无 IO 的老浏览器：退化为常驻循环
    }
    window.addEventListener("resize", onResize);

    const ld = document.getElementById("terraLoading");
    if (ld) { ld.classList.add("gone"); setTimeout(() => ld.remove(), 600); }
  }

  return {
    init,
    select(i) { select(i); },
    setMode, setView, clearSel, setContours, setProfile,
    debug() { return { hovered, hoveredRegion, selected, regions: pickRegions.length, groups: districtGroups.length }; },
    setLabels(v) {
      showLabels = v;
      if (labelLayer) labelLayer.style.display = v ? "" : "none";
      if (v) updateLabels();
    },
    focus(name) {
      const i = window.CHQ.DISTRICTS.findIndex(d => d.n === name);
      if (i >= 0) select(i);
    }
  };
})();

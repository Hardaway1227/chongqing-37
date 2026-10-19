/* ==========================================================
   wordcloud.js — 地貌词云引擎
   13 种地形轮廓 + 螺旋填充布局 + SVG 渲染
   ========================================================== */
window.WordCloud = (function () {

  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  /* ---------- 地形轮廓：u,v ∈ [-1,1]，v 向上为正 ---------- */
  const S = {
    // 尖峰：底宽顶尖
    peak(u, v) {
      if (v < -1 || v > 1) return false;
      const t = (v + 1) / 2;
      let w = (1 - t) * 0.97;
      w *= 1 + 0.13 * Math.sin(t * 7.5) + 0.05 * Math.sin(t * 17);
      return Math.abs(u) < w;
    },
    // 峡谷：V 形深切，两壁陡立
    gorge(u, v) {
      if (v < -1 || v > 1) return false;
      const t = (v + 1) / 2;
      const w = 0.09 + 0.90 * Math.pow(t, 0.68);
      return Math.abs(u) < w * (1 + 0.045 * Math.sin(t * 15));
    },
    // 半岛：舌状，一端收窄
    peninsula(u, v) {
      if (v < -1 || v > 1) return false;
      const w = 0.95 * Math.sqrt(Math.max(0, 1 - v * v * 0.80)) * (1 - 0.40 * Math.max(0, v));
      return Math.abs(u) < w && v > -0.90;
    },
    // 丘陵：顶部波浪起伏
    hill(u, v) {
      if (v < -1 || v > 1) return false;
      const top = 0.52 + 0.20 * Math.sin(u * 3.4) + 0.10 * Math.sin(u * 6.9 + 1.2);
      return v < top && v > -0.86 && Math.abs(u) < 0.96;
    },
    // 盆地：圆碗，四周微隆
    basin(u, v) {
      const a = Math.atan2(v, u);
      const r = Math.hypot(u / 0.98, v / 0.92);
      return r < 1 - 0.07 * Math.sin(a * 5) - 0.04 * Math.sin(a * 3 + 1);
    },
    // 梯田 / 台地：阶梯递减
    terrace(u, v) {
      if (v < -1 || v > 1) return false;
      const t = (v + 1) / 2;
      const step = Math.min(3, Math.floor(t * 4));
      const w = 0.96 - step * 0.185;
      return Math.abs(u) < w;
    },
    // 台原：桌状山，顶平坡陡
    plateau(u, v) {
      if (v < -1 || v > 1) return false;
      const t = (v + 1) / 2;
      const w = t < 0.34 ? 0.28 + (t / 0.34) * 0.66 : 0.94 - (t - 0.34) * 0.05;
      return Math.abs(u) < w;
    },
    // 峰林 / 天坑：数座锥峰并立
    karst(u, v) {
      const cone = (cx, top, hw) => {
        if (v > top || v < -1) return false;
        const t = (top - v) / (top + 1);
        return Math.abs(u - cx) < hw * t;
      };
      return cone(-0.54, 0.30, 0.33) || cone(0.02, 0.66, 0.38) ||
        cone(0.56, 0.24, 0.32) || (v < -0.62 && Math.abs(u) < 0.92);
    },
    // 林海：树冠连缀
    forest(u, v) {
      const c = [[-0.62, -0.08, 0.44], [-0.16, 0.24, 0.50], [0.36, 0.04, 0.46],
      [0.66, -0.36, 0.34], [-0.34, -0.58, 0.38], [0.18, -0.62, 0.34]];
      for (let i = 0; i < c.length; i++) {
        if (Math.hypot(u - c[i][0], v - c[i][1]) < c[i][2]) return true;
      }
      return false;
    },
    // 河谷：U 形宽谷
    valley(u, v) {
      if (v < -1 || v > 1) return false;
      const t = (v + 1) / 2;
      const w = 0.24 + 0.74 * Math.pow(t, 1.45);
      return Math.abs(u) < w * (1 + 0.04 * Math.sin(t * 11));
    },
    // 山脊：锯齿状多峰
    ridge(u, v) {
      if (v < -1 || v > 1) return false;
      const top = 0.38 + 0.44 * Math.abs(Math.sin(u * 3.05 + 0.3));
      return v < top && v > -0.88 && Math.abs(u) < 0.97;
    },
    // 江湾：S 形蜿蜒
    river(u, v) {
      if (v < -1 || v > 1) return false;
      const cx = 0.52 * Math.sin(v * 1.85);
      const w = 0.31 + 0.09 * Math.sin(v * 2.7 + 0.6);
      return Math.abs(u - cx) < w;
    },
    // 三江汇：Y 形
    confluence(u, v) {
      const seg = (ax, ay, bx, by) => {
        const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
        let t = ((u - ax) * dx + (v - ay) * dy) / l2;
        t = clamp(t, 0, 1);
        return Math.hypot(u - (ax + t * dx), v - (ay + t * dy));
      };
      return seg(0, -0.95, 0, 0.05) < 0.26 ||
        seg(0, 0.05, -0.72, 0.90) < 0.235 ||
        seg(0, 0.05, 0.72, 0.90) < 0.235;
    },

    /* ---------- 区县专属轮廓（破局"形状相似"） ---------- */
    // 涂鸦笔刷（九龙坡）
    brush(u, v) {
      const d = (u + v) / Math.SQRT2;
      return Math.abs(d) < 0.34 && v > -0.95 && v < 0.92;
    },
    // 龙（铜梁龙舞）
    dragon(u, v) {
      if (v < -1 || v > 1) return false;
      const cx = 0.46 * Math.sin(v * 2.2) + 0.10 * Math.sin(v * 5.5);
      const w = 0.20 + 0.07 * Math.cos(v * 3.0);
      return Math.abs(u - cx) < w;
    },
    // 折扇（荣昌折扇）
    fan(u, v) {
      const dx = u, dy = v + 1;
      const r = Math.hypot(dx, dy);
      if (r > 1.0 || r < 0.05) return false;
      const a = Math.atan2(dy, dx);
      return Math.abs(a - Math.PI / 2) < 0.92;
    },
    // 佛龛（大足石刻）
    niche(u, v) {
      if (v < -1 || v > 1) return false;
      const t = (v + 1) / 2;
      if (t < 0.55) return Math.abs(u) < 0.62;
      const rr = Math.hypot(u / 0.62, (t - 0.55) / 0.45);
      return rr < 1;
    },
    // 夔门（奉节）
    gate(u, v) {
      if (v < -1 || v > 1) return false;
      const t = (v + 1) / 2;
      const gap = 0.30 - 0.13 * t;
      if (Math.abs(u) < gap) return false;
      const wall = 0.95 - gap;
      return Math.abs(Math.abs(u) - (gap + wall / 2)) < wall / 2 + 0.02;
    },
    // 塔阁（梁平文峰塔 / 忠县石宝寨）
    pagoda(u, v) {
      if (v < -1 || v > 1) return false;
      const t = (v + 1) / 2;
      const w = 0.32 - 0.21 * Math.pow(t, 0.6);
      return Math.abs(u) < w && v > -0.95;
    },
    // 拱桥（江北）
    bridge(u, v) {
      if (v < -1 || v > 1) return false;
      if (v > -0.12 && v < 0.20) return Math.abs(u) < 0.92;
      if (v <= -0.12) {
        const r = Math.hypot(u / 0.9, (v + 0.12) / 0.62);
        return Math.abs(r - 1) < 0.17;
      }
      return false;
    },
    // 九宫格火锅（渝中）
    hotpot(u, v) {
      const r = Math.hypot(u / 0.95, v / 0.92);
      if (r > 0.97) return false;
      const a = Math.atan2(v, u);
      const seam = Math.abs(((a * 7) / Math.PI) % 2 - 1) < 0.11;
      return !seam;
    },
    // 花海（垫江牡丹）
    flowerfield(u, v) {
      if (v < -1 || v > 1) return false;
      if (v < -0.55) return Math.abs(u) < 0.96;
      const top = -0.2 + 0.46 * Math.abs(Math.sin(u * 2.2)) + 0.12 * Math.sin(u * 5);
      return v < top && v > -0.95;
    },
    // 湖岛（长寿湖）
    islandlake(u, v) {
      if (v < -1 || v > 1) return false;
      if (v < -0.35) return Math.abs(u) < 0.96;
      const isl = [[-0.5, 0.15, 0.22], [0.26, 0.05, 0.27], [0.62, -0.12, 0.16]];
      for (let i = 0; i < isl.length; i++) {
        if (Math.hypot(u - isl[i][0], v - isl[i][1]) < isl[i][2]) return true;
      }
      return false;
    },
    // 江浪（江津）
    wave(u, v) {
      if (v < -1 || v > 1) return false;
      const cx = 0.5 * Math.sin(v * 1.4 + 0.6);
      const w = 0.34 + 0.12 * Math.sin(v * 2.0);
      return Math.abs(u - cx) < w && v > -0.9;
    },
    // 吊脚楼（黔江 / 酉阳）
    stilt(u, v) {
      if (v < -1 || v > 1) return false;
      const t = (v + 1) / 2;
      if (t < 0.2) return Math.abs(u) < 0.22;
      const w = 0.30 + 0.55 * Math.pow(t, 1.4);
      return Math.abs(u) < w;
    },
    // 莲台（潼南大佛寺）
    lotus(u, v) {
      if (v < -1 || v > 1) return false;
      if (v < -0.6) return Math.abs(u) < 0.16;
      const pl = [[-0.45, 0.1], [0, 0.26], [0.45, 0.1], [-0.7, -0.08], [0.7, -0.08]];
      for (let i = 0; i < pl.length; i++) {
        if (Math.hypot((u - pl[i][0]) / 0.32, (v - pl[i][1]) / 0.5) < 1) return true;
      }
      return false;
    },
    // 辣椒（綦江）
    pepper(u, v) {
      if (v < -1 || v > 1) return false;
      const t = (v + 1) / 2;
      const cx = -0.45 + 0.9 * t - 0.12 * Math.sin((v + 1) * 3);
      const w = 0.16 + 0.10 * t;
      return Math.abs(u - cx) < w && v > -0.92;
    },
    // 竹海（永川茶山竹海）
    bamboo(u, v) {
      if (v < -1 || v > 1) return false;
      const xs = [-0.55, -0.18, 0.2, 0.55];
      for (let i = 0; i < xs.length; i++) {
        if (Math.abs(u - xs[i]) < 0.085 && v > -0.92) return true;
      }
      return false;
    },
    // 灯笼（丰都庙会）
    lantern(u, v) {
      if (v > 0.55 || v < -0.55) return false;
      if (v > 0.4 || v < -0.4) return Math.abs(u) < 0.3;
      const r = Math.hypot(u / 0.55, v / 0.42);
      return r < 1;
    },
    // 山峦（巫山）
    range(u, v) {
      if (v < -1 || v > 1) return false;
      const top = 0.2 + 0.5 * Math.abs(Math.sin(u * 2.1 + 0.4)) + 0.12 * Math.sin(u * 4.5);
      return v < top && v > -0.9 && Math.abs(u) < 0.96;
    },
    // 瀑布（万州）
    waterfall(u, v) {
      if (v < -1 || v > 1) return false;
      if (v < -0.4) return Math.hypot(u / 0.9, (v + 0.7) / 0.25) < 1;
      const t = (v + 1) / 2;
      const w = 0.5 - 0.42 * Math.pow(t, 0.5);
      return Math.abs(u) < w && v > -0.95;
    },
    // 平湖（开州汉丰湖）
    lake(u, v) {
      if (v < -1 || v > 1) return false;
      if (v < -0.2) return Math.abs(u) < 0.96;
      const top = 0.15 + 0.18 * Math.sin(u * 1.6);
      return v < top && v > -0.2 && Math.abs(u) < 0.96;
    },
    // 玉璧（璧山）
    bi(u, v) {
      const r = Math.hypot(u, v);
      return r > 0.45 && r < 0.95;
    },
    // 茶芽（南川 / 永川）
    tea(u, v) {
      if (v < -1 || v > 1) return false;
      const cs = Math.cos(-0.6), sn = Math.sin(-0.6);
      const x = u * cs - v * sn, y = u * sn + v * cs;
      const rr = Math.hypot(x / 0.32, y / 0.8);
      return rr < 1 && v > -0.9;
    },
    // 舟船（酉阳酉水）
    boat(u, v) {
      if (v < -1 || v > 1) return false;
      if (v < -0.1) {
        const t = (v + 1) / 2;
        const w = 0.85 - 0.5 * t;
        return Math.abs(u) < w;
      }
      if (v < 0.32) return Math.abs(u) < 0.12;
      return false;
    },
    // 盐灶（巫溪宁厂）
    salt(u, v) {
      if (v < -1 || v > 1) return false;
      if (v < -0.5) return Math.abs(u) < 0.8;
      if (v < 0.6) {
        if (Math.abs(u + 0.35) < 0.16) return true;
        if (Math.abs(u - 0.35) < 0.16) return true;
      }
      if (v >= 0.6) return Math.hypot(u / 0.5, (v - 0.7) / 0.3) < 1;
      return false;
    },
    // 台地草场（石柱）
    mesa(u, v) {
      if (v < -1 || v > 1) return false;
      const t = (v + 1) / 2;
      const w = t < 0.5 ? 0.34 + t * 1.1 : 0.92 - (t - 0.5) * 0.06;
      return Math.abs(u) < w;
    }
  };

  const SHAPE_NAME = {
    peak: "尖峰型", gorge: "峡江型", peninsula: "半岛型", hill: "丘陵型",
    basin: "盆坝型", terrace: "梯台型", plateau: "台原型", karst: "峰林型",
    forest: "林海型", valley: "河谷型", ridge: "山脊型", river: "江湾型",
    confluence: "汇流型",
    brush: "涂鸦型", dragon: "龙舞型", fan: "折扇型", niche: "佛龛型",
    gate: "夔门型", pagoda: "塔阁型", bridge: "拱桥型", hotpot: "火锅型",
    flowerfield: "花海型", islandlake: "湖岛型", wave: "江浪型", stilt: "吊脚型",
    lotus: "莲台型", pepper: "椒红型", bamboo: "竹海型", lantern: "灯会型",
    range: "山峦型", waterfall: "瀑布型", lake: "平湖型", bi: "玉璧型",
    tea: "茶芽型", boat: "舟船型", salt: "盐灶型", mesa: "台地型"
  };

  /* ---------- 伪随机 ---------- */
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  /* ---------- 形状内判定（9 点采样） ---------- */
  function fits(u, v, cw, ch, inside) {
    const hw = cw / 2, hh = ch / 2;
    if (!inside(u, v)) return false;
    if (!inside(u - hw, v - hh) || !inside(u + hw, v - hh)) return false;
    if (!inside(u - hw, v + hh) || !inside(u + hw, v + hh)) return false;
    if (!inside(u, v - hh) || !inside(u, v + hh)) return false;
    if (!inside(u - hw, v) || !inside(u + hw, v)) return false;
    return true;
  }

  function hits(u, v, cw, ch, placed, pad) {
    const hw = cw / 2 + pad, hh = ch / 2 + pad;
    for (let i = 0; i < placed.length; i++) {
      const p = placed[i];
      if (Math.abs(u - p.u) < hw + p.cw / 2 && Math.abs(v - p.v) < hh + p.ch / 2) return true;
    }
    return false;
  }

  /* ---------- 布局 ---------- */
  function layout(words, shapeKey, seed) {
    const inside = S[shapeKey] || S.hill;
    const rs = rng(seed || 7);
    const list = words.map((a, i) => ({ t: a[0], w: a[1], c: a[2], d: a[3], i }));
    list.sort((a, b) => b.w - a.w);

    const ws = list.map(x => x.w);
    const mx = Math.max.apply(null, ws), mn = Math.min.apply(null, ws);
    const sizeOf = w => 0.046 + 0.104 * Math.pow(mx === mn ? 1 : (w - mn) / (mx - mn), 0.68);

    const placed = [];
    const N = 1900, GOLD = 2.39996, pad = 0.012;

    for (let k = 0; k < list.length; k++) {
      const it = list[k];
      let done = false;
      for (let shrink = 0; shrink < 4 && !done; shrink++) {
        const size = sizeOf(it.w) * (1 - shrink * 0.14);
        const vert = rs() < 0.30 && it.t.length > 1;
        const cw = vert ? size * 1.20 : size * it.t.length * 1.04;
        const ch = vert ? size * it.t.length * 1.04 : size * 1.20;
        for (let step = 0; step < N; step++) {
          const rad = 1.32 * Math.sqrt((step + 0.5) / N);
          const ang = step * GOLD + (seed || 0) * 0.61;
          const u = rad * Math.cos(ang), v = rad * Math.sin(ang) * 0.96;
          if (!fits(u, v, cw, ch, inside)) continue;
          if (hits(u, v, cw, ch, placed, pad)) continue;
          placed.push(Object.assign({}, it, { size, vert, u, v, cw, ch }));
          done = true;
          break;
        }
      }
    }
    return placed;
  }

  /* ---------- 轮廓路径（逐行取左右边界） ---------- */
  function outlinePath(inside) {
    const ROWS = 54, COLS = 150;
    const L = [], R = [];
    for (let i = 0; i <= ROWS; i++) {
      const v = -1 + 2 * i / ROWS;
      let mn = null, mx = null;
      for (let j = 0; j <= COLS; j++) {
        const u = -1 + 2 * j / COLS;
        if (inside(u, v)) { if (mn === null) mn = u; mx = u; }
      }
      if (mn !== null) { L.push([mn, v]); R.push([mx, v]); }
    }
    if (!L.length) return "";
    const M = p => `${(400 + p[0] * 275).toFixed(1)},${(300 - p[1] * 275).toFixed(1)}`;
    let d = "M" + M(L[0]);
    for (let i = 1; i < L.length; i++) d += " L" + M(L[i]);
    for (let i = R.length - 1; i >= 0; i--) d += " L" + M(R[i]);
    return d + " Z";
  }

  /* ---------- 配色 ---------- */
  const CAT = {
    spot: { c: "#ff7a45", n: "景点" },
    nat: { c: "#3ecfa0", n: "自然" },
    cul: { c: "#f2c14e", n: "人文" },
    food: { c: "#ff4d2e", n: "物产" },
    town: { c: "#6fc0ff", n: "古镇" }
  };

  /* ---------- 渲染 ---------- */
  function svg(placed, shapeKey, opt) {
    opt = opt || {};
    const inside = S[shapeKey] || S.hill;
    const d = outlinePath(inside);
    let s = `<svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`;
    s += `<defs>
      <linearGradient id="wcFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8fb4d8" stop-opacity=".13"/>
        <stop offset="100%" stop-color="#3f8fe0" stop-opacity=".05"/></linearGradient>
      <linearGradient id="wcLine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffb066"/><stop offset="55%" stop-color="#ff7a45"/>
        <stop offset="100%" stop-color="#6fc0ff"/></linearGradient>
      <filter id="wcGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="7" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>`;

    // 地貌底
    s += `<path d="${d}" fill="url(#wcFill)" stroke="url(#wcLine)" stroke-width="2" opacity=".9"/>`;
    s += `<path d="${d}" fill="none" stroke="#ffb066" stroke-width="1" opacity=".22" transform="translate(0,7)"/>`;
    s += `<path d="${d}" fill="none" stroke="#6fc0ff" stroke-width="1" opacity=".14" transform="translate(0,15)"/>`;

    // 词
    placed.forEach((p, k) => {
      const cat = CAT[p.c] || CAT.spot;
      const fs = (p.size * 275).toFixed(1);
      const x = (400 + p.u * 275).toFixed(1);
      const y = (300 - p.v * 275).toFixed(1);
      const cls = `wc-word wc-${p.c}`;
      const delay = (k * 26) + "ms";
      if (p.vert) {
        const chars = p.t.split("");
        const startY = 300 - p.v * 275 - (p.ch * 275) / 2 + p.size * 275 * 0.95;
        s += `<g class="${cls}" data-i="${p.i}" data-cat="${p.c}" style="animation-delay:${delay}">`;
        chars.forEach((ch, ci) => {
          s += `<text x="${x}" y="${(startY + ci * p.size * 275 * 1.06).toFixed(1)}" font-size="${fs}" fill="${cat.c}" text-anchor="middle">${ch}</text>`;
        });
        s += `</g>`;
      } else {
        s += `<text class="${cls}" data-i="${p.i}" data-cat="${p.c}" x="${x}" y="${(parseFloat(y) + p.size * 275 * 0.36).toFixed(1)}" `
          + `font-size="${fs}" fill="${cat.c}" text-anchor="middle" style="animation-delay:${delay}">${p.t}</text>`;
      }
    });

    s += `</svg>`;
    return s;
  }

  return {
    layout, svg, CAT, SHAPE_NAME,
    shapes: () => Object.keys(S),
    insideOf: k => S[k] || S.hill
  };
})();

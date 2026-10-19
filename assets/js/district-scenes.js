/* ==========================================================
   district-scenes.js — 区县风景插画 · 一区一景
   37 个区县各自一道风景：配方(天空/层次/道具/天气) + 图元库组合
   与 stay-art.js 同一体系，viewBox 400×225，可复用 CSS 动画类
   ========================================================== */
window.DistrictScenes = (function () {
  "use strict";
  const F = n => Math.round(n * 10) / 10;
  let UID = 0;
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  /* ---------- 颜色工具 ---------- */
  const hx = c => { if (!c || c[0] !== "#" || c.length < 7) return [120, 130, 140]; const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const to = a => "#" + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const dark = (c, k) => { const [r, g, b] = hx(c); return to([r * (1 - k), g * (1 - k), b * (1 - k)]); };
  const light = (c, k) => { const [r, g, b] = hx(c); return to([r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k]); };
  const warm = (c, k) => { const [r, g, b] = hx(c); return to([r + (255 - r) * k * 1.2, g + (255 - g) * k * .55, b * (1 - k * .35)]); };
  const mix = (c1, c2, k) => { const a = hx(c1), b = hx(c2); return to([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]); };
  // 季节色板：春翠 / 秋金 / 冬雪
  const SEASON = [null, c => mix(c, "#6fae7e", .3), c => mix(c, "#c98a3a", .32), c => mix(c, "#dfe8f2", .38)];

  const grad = (id, c0, c1) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="${c0}"/><stop offset="100%" stop-color="${c1}"/></linearGradient>`;
  const grad2 = (id, c) =>
    `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">` +
    `<stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${c}" stop-opacity="0"/></radialGradient>`;

  /* ---------- 基础图元 ---------- */
  // 远山脊线
  const ridge = (r, c, o) => {
    const { y0 = 120, amp = 34, sd = 1.2 } = o || {};
    let d = `M0,225 L0,${F(y0)}`;
    for (let i = 1; i <= 20; i++) {
      const t = i / 20;
      d += ` L${F(t * 400)},${F(y0 - (Math.sin(t * 5.1 + sd) * .5 + .5) * amp - Math.sin(t * 13 + sd * 3) * amp * .2)}`;
    }
    return `<path d="${d} L400,225 Z" fill="${c}"/>`;
  };
  // 星辰
  const stars = (r, n, col) => {
    let s = "";
    for (let i = 0; i < n; i++) s += `<circle class="sa-star" cx="${F(r() * 400)}" cy="${F(r() * 130)}" r="${F(.5 + r() * 1.1)}" fill="${col || "#cfe0ff"}" opacity="${F(.25 + r() * .5)}" style="animation-delay:${F(r() * 3.2)}s"/>`;
    return s;
  };
  // 月/落日
  const orb = (x, y, rad, col, halo) =>
    `<circle cx="${x}" cy="${y}" r="${rad * 3.2}" fill="${col}" opacity=".10"/>` +
    `<circle cx="${x}" cy="${y}" r="${rad * 1.8}" fill="${col}" opacity=".14"/>` +
    `<circle cx="${x}" cy="${y}" r="${rad}" fill="${col}" opacity=".95"/>`;
  // 雾
  const mist = (r, y, n, col, op) => {
    let s = "";
    for (let i = 0; i < n; i++) {
      const w = 70 + r() * 130, x = r() * 400 - w * .3;
      s += `<ellipse class="sa-mist" cx="${F(x)}" cy="${F(y + (r() - .5) * 14)}" rx="${F(w)}" ry="${F(5 + r() * 8)}" fill="${col}" opacity="${F(op * (.6 + r() * .6))}" style="animation-delay:${F(r() * 6)}s"/>`;
    }
    return s;
  };
  // 水面波光
  const shimmer = (y0, y1, col, n) => {
    let s = "";
    for (let i = 0; i < (n || 22); i++) {
      const t = i / (n || 22), y = y0 + t * (y1 - y0);
      s += `<rect class="sa-shimmer" x="${F(8 + (i * 61) % 360)}" y="${F(y)}" width="${F(18 + (i * 43) % 110)}" height="1.5" fill="${col}" opacity="${F(.08 + (i % 4) * .06)}" style="animation-delay:${F(i * .28)}s"/>`;
    }
    return s;
  };
  // 鸟
  const birds = (x, y, n, col) => {
    let s = "";
    for (let i = 0; i < n; i++) {
      const bx = x + i * 13 + (i % 2) * 5, by = y + (i % 3) * 7;
      s += `<path d="M${F(bx)},${F(by)} q3,-3 6,0 q3,-3 6,0" fill="none" stroke="${col}" stroke-width="1.1" opacity=".55"/>`;
    }
    return s;
  };
  // 松
  const pine = (x, y, s, fill, snow) => {
    let g = `<path d="M${F(x)},${F(y)} L${F(x)},${F(y - 26 * s)}" stroke="${fill}" stroke-width="${F(1.8 * s)}"/>`;
    for (let k = 0; k < 3; k++) {
      const yy = y - 7 * s - k * 8 * s, w = (11 - k * 2.6) * s;
      g += `<path d="M${F(x - w)},${F(yy)} L${F(x)},${F(yy - 13 * s)} L${F(x + w)},${F(yy)} Z" fill="${fill}"/>`;
      if (snow) g += `<path d="M${F(x - w * .8)},${F(yy - 1)} L${F(x)},${F(yy - 13 * s)} L${F(x + w * .8)},${F(yy - 1)}" fill="none" stroke="${snow}" stroke-width="${F(1.5 * s)}" opacity=".9"/>`;
    }
    return g;
  };
  // 吊脚楼群（沿江）
  const town = (r, c, o) => {
    const { x0 = 0, x1 = 400, y = 190, n = 7, s = 1 } = o;
    let g = "";
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), x = x0 + (x1 - x0) * t;
      const w = (16 + r() * 10) * s, h = (20 + r() * 16) * s;
      const base = y + (r() - .5) * 8;
      g += `<rect x="${F(x - w / 2)}" y="${F(base - h)}" width="${F(w)}" height="${F(h)}" fill="${c.wall}"/>`;
      g += `<path d="M${F(x - w / 2 - 3)},${F(base - h)} Q${F(x)},${F(base - h - 9 * s)} ${F(x + w / 2 + 3)},${F(base - h)} L${F(x + w / 2)},${F(base - h + 3)} L${F(x - w / 2)},${F(base - h + 3)} Z" fill="${c.roof}"/>`;
      // 支脚
      const legs = 2 + (i % 2);
      for (let k = 0; k < legs; k++) {
        const lx = x - w / 2 + 3 + k * (w - 6) / (legs - 1 || 1);
        g += `<line x1="${F(lx)}" y1="${F(base)}" x2="${F(lx)}" y2="${F(base + 10 + r() * 8)}" stroke="${c.leg || dark(c.wall, .35)}" stroke-width="1.6"/>`;
      }
      if (r() > .35) g += `<rect x="${F(x - 2)}" y="${F(base - h + 5)}" width="4" height="4.5" fill="${c.win}" opacity=".9"/>`;
      if (r() > .6) g += `<rect x="${F(x - w / 2 + 4)}" y="${F(base - h + 5)}" width="3.4" height="4" fill="${c.win}" opacity=".7"/>`;
    }
    return g;
  };
  // 城市天际线（带亮窗）
  const skyline = (r, c, o) => {
    const { x0 = 0, x1 = 400, y = 196, n = 11, hMin = 34, hMax = 96 } = o;
    let g = "";
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), x = x0 + (x1 - x0) * t;
      const w = 13 + r() * 16, h = hMin + r() * (hMax - hMin);
      const by = y + (r() - .5) * 6;
      g += `<rect x="${F(x - w / 2)}" y="${F(by - h)}" width="${F(w)}" height="${F(h)}" fill="${c.tower}"/>`;
      if (r() > .6) g += `<line x1="${F(x)}" y1="${F(by - h)}" x2="${F(x)}" y2="${F(by - h - 5 - r() * 6)}" stroke="${c.tower}" stroke-width="1.2"/>`;
      const rows = Math.floor(h / 9);
      for (let k = 0; k < rows; k++) {
        for (let m = 0; m < 2; m++) {
          if (r() > .45) g += `<rect x="${F(x - w / 2 + 3 + m * (w / 2 - 1))}" y="${F(by - h + 5 + k * 9)}" width="${F(w / 2 - 4)}" height="3.6" fill="${c.win}" opacity="${F(.35 + r() * .6)}"/>`;
        }
      }
    }
    return g;
  };
  // 喀斯特峰林
  const karst = (r, c, o) => {
    const { x0 = -10, x1 = 410, y = 180, n = 6, h = 80 } = o;
    let g = "";
    for (let i = 0; i < n; i++) {
      const x = x0 + (x1 - x0) * (i / (n - 1)) + (r() - .5) * 16;
      const hh = h * (.55 + r() * .55), w = hh * .36;
      g += `<path d="M${F(x - w)},${F(y)} C${F(x - w * .72)},${F(y - hh * .5)} ${F(x - w * .5)},${F(y - hh * .88)} ${F(x)},${F(y - hh)} C${F(x + w * .5)},${F(y - hh * .88)} ${F(x + w * .72)},${F(y - hh * .5)} ${F(x + w)},${F(y)} Z" fill="${c.mid}"/>`;
      g += `<path d="M${F(x)},${F(y - hh)} C${F(x + w * .5)},${F(y - hh * .88)} ${F(x + w * .72)},${F(y - hh * .5)} ${F(x + w)},${F(y)} L${F(x)},${F(y)} Z" fill="${c.far}" opacity=".5"/>`;
      g += `<path d="M${F(x - w * .95)},${F(y - hh * .17)} Q${F(x)},${F(y - hh * .3)} ${F(x + w * .95)},${F(y - hh * .17)} L${F(x + w * .95)},${F(y - hh * .1)} L${F(x - w * .95)},${F(y - hh * .1)} Z" fill="${c.veg}"/>`;
    }
    return g;
  };
  // 峡谷双崖（江从中间过）
  const gorge = (r, c, o) => {
    const { y = 190, hL = 150, hR = 130, gap = 120, cx = 200 } = o;
    const wall = (x0, x1, h, sd) => {
      let d = `M${F(x0)},225 L${F(x0)},${F(y - h)}`;
      for (let i = 1; i <= 6; i++) {
        const t = i / 6;
        d += ` L${F(x0 + (x1 - x0) * t)},${F(y - h - Math.sin(t * 4 + sd) * 14 - (i % 2) * 6)}`;
      }
      d += ` L${F(x1)},${F(y)} Z`;
      return `<path d="${d}" fill="${c.cliff}"/>`;
    };
    let g = wall(cx - gap - 90, cx - gap / 2, hL, .4) + wall(cx + gap / 2, cx + gap + 90, hR, 2.1);
    // 崖面纹理
    g += `<path d="M${F(cx - gap - 70)},${F(y - hL + 30)} q10,26 -4,50" stroke="${dark(c.cliff, .3)}" stroke-width="2" fill="none" opacity=".5"/>`;
    g += `<path d="M${F(cx + gap + 66)},${F(y - hR + 22)} q-12,22 2,44" stroke="${dark(c.cliff, .3)}" stroke-width="2" fill="none" opacity=".5"/>`;
    // 崖顶植被
    g += `<path d="M${F(cx - gap - 92)},${F(y - hL + 4)} q46,-12 92,2 L${F(cx - gap / 2)},${F(y - hL + 14)} Z" fill="${c.veg}"/>`;
    g += `<path d="M${F(cx + gap / 2)},${F(y - hR + 14)} L${F(cx + gap + 92)},${F(y - hR + 4)} q-46,14 -92,-2 Z" fill="${c.veg}"/>`;
    return g;
  };
  // 天生桥（石拱）
  const arch = (r, c, o) => {
    const { x = 200, y = 196, rad = 46, th = 15 } = o;
    let g = `<path d="M${F(x - rad - th)},${F(y)} L${F(x - rad - th)},${F(y - rad * .8)} A${F(rad + th)},${F(rad + th)} 0 0 1 ${F(x + rad + th)},${F(y - rad * .8)} L${F(x + rad + th)},${F(y)} L${F(x + rad)},${F(y)} L${F(x + rad)},${F(y - rad * .8)} A${F(rad)},${F(rad)} 0 0 0 ${F(x - rad)},${F(y - rad * .8)} L${F(x - rad)},${F(y)} Z" fill="${c.rock}"/>`;
    g += `<path d="M${F(x - rad - th)},${F(y - rad * .8)} A${F(rad + th)},${F(rad + th)} 0 0 1 ${F(x + rad + th)},${F(y - rad * .8)}" fill="none" stroke="${c.far}" stroke-width="2.4" opacity=".6"/>`;
    // 拱顶植被
    g += `<path d="M${F(x - rad - th)},${F(y - rad * .8 - 2)} q${F(rad + th)},-12 ${F((rad + th) * 2)},0 l0,4 q${F(-rad - th)},-8 ${F(-(rad + th) * 2)},0 Z" fill="${c.veg}"/>`;
    return g;
  };
  // 瀑布
  const waterfall = (r, c, o) => {
    const { x = 200, y = 150, w = 26, h = 66 } = o;
    let g = `<path d="M${F(x - w - 26)},225 L${F(x - w - 26)},${F(y - 24)} L${F(x + w + 26)},${F(y - 24)} L${F(x + w + 26)},225 Z" fill="${c.cliff}"/>`;
    g += `<path d="M${F(x - w)},${F(y)} L${F(x - w * .8)},${F(y + h)} L${F(x + w * .8)},${F(y + h)} L${F(x + w)},${F(y)} Z" fill="${c.foam}" opacity=".95"/>`;
    g += `<path d="M${F(x - w * .4)},${F(y)} L${F(x - w * .3)},${F(y + h)} L${F(x + w * .3)},${F(y + h)} L${F(x + w * .4)},${F(y)} Z" fill="#ffffff" opacity=".55"/>`;
    g += `<ellipse cx="${F(x)}" cy="${F(y + h + 3)}" rx="${F(w * 1.9)}" ry="${F(6 + r() * 3)}" fill="${c.foam}" opacity=".8"/>`;
    for (let i = 0; i < 6; i++) g += `<circle class="sa-fly" cx="${F(x + (r() - .5) * w * 1.4)}" cy="${F(y + h * (.5 + r() * .5))}" r="${F(.8 + r() * 1.4)}" fill="#fff" opacity="${F(.3 + r() * .4)}" style="animation-delay:${F(r() * 2)}s"/>`;
    return g;
  };
  // 茶山梯行
  const tea = (r, c, o) => {
    const { y = 200, rows = 6 } = o;
    let g = "";
    for (let i = 0; i < rows; i++) {
      const yy = y - i * 11;
      g += `<path d="M-10,${F(yy)} Q100,${F(yy - 7 - r() * 4)} 200,${F(yy - 2)} T410,${F(yy - 6)} L410,${F(yy + 9)} Q200,${F(yy + 14)} -10,${F(yy + 9)} Z" fill="${i % 2 ? c.mid : c.far}"/>`;
      for (let k = 0; k < 9; k++) g += `<circle cx="${F(-6 + k * 48 + (i % 2) * 22)}" cy="${F(yy - 1 + Math.sin(k + i) * 2)}" r="2.6" fill="${c.veg}" opacity=".8"/>`;
    }
    return g;
  };
  // 花海
  const flowerSea = (r, c, o) => {
    const { y = 196, col = c.veg } = o;
    let g = `<path d="M-10,225 L-10,${F(y)} Q200,${F(y - 16)} 410,${F(y + 4)} L410,225 Z" fill="${c.mid}"/>`;
    for (let i = 0; i < 90; i++) {
      const x = r() * 400, yy = y + 4 + r() * 24;
      g += `<circle cx="${F(x)}" cy="${F(yy)}" r="${F(1 + r() * 1.8)}" fill="${col}" opacity="${F(.5 + r() * .5)}"/>`;
    }
    for (let i = 0; i < 26; i++) {
      const x = 10 + r() * 380, yy = y + 12 + r() * 14;
      g += `<g opacity=".9"><line x1="${F(x)}" y1="${F(yy + 5)}" x2="${F(x)}" y2="${F(yy)}" stroke="${dark(col, .4)}" stroke-width="1"/>` +
        `<circle cx="${F(x)}" cy="${F(yy - 1)}" r="2.6" fill="${col}"/><circle cx="${F(x - 2.4)}" cy="${F(yy)}" r="1.9" fill="${light(col, .25)}"/><circle cx="${F(x + 2.4)}" cy="${F(yy)}" r="1.9" fill="${light(col, .25)}"/></g>`;
    }
    return g;
  };
  // 竹林
  const bamboo = (r, c, o) => {
    const { x0 = 0, x1 = 400, y = 225, n = 22, hMin = 60, hMax = 130 } = o;
    let g = "";
    for (let i = 0; i < n; i++) {
      const x = x0 + (x1 - x0) * (i / n) + r() * 10;
      const h = hMin + r() * (hMax - hMin), w = 1.6 + r() * 1.6;
      g += `<line x1="${F(x)}" y1="${F(y)}" x2="${F(x + (r() - .5) * 10)}" y2="${F(y - h)}" stroke="${i % 3 ? c.mid : c.far}" stroke-width="${F(w)}" opacity=".9"/>`;
      for (let k = 1; k <= 3; k++) {
        const ly = y - h * (k / 4);
        g += `<path d="M${F(x + (r() - .5) * 4)},${F(ly)} q${F(6 + r() * 6)},-4 ${F(12 + r() * 6)},1" stroke="${c.veg}" stroke-width="2" fill="none" opacity=".8"/>`;
      }
    }
    return g;
  };
  // 草场 + 牛
  const grass = (r, c, o) => {
    const { y = 196 } = o;
    let g = `<path d="M-10,225 L-10,${F(y)} Q120,${F(y - 20)} 210,${F(y - 8)} T410,${F(y - 12)} L410,225 Z" fill="${c.mid}"/>`;
    g += `<path d="M-10,225 L-10,${F(y + 14)} Q160,${F(y - 2)} 410,${F(y + 10)} L410,225 Z" fill="${c.far}" opacity=".8"/>`;
    for (let i = 0; i < 5; i++) {
      const x = 30 + r() * 340, yy = y + 16 + r() * 12, s = 2.2 + r() * 1.6;
      g += `<g fill="${dark(c.far, .45)}"><ellipse cx="${F(x)}" cy="${F(yy)}" rx="${F(5 * s)}" ry="${F(2.6 * s)}"/>` +
        `<circle cx="${F(x + 5 * s)}" cy="${F(yy - 2.2 * s)}" r="${F(1.5 * s)}"/>` +
        `<line x1="${F(x - 2 * s)}" y1="${F(yy + 2.4 * s)}" x2="${F(x - 2 * s)}" y2="${F(yy + 4.6 * s)}" stroke="${dark(c.far, .45)}" stroke-width="1"/>` +
        `<line x1="${F(x + 2 * s)}" y1="${F(yy + 2.4 * s)}" x2="${F(x + 2 * s)}" y2="${F(yy + 4.6 * s)}" stroke="${dark(c.far, .45)}" stroke-width="1"/></g>`;
    }
    return g;
  };
  // 江边宝塔（石宝寨式）
  const pagoda = (r, c, o) => {
    const { x = 330, y = 205, levels = 8, w = 13 } = o;
    let g = `<rect x="${F(x - w * .8)}" y="${F(y - 8)}" width="${F(w * 1.6)}" height="10" fill="${dark(c.rock, .2)}"/>`;
    for (let i = 0; i < levels; i++) {
      const yy = y - 8 - i * 11, ww = w * (1 - i * .07);
      g += `<rect x="${F(x - ww / 2)}" y="${F(yy - 10)}" width="${F(ww)}" height="10" fill="${i % 2 ? c.rock : light(c.rock, .12)}"/>`;
      g += `<path d="M${F(x - ww / 2 - 3)},${F(yy - 10)} Q${F(x)},${F(yy - 15)} ${F(x + ww / 2 + 3)},${F(yy - 10)} L${F(x + ww / 2)},${F(yy - 8)} L${F(x - ww / 2)},${F(yy - 8)} Z" fill="${c.roof}"/>`;
      if (i % 2 === 0) g += `<rect x="${F(x - 1.4)}" y="${F(yy - 8)}" width="2.8" height="3" fill="${c.win}" opacity=".85"/>`;
    }
    g += `<path d="M${F(x)},${F(y - 8 - levels * 11 - 2)} l0,-7" stroke="${c.roof}" stroke-width="1.6"/><circle cx="${F(x)}" cy="${F(y - 8 - levels * 11 - 9)}" r="1.8" fill="${c.win}"/>`;
    return g;
  };
  // 崖畔庙宇（丰都/白帝城/张飞庙）
  const cliffTemple = (r, c, o) => {
    const { x = 200, y = 150, n = 3 } = o;
    let g = "";
    for (let i = 0; i < n; i++) {
      const w = 30 - i * 4, xx = x + (i - (n - 1) / 2) * 26, yy = y + i * 8;
      g += `<rect x="${F(xx - w / 2)}" y="${F(yy - 12)}" width="${F(w)}" height="12" fill="${c.wall}"/>`;
      g += `<path d="M${F(xx - w / 2 - 4)},${F(yy - 12)} Q${F(xx)},${F(yy - 20)} ${F(x + w / 2 + 4)},${F(yy - 12)} L${F(xx + w / 2)},${F(yy - 10)} L${F(xx - w / 2)},${F(yy - 10)} Z" fill="${c.roof}"/>`;
      g += `<rect x="${F(xx - 2)}" y="${F(yy - 9)}" width="4" height="6" fill="${c.win}" opacity=".9"/>`;
      g += `<line x1="${F(xx)}" y1="${F(yy - 12)}" x2="${F(xx)}" y2="${F(yy - 22)}" stroke="${c.roof}" stroke-width="1"/>`;
    }
    return g;
  };
  // 烽火龙舞（铜梁）
  const dragonFire = (r, c, o) => {
    const { cx = 200, cy = 170, len = 130 } = o;
    let d = `M${F(cx - len / 2)},${F(cy + 10)}`;
    for (let i = 1; i <= 8; i++) d += ` Q${F(cx - len / 2 + i * len / 8)},${F(cy - 16 - Math.sin(i * 1.4) * 12)} ${F(cx - len / 2 + i * len / 8 + 4)},${F(cy - 6 - Math.sin(i * 1.4) * 10)}`;
    let g = `<path d="${d}" fill="none" stroke="${c.dragon}" stroke-width="4.5" stroke-linecap="round"/>`;
    g += `<path d="${d}" fill="none" stroke="${light(c.dragon, .35)}" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    g += `<circle cx="${F(cx + len / 2 + 6)}" cy="${F(cy - 10)}" r="6" fill="${c.dragon}"/>` +
      `<circle cx="${F(cx + len / 2 + 8)}" cy="${F(cy - 11)}" r="1.4" fill="#fff"/>` +
      `<path d="M${F(cx + len / 2 + 11)},${F(cy - 14)} q6,-4 9,1 q-5,3 -9,-1 Z" fill="${light(c.dragon, .3)}"/>`;
    // 举杆人
    for (let k = 0; k < 5; k++) {
      const px = cx - len / 2 + 14 + k * (len - 28) / 4, py = cy + 26;
      g += `<g fill="${dark(c.ground, .4)}"><circle cx="${F(px)}" cy="${F(py - 12)}" r="2.6"/><rect x="${F(px - 2.2)}" y="${F(py - 10)}" width="4.4" height="10" rx="1.4"/></g>`;
      g += `<line x1="${F(px)}" y1="${F(py - 10)}" x2="${F(px)}" y2="${F(cy - 6 - Math.sin((k + 1) * 1.4) * 10)}" stroke="${dark(c.ground, .4)}" stroke-width="1.1"/>`;
    }
    // 铁水花
    for (let i = 0; i < 34; i++) {
      g += `<circle class="sa-fly" cx="${F(cx - 70 + r() * 140)}" cy="${F(cy - 40 + r() * 60)}" r="${F(.7 + r() * 1.7)}" fill="${i % 3 ? "#ffd76a" : "#ff9a3c"}" opacity="${F(.5 + r() * .5)}" style="animation-delay:${F(r() * 1.6)}s"/>`;
    }
    return g;
  };
  // 工业遗存（重钢）
  const factory = (r, c, o) => {
    const { x = 120, y = 205 } = o;
    let g = `<rect x="${F(x - 60)}" y="${F(y - 26)}" width="120" height="26" fill="${c.mid}"/>`;
    g += `<rect x="${F(x - 46)}" y="${F(y - 62)}" width="10" height="62" fill="${dark(c.mid, .25)}"/>`;
    g += `<rect x="${F(x - 28)}" y="${F(y - 74)}" width="7" height="74" fill="${dark(c.mid, .25)}"/>`;
    g += `<path d="M${F(x + 6)},${F(y - 40)} l26,-18 l4,5 l-26,18 Z" fill="${dark(c.mid, .15)}"/>`;
    g += `<path d="M${F(x + 30)},${F(y - 58)} l0,-22 l3,0 l0,22 Z" fill="${dark(c.mid, .25)}"/>`;
    g += `<rect x="${F(x + 40)}" y="${F(y - 46)}" width="22" height="46" fill="${dark(c.mid, .35)}"/>`;
    for (let i = 0; i < 4; i++) g += `<rect x="${F(x + 44 + i * 5)}" y="${F(y - 40 + i * 3)}" width="3" height="4" fill="${c.win}" opacity=".8"/>`;
    // 锈色管道
    g += `<path d="M${F(x - 60)},${F(y - 18)} q30,-8 60,0 t60,0" stroke="${c.rust}" stroke-width="2.4" fill="none" opacity=".85"/>`;
    return g;
  };
  // 湖岛（长寿湖/小南海）
  const isles = (r, c, o) => {
    const { y = 196 } = o;
    let g = `<path d="M-10,225 L-10,${F(y)} Q200,${F(y - 10)} 410,${F(y)} L410,225 Z" fill="${c.water}"/>`;
    const spots = [[60, 8], [130, 12], [210, 9], [280, 13], [350, 7]];
    spots.forEach(([x, s], i) => {
      g += `<path d="M${F(x - s * 2)},${F(y + 2)} q${F(s * 2)},-${F(s + 3)} ${F(s * 4)},0 q${F(-s * 2)},3 ${F(-s * 4)},0 Z" fill="${c.isle}"/>`;
      g += `<path d="M${F(x - 3)},${F(y - 1)} q3,-9 6,0 q-3,3 -6,0 Z" fill="${c.veg}"/>`;
      g += `<path d="M${F(x + 3)},${F(y - 1)} q4,-12 8,0 q-4,4 -8,0 Z" fill="${dark(c.veg, .12)}"/>`;
    });
    return g;
  };
  // 悬崖古城墙（钓鱼城）
  const fort = (r, c, o) => {
    const { x0 = 40, x1 = 360, y = 160 } = o;
    let g = `<path d="M${F(x0)},225 L${F(x0)},${F(y)} Q${F((x0 + x1) / 2)},${F(y - 26)} ${F(x1)},${F(y)} L${F(x1)},225 Z" fill="${c.cliff}"/>`;
    g += `<path d="M${F(x0 - 6)},${F(y)} Q${F((x0 + x1) / 2)},${F(y - 26)} ${F(x1 + 6)},${F(y)} L${F(x1 + 6)},${F(y - 7)} Q${F((x0 + x1) / 2)},${F(y - 32)} ${F(x0 - 6)},${F(y - 7)} Z" fill="${c.wall}"/>`;
    for (let i = x0; i <= x1; i += 14) g += `<rect x="${F(i)}" y="${F(y - 12)}" width="8" height="6" fill="${c.wall}"/>`;
    g += `<rect x="${F((x0 + x1) / 2 - 8)}" y="${F(y - 24)}" width="16" height="17" fill="${dark(c.wall, .18)}"/>`;
    g += `<path d="M${F((x0 + x1) / 2 - 12)},${F(y - 24)} Q${F((x0 + x1) / 2)},${F(y - 34)} ${F((x0 + x1) / 2 + 12)},${F(y - 24)} Z" fill="${c.roof}"/>`;
    return g;
  };
  // 跨江索道
  const cable = (r, c, o) => {
    const { x0 = 20, x1 = 380, y0 = 60, y1 = 150 } = o;
    const line = c.line || "#8a9ab0", car = c.car || "#d8e2ee";
    let g = `<line x1="${F(x0)}" y1="${F(y0)}" x2="${F(x1)}" y2="${F(y1)}" stroke="${line}" stroke-width="1.2" opacity=".8"/>`;
    for (let k = 1; k <= 3; k++) {
      const t = k / 4, cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t;
      g += `<line x1="${F(cx)}" y1="${F(cy)}" x2="${F(cx)}" y2="${F(cy + 26)}" stroke="${line}" stroke-width="1"/>` +
        `<g class="sa-cable" style="animation-delay:${F(k * .8)}s"><rect x="${F(cx - 7)}" y="${F(cy + 26)}" width="14" height="11" rx="2.4" fill="${car}"/>` +
        `<rect x="${F(cx - 5)}" y="${F(cy + 28.5)}" width="10" height="4" fill="${c.win || "#ffbe6e"}" opacity=".9"/></g>`;
    }
    g += `<rect x="${F(x0 - 3)}" y="${F(y0 - 16)}" width="6" height="16" fill="${dark(line, .2)}"/>`;
    g += `<rect x="${F(x1 - 3)}" y="${F(y1 - 12)}" width="6" height="12" fill="${dark(line, .2)}"/>`;
    return g;
  };
  // 盐灶（巫溪宁厂）
  const saltPan = (r, c, o) => {
    const { y = 200 } = o;
    let g = "";
    for (let i = 0; i < 4; i++) {
      const x = 60 + i * 80, yy = y + (i % 2) * 8;
      g += `<rect x="${F(x)}" y="${F(yy)}" width="62" height="10" rx="2" fill="${c.pan}"/>`;
      g += `<ellipse cx="${F(x + 31)}" cy="${F(yy + 2)}" rx="26" ry="3" fill="${light(c.pan, .3)}" opacity=".8"/>`;
      g += `<ellipse class="sa-steam" cx="${F(x + 31)}" cy="${F(yy - 6)}" rx="14" ry="5" fill="#dfe8f2" opacity=".22" style="animation-delay:${F(i * .9)}s"/>`;
    }
    for (let i = 0; i < 3; i++) {
      const x = 90 + i * 90;
      g += `<rect x="${F(x)}" y="${F(y - 30)}" width="8" height="30" fill="${dark(c.pan, .35)}"/>`;
      g += `<ellipse class="sa-steam" cx="${F(x + 4)}" cy="${F(y - 34)}" rx="7" ry="4" fill="#e8eef5" opacity=".3" style="animation-delay:${F(i * 1.2)}s"/>`;
    }
    return g;
  };
  // 风雨廊桥
  const corridor = (r, c, o) => {
    const { x = 200, y = 196, span = 90 } = o;
    let g = `<path d="M${F(x - span / 2 - 8)},${F(y)} L${F(x + span / 2 + 8)},${F(y)} L${F(x + span / 2 - 6)},${F(y - 9)} L${F(x - span / 2 + 6)},${F(y - 9)} Z" fill="${c.wood}"/>`;
    for (let i = 0; i <= 8; i++) {
      const t = i / 8, px = x - span / 2 + span * t, ph = 16 + Math.sin(t * Math.PI) * 7;
      g += `<line x1="${F(px)}" y1="${F(y - 9)}" x2="${F(px)}" y2="${F(y - 9 - ph)}" stroke="${dark(c.wood, .3)}" stroke-width="1.6"/>`;
    }
    g += `<path d="M${F(x - span / 2 - 6)},${F(y - 25)} Q${F(x)},${F(y - 33)} ${F(x + span / 2 + 6)},${F(y - 25)} L${F(x + span / 2 + 2)},${F(y - 21)} Q${F(x)},${F(y - 29)} ${F(x - span / 2 - 2)},${F(y - 21)} Z" fill="${c.roof}"/>`;
    g += `<path d="M${F(x - span / 2 - 6)},${F(y - 25)} Q${F(x)},${F(y - 33)} ${F(x + span / 2 + 6)},${F(y - 25)}" fill="none" stroke="${dark(c.roof, .25)}" stroke-width="1" opacity=".7"/>`;
    for (let i = 1; i < 8; i += 2) g += `<rect x="${F(x - span / 2 + span * (i / 8) - 3)}" y="${F(y - 19)}" width="6" height="8" fill="${c.win}" opacity=".75"/>`;
    return g;
  };
  // 苗族银饰纹样
  const silver = (r, c, o) => {
    const { x = 90, y = 205, s = 1.4 } = o;
    let g = `<g opacity=".95">`;
    g += `<path d="M${F(x)},${F(y - 34 * s)} q${F(16 * s)},${F(10 * s)} ${F(10 * s)},${F(26 * s)} q-${F(6 * s)},${F(10 * s)} -${F(10 * s)},${F(8 * s)} q-${F(4 * s)},-${F(16 * s)} ${F(0)},-${F(34 * s)} Z" fill="${c.silver}"/>`;
    for (let i = 0; i < 5; i++) {
      const yy = y - 30 * s + i * 7 * s;
      g += `<path d="M${F(x + 2 * s)},${F(yy)} q${F(9 * s)},-${F(3 * s)} ${F(16 * s)},0" stroke="${dark(c.silver, .3)}" stroke-width="1" fill="none"/>`;
      g += `<circle cx="${F(x + 4 * s)}" cy="${F(yy + 1)}" r="${F(1.1 * s)}" fill="${dark(c.silver, .35)}"/>`;
    }
    // 垂坠银铃
    for (let i = 0; i < 4; i++) {
      const sx = x + 3 * s + i * 5 * s, sy = y - 2 * s + i * 2 * s;
      g += `<line x1="${F(sx)}" y1="${F(sy)}" x2="${F(sx)}" y2="${F(sy + 4 * s)}" stroke="${dark(c.silver, .25)}" stroke-width=".8"/>` +
        `<circle cx="${F(sx)}" cy="${F(sy + 5.4 * s)}" r="${F(1.5 * s)}" fill="${light(c.silver, .2)}"/>`;
    }
    g += `</g>`;
    // 远处苗楼（吊脚楼顶角翘起）
    g += `<g><path d="M${F(x + 40)},${F(y)} l0,-16 l22,0 l0,16 Z" fill="${c.wall}"/>` +
      `<path d="M${F(x + 34)},${F(y - 16)} q11,-8 22,0 l4,3 l-30,0 Z" fill="${c.roof}"/></g>`;
    return g;
  };
  // 火塘腊肉（大巴山）
  const earthen = (r, c, o) => {
    const { x = 200, y = 210 } = o;
    let g = `<path d="M${F(x - 34)},${F(y)} L${F(x + 34)},${F(y)} L${F(x + 26)},${F(y - 26)} L${F(x - 26)},${F(y - 26)} Z" fill="${dark(c.wood, .2)}"/>`;
    g += `<path d="M${F(x - 30)},${F(y - 26)} L${F(x + 30)},${F(y - 26)} L${F(x + 22)},${F(y - 44)} L${F(x - 22)},${F(y - 44)} Z" fill="${c.wood}"/>`;
    g += `<path d="M${F(x - 26)},${F(y - 44)} Q${F(x)},${F(y - 58)} ${F(x + 26)},${F(y - 44)} L${F(x + 22)},${F(y - 40)} L${F(x - 22)},${F(y - 40)} Z" fill="${dark(c.wood, .3)}"/>`;
    // 火塘
    g += `<ellipse cx="${F(x)}" cy="${F(y - 4)}" rx="14" ry="4" fill="${dark(c.wood, .5)}"/>`;
    for (let i = 0; i < 5; i++) {
      g += `<line x1="${F(x - 8 + i * 4)}" y1="${F(y - 4)}" x2="${F(x - 11 + i * 5)}" y2="${F(y - 12)}" stroke="#6a4a2c" stroke-width="1.6"/>`;
    }
    g += `<path class="sa-flick" d="M${F(x)},${F(y - 12)} q4,-9 0,-16 q-5,6 0,16 q-4,-5 -1,-11 q4,4 1,11 Z" fill="#ff9a3c" opacity=".9"/>`;
    g += `<circle class="sa-flick" cx="${F(x)}" cy="${F(y - 18)}" r="6" fill="#ffb765" opacity=".18" style="animation-delay:.4s"/>`;
    // 挂腊肉
    for (let i = 0; i < 3; i++) {
      const mx = x - 14 + i * 14;
      g += `<line x1="${F(mx)}" y1="${F(y - 40)}" x2="${F(mx)}" y2="${F(y - 32)}" stroke="#3a2c1c" stroke-width="1"/>` +
        `<rect x="${F(mx - 3)}" y="${F(y - 32)}" width="6" height="11" rx="2.6" fill="#7a3a26"/>` +
        `<rect x="${F(mx - 3)}" y="${F(y - 29)}" width="6" height="1.6" fill="#c98a5a" opacity=".8"/>`;
    }
    return g;
  };
  // 梯田
  const terrace = (r, c, o) => {
    const { y = 210, rows = 5 } = o;
    let g = "";
    for (let i = 0; i < rows; i++) {
      const yy = y - i * 13;
      g += `<path d="M-10,${F(yy)} Q90,${F(yy - 9)} 200,${F(yy - 3)} T410,${F(yy - 8)} L410,${F(yy + 10)} Q200,${F(yy + 16)} -10,${F(yy + 10)} Z" fill="${i % 2 ? c.mid : c.far}"/>`;
      g += `<path d="M-10,${F(yy + 1)} Q90,${F(yy - 8)} 200,${F(yy - 2)} T410,${F(yy - 7)}" stroke="${light(c.water, .35)}" stroke-width="1.6" fill="none" opacity=".7"/>`;
    }
    return g;
  };
  // 温泉蒸汽
  const steam = (r, c, o) => {
    const { y = 205 } = o;
    let g = `<path d="M-10,225 L-10,${F(y)} Q200,${F(y - 8)} 410,${F(y + 2)} L410,225 Z" fill="${c.water}"/>`;
    for (let i = 0; i < 4; i++) {
      const x = 50 + i * 95 + r() * 20;
      g += `<ellipse cx="${F(x)}" cy="${F(y + 6)}" rx="${F(20 + r() * 12)}" ry="5" fill="${light(c.water, .3)}" opacity=".55"/>`;
      g += `<ellipse class="sa-steam" cx="${F(x)}" cy="${F(y - 12)}" rx="${F(12 + r() * 10)}" ry="${F(8 + r() * 6)}" fill="#e6eef7" opacity="${F(.16 + r() * .12)}" style="animation-delay:${F(i * .7)}s"/>`;
    }
    return g;
  };
  // 涂鸦墙（黄桷坪）
  const graffiti = (r, c, o) => {
    const { x0 = 0, x1 = 400, y = 200, h = 56 } = o;
    const cols = ["#ff4d6d", "#ffd166", "#06d6a0", "#4cc9f0", "#b388ff", "#ff8fab"];
    let g = `<rect x="${F(x0)}" y="${F(y - h)}" width="${F(x1 - x0)}" height="${F(h + 25)}" fill="${c.wall}"/>`;
    for (let i = 0; i < 26; i++) {
      const col = cols[Math.floor(r() * cols.length)];
      const bx = x0 + r() * (x1 - x0 - 26), by = y - h + r() * (h - 10);
      const kind = r();
      if (kind > .6) g += `<circle cx="${F(bx)}" cy="${F(by)}" r="${F(3 + r() * 7)}" fill="none" stroke="${col}" stroke-width="2.4" opacity=".9"/>`;
      else if (kind > .3) g += `<path d="M${F(bx)},${F(by)} q${F(8 + r() * 14)},-${F(8 + r() * 12)} ${F(16 + r() * 10)},0" stroke="${col}" stroke-width="2.6" fill="none" opacity=".9"/>`;
      else g += `<rect x="${F(bx)}" y="${F(by)}" width="${F(6 + r() * 12)}" height="${F(4 + r() * 8)}" rx="1.6" fill="${col}" opacity=".85"/>`;
    }
    return g;
  };
  // 城门楼（边城/古城门）
  const gate = (r, c, o) => {
    const { x = 200, y = 205, w = 46 } = o;
    let g = `<rect x="${F(x - w / 2)}" y="${F(y - 34)}" width="${F(w)}" height="34" fill="${c.wall}"/>`;
    g += `<path d="M${F(x - w / 2 - 6)},${F(y - 34)} L${F(x + w / 2 + 6)},${F(y - 34)} L${F(x + w / 2 - 2)},${F(y - 44)} L${F(x - w / 2 + 2)},${F(y - 44)} Z" fill="${c.roof}"/>`;
    g += `<path d="M${F(x - w / 2 - 8)},${F(y - 44)} Q${F(x)},${F(y - 54)} ${F(x + w / 2 + 8)},${F(y - 44)} L${F(x + w / 2 + 2)},${F(y - 41)} L${F(x - w / 2 - 2)},${F(y - 41)} Z" fill="${dark(c.roof, .15)}"/>`;
    g += `<path d="M${F(x - 8)},${F(y)} L${F(x - 8)},${F(y - 20)} L${F(x + 8)},${F(y - 20)} L${F(x + 8)},${F(y)} Z" fill="${dark(c.wall, .45)}"/>`;
    g += `<rect x="${F(x - 4)}" y="${F(y - 16)}" width="8" height="5" rx="1" fill="${c.win}" opacity=".9"/>`;
    for (let i = 0; i < 3; i++) g += `<circle cx="${F(x - 16 + i * 16)}" cy="${F(y - 39)}" r="1.6" fill="${c.win}" opacity=".85"/>`;
    return g;
  };
  // 雪松林（大巴山/仙女山冬）
  const snowForest = (r, c, o) => {
    const { y = 205, n = 14 } = o;
    let g = `<path d="M-10,225 L-10,${F(y)} Q200,${F(y - 12)} 410,${F(y + 2)} L410,225 Z" fill="${c.snow}"/>`;
    for (let i = 0; i < n; i++) {
      const x = r() * 400, s = .8 + r() * 1.1;
      g += pine(x, y + 6 + r() * 16, s, dark(c.tree, .1), "#eef4fb");
    }
    return g;
  };
  // 溶洞洞口（芙蓉洞/桃花源）
  const cave = (r, c, o) => {
    const { x = 200, y = 205, w = 40, h = 44 } = o;
    let g = `<path d="M-10,225 L-10,${F(y)} Q${F(x - w - 30)},${F(y - 6)} ${F(x - w)},${F(y - h * .5)} L${F(x - w)},${F(y - h * .5)} Q${F(x)},${F(y - h * 1.5)} ${F(x + w)},${F(y - h * .5)} L${F(x + w)},${F(y)} Q${F(x + w + 30)},${F(y - 6)} 410,${F(y + 2)} L410,225 Z" fill="${c.cliff}"/>`;
    g += `<path d="M${F(x - w)},${F(y)} Q${F(x - w)},${F(y - h * 1.35)} ${F(x)},${F(y - h * 1.35)} Q${F(x + w)},${F(y - h * 1.35)} ${F(x + w)},${F(y)} Z" fill="${dark(c.cliff, .6)}"/>`;
    // 钟乳石
    for (let i = 0; i < 6; i++) {
      const sx = x - w + 6 + i * ((w * 2 - 12) / 5), sh = 8 + r() * 14;
      g += `<path d="M${F(sx)},${F(y - h * 1.35 + 4)} q${F(3 + r() * 3)},${F(sh * .5)} 0,${F(sh)} q${F(-3 - r() * 3)},${F(-sh * .5)} 0,${F(-sh)} Z" fill="${light(c.cliff, .18)}" opacity=".85"/>`;
    }
    g += `<ellipse cx="${F(x)}" cy="${F(y - h * .8)}" rx="${F(w * .8)}" ry="${F(h * .3)}" fill="${c.glow}" opacity=".18"/>`;
    return g;
  };
  // 桃花林（桃花源）
  const peach = (r, c, o) => {
    const { y = 200, n = 7 } = o;
    let g = `<path d="M-10,225 L-10,${F(y)} Q200,${F(y - 10)} 410,${F(y + 4)} L410,225 Z" fill="${c.mid}"/>`;
    for (let i = 0; i < n; i++) {
      const x = 20 + i * 58 + r() * 16, s = .9 + r() * .8;
      g += `<path d="M${F(x - 2 * s)},${F(y + 6)} q${F(2 * s)},-${F(20 * s)} ${F(4 * s)},${F(-26 * s)}" stroke="#4b3a28" stroke-width="${F(3 * s)}" fill="none"/>`;
      for (let k = 0; k < 3; k++) {
        g += `<ellipse cx="${F(x + (r() - .5) * 22 * s)}" cy="${F(y - 18 * s + (r() - .5) * 12 * s)}" rx="${F((9 + r() * 6) * s)}" ry="${F((6 + r() * 4) * s)}" fill="${k ? light(c.bloom, .18) : c.bloom}" opacity=".92"/>`;
      }
    }
    return g;
  };
  // 摩崖石刻龛（大足）
  const niches = (r, c, o) => {
    const { y = 205, n = 4 } = o;
    let g = `<path d="M-10,225 L-10,${F(y - 30)} Q200,${F(y - 44)} 410,${F(y - 26)} L410,225 Z" fill="${c.cliff}"/>`;
    for (let i = 0; i < n; i++) {
      const x = 46 + i * 104 + (r() - .5) * 10, s = 1 + r() * .5;
      g += `<ellipse cx="${F(x)}" cy="${F(y - 8)}" rx="${F(11 * s)}" ry="${F(16 * s)}" fill="${dark(c.cliff, .45)}"/>`;
      // 佛身
      g += `<circle cx="${F(x)}" cy="${F(y - 16 * s)}" r="${F(4 * s)}" fill="${light(c.stone, .3)}"/>` +
        `<path d="M${F(x)},${F(y - 12 * s)} q${F(7 * s)},${F(4 * s)} ${F(5 * s)},${F(14 * s)} l${F(-10 * s)},0 q${F(-2 * s)},-${F(10 * s)} ${F(5 * s)},-${F(14 * s)} Z" fill="${c.stone}"/>`;
      // 背光
      g += `<circle cx="${F(x)}" cy="${F(y - 13 * s)}" r="${F(9 * s)}" fill="none" stroke="${light(c.stone, .35)}" stroke-width="1" opacity=".6"/>`;
    }
    // 千手观音放射线
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g += `<line x1="${F(200 + Math.cos(a) * 8)}" y1="${F(y - 13 + Math.sin(a) * 8)}" x2="${F(200 + Math.cos(a) * 17)}" y2="${F(y - 13 + Math.sin(a) * 17)}" stroke="${light(c.stone, .4)}" stroke-width="1" opacity=".55"/>`;
    }
    return g;
  };
  // 水下碑林（白鹤梁）
  const steleWater = (r, c, o) => {
    const { y = 205 } = o;
    let g = `<path d="M-10,225 L-10,${F(y)} Q200,${F(y - 8)} 410,${F(y + 3)} L410,225 Z" fill="${c.water}"/>`;
    for (let i = 0; i < 5; i++) {
      const x = 50 + i * 74 + r() * 10, h = 26 + r() * 14;
      g += `<rect x="${F(x)}" y="${F(y - h + 12)}" width="9" height="${F(h)}" rx="1.4" fill="${c.stone}" opacity=".92"/>`;
      g += `<rect x="${F(x + 1.6)}" y="${F(y - h + 17)}" width="5.8" height="${F(h - 10)}" fill="${dark(c.stone, .3)}" opacity=".6"/>`;
    }
    for (let i = 0; i < 3; i++) {
      const x = 80 + r() * 240;
      g += `<path class="sa-fly" d="M${F(x)},${F(y + 6 + r() * 14)} q4,-3 8,0 q4,-3 8,0" fill="none" stroke="${light(c.water, .4)}" stroke-width="1.2" opacity=".7" style="animation-delay:${F(r() * 2)}s"/>`;
    }
    return g;
  };
  // 脐橙林（奉节）
  const orange = (r, c, o) => {
    const { y = 202, n = 5 } = o;
    let g = `<path d="M-10,225 L-10,${F(y)} Q200,${F(y - 12)} 410,${F(y + 4)} L410,225 Z" fill="${c.mid}"/>`;
    for (let i = 0; i < n; i++) {
      const x = 34 + i * 80 + r() * 12, s = 1 + r() * .5;
      g += `<rect x="${F(x - 1.6 * s)}" y="${F(y - 10 * s)}" width="${F(3.2 * s)}" height="${F(12 * s)}" fill="#4b3a28"/>`;
      g += `<circle cx="${F(x)}" cy="${F(y - 16 * s)}" r="${F(9 * s)}" fill="${c.leaf}"/>`;
      g += `<circle cx="${F(x - 6 * s)}" cy="${F(y - 12 * s)}" r="${F(6 * s)}" fill="${dark(c.leaf, .1)}"/>`;
      g += `<circle cx="${F(x + 6 * s)}" cy="${F(y - 13 * s)}" r="${F(6 * s)}" fill="${dark(c.leaf, .1)}"/>`;
      for (let k = 0; k < 4; k++) g += `<circle cx="${F(x + (r() - .5) * 15 * s)}" cy="${F(y - 15 * s + (r() - .5) * 8 * s)}" r="${F(2.2 * s)}" fill="${c.fruit}"/>`;
    }
    return g;
  };
  // 飞机（渝北机场）
  const plane = (r, c, o) => {
    const { x = 320, y = 58 } = o;
    return `<g class="sa-fly" opacity=".95" style="animation-delay:.6s">` +
      `<path d="M${F(x - 20)},${F(y)} q10,-3 22,-1 l14,1 q3,0 3,2.4 l0,1.2 q0,2.4 -3,2.4 l-14,1 q-12,2 -22,-1 q-4,-2 0,-6 Z" fill="${c.plane}"/>` +
      `<path d="M${F(x - 4)},${F(y + 1)} l-8,9 l4,1 l8,-7 Z" fill="${dark(c.plane, .2)}"/>` +
      `<path d="M${F(x + 2)},${F(y - 1)} l-4,-8 l3,-1 l6,7 Z" fill="${dark(c.plane, .2)}"/>` +
      `<circle cx="${F(x + 16)}" cy="${F(y + 2)}" r="1.2" fill="${c.win}"/></g>`;
  };
  // 书堆（大学城）
  const books = (r, c, o) => {
    const { x = 340, y = 214 } = o;
    let g = "";
    const cols = ["#c0453a", "#2f5f8f", "#3f7a52", "#8f6b2f"];
    for (let i = 0; i < 3; i++) {
      const w = 30 - i * 5, h = 5 + i * 1.5;
      g += `<rect x="${F(x - w / 2)}" y="${F(y - (i + 1) * (h + 1))}" width="${F(w)}" height="${F(h)}" rx="1" fill="${cols[i % 4]}"/>`;
      g += `<rect x="${F(x - w / 2 + 3)}" y="${F(y - (i + 1) * (h + 1) + 1)}" width="${F(w - 8)}" height="1.2" fill="#fff" opacity=".35"/>`;
    }
    return g;
  };
  // 玉璧（璧山）
  const jadeRing = (r, c, o) => {
    const { x = 330, y = 120, rad = 26 } = o;
    return `<g class="sa-lantern" style="animation-delay:.5s">` +
      `<circle cx="${x}" cy="${y}" r="${rad}" fill="none" stroke="${c.jade}" stroke-width="7" opacity=".9"/>` +
      `<circle cx="${x}" cy="${y}" r="${rad}" fill="none" stroke="${light(c.jade, .4)}" stroke-width="2" opacity=".8"/>` +
      `<circle cx="${x}" cy="${y}" r="${rad * .42}" fill="${dark(c.jade, .25)}" opacity=".9"/>` +
      `<path d="M${F(x - rad)},${F(y - rad * .5)} a${rad},${rad} 0 0 1 ${rad * .7},-${rad * .7}" stroke="${light(c.jade, .55)}" stroke-width="1.4" fill="none" opacity=".7"/></g>`;
  };
  // 夏布织机（荣昌）
  const loom = (r, c, o) => {
    const { x = 200, y = 212 } = o;
    let g = `<rect x="${F(x - 34)}" y="${F(y - 8)}" width="68" height="4" fill="${dark(c.wood, .2)}"/>`;
    for (let i = 0; i <= 12; i++) {
      const px = x - 32 + i * 5.3;
      g += `<line x1="${F(px)}" y1="${F(y - 8)}" x2="${F(px)}" y2="${F(y - 34)}" stroke="${c.cloth}" stroke-width="1.1" opacity=".9"/>`;
    }
    for (let k = 0; k < 3; k++) g += `<line x1="${F(x - 34)}" y1="${F(y - 12 - k * 7)}" x2="${F(x + 34)}" y2="${F(y - 12 - k * 7)}" stroke="${light(c.cloth, .3)}" stroke-width="1" opacity=".6"/>`;
    g += `<rect x="${F(x - 38)}" y="${F(y - 4)}" width="6" height="12" fill="${dark(c.wood, .3)}"/><rect x="${F(x + 32)}" y="${F(y - 4)}" width="6" height="12" fill="${dark(c.wood, .3)}"/>`;
    return g;
  };
  // 榨菜坛（涪陵）
  const jars = (r, c, o) => {
    const { y = 212, n = 5, x0 = 60 } = o;
    let g = "";
    for (let i = 0; i < n; i++) {
      const x = x0 + i * 68 + r() * 8, s = .9 + r() * .5;
      g += `<path d="M${F(x - 8 * s)},${F(y)} q${F(2 * s)},-${F(16 * s)} ${F(8 * s)},-${F(18 * s)} q${F(6 * s)},${F(2 * s)} ${F(8 * s)},${F(18 * s)} Z" fill="${c.jar}"/>` +
        `<ellipse cx="${F(x)}" cy="${F(y - 18 * s)}" rx="${F(8 * s)}" ry="${F(2.6 * s)}" fill="${dark(c.jar, .3)}"/>` +
        `<path d="M${F(x - 6 * s)},${F(y - 8 * s)} q${F(6 * s)},-${F(3 * s)} ${F(12 * s)},0" stroke="${light(c.jar, .35)}" stroke-width="1.2" fill="none" opacity=".8"/>`;
    }
    return g;
  };
  // 轻轨穿楼（李子坝）
  const railBuilding = (r, c, o) => {
    const { x = 300, y = 214, w = 46, h = 74 } = o;
    let g = `<rect x="${F(x - w / 2)}" y="${F(y - h)}" width="${F(w)}" height="${F(h)}" fill="${c.tower}"/>`;
    const rows = Math.floor(h / 11);
    for (let i = 0; i < rows; i++) {
      for (let m = 0; m < 3; m++) {
        g += `<rect x="${F(x - w / 2 + 5 + m * 13)}" y="${F(y - h + 6 + i * 11)}" width="8" height="5" fill="${c.win}" opacity="${F(.3 + r() * .55)}"/>`;
      }
    }
    // 轨道穿楼
    g += `<rect x="${F(x - w / 2 - 26)}" y="${F(y - h + 30)}" width="${F(w + 52)}" height="4" fill="${dark(c.rail, .1)}"/>`;
    for (let i = 0; i < 6; i++) g += `<line x1="${F(x - w / 2 - 22 + i * 9)}" y1="${F(y - h + 30)}" x2="${F(x - w / 2 - 22 + i * 9)}" y2="${F(y - h + 34)}" stroke="${dark(c.rail, .35)}" stroke-width="1.4"/>`;
    g += `<rect x="${F(x - w / 2 - 26)}" y="${F(y - h + 34)}" width="${F(w + 52)}" height="2.6" fill="${c.rail}"/>`;
    return g;
  };
  // 水面船
  const boat = (r, c, o) => {
    const { x = 200, y = 214, s = 1 } = o;
    const hull = c.hull || dark(c.water || "#1c2a3a", .35);
    return `<g class="sa-boat">` +
      `<path d="M${F(x - 11 * s)},${F(y)} q${F(11 * s)},${F(7 * s)} ${F(22 * s)},0 q${F(-11 * s)},-${F(4 * s)} -${F(22 * s)},0 Z" fill="${hull}"/>` +
      `<rect x="${F(x - 3 * s)}" y="${F(y - 9 * s)}" width="${F(6 * s)}" height="${F(8 * s)}" fill="${dark(hull, .25)}"/>` +
      `<rect x="${F(x - 2 * s)}" y="${F(y - 8 * s)}" width="2" height="2.4" fill="${c.win || "#ffbe6e"}"/></g>`;
  };

  /* ==========================================================
     区县配方：pal 调色板 / mid 中景 / fore 前景 / prop 招牌
     ========================================================== */
  const RECIPES = {
    "渝中区": {
      pal: { sky0: "#101a2c", sky1: "#2c3d5c", far: "#1b2a44", mid: "#141d30", near: "#0c1322", water: "#16233a", tower: "#101828", win: "#ffcf8a", veg: "#1d3040", rail: "#46586e", line: "#9aabc4", car: "#d8e2ee" },
      mid: [["ridge", { y0: 132, amp: 34 }]],
      prop: [["skyline", { n: 13, hMin: 44, hMax: 104 }], ["railBuilding", {}], ["cable", {}]],
      water: true, weather: "stars", note: "半岛夜景"
    },
    "江北区": {
      pal: { sky0: "#0e1a2e", sky1: "#31456b", far: "#1d2c48", mid: "#16223a", near: "#0d1526", water: "#18294a", tower: "#12203a", win: "#a8d4ff", veg: "#1d3040", glass: "#2fbf9a" },
      mid: [["ridge", { y0: 128, amp: 26 }]],
      prop: [["skyline", { n: 12, hMin: 50, hMax: 116 }], ["jadeRing", {}], ["boat", {}]],
      water: true, weather: "stars", note: "江北嘴"
    },
    "南岸区": {
      pal: { sky0: "#0b1424", sky1: "#2a3a5e", far: "#182541", mid: "#111c33", near: "#0a1220", water: "#152238", tower: "#0f1a2e", win: "#ffd9a0", veg: "#1c2c3c" },
      mid: [["ridge", { y0: 120, amp: 40 }]],
      prop: [["skyline", { n: 10, hMin: 30, hMax: 78 }], ["pine", {}]],
      water: true, weather: "stars", note: "一棵树观景台"
    },
    "沙坪坝区": {
      pal: { sky0: "#1a2436", sky1: "#4a5a76", far: "#2c3a52", mid: "#22304a", near: "#141d2e", water: "#1c2c44", wall: "#3a3128", roof: "#241c14", win: "#ffbe6e", veg: "#2c4a3a" },
      mid: [["ridge", { y0: 118, amp: 44 }]],
      prop: [["town", { x0: -6, x1: 150, n: 6, s: .9 }], ["books", {}], ["boat", {}]],
      water: true, weather: "mist", note: "磁器口"
    },
    "九龙坡区": {
      pal: { sky0: "#1c2230", sky1: "#454f66", far: "#2e3648", mid: "#262f42", near: "#171e2c", wall: "#20242e", win: "#ffc27a", veg: "#2c4a3a" },
      mid: [["ridge", { y0: 130, amp: 30 }]],
      prop: [["graffiti", {}], ["books", {}]],
      water: false, weather: "none", note: "黄桷坪涂鸦街"
    },
    "大渡口区": {
      pal: { sky0: "#1e2028", sky1: "#4c4a56", far: "#34333c", mid: "#282a34", near: "#191b22", water: "#232c3a", rust: "#a8552e", win: "#ffb765", mid2: "#3c3a44" },
      mid: [["ridge", { y0: 138, amp: 24 }]],
      prop: [["factory", {}], ["town", { x0: 220, x1: 400, n: 5, s: .8 }]],
      water: true, weather: "mist", note: "重钢遗址"
    },
    "渝北区": {
      pal: { sky0: "#16233a", sky1: "#4a6a92", far: "#2c4a6c", mid: "#24405e", near: "#152a42", water: "#1d3a58", win: "#ffd9a0", veg: "#2f5a44", plane: "#dfe8f2" },
      mid: [["ridge", { y0: 126, amp: 38 }]],
      prop: [["plane", {}], ["town", { x0: 20, x1: 210, n: 6, s: .85 }], ["steam", {}]],
      water: true, weather: "none", note: "龙兴古镇 · 统景温泉"
    },
    "巴南区": {
      pal: { sky0: "#1a2630", sky1: "#48685e", far: "#2e4c44", mid: "#26403a", near: "#162822", water: "#1e3830", wall: "#3a3428", roof: "#241d12", win: "#ffbe6e", veg: "#31553f" },
      mid: [["ridge", { y0: 124, amp: 42 }]],
      prop: [["town", { x0: 30, x1: 240, n: 7, s: .95 }], ["steam", {}]],
      water: true, weather: "mist", note: "丰盛古镇 · 东温泉"
    },
    "北碚区": {
      pal: { sky0: "#141f2e", sky1: "#3f5f6e", far: "#284858", mid: "#1f3a48", near: "#12242e", water: "#1a3644", win: "#ffc98a", veg: "#2c5240" },
      mid: [["ridge", { y0: 116, amp: 48 }]],
      prop: [["steam", {}], ["town", { x0: 210, x1: 390, n: 5, s: .8 }], ["pine", {}]],
      water: true, weather: "mist", note: "缙云山 · 北温泉"
    },
    "涪陵区": {
      pal: { sky0: "#17222e", sky1: "#3d5a68", far: "#284454", mid: "#1e3644", near: "#12222c", water: "#1a3a42", jar: "#8a5a30", win: "#ffc27a", stone: "#6a7a72", veg: "#2c5240" },
      mid: [["ridge", { y0: 126, amp: 36 }]],
      prop: [["steleWater", {}], ["jars", {}], ["boat", {}]],
      water: true, weather: "none", note: "白鹤梁 · 榨菜之乡"
    },
    "长寿区": {
      pal: { sky0: "#152232", sky1: "#3f6280", far: "#2a4a68", mid: "#20405c", near: "#142a40", water: "#1c4258", isle: "#2f5a3e", veg: "#3a6a48", win: "#ffd9a0", rock: "#7a6a52", roof: "#3a2c1c" },
      mid: [["ridge", { y0: 132, amp: 30 }]],
      prop: [["isles", {}], ["boat", {}], ["pagoda", { x: 60, levels: 5 }]],
      water: true, weather: "none", note: "长寿湖 · 菩提山"
    },
    "江津区": {
      pal: { sky0: "#1c2228", sky1: "#4a5a5e", far: "#3a4a4a", mid: "#2c3c3a", near: "#1a2422", water: "#22423e", cliff: "#6a4a34", foam: "#eef4f2", veg: "#35604a", wall: "#3a3128", roof: "#221a10", win: "#ffbe6e" },
      mid: [["ridge", { y0: 130, amp: 34 }]],
      prop: [["waterfall", {}], ["town", { x0: 250, x1: 400, n: 5, s: .8 }]],
      water: true, weather: "mist", note: "四面山 · 中山古镇"
    },
    "合川区": {
      pal: { sky0: "#1a2226", sky1: "#46585c", far: "#324648", mid: "#26383c", near: "#162226", water: "#1e3a42", cliff: "#5a4a38", wall: "#8a7a62", roof: "#4a3828", win: "#ffbe6e", veg: "#3a5c46" },
      mid: [["ridge", { y0: 124, amp: 40 }]],
      prop: [["fort", {}], ["boat", {}]],
      water: true, weather: "mist", note: "钓鱼城 · 三江汇"
    },
    "永川区": {
      pal: { sky0: "#18281e", sky1: "#4a6a4e", far: "#2f5238", mid: "#26422c", near: "#162a1c", water: "#1e4030", leaf: "#4a8a4a", veg: "#3f7a48", win: "#ffd9a0" },
      mid: [["ridge", { y0: 128, amp: 30 }]],
      prop: [["tea", {}], ["bamboo", { x0: -4, x1: 200 }], ["bamboo", { x0: 210, x1: 404, hMin: 40, hMax: 90 }]],
      water: false, weather: "mist", note: "茶山竹海"
    },
    "南川区": {
      pal: { sky0: "#16242e", sky1: "#3e6272", far: "#284858", mid: "#1f4050", near: "#12262e", water: "#1c4450", veg: "#3a6a4e", win: "#ffc98a" },
      mid: [["ridge", { y0: 118, amp: 46 }]],
      prop: [["terrace", {}], ["bamboo", { n: 12, hMin: 40, hMax: 90 }], ["steam", {}]],
      water: true, weather: "mist", note: "金佛山 · 神龙峡"
    },
    "綦江区": {
      pal: { sky0: "#20242c", sky1: "#4c5a6a", far: "#36424e", mid: "#2a333e", near: "#1a2028", wall: "#232830", win: "#ffc27a", veg: "#3a6a4e", flower: "#e04a6a" },
      mid: [["ridge", { y0: 126, amp: 36 }]],
      prop: [["flowerSea", { col: "#e04a6a" }], ["graffiti", { x0: 0, x1: 400, y: 168, h: 34 }]],
      water: false, weather: "none", note: "农民版画 · 古剑山"
    },
    "大足区": {
      pal: { sky0: "#1c2128", sky1: "#4c565c", far: "#38424a", mid: "#2a323a", near: "#181e24", cliff: "#5c5248", stone: "#b8ac96", win: "#ffbe6e", veg: "#3a5c44", water: "#1e3a44", isle: "#2f5a3e" },
      mid: [["ridge", { y0: 132, amp: 30 }]],
      prop: [["niches", {}], ["isles", {}]],
      water: true, weather: "mist", note: "大足石刻 · 龙水湖"
    },
    "璧山区": {
      pal: { sky0: "#162028", sky1: "#3a5a5c", far: "#28484c", mid: "#1e3a3e", near: "#122426", water: "#1a4246", jade: "#3ecfa0", veg: "#2f6a4c", win: "#ffd9a0", isle: "#2c5a44" },
      mid: [["ridge", { y0: 130, amp: 32 }]],
      prop: [["jadeRing", { rad: 30 }], ["isles", {}], ["boat", {}]],
      water: true, weather: "none", note: "秀湖 · 玉璧故地"
    },
    "铜梁区": {
      pal: { sky0: "#1e1a18", sky1: "#4e342a", far: "#3c2a22", mid: "#2c1e18", near: "#1a1210", dragon: "#d83a2a", ground: "#241812", win: "#ffb765" },
      mid: [["ridge", { y0: 134, amp: 26 }]],
      prop: [["dragonFire", {}], ["town", { x0: 250, x1: 400, n: 4, s: .75 }]],
      water: false, weather: "embers", note: "铜梁龙舞"
    },
    "潼南区": {
      pal: { sky0: "#20260e", sky1: "#6a6a24", far: "#4e5420", mid: "#3c441c", near: "#262c12", water: "#2c4a3a", flower: "#f2c94e", veg: "#5a7a2c", rock: "#7a6a52", roof: "#3a2c1c", win: "#ffd9a0" },
      mid: [["ridge", { y0: 128, amp: 30 }]],
      prop: [["flowerSea", { col: "#f2d24e" }], ["pagoda", { x: 344, levels: 5 }], ["town", { x0: -6, x1: 130, n: 5, s: .8 }]],
      water: true, weather: "none", note: "油菜花海 · 大佛寺"
    },
    "荣昌区": {
      pal: { sky0: "#1e2226", sky1: "#4a5048", far: "#363c36", mid: "#282e28", near: "#181c18", wall: "#3a3026", roof: "#241c10", win: "#ffbe6e", cloth: "#e8ddc4", wood: "#5a4630", jar: "#7a4a28" },
      mid: [["ridge", { y0: 130, amp: 28 }]],
      prop: [["loom", {}], ["jars", { y: 212, n: 3, x0: 18 }], ["town", { x0: 250, x1: 400, n: 4, s: .75 }]],
      water: false, weather: "none", note: "夏布 · 荣昌陶 · 卤鹅"
    },
    "开州区": {
      pal: { sky0: "#152332", sky1: "#3e6280", far: "#2a4a68", mid: "#20405c", near: "#142a40", water: "#1c4258", isle: "#2f5a3e", veg: "#3a6a48", win: "#ffd9a0", wood: "#5a4630", roof: "#3a2c1c" },
      mid: [["ridge", { y0: 126, amp: 36 }]],
      prop: [["isles", {}], ["corridor", {}], ["boat", {}]],
      water: true, weather: "mist", note: "汉丰湖 · 风雨廊桥"
    },
    "梁平区": {
      pal: { sky0: "#1a2620", sky1: "#486a58", far: "#2f5040", mid: "#264438", near: "#162c22", water: "#1e4436", bamboo: "#3f7a48", veg: "#4a8a52", win: "#ffd9a0" },
      mid: [["ridge", { y0: 124, amp: 34 }]],
      prop: [["bamboo", { n: 20 }], ["tea", { y: 206, rows: 4 }], ["town", { x0: 250, x1: 400, n: 4, s: .75 }]],
      water: true, weather: "mist", note: "竹帘 · 双桂堂"
    },
    "城口县": {
      pal: { sky0: "#1c2630", sky1: "#4a5e70", far: "#34474f", mid: "#26363c", near: "#161f24", water: "#1c3038", snow: "#e8eff5", tree: "#2c4a3c", wood: "#4a3a28", win: "#ffb765" },
      mid: [["ridge", { y0: 112, amp: 52 }]],
      prop: [["snowForest", {}], ["earthen", {}]],
      water: false, weather: "snow", note: "大巴山 · 腊肉火塘"
    },
    "丰都县": {
      pal: { sky0: "#1a1c26", sky1: "#3e3a4e", far: "#2c2a3a", mid: "#22202e", near: "#141220", water: "#1c2436", wall: "#4a3a2c", roof: "#2c2014", win: "#ffb765", veg: "#2c3a4a" },
      mid: [["ridge", { y0: 128, amp: 34 }]],
      prop: [["cliffTemple", { x: 200, y: 126 }], ["gate", {}], ["boat", {}]],
      water: true, weather: "mist", note: "鬼城名山 · 奈何桥"
    },
    "垫江县": {
      pal: { sky0: "#241c26", sky1: "#5e4a62", far: "#463a4a", mid: "#362c3a", near: "#221a24", water: "#2c3a4a", flower: "#e88ab8", veg: "#3a6a4e", win: "#ffd9a0" },
      mid: [["ridge", { y0: 126, amp: 32 }]],
      prop: [["flowerSea", { col: "#f0a8cc" }], ["peach", {}]],
      water: false, weather: "none", note: "牡丹花海"
    },
    "忠县": {
      pal: { sky0: "#17222e", sky1: "#3f5c70", far: "#28444f", mid: "#1e3642", near: "#12222a", water: "#1a3a48", rock: "#8a7a62", roof: "#3a2c1c", win: "#ffc98a", veg: "#2f5240" },
      mid: [["ridge", { y0: 124, amp: 38 }]],
      prop: [["pagoda", { x: 320, levels: 9 }], ["boat", {}]],
      water: true, weather: "mist", note: "石宝寨"
    },
    "云阳县": {
      pal: { sky0: "#1a242e", sky1: "#42606e", far: "#2c4854", mid: "#223840", near: "#142228", water: "#1c3a44", rock: "#6a5c4a", roof: "#3a2c1c", win: "#ffc98a", veg: "#2f5240" },
      mid: [["ridge", { y0: 120, amp: 44 }]],
      prop: [["cliffTemple", { x: 90, y: 140 }], ["gorge", { y: 214, hL: 70, hR: 60, gap: 150 }], ["boat", {}]],
      water: true, weather: "mist", note: "龙缸 · 张飞庙"
    },
    "奉节县": {
      pal: { sky0: "#221a1c", sky1: "#5a3e3a", far: "#4a322c", mid: "#382622", near: "#221614", water: "#24384a", cliff: "#6a4234", veg: "#3a5c3e", wall: "#4a3a2c", roof: "#2c2014", win: "#ffbe6e", fruit: "#e8842a" },
      mid: [["gorge", { y: 196, hL: 150, hR: 132, gap: 116 }]],
      prop: [["cliffTemple", { x: 120, y: 120 }], ["orange", {}], ["boat", {}]],
      water: true, weather: "mist", note: "夔门 · 白帝城"
    },
    "巫山县": {
      pal: { sky0: "#1c2630", sky1: "#4a6070", far: "#34484f", mid: "#26383e", near: "#162226", water: "#1c3642", cliff: "#5a4a42", veg: "#2f5240", win: "#ffc98a", line: "#9aabc4", car: "#d8e2ee" },
      mid: [["gorge", { y: 198, hL: 140, hR: 120, gap: 130 }]],
      prop: [["cliffTemple", { x: 255, y: 96 }], ["boat", {}], ["cable", {}]],
      water: true, weather: "mist", note: "巫峡 · 神女峰"
    },
    "巫溪县": {
      pal: { sky0: "#1e2226", sky1: "#4c5248", far: "#383c36", mid: "#2a2e28", near: "#1a1e18", water: "#223038", pan: "#4a4a52", veg: "#3a5c44", win: "#ffbe6e" },
      mid: [["ridge", { y0: 122, amp: 40 }]],
      prop: [["saltPan", {}], ["town", { x0: 240, x1: 400, n: 5, s: .8 }], ["grass", {}]],
      water: true, weather: "mist", note: "宁厂盐灶 · 红池坝"
    },
    "黔江区": {
      pal: { sky0: "#16222e", sky1: "#3c5c6e", far: "#284450", mid: "#1f3844", near: "#12222a", water: "#1a3a48", isle: "#2f5a3e", veg: "#35604a", wood: "#5a4630", roof: "#3a2c1c", win: "#ffc98a", cliff: "#4a5a5e" },
      mid: [["ridge", { y0: 118, amp: 46 }], ["gorge", { y: 214, hL: 62, hR: 56, gap: 170 }]],
      prop: [["isles", {}], ["corridor", {}], ["boat", {}]],
      water: true, weather: "mist", note: "小南海 · 濯水廊桥"
    },
    "武隆区": {
      pal: { sky0: "#14202a", sky1: "#3a6060", far: "#264a4a", mid: "#1c3c3c", near: "#102424", water: "#164040", rock: "#5c6a5c", veg: "#2f6a4a", win: "#ffd9a0", foam: "#e8f2f0", glow: "#9fe8d8" },
      mid: [["ridge", { y0: 118, amp: 42 }], ["karst", { y: 176, n: 6, h: 74 }]],
      prop: [["arch", { x: 130, rad: 40, th: 14 }], ["arch", { x: 268, rad: 30, th: 11 }], ["grass", {}], ["cave", { x: 340, w: 30, h: 30 }]],
      water: true, weather: "mist", note: "天生三桥 · 仙女山"
    },
    "石柱县": {
      pal: { sky0: "#1a2630", sky1: "#486874", far: "#2f4c56", mid: "#243e46", near: "#142630", water: "#1c3c48", veg: "#3a6a4e", win: "#ffc98a", wall: "#3a3026", roof: "#241c10" },
      mid: [["ridge", { y0: 120, amp: 44 }]],
      prop: [["grass", {}], ["silver", {}], ["town", { x0: 230, x1: 400, n: 4, s: .75 }]],
      water: true, weather: "mist", note: "千野草场 · 土家山寨"
    },
    "秀山县": {
      pal: { sky0: "#1c2430", sky1: "#4a5c74", far: "#34445a", mid: "#263448", near: "#161f2c", water: "#1e3a52", wall: "#4a4034", roof: "#2c2418", win: "#ffbe6e", veg: "#35604a", flower: "#e05a8a" },
      mid: [["ridge", { y0: 124, amp: 36 }]],
      prop: [["gate", {}], ["flowerSea", { col: "#e0709a" }], ["silver", {}]],
      water: true, weather: "none", note: "洪安边城 · 龙凤花海"
    },
    "酉阳县": {
      pal: { sky0: "#1a2430", sky1: "#486070", far: "#32485a", mid: "#263848", near: "#16222e", water: "#1e3a50", bloom: "#f0a8bc", veg: "#35604a", wall: "#3a3026", roof: "#241c10", win: "#ffbe6e", cliff: "#4a4a48", glow: "#cfe8d8" },
      mid: [["ridge", { y0: 122, amp: 40 }]],
      prop: [["town", { x0: -6, x1: 220, n: 8, s: .95 }], ["cave", { x: 310, w: 38, h: 40 }], ["peach", {}]],
      water: true, weather: "mist", note: "桃花源 · 龚滩古镇"
    },
    "彭水县": {
      pal: { sky0: "#1c222e", sky1: "#444e68", far: "#323a50", mid: "#262e42", near: "#161c2a", water: "#1e3050", cliff: "#4a4258", silver: "#c8d4e0", wall: "#3a3040", roof: "#241c2c", win: "#ffc98a", veg: "#2f5244" },
      mid: [["gorge", { y: 200, hL: 130, hR: 110, gap: 140 }]],
      prop: [["cliffTemple", { x: 118, y: 118 }], ["silver", { x: 90 }], ["boat", {}]],
      water: true, weather: "mist", note: "阿依河 · 九黎城"
    }
  };

  /* ---------- 合成 ---------- */
  function applyPal(P, fn) {
    const Q = {};
    for (const k in P) Q[k] = /^#[0-9a-f]{6}$/i.test(P[k]) ? fn(P[k]) : P[k];
    return Q;
  }
  const M = { ridge, karst, gorge, arch, waterfall, tea, flowerSea, bamboo, grass, pagoda, cliffTemple, dragonFire, factory, isles, fort, town, skyline, cable, saltPan, corridor, silver, earthen, terrace, steam, graffiti, gate, snowForest, cave, peach, niches, steleWater, orange, plane, books, jadeRing, loom, jars, railBuilding, boat };
  const PINE_DEFAULT = { wall: "#3a3026", roof: "#241c10", win: "#ffbe6e", leg: "#241c10" };

  function draw(r, P, key, o, seq) {
    if (key === "pine") return pine(40 + seq * 37 % 340, o.y || 200, o.s || 1, P.veg || "#2c4a38", null);
    if (key === "town") {
      return town(r, {
        wall: P.wall || P.mid, roof: P.roof || dark(P.mid, .3),
        win: P.win || "#ffbe6e", leg: dark(P.mid, .35)
      }, o);
    }
    const f = M[key];
    return f ? f(r, P, o || {}, seq) : "";
  }

  /* 配色兜底：任何图元缺颜色都不再崩 */
  function withFallbacks(P) {
    const mid = P.mid || "#22303c", veg = P.veg || "#2c4a38", water = P.water || mid;
    return Object.assign({}, P, {
      veg, mid, water,
      wall: P.wall || mid, roof: P.roof || dark(mid, .3), win: P.win || "#ffbe6e",
      far: P.far || dark(mid, .25), near: P.near || dark(mid, .5),
      stone: P.stone || light(mid, .35), rock: P.rock || mid, cliff: P.cliff || dark(mid, .12),
      hull: P.hull || dark(water, .35),
      leaf: P.leaf || dark(veg, .1), bloom: P.bloom || "#f0a8bc",
      glow: P.glow || "#cfe8d8", isle: P.isle || dark(veg, .1),
      foam: P.foam || "#eef4f2", jade: P.jade || "#3ecfa0",
      fruit: P.fruit || "#e8842a", line: P.line || "#9aabc4", car: P.car || "#d8e2ee",
      rail: P.rail || "#46586e", cloth: P.cloth || "#e8ddc4", pan: P.pan || mid,
      snow: P.snow || "#e8eff5", tree: P.tree || veg,
      silver: P.silver || "#c8d4e0", dragon: P.dragon || "#d83a2a", ground: P.ground || (P.near || dark(mid, .5)),
      rust: P.rust || "#a8552e", jar: P.jar || "#8a5a30", wood: P.wood || "#5a4630",
      plane: P.plane || "#dfe8f2", tower: P.tower || mid
    });
  }

  function compose(key, variant, seed, z, season) {
    const R = RECIPES[key];
    if (!R) return "";
    const r = rng((seed || 1) * 7919 + key.length * 131 + (variant || 0) * 977);
    const P0 = R.pal;
    let base = variant === 1 ? applyPal(P0, c => warm(c, .2))
      : variant === 2 ? applyPal(P0, c => dark(c, .52)) : P0;
    if (season && SEASON[season]) base = applyPal(base, SEASON[season]);
    const P = withFallbacks(base);
    const uid = "ds" + (++UID);
    // 变焦取景：z = {x,y,k} 归一化中心 + 倍数，模拟不同机位
    const zt = (z && z.k > 1.01)
      ? ` transform="translate(${F(-z.x * 400 * (z.k - 1))},${F(-z.y * 225 * (z.k - 1))}) scale(${z.k})"`
      : "";
    let s = `<svg class="dp-svg" viewBox="0 0 400 225" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">`;
    s += `<defs>${grad(uid + "s", P.sky0, P.sky1)}</defs><g${zt}>`;
    // 天空
    s += `<rect width="400" height="225" fill="url(#${uid}s)"/>`;
    // 天体/天色
    const sunX = 70 + r() * 60;
    if (variant === 2) {
      s += stars(r, 46) + `<circle cx="${F(sunX + 180)}" cy="46" r="13" fill="#dfe8ff" opacity=".9"/>`;
      s += `<circle cx="${F(sunX + 180)}" cy="46" r="34" fill="#dfe8ff" opacity=".08"/>`;
    } else if (variant === 1) {
      s += orb(sunX, 62, 15, "#ffb066");
    } else {
      s += orb(330, 44, 10, "#fff3d6");
    }
    // 远山
    if (R.mid) R.mid.forEach((m, i) => { s += draw(r, P, m[0], Object.assign({ y0: 120 + i * 14, amp: 34 }, m[1] || {}), i); });
    // 水面（先铺底，招牌道具画在水上）
    if (R.water) {
      const wy = 206;
      s += `<rect x="0" y="${F(wy)}" width="400" height="${F(225 - wy)}" fill="${P.water}" opacity=".96"/>`;
      s += `<rect x="0" y="${F(wy)}" width="400" height="1.4" fill="${light(P.water, .3)}" opacity=".5"/>`;
    }
    // 中景主体（prop 里的造型图元按序画）
    (R.prop || []).forEach((m, i) => { s += draw(r, P, m[0], m[1] || {}, i); });
    // 波光（压在水面之上的亮线）
    if (R.water) shimmer(210, 222, P.win || "#ffd9a0", 16);
    // 天气
    if (R.weather === "mist") s += mist(r, 188, 4, P.far || "#dfe8f2", .3);
    if (R.weather === "snow") {
      for (let i = 0; i < 40; i++) s += `<circle class="sa-fall" cx="${F(r() * 400)}" cy="${F(r() * 225)}" r="${F(.8 + r() * 1.5)}" fill="#fff" opacity="${F(.3 + r() * .5)}" style="animation-delay:${F(r() * 4)}s"/>`;
    }
    if (R.weather === "embers") {
      for (let i = 0; i < 22; i++) s += `<circle class="sa-fly" cx="${F(r() * 400)}" cy="${F(150 + r() * 70)}" r="${F(.7 + r() * 1.5)}" fill="#ffb765" opacity="${F(.4 + r() * .5)}" style="animation-delay:${F(r() * 2)}s"/>`;
    }
    // 鸟
    if (variant !== 2 && r() > .35) s += birds(60 + r() * 120, 56 + r() * 30, 4, dark(P.sky1, .3));
    s += `</g></svg>`;
    return s;
  }

  return {
    svg: compose,
    has: k => !!RECIPES[k],
    note: k => (RECIPES[k] || {}).note || "",
    keys: () => Object.keys(RECIPES)
  };
})();

/* ==========================================================
   stay-art.js — 民宿插画 · 一家一景
   16 个手绘场景：夜江吊脚楼 / 半岛夜景露台 / 古镇天井院 /
   洪崖洞崖壁楼 / 仙女山雪原木屋 / 龚滩晨雾 / 金佛山玻璃房 /
   黄水林海 / 四面山瀑布 / 濯水风雨桥 / 索道老公寓 /
   缙云竹涧温泉 / 巫峡窗框 / 涞滩瓮城 / 龙缸星空帐篷 / 大巴山火塘
   ========================================================== */
window.StayArt = (function () {
  "use strict";
  const F = n => Math.round(n * 10) / 10;
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  /* ---------- 元件 ---------- */
  const grad = (id, c0, c1) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="${c0}"/><stop offset="100%" stop-color="${c1}"/></linearGradient>`;
  const grad2 = (id, c0) =>
    `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">` +
    `<stop offset="0%" stop-color="${c0}"/><stop offset="100%" stop-color="${c0}" stop-opacity="0"/></radialGradient>`;

  const ridge = (y0, amp, fill, sd) => {
    let d = `M0,220 L0,${F(y0)}`;
    for (let i = 1; i <= 24; i++) {
      const t = i / 24;
      d += ` L${F(t * 400)},${F(y0 - (Math.sin(t * 6.3 + sd) * .5 + .5) * amp - Math.sin(t * 17 + sd * 3) * amp * .18)}`;
    }
    return `<path d="${d} L400,220 Z" fill="${fill}"/>`;
  };
  const stars = (r, n, yMax, col) => {
    let s = "";
    for (let i = 0; i < n; i++) s += `<circle class="sa-star" cx="${F(r() * 400)}" cy="${F(r() * yMax)}" r="${F(.5 + r() * 1.1)}" fill="${col || "#cfe0ff"}" opacity="${F(.2 + r() * .55)}" style="animation-delay:${F(r() * 3.2)}s"/>`;
    return s;
  };
  const moon = (x, y, rad, col) =>
    `<circle cx="${x}" cy="${y}" r="${rad * 2.1}" fill="${col}" opacity=".07"/>` +
    `<circle cx="${x}" cy="${y}" r="${rad}" fill="${col}" opacity=".92"/>` +
    `<circle cx="${x - rad * .3}" cy="${y - rad * .25}" r="${rad * .16}" fill="#000" opacity=".08"/>` +
    `<circle cx="${x + rad * .35}" cy="${y + rad * .2}" r="${rad * .11}" fill="#000" opacity=".07"/>`;
  const mist = (x, y, w, h, col, op, delay) =>
    `<ellipse class="sa-mist" cx="${F(x)}" cy="${F(y)}" rx="${F(w)}" ry="${F(h)}" fill="${col}" opacity="${op}" style="animation-delay:${delay || 0}s"/>`;
  const shimmer = (y0, n, col, wMax) => {
    let s = "";
    for (let i = 0; i < n; i++) {
      const y = y0 + i * 4.4;
      s += `<rect class="sa-shimmer" x="${F(10 + (i * 53) % 340)}" y="${F(y)}" width="${F(24 + (i * 37) % (wMax || 90))}" height="1.6" fill="${col}" opacity="${F(.1 + (i % 4) * .07)}" style="animation-delay:${F(i * .3)}s"/>`;
    }
    return s;
  };
  const pine = (x, y, s, fill, snow) => {
    let g = `<path d="M${F(x)},${F(y)} L${F(x)},${F(y - 30 * s)}" stroke="${fill}" stroke-width="${F(2 * s)}"/>`;
    for (let k = 0; k < 3; k++) {
      const yy = y - 8 * s - k * 9 * s, w = (13 - k * 3) * s;
      g += `<path d="M${F(x - w)},${F(yy)} L${F(x)},${F(yy - 15 * s)} L${F(x + w)},${F(yy)} Z" fill="${fill}"/>`;
      if (snow) g += `<path d="M${F(x - w * .8)},${F(yy - 1)} L${F(x)},${F(yy - 15 * s)} L${F(x + w * .8)},${F(yy - 1)}" fill="none" stroke="${snow}" stroke-width="${F(1.6 * s)}" opacity=".85"/>`;
    }
    return g;
  };
  const banyan = (x, y, s) =>
    `<path d="M${F(x - 3 * s)},${F(y)} Q${F(x)},${F(y - 30 * s)} ${F(x + 2 * s)},${F(y - 44 * s)}" stroke="#4b3a28" stroke-width="${F(6 * s)}" fill="none"/>` +
    `<path d="M${F(x - 4 * s)},${F(y - 20 * s)} Q${F(x - 16 * s)},${F(y - 30 * s)} ${F(x - 20 * s)},${F(y - 40 * s)}" stroke="#4b3a28" stroke-width="${F(2.6 * s)}" fill="none"/>` +
    `<ellipse cx="${F(x - 14 * s)}" cy="${F(y - 46 * s)}" rx="${F(17 * s)}" ry="${F(11 * s)}" fill="#243d2c"/>` +
    `<ellipse cx="${F(x + 12 * s)}" cy="${F(y - 50 * s)}" rx="${F(19 * s)}" ry="${F(12 * s)}" fill="#2a4633"/>` +
    `<ellipse cx="${F(x)}" cy="${F(y - 58 * s)}" rx="${F(15 * s)}" ry="${F(10 * s)}" fill="#31503b"/>` +
    `<path d="M${F(x - 6 * s)},${F(y - 36 * s)} l0,${F(10 * s)} M${F(x + 8 * s)},${F(y - 34 * s)} l0,${F(9 * s)}" stroke="#4b3a28" stroke-width="${F(1.2 * s)}" opacity=".7"/>`;
  const lantern = (x, y, s, col) =>
    `<g class="sa-lantern" style="animation-delay:${F((s * 3) % 2)}s">` +
    `<line x1="${F(x)}" y1="${F(y - 9 * s)}" x2="${F(x)}" y2="${F(y - 4 * s)}" stroke="#6a2c1c" stroke-width="1.2"/>` +
    `<ellipse cx="${F(x)}" cy="${F(y)}" rx="${F(4.6 * s)}" ry="${F(5.6 * s)}" fill="${col || "#e0402a"}"/>` +
    `<ellipse cx="${F(x)}" cy="${F(y)}" rx="${F(2.2 * s)}" ry="${F(5.6 * s)}" fill="#ffb08a" opacity=".45"/>` +
    `<line x1="${F(x)}" y1="${F(y + 5.6 * s)}" x2="${F(x)}" y2="${F(y + 9 * s)}" stroke="#c8b06a" stroke-width="1.2"/>` +
    `</g>`;
  const win = (x, y, w, h, col, op) =>
    `<rect x="${F(x)}" y="${F(y)}" width="${F(w)}" height="${F(h)}" rx="1" fill="${col || "#ffb765"}" opacity="${op == null ? .85 : op}"/>`;
  const roof = (x, y, w, h, col, edge) =>
    `<path d="M${F(x - 6)},${F(y)} Q${F(x + w / 2)},${F(y - h)} ${F(x + w + 6)},${F(y)} L${F(x + w)},${F(y + 3)} L${F(x)},${F(y + 3)} Z" fill="${col}"/>` +
    (edge ? `<path d="M${F(x - 6)},${F(y)} Q${F(x + w / 2)},${F(y - h)} ${F(x + w + 6)},${F(y)}" fill="none" stroke="${edge}" stroke-width="1.2" opacity=".6"/>` : "");
  const birds = (x, y, n, col) => {
    let s = "";
    for (let i = 0; i < n; i++) {
      const bx = x + i * 13, by = y + (i % 2) * 5, k = 3.2;
      s += `<path d="M${F(bx - k)},${F(by)} q${k},${-k} ${k},0 q0,${-k} ${k},0" fill="none" stroke="${col || "#22303f"}" stroke-width="1.2" opacity=".75"/>`;
    }
    return s;
  };
  const firefly = (r, x0, x1, y0, y1) =>
    `<circle class="sa-fly" cx="${F(x0 + r() * (x1 - x0))}" cy="${F(y0 + r() * (y1 - y0))}" r="1.5" fill="#ffe9a0" style="animation-delay:${F(r() * 2.6)}s"/>`;
  const smoke = (x, y, s, col, delay) =>
    `<g class="sa-steam" style="animation-delay:${delay || 0}s" opacity=".5">` +
    `<path d="M${F(x)},${F(y)} q${F(-6 * s)},${F(-9 * s)} 0,${F(-18 * s)} q${F(6 * s)},${F(-9 * s)} 0,${F(-18 * s)}" fill="none" stroke="${col || "#c9d4de"}" stroke-width="${F(2.4 * s)}" stroke-linecap="round"/>` +
    `</g>`;

  /* =======================================================
     场景 1 · 临江门老吊脚楼 —— 夜江货船
     ======================================================= */
  function scRiverShip(r, P) {
    let d = grad(P + "sky", "#16283f", "#0a1220") + grad(P + "wat", "#13273f", "#070f1a");
    let g = `<rect width="400" height="220" fill="url(#${P}sky)"/>`;
    g += stars(r, 30, 100);
    g += moon(332, 40, 12, "#e8f0ff");
    g += ridge(148, 22, "#0f1926", 2);
    for (let i = 0; i < 16; i++) {
      const bx = i * 25 + r() * 6, bh = 12 + r() * 26, bw = 12 + r() * 10;
      g += `<rect x="${F(bx)}" y="${F(150 - bh)}" width="${F(bw)}" height="${F(bh)}" fill="#0d1622"/>`;
      for (let k = 0; k < 4; k++) {
        if (r() > .45) g += win(bx + 2 + (k % 2) * (bw / 2), 152 - bh + 3 + Math.floor(k / 2) * 7, 2.4, 3.4, "#ffc274", .35 + r() * .55);
      }
    }
    g += `<rect y="150" width="400" height="70" fill="url(#${P}wat)"/>`;
    g += `<ellipse cx="332" cy="176" rx="7" ry="26" fill="#e8f0ff" opacity=".10"/>`;
    g += shimmer(158, 14, "#8fc0ff", 80);
    g += `<g class="sa-boat"><path d="M96,168 h72 l-8,10 h-56 Z" fill="#1a1410"/>` +
         `<rect x="118" y="158" width="30" height="10" fill="#241c14"/>` +
         `<rect x="128" y="150" width="5" height="9" fill="#241c14"/>` +
         win(122, 160, 6, 5, "#ffcf8a", .9) + win(138, 160, 6, 5, "#ffcf8a", .9) +
         `<ellipse cx="132" cy="180" rx="40" ry="3" fill="#ffcf8a" opacity=".08"/></g>`;
    const houses = [[212, 128, 60], [288, 112, 66], [356, 138, 44]];
    houses.forEach((h, i) => {
      const x = h[0], y = h[1], w = h[2], hh = 34 + (i === 1 ? 8 : 0);
      for (let p = 0; p < 4; p++) g += `<rect x="${F(x + 6 + p * (w / 3.4))}" y="${F(y + hh)}" width="3.2" height="${F(44 - r() * 8)}" fill="#33261a"/>`;
      g += `<rect x="${F(x - 3)}" y="${F(y + hh - 3)}" width="${F(w + 6)}" height="4" fill="#43311f"/>`;
      g += `<rect x="${F(x)}" y="${F(y)}" width="${F(w)}" height="${F(hh)}" fill="${i === 1 ? "#7d5334" : "#6a472c"}"/>`;
      g += roof(x - 6, y, w + 12, 16, "#241d16", "#a8703c");
      for (let k = 0; k < 3; k++) g += win(x + 7 + k * (w / 3), y + 8, 7, 9, "#ffb765", .6 + r() * .4);
      g += lantern(x + w / 2, y + hh - 6, 1, "#e0402a");
    });
    g += `<path d="M190,220 L200,160 L260,138 L330,150 L400,168 L400,220 Z" fill="#131a12"/>`;
    g += `<rect width="400" height="220" fill="#05080d" opacity=".14"/>`;
    return `<defs>${d}</defs>` + g;
  }

  /* =======================================================
     场景 2 · 南山云顶崖居 —— 半岛灯海露台
     ======================================================= */
  function scCityLight(r, P) {
    let d = grad(P + "sky", "#141d33", "#0a0f1c") + grad2(P + "glow", "#ffb765");
    let g = `<rect width="400" height="220" fill="url(#${P}sky)"/>`;
    g += stars(r, 40, 90);
    g += ridge(120, 20, "#0e1524", 5) + ridge(140, 14, "#0b111d", 11);
    for (let i = 0; i < 30; i++) {
      const bx = r() * 396, bw = 9 + r() * 15, bh = 14 + r() * 34, by = 152 - bh;
      g += `<rect x="${F(bx)}" y="${F(by)}" width="${F(bw)}" height="${F(bh)}" fill="#0a1018"/>`;
      const cols = Math.max(1, Math.floor(bw / 6)), rows = Math.max(1, Math.floor(bh / 7));
      for (let cx = 0; cx < cols; cx++) for (let cy = 0; cy < rows; cy++) {
        if (r() > .38) g += win(bx + 2 + cx * 6, by + 3 + cy * 7, 2.6, 3.6, r() > .75 ? "#9fd0ff" : "#ffc274", .3 + r() * .6);
      }
    }
    g += `<rect y="146" width="400" height="26" fill="url(#${P}glow)" opacity=".22"/>`;
    g += `<rect y="196" width="400" height="24" fill="#0a0d12"/>`;
    for (let i = 0; i <= 26; i++) g += `<rect x="${F(i * 15.4)}" y="176" width="2.6" height="24" fill="#141a22"/>`;
    g += `<rect y="174" width="400" height="4" rx="2" fill="#1c242f"/>`;
    g += `<rect y="204" width="400" height="3" fill="#232d3a"/>`;
    g += `<ellipse cx="86" cy="200" rx="26" ry="7" fill="#1d1510"/>`;
    g += `<rect x="82" y="200" width="4" height="14" fill="#14100c"/>`;
    g += `<path d="M74,200 h24 l-3,-5 h-18 Z" fill="#241a12"/>`;
    g += `<rect x="92" y="192" width="7" height="7" rx="1.5" fill="#d8e4f0" opacity=".85"/>`;
    g += smoke(100, 190, .7, "#c9d4de", .4);
    g += `<path d="M356,204 h22 l-3,-14 h-16 Z" fill="#3a2c1e"/>` +
         `<path d="M367,190 q-10,-8 -4,-16 M367,190 q10,-8 4,-16 M367,190 v-14" stroke="#3f5a3a" stroke-width="2.4" fill="none"/>`;
    g += `<rect width="400" height="220" fill="#05080d" opacity=".12"/>`;
    return `<defs>${d}</defs>` + g;
  }

  /* =======================================================
     场景 3 · 磁器口老院子 —— 天井黄桷树
     ======================================================= */
  function scCourtyard(r, P) {
    let d = grad(P + "sky", "#3a4662", "#181e2b");
    let g = `<rect width="400" height="220" fill="url(#${P}sky)"/>`;
    g += `<path d="M0,26 L104,66 L104,220 L0,220 Z" fill="#2b2620"/>`;
    g += `<path d="M400,18 L296,58 L296,220 L400,220 Z" fill="#262118"/>`;
    g += `<path d="M0,26 L104,66 L104,76 L0,38 Z" fill="#1c1813"/>`;
    g += `<path d="M400,18 L296,58 L296,68 L400,30 Z" fill="#191510"/>`;
    for (let i = 0; i < 7; i++) {
      g += `<line x1="${F(2 + i * 15)}" y1="${F(30 + i * 1.2)}" x2="${F(2 + i * 15)}" y2="${F(40 + i * 1.2)}" stroke="#3a332a" stroke-width="2"/>`;
      g += `<line x1="${F(398 - i * 15)}" y1="${F(22 + i * 1.2)}" x2="${F(398 - i * 15)}" y2="${F(32 + i * 1.2)}" stroke="#3a332a" stroke-width="2"/>`;
    }
    g += `<rect x="118" y="86" width="164" height="60" fill="#4a4036"/>`;
    g += roof(112, 88, 176, 22, "#221d17", "#8a6a42");
    g += win(132, 104, 20, 24, "#ffc98a", .9) + win(196, 104, 20, 24, "#ffc98a", .85) + win(248, 104, 20, 24, "#ffb765", .7);
    g += `<rect x="176" y="118" width="18" height="28" fill="#2e2419"/>`;
    g += lantern(150, 100, 1.2) + lantern(252, 100, 1.2);
    g += `<rect y="146" width="400" height="74" fill="#232a33"/>`;
    for (let i = 0; i < 9; i++) g += `<line x1="0" y1="${F(150 + i * 8.4)}" x2="400" y2="${F(150 + i * 8.4)}" stroke="#2c3542" stroke-width="1.4"/>`;
    for (let i = 0; i < 6; i++) g += `<line x1="${F(i * 72)}" y1="146" x2="${F(i * 72 - 14)}" y2="220" stroke="#2c3542" stroke-width="1.4"/>`;
    g += banyan(200, 200, 1.35);
    g += `<ellipse cx="120" cy="186" rx="20" ry="6" fill="#3d4652"/><ellipse cx="120" cy="183" rx="20" ry="5" fill="#4c5866"/>`;
    g += `<rect x="116" y="188" width="7" height="16" fill="#333c47"/>`;
    g += `<ellipse cx="86" cy="198" rx="8" ry="4" fill="#3d4652"/><ellipse cx="152" cy="198" rx="8" ry="4" fill="#3d4652"/>`;
    g += `<g opacity=".9"><ellipse cx="286" cy="54" rx="9" ry="4.5" fill="#14100c"/>` +
         `<circle cx="294" cy="49" r="4" fill="#14100c"/>` +
         `<path d="M292,46 l-1,-4 M296,46 l1,-4" stroke="#14100c" stroke-width="1.4"/>` +
         `<path d="M278,52 q-8,4 -2,8" stroke="#14100c" stroke-width="1.6" fill="none"/></g>`;
    g += `<rect width="400" height="220" fill="#05080d" opacity=".1"/>`;
    return `<defs>${d}</defs>` + g;
  }

  /* =======================================================
     场景 4 · 洪崖洞崖壁客栈 —— 崖壁层楼 + 跨江大桥
     ======================================================= */
  function scCliffTower(r, P) {
    let d = grad(P + "sky", "#131e33", "#0a1018") + grad(P + "wat", "#101f33", "#070d16");
    let g = `<rect width="400" height="220" fill="url(#${P}sky)"/>`;
    g += stars(r, 24, 70);
    g += moon(64, 34, 9, "#e8f0ff");
    g += `<path d="M0,118 H400" stroke="#0d1420" stroke-width="3"/>`;
    g += `<rect x="70" y="96" width="6" height="24" fill="#0d1420"/><rect x="330" y="96" width="6" height="24" fill="#0d1420"/>`;
    g += `<path d="M73,98 Q200,128 333,98" fill="none" stroke="#0d1420" stroke-width="1.6"/>`;
    for (let i = 0; i <= 20; i++) {
      const t = i / 20, x = 73 + t * 260, y = 98 + Math.sin(Math.PI * t) * 30;
      g += `<line x1="${F(x)}" y1="${F(y)}" x2="${F(x)}" y2="118" stroke="#0d1420" stroke-width=".9"/>`;
    }
    for (let i = 0; i < 22; i++) g += `<circle cx="${F(i * 18 + 6)}" cy="118" r="1.3" fill="#ffd9a0" opacity="${F(.3 + r() * .5)}"/>`;
    g += `<path d="M0,220 L0,120 L60,132 L96,220 Z" fill="#12161d"/>`;
    for (let i = 0; i < 5; i++) {
      const y = 108 + i * 21, w = 120 - i * 8, x = 150 + i * 4;
      g += `<rect x="${F(x)}" y="${F(y)}" width="${F(w)}" height="18" fill="${i % 2 ? "#5d4030" : "#6b4a34"}"/>`;
      g += `<rect x="${F(x - 5)}" y="${F(y)}" width="${F(w + 10)}" height="3.4" fill="#3a2a1c"/>`;
      g += roof(x - 8, y, w + 16, 9, "#211a12", "#a8703c");
      for (let k = 0; k < 4; k++) g += win(x + 8 + k * (w - 20) / 3.4, y + 5, 8, 8, "#ffc274", .55 + r() * .45);
      for (let p = 0; p < 3; p++) g += `<rect x="${F(x + 10 + p * (w / 2.8))}" y="${F(y + 18)}" width="2.6" height="${F(14 + r() * 6)}" fill="#2e2216" opacity=".9"/>`;
      g += lantern(x + w - 8, y + 17, .9, "#e0402a");
    }
    g += `<rect y="188" width="400" height="32" fill="url(#${P}wat)"/>`;
    for (let i = 0; i < 26; i++) {
      const lx = 150 + r() * 130, ly = 190 + r() * 28;
      g += `<rect x="${F(lx)}" y="${F(ly)}" width="${F(6 + r() * 22)}" height="1.6" fill="#ffc274" opacity="${F(.08 + r() * .22)}"/>`;
    }
    g += `<path d="M300,196 q10,-6 20,0 t20,0" stroke="#ffc274" stroke-width="1" fill="none" opacity=".2"/>`;
    g += `<rect width="400" height="220" fill="#05080d" opacity=".12"/>`;
    return `<defs>${d}</defs>` + g;
  }

  /* =======================================================
     场景 5 · 仙女山森林木屋 —— 雪原林海
     ======================================================= */
  function scSnowGrass(r, P) {
    let d = grad(P + "sky", "#54708f", "#c3d3e0") + grad(P + "snow", "#eef4f9", "#c9d8e6");
    let g = `<rect width="400" height="220" fill="url(#${P}sky)"/>`;
    g += `<circle cx="330" cy="36" r="26" fill="#fff7e0" opacity=".25"/><circle cx="330" cy="36" r="13" fill="#fff8e6" opacity=".7"/>`;
    g += ridge(96, 26, "#a9bccd", 4) + ridge(120, 18, "#93a9bd", 9);
    g += `<path d="M0,150 Q100,132 200,148 Q300,164 400,142 L400,220 L0,220 Z" fill="url(#${P}snow)"/>`;
    for (let i = 0; i < 9; i++) {
      const tx = 12 + i * 44 + r() * 14, ty = 150 + r() * 16, s = .8 + r() * .7;
      g += pine(tx, ty, s, "#2e4438", "#f2f7fb");
    }
    const hx = 148, hy = 128;
    g += `<rect x="${hx}" y="${hy}" width="104" height="42" fill="#7a5a38"/>`;
    for (let k = 0; k < 5; k++) g += `<line x1="${hx}" y1="${F(hy + 6 + k * 8)}" x2="${hx + 104}" y2="${F(hy + 6 + k * 8)}" stroke="#5f4527" stroke-width="1.6"/>`;
    g += roof(hx - 12, hy, 128, 30, "#2e2a24", "#cfe0ee");
    g += win(hx + 14, hy + 12, 24, 20, "#ffd9a0", .95) + win(hx + 62, hy + 12, 24, 20, "#ffc98a", .9);
    g += `<rect x="${hx + 88}" y="${hy - 18}" width="10" height="20" fill="#4a3a2a"/>`;
    g += smoke(hx + 93, hy - 18, .9, "#dfe8f0", 0);
    for (let i = 0; i < 14; i++) g += `<ellipse cx="${F(r() * 400)}" cy="${F(176 + r() * 40)}" rx="${F(6 + r() * 14)}" ry="${F(1.4 + r())}" fill="#ffffff" opacity=".35"/>`;
    for (let i = 0; i < 22; i++) g += `<circle class="sa-fall" cx="${F(r() * 400)}" cy="${F(r() * 200)}" r="${F(.8 + r() * 1.4)}" fill="#fff" opacity="${F(.3 + r() * .5)}" style="animation-delay:${F(r() * 5)}s"/>`;
    g += `<rect width="400" height="220" fill="#0a1420" opacity=".08"/>`;
    return `<defs>${d}</defs>` + g;
  }

  /* =======================================================
     场景 6 · 龚滩临江吊脚楼 —— 乌江晨雾
     ======================================================= */
  function scFogRiver(r, P) {
    let d = grad(P + "sky", "#a9bcc8", "#e8eef2") + grad(P + "wat", "#b9c9d2", "#8fa4b2");
    let g = `<rect width="400" height="220" fill="url(#${P}sky)"/>`;
    g += `<circle cx="300" cy="44" r="30" fill="#fff3d8" opacity=".35"/><circle cx="300" cy="44" r="14" fill="#fff6e2" opacity=".8"/>`;
    g += ridge(110, 30, "#bccad4", 3) + ridge(132, 22, "#a7b8c6", 8) + ridge(152, 14, "#93a6b5", 13);
    for (let i = 0; i < 4; i++) g += mist(60 + i * 110, 118 + i * 12, 130 + r() * 60, 7 + r() * 5, "#e8eef2", .5 + r() * .25, i * 1.8);
    g += `<rect y="158" width="400" height="62" fill="url(#${P}wat)"/>`;
    g += shimmer(162, 12, "#e8eef2", 70);
    g += `<g class="sa-boat"><path d="M52,176 q22,10 46,0 l-6,8 h-34 Z" fill="#3a3226"/>` +
         `<path d="M74,176 v-16" stroke="#3a3226" stroke-width="2"/>` +
         `<circle cx="74" cy="156" r="3.4" fill="#2e2820"/><path d="M74,160 v12" stroke="#2e2820" stroke-width="3.4"/>` +
         `<ellipse cx="74" cy="184" rx="26" ry="2.6" fill="#7e93a3" opacity=".5"/></g>`;
    const hx = 236, hy = 120;
    for (let p = 0; p < 4; p++) g += `<rect x="${F(hx + 8 + p * 26)}" y="${F(hy + 44)}" width="3.4" height="${F(38 + r() * 8)}" fill="#4a3a2c"/>`;
    g += `<rect x="${hx - 4}" y="${hy + 40}" width="128" height="5" fill="#57402c"/>`;
    g += `<rect x="${hx}" y="${hy}" width="120" height="44" fill="#6d5238"/>`;
    for (let k = 0; k < 4; k++) g += `<line x1="${hx}" y1="${F(hy + 9 + k * 10)}" x2="${hx + 120}" y2="${F(hy + 9 + k * 10)}" stroke="#543d26" stroke-width="1.4"/>`;
    g += roof(hx - 10, hy, 140, 24, "#2c2a26", "#8fa4b2");
    g += win(hx + 16, hy + 12, 20, 16, "#ffd9a0", .9) + win(hx + 84, hy + 12, 20, 16, "#3a4a58", .8);
    g += lantern(hx + 58, hy + 46, 1, "#d84a30");
    g += `<line x1="${hx + 6}" y1="${hy + 52}" x2="${hx + 116}" y2="${hy + 52}" stroke="#8a7a5c" stroke-width="1"/>`;
    g += `<rect x="${hx + 20}" y="${hy + 52}" width="12" height="16" fill="#9a4a3a" opacity=".9"/><rect x="${hx + 44}" y="${hy + 52}" width="10" height="13" fill="#7a8a9a" opacity=".9"/>`;
    g += birds(96, 66, 4, "#4a5a68");
    g += mist(200, 176, 180, 10, "#e8eef2", .55, 1.2);
    g += `<rect width="400" height="220" fill="#1a2632" opacity=".07"/>`;
    return `<defs>${d}</defs>` + g;
  }

  /* =======================================================
     场景 7 · 金佛山悬崖玻璃房 —— 云海观星
     ======================================================= */
  function scGlassBox(r, P) {
    let d = grad(P + "sky", "#101a30", "#060a14");
    let g = `<rect width="400" height="220" fill="url(#${P}sky)"/>`;
    g += stars(r, 46, 120);
    g += `<ellipse cx="200" cy="70" rx="150" ry="26" fill="#8fa8d8" opacity=".05"/>`;
    for (let i = 0; i < 5; i++) g += mist(20 + i * 96, 150 + i * 12, 120 + r() * 70, 9 + r() * 6, i % 2 ? "#4a5f80" : "#33445e", .3 + r() * .25, i * 1.5);
    g += `<path d="M400,220 L400,20 L336,44 L318,96 L344,118 L322,220 Z" fill="#131820"/>`;
    for (let i = 0; i < 7; i++) g += `<line x1="${F(330 + r() * 60)}" y1="${F(30 + r() * 170)}" x2="${F(326 + r() * 60)}" y2="${F(44 + r() * 170)}" stroke="#1d242e" stroke-width="1.6"/>`;
    g += `<rect x="150" y="150" width="190" height="5" fill="#232b36"/>`;
    for (let p = 0; p < 5; p++) g += `<rect x="${F(156 + p * 44)}" y="155" width="3" height="${F(20 + r() * 14)}" fill="#1a212a"/>`;
    g += `<rect x="176" y="102" width="118" height="48" rx="3" fill="#9fd0ff" opacity=".16"/>`;
    g += `<rect x="176" y="102" width="118" height="48" rx="3" fill="none" stroke="#cfe8ff" stroke-width="1.6" opacity=".75"/>`;
    g += `<line x1="235" y1="102" x2="235" y2="150" stroke="#cfe8ff" stroke-width="1" opacity=".4"/>`;
    g += `<rect x="186" y="126" width="98" height="24" fill="#ffc98a" opacity=".14"/>`;
    g += `<circle cx="222" cy="122" r="4" fill="#ffd9a0" opacity=".95"/>`;
    g += `<path d="M186,150 v-14 q0,-8 8,-8 h10 v22 Z" fill="#ffb765" opacity=".22"/>`;
    g += `<rect x="252" y="134" width="26" height="16" rx="3" fill="#ffb765" opacity=".3"/>`;
    for (let i = 0; i < 9; i++) g += `<rect x="${F(158 + i * 21)}" y="138" width="2" height="13" fill="#2c3644"/>`;
    g += `<rect x="152" y="136" width="182" height="2.6" fill="#38445a"/>`;
    g += `<line x1="188" y1="146" x2="216" y2="106" stroke="#e8f4ff" stroke-width="2" opacity=".14"/>`;
    g += `<circle class="sa-star" cx="270" cy="118" r="1.4" fill="#fff" style="animation-delay:.8s"/>`;
    g += `<rect width="400" height="220" fill="#05080d" opacity=".1"/>`;
    return `<defs>${d}</defs>` + g;
  }

  /* =======================================================
     场景 8 · 黄水林海避暑山居 —— 林海四重
     ======================================================= */
  function scForestSea(r, P) {
    let d = grad(P + "sky", "#33505a", "#a8c4b4");
    const layer = (y0, amp, fill, sd, trees) => {
      let s = ridge(y0, amp, fill, sd);
      if (trees) {
        for (let i = 0; i < 14; i++) {
          const tx = i * 29 + r() * 12;
          const ty = y0 - (Math.sin((tx / 400) * 6.3 + sd) * .5 + .5) * amp - Math.sin((tx / 400) * 17 + sd * 3) * amp * .18;
          s += pine(tx, ty + 2, .5, fill, null);
        }
      }
      return s;
    };
    let g = `<rect width="400" height="220" fill="url(#${P}sky)"/>`;
    g += mist(120, 60, 220, 12, "#c4d8cc", .4, 0);
    g += layer(96, 34, "#7d9c94", 3, true);
    g += mist(80, 108, 240, 10, "#c4d8cc", .55, 2);
    g += layer(126, 28, "#5d7d78", 7, true);
    g += mist(200, 140, 220, 9, "#b8cec2", .5, 4);
    g += layer(156, 22, "#47706a", 11, true);
    const hx = 158, hy = 150;
    g += `<rect x="${F(hx - 8)}" y="${F(hy + 26)}" width="112" height="10" fill="#3a4338"/>`;
    g += `<rect x="${hx}" y="${hy}" width="96" height="34" fill="#6d5335"/>`;
    for (let k = 0; k < 3; k++) g += `<line x1="${hx}" y1="${F(hy + 9 + k * 9)}" x2="${hx + 96}" y2="${F(hy + 9 + k * 9)}" stroke="#54402a" stroke-width="1.4"/>`;
    g += roof(hx - 10, hy, 116, 22, "#2c2a24", "#9ab5a8");
    g += win(hx + 14, hy + 10, 20, 16, "#ffd9a0", .95) + win(hx + 60, hy + 10, 20, 16, "#ffc98a", .85);
    g += smoke(hx + 86, hy - 2, .8, "#c4d4cc", .6);
    g += `<path d="M0,220 L0,186 Q120,168 220,182 Q320,196 400,180 L400,220 Z" fill="#233330"/>`;
    g += `<path d="M196,182 Q188,200 182,220 L206,220 Q202,200 208,182 Z" fill="#31413a"/>`;
    for (let i = 0; i < 6; i++) g += `<path d="M${F(20 + i * 64)},${F(196 + (i % 3) * 8)} q4,-8 8,0 M${F(24 + i * 64)},${F(200 + (i % 3) * 8)} q4,-8 8,0" stroke="#3f5c48" stroke-width="1.6" fill="none"/>`;
    g += `<rect width="400" height="220" fill="#0a1412" opacity=".08"/>`;
    return `<defs>${d}</defs>` + g;
  }

  /* =======================================================
     场景 9 · 四面山瀑布小院 —— 丹霞飞瀑
     ======================================================= */
  function scDanxia(r, P) {
    let d = grad(P + "sky", "#46586f", "#d89a63") + grad(P + "wat", "#8a5a3a", "#5a3826");
    let g = `<rect width="400" height="220" fill="url(#${P}sky)"/>`;
    g += `<circle cx="86" cy="46" r="22" fill="#ffd9a0" opacity=".3"/><circle cx="86" cy="46" r="11" fill="#ffe4b0" opacity=".8"/>`;
    g += `<path d="M0,220 L0,34 L64,54 L96,120 L84,220 Z" fill="#8a4a32"/>`;
    g += `<path d="M400,220 L400,20 L330,40 L300,110 L318,220 Z" fill="#7a4030"/>`;
    for (let i = 0; i < 9; i++) {
      g += `<line x1="0" y1="${F(52 + i * 18)}" x2="${F(60 + (i % 3) * 14)}" y2="${F(64 + i * 18)}" stroke="#6a3826" stroke-width="2" opacity=".7"/>`;
      g += `<line x1="400" y1="${F(40 + i * 19)}" x2="${F(336 - (i % 3) * 14)}" y2="${F(52 + i * 19)}" stroke="#6a3826" stroke-width="2" opacity=".7"/>`;
    }
    g += `<path d="M196,30 q10,60 4,110 q-4,30 -2,50 l16,0 q2,-24 -2,-52 q-2,-52 6,-108 Z" fill="#e8f0f5" opacity=".9"/>`;
    g += `<path d="M206,44 q6,50 2,96" stroke="#fff" stroke-width="2" fill="none" opacity=".5"/>`;
    g += `<g class="sa-steam" opacity=".7">` +
         `<ellipse cx="204" cy="192" rx="46" ry="10" fill="#e8f0f5" opacity=".5"/>` +
         `<ellipse cx="204" cy="184" rx="30" ry="7" fill="#fff" opacity=".4"/></g>`;
    g += `<ellipse cx="204" cy="204" rx="120" ry="12" fill="url(#${P}wat)" opacity=".8"/>`;
    const hx = 250, hy = 168;
    g += `<rect x="${hx}" y="${hy}" width="86" height="34" fill="#5a4a38"/>`;
    g += roof(hx - 10, hy, 106, 20, "#2e2a22", "#c98a5a");
    g += win(hx + 12, hy + 10, 18, 15, "#ffd9a0", .95) + win(hx + 52, hy + 10, 18, 15, "#ffc98a", .85);
    g += `<rect x="${F(hx - 44)}" y="${F(hy + 14)}" width="34" height="20" fill="#4a3e30"/>`;
    g += `<line x1="${F(hx - 10)}" y1="${F(hy + 6)}" x2="${F(hx + 96)}" y2="${F(hy + 6)}" stroke="#e0402a" stroke-width="1.4" opacity=".8"/>`;
    g += lantern(hx + 40, hy + 22, 1, "#e0402a");
    g += `<path d="M0,220 L0,190 Q60,178 120,196 L120,220 Z" fill="#6a3826"/>`;
    for (let i = 0; i < 4; i++) g += `<path d="M${F(16 + i * 12)},212 v-22 M${F(22 + i * 12)},210 v-18" stroke="#3f5a3a" stroke-width="2.4"/>`;
    g += birds(300, 60, 3, "#5a3a28");
    g += `<rect width="400" height="220" fill="#1a0e08" opacity=".1"/>`;
    return `<defs>${d}</defs>` + g;
  }

  /* =======================================================
     场景 10 · 濯水风雨桥居 —— 廊桥灯火
     ======================================================= */
  function scCoveredBridge(r, P) {
    let d = grad(P + "sky", "#5f7a8c", "#cfdde2") + grad(P + "wat", "#7e96a6", "#54687a");
    let g = `<rect width="400" height="220" fill="url(#${P}sky)"/>`;
    g += `<circle cx="70" cy="40" r="20" fill="#fff3d8" opacity=".4"/>`;
    g += ridge(96, 26, "#9db2be", 4) + ridge(120, 16, "#8ba2b0", 9);
    for (let i = 0; i < 4; i++) {
      const hx = 24 + i * 52, hy = 118 - (i % 2) * 8;
      g += `<rect x="${hx}" y="${hy}" width="40" height="26" fill="#4a4438"/>`;
      g += roof(hx - 5, hy, 50, 14, "#2c2a24", "#9db2be");
      g += win(hx + 8, hy + 8, 9, 8, "#ffc98a", .8) + win(hx + 24, hy + 8, 9, 8, "#ffb765", .7);
    }
    g += `<rect y="146" width="400" height="74" fill="url(#${P}wat)"/>`;
    const by = 128;
    for (let i = 0; i < 5; i++) {
      const x = 40 + i * 66;
      g += `<rect x="${x}" y="${F(by + 10)}" width="62" height="34" fill="#5a4632"/>`;
      g += roof(x - 6, by + 10, 74, 16, "#2e2a22", "#c98a5a");
      g += win(x + 12, by + 22, 10, 10, "#ffc98a", .9) + win(x + 38, by + 22, 10, 10, "#ffb765", .8);
      g += `<rect x="${F(x + 26)}" y="${F(by + 44)}" width="4" height="18" fill="#3a2e20"/>`;
      g += `<rect x="${F(x + 4)}" y="${F(by + 40)}" width="54" height="4" fill="#463527"/>`;
      g += lantern(x + 30, by + 46, .9, "#e0402a");
    }
    for (let i = 0; i < 4; i++) g += `<rect x="${F(70 + i * 66)}" y="${F(by + 62)}" width="8" height="18" fill="#2e2620" opacity=".85"/>`;
    for (let i = 0; i < 10; i++) g += `<rect class="sa-shimmer" x="${F(60 + i * 34)}" y="${F(156 + (i % 3) * 12)}" width="26" height="1.8" fill="#ffe0b0" opacity=".18" style="animation-delay:${F(i * .4)}s"/>`;
    g += `<path d="M366,146 q-6,-30 4,-44" stroke="#4a3a28" stroke-width="4" fill="none"/>`;
    for (let i = 0; i < 6; i++) g += `<path d="M370,${F(104 + i * 7)} q${i % 2 ? 12 : -12},10 ${i % 2 ? 16 : -16},${F(20 + i * 2)}" stroke="#3f5a3a" stroke-width="2" fill="none" opacity=".9"/>`;
    g += `<ellipse cx="370" cy="98" rx="22" ry="12" fill="#3f5a3a"/>`;
    g += birds(150, 60, 3, "#4a5a68");
    g += `<rect width="400" height="220" fill="#14202a" opacity=".07"/>`;
    return `<defs>${d}</defs>` + g;
  }

  /* =======================================================
     场景 11 · 长江索道旁老公寓 —— 缆车过窗
     ======================================================= */
  function scCableApt(r, P) {
    let d = grad(P + "sky", "#2b3350", "#7a5262") + grad2(P + "glow", "#ff9a5a");
    let g = `<rect width="400" height="220" fill="url(#${P}sky)"/>`;
    g += `<circle cx="66" cy="88" r="34" fill="url(#${P}glow)" opacity=".28"/>`;
    for (let i = 0; i < 12; i++) {
      const bx = i * 34 + r() * 8, bh = 20 + r() * 40;
      g += `<rect x="${F(bx)}" y="${F(150 - bh)}" width="${F(16 + r() * 12)}" height="${F(bh)}" fill="#232c42" opacity=".9"/>`;
      for (let k = 0; k < 3; k++) if (r() > .5) g += win(bx + 3 + k * 6, 150 - bh + 6 + k * 9, 2.6, 3.4, "#ffc274", .5);
    }
    const bx0 = 96, by0 = 74, bw = 150, fl = 5, fh = 15;
    g += `<rect x="${bx0}" y="${by0}" width="${bw}" height="${fl * fh}" fill="#39404e"/>`;
    g += `<rect x="${F(bx0 - 4)}" y="${F(by0 - 6)}" width="${F(bw + 8)}" height="7" fill="#2c333f"/>`;
    for (let i = 0; i < fl; i++) {
      const y = by0 + i * fh;
      g += `<rect x="${F(bx0 - 3)}" y="${F(y + fh - 3)}" width="${F(bw + 6)}" height="3.4" fill="#454e5e"/>`;
      for (let k = 0; k < 4; k++) {
        const x = bx0 + 8 + k * 35;
        const lit = r() > .3;
        g += win(x, y + 4, 18, 10, lit ? "#ffc98a" : "#2b3240", lit ? .55 + r() * .4 : .9);
        g += `<rect x="${F(x + 14)}" y="${F(y + 12)}" width="5" height="4" fill="#525b6b"/>`;
      }
      if (i === 2) {
        g += `<line x1="${F(bx0 + 6)}" y1="${F(y - 2)}" x2="${F(bx0 + bw - 6)}" y2="${F(y - 2)}" stroke="#8a8a7a" stroke-width=".9"/>`;
        ["#c05a4a", "#4a6a8a", "#c9a44a", "#6a8a5a"].forEach((c, k) => {
          g += `<rect x="${F(bx0 + 18 + k * 26)}" y="${F(y - 2)}" width="10" height="13" fill="${c}" opacity=".85"/>`;
        });
      }
    }
    g += `<line x1="0" y1="52" x2="400" y2="44" stroke="#1c232f" stroke-width="1.4"/>`;
    g += `<rect x="330" y="40" width="5" height="34" fill="#1c232f"/>`;
    g += `<g class="sa-cable"><rect x="-30" y="46" width="34" height="22" rx="4" fill="#c23a2a"/>` +
         `<rect x="-24" y="51" width="16" height="10" fill="#ffd9a0" opacity=".95"/>` +
         `<line x1="-13" y1="44" x2="-13" y2="46" stroke="#1c232f" stroke-width="2"/></g>`;
    g += `<path d="M0,86 Q100,98 200,88 Q300,78 400,92" stroke="#1c232f" stroke-width=".9" fill="none" opacity=".8"/>`;
    g += `<rect y="186" width="400" height="34" fill="#181d26"/>`;
    g += `<rect x="36" y="150" width="4" height="40" fill="#10141c"/>`;
    g += `<circle cx="38" cy="148" r="5" fill="#ffd9a0" opacity=".95"/><circle cx="38" cy="148" r="12" fill="#ffd9a0" opacity=".14"/>`;
    g += `<rect y="150" width="400" height="2" fill="#0e1218" opacity=".6"/>`;
    g += `<rect width="400" height="220" fill="#0a0e16" opacity=".14"/>`;
    return `<defs>${d}</defs>` + g;
  }

  /* =======================================================
     场景 12 · 缙云山禅意山居 —— 竹涧温泉
     ======================================================= */
  function scBambooZen(r, P) {
    let d = grad(P + "sky", "#243a2c", "#0e1a12") + grad(P + "pool", "#3f6a62", "#1e3833");
    let g = `<rect width="400" height="220" fill="url(#${P}sky)"/>`;
    const stalk = (x, w, h, op) => {
      let s = `<g opacity="${op}"><rect x="${F(x)}" y="${F(220 - h)}" width="${F(w)}" height="${F(h)}" rx="${F(w / 2)}" fill="#2e4a30"/>`;
      const n = Math.floor(h / 34);
      for (let k = 0; k < n; k++) s += `<line x1="${F(x - 1)}" y1="${F(220 - h + 20 + k * 34)}" x2="${F(x + w + 1)}" y2="${F(220 - h + 20 + k * 34)}" stroke="#1d3020" stroke-width="1.6"/>`;
      return s + `</g>`;
    };
    [20, 58, 356, 382].forEach((x, i) => { g += stalk(x, 5 - (i % 2), 150 + r() * 60, .9 - i * .1); });
    g += stalk(88, 4, 120, .55) + stalk(312, 4, 132, .55);
    for (let i = 0; i < 10; i++) {
      const lx = r() * 400, ly = 20 + r() * 90;
      g += `<path d="M${F(lx)},${F(ly)} q${r() > .5 ? 10 : -10},-6 ${r() > .5 ? 18 : -18},${F(2 + r() * 6)}" stroke="#3a5c3a" stroke-width="2" fill="none" opacity=".8"/>`;
    }
    const hx = 150, hy = 108;
    g += `<rect x="${F(hx - 10)}" y="${F(hy + 30)}" width="128" height="8" fill="#3a4338"/>`;
    g += `<rect x="${hx}" y="${hy}" width="108" height="34" fill="#4a3a2c"/>`;
    g += `<rect x="${F(hx + 18)}" y="${F(hy + 8)}" width="30" height="26" fill="#ffd9a0" opacity=".9"/>`;
    g += `<rect x="${F(hx + 60)}" y="${F(hy + 8)}" width="30" height="26" fill="#ffc98a" opacity=".85"/>`;
    g += `<line x1="${F(hx + 33)}" y1="${F(hy + 8)}" x2="${F(hx + 33)}" y2="${F(hy + 34)}" stroke="#4a3a2c" stroke-width="1.6"/>`;
    g += `<line x1="${F(hx + 18)}" y1="${F(hy + 21)}" x2="${F(hx + 48)}" y2="${F(hy + 21)}" stroke="#4a3a2c" stroke-width="1.6"/>`;
    g += `<line x1="${F(hx + 75)}" y1="${F(hy + 8)}" x2="${F(hx + 75)}" y2="${F(hy + 34)}" stroke="#4a3a2c" stroke-width="1.6"/>`;
    g += `<line x1="${F(hx + 60)}" y1="${F(hy + 21)}" x2="${F(hx + 90)}" y2="${F(hy + 21)}" stroke="#4a3a2c" stroke-width="1.6"/>`;
    g += roof(hx - 12, hy, 132, 20, "#241f18", "#7a9a6a");
    g += `<ellipse cx="300" cy="196" rx="62" ry="16" fill="#2a2418"/>`;
    g += `<ellipse cx="300" cy="194" rx="54" ry="12" fill="url(#${P}pool)"/>`;
    g += `<ellipse cx="300" cy="194" rx="54" ry="12" fill="none" stroke="#5a7a5a" stroke-width="1.4" opacity=".6"/>`;
    g += `<g class="sa-steam" opacity=".55">` +
         `<ellipse cx="288" cy="182" rx="16" ry="5" fill="#c4d4cc" opacity=".5"/>` +
         `<ellipse cx="312" cy="176" rx="13" ry="4" fill="#c4d4cc" opacity=".4"/></g>`;
    g += `<path d="M0,214 Q120,200 240,210 Q340,218 400,208 L400,220 L0,220 Z" fill="#1c2a1e"/>`;
    for (let i = 0; i < 6; i++) g += `<ellipse cx="${F(30 + i * 66)}" cy="${F(210 + (i % 2) * 5)}" rx="14" ry="4" fill="#2e3a2c" opacity=".8"/>`;
    for (let i = 0; i < 4; i++) g += firefly(r, 40, 360, 150, 200);
    g += `<rect width="400" height="220" fill="#05080d" opacity=".1"/>`;
    return `<defs>${d}</defs>` + g;
  }

  /* =======================================================
     场景 13 · 巫山观峡台民宿 —— 窗框里的神女峰
     ======================================================= */
  function scGorgeView(r, P) {
    let d = grad(P + "sky", "#31435c", "#93a9b8") + grad(P + "wat", "#6a8296", "#42566a");
    let g = `<rect width="400" height="220" fill="url(#${P}sky)"/>`;
    g += mist(200, 60, 200, 10, "#c4d0da", .45, 0);
    g += `<path d="M0,220 L0,26 L58,48 L92,130 L76,220 Z" fill="#232c36"/>`;
    g += `<path d="M400,220 L400,18 L352,36 L326,84 L344,120 L330,220 Z" fill="#1e262f"/>`;
    g += `<path d="M352,36 l10,-22 l8,10 l6,-14 l8,16 l-6,12 Z" fill="#2a3440"/>`;
    g += `<circle cx="366" cy="12" r="3" fill="#2a3440"/>`;
    for (let i = 0; i < 16; i++) {
      const rx0 = r() > .5 ? r() * 80 : 320 + r() * 76, ry0 = 90 + r() * 110;
      g += `<circle cx="${F(rx0)}" cy="${F(ry0)}" r="${F(2.4 + r() * 2.6)}" fill="${r() > .5 ? "#c14a2e" : "#d4762e"}" opacity="${F(.6 + r() * .4)}"/>`;
    }
    g += `<rect y="168" width="400" height="52" fill="url(#${P}wat)"/>`;
    g += mist(200, 176, 200, 9, "#c4d0da", .5, 1.5);
    g += mist(120, 190, 160, 8, "#c4d0da", .4, 3);
    g += `<path d="M150,196 q30,-6 60,0 t60,0 t60,0" stroke="#e8eef2" stroke-width="1.4" fill="none" opacity=".3"/>`;
    g += `<rect x="46" y="28" width="308" height="7" rx="2" fill="#2e2620"/>`;
    g += `<rect x="46" y="162" width="308" height="8" rx="2" fill="#2e2620"/>`;
    g += `<rect x="46" y="28" width="8" height="142" fill="#2e2620"/>`;
    g += `<rect x="346" y="28" width="8" height="142" fill="#2e2620"/>`;
    g += `<rect x="196" y="35" width="6" height="128" fill="#2e2620"/>`;
    g += `<rect y="170" width="400" height="50" fill="#1a2028"/>`;
    g += `<path d="M60,170 h26 l-3,-12 h-20 Z" fill="#3a2c1e"/>` +
         `<path d="M73,158 q-8,-10 -2,-18 M73,158 q8,-10 2,-18" stroke="#3f5a3a" stroke-width="2.2" fill="none"/>`;
    g += `<rect x="320" y="150" width="5" height="20" fill="#241c14"/><path d="M316,150 h13 l-3,-8 h-7 Z" fill="#3a2c1e"/>`;
    g += birds(120, 90, 3, "#4a5a68");
    g += `<rect width="400" height="220" fill="#0a1018" opacity=".1"/>`;
    return `<defs>${d}</defs>` + g;
  }

  /* =======================================================
     场景 14 · 涞滩古镇禅院 —— 瓮城与摩崖
     ======================================================= */
  function scOldTown(r, P) {
    let d = grad(P + "sky", "#2e3a52", "#5a4630");
    let g = `<rect width="400" height="220" fill="url(#${P}sky)"/>`;
    g += `<circle cx="330" cy="40" r="18" fill="#ffd9a0" opacity=".22"/>`;
    g += `<path d="M400,220 L400,10 L300,26 L282,110 L300,220 Z" fill="#3a3428"/>`;
    for (let i = 0; i < 3; i++) {
      const gx = 322 + (i % 2) * 30, gy = 56 + i * 40;
      g += `<path d="M${F(gx - 12)},${F(gy + 26)} v-14 q0,-16 12,-16 q12,0 12,16 v14 Z" fill="#241f18"/>`;
      g += `<circle cx="${gx}" cy="${F(gy + 2)}" r="3.6" fill="#c9a44a" opacity=".9"/>`;
      g += `<path d="M${F(gx - 6)},${F(gy + 24)} q6,-14 12,0 Z" fill="#c9a44a" opacity=".75"/>`;
      g += `<circle cx="${gx}" cy="${F(gy + 40)}" r="3" fill="#ffb765" opacity=".8"/>`;
    }
    for (let i = 0; i < 6; i++) g += `<line x1="${F(286 + r() * 110)}" y1="${F(20 + r() * 190)}" x2="${F(284 + r() * 110)}" y2="${F(30 + r() * 190)}" stroke="#2a2519" stroke-width="2"/>`;
    g += `<rect x="0" y="120" width="240" height="100" fill="#4a4438"/>`;
    for (let i = 0; i < 240; i += 24) g += `<rect x="${i}" y="112" width="16" height="10" fill="#4a4438"/>`;
    g += `<path d="M0,120 H240" stroke="#5a5346" stroke-width="2"/>`;
    for (let i = 0; i < 40; i++) g += `<line x1="${F(r() * 240)}" y1="${F(124 + r() * 92)}" x2="${F(r() * 240 + 6)}" y2="${F(124 + r() * 92)}" stroke="#3a352b" stroke-width="1.6" opacity=".7"/>`;
    g += `<path d="M96,220 v-52 q0,-26 26,-26 q26,0 26,26 v52 Z" fill="#1c1810"/>`;
    g += `<path d="M104,220 v-50 q0,-20 18,-20 q18,0 18,20 v50 Z" fill="#0e0b06"/>`;
    g += `<rect x="84" y="66" width="80" height="30" fill="#544c3e"/>`;
    g += roof(76, 68, 96, 26, "#241f18", "#c9a44a");
    g += win(96, 76, 16, 14, "#ffc98a", .9) + win(134, 76, 16, 14, "#ffb765", .8);
    g += lantern(122, 100, 1.1, "#e0402a") + lantern(60, 118, 1) + lantern(196, 118, 1);
    g += `<rect y="196" width="400" height="24" fill="#3a352e"/>`;
    for (let i = 0; i < 5; i++) g += `<line x1="0" y1="${F(200 + i * 5)}" x2="400" y2="${F(200 + i * 5)}" stroke="#2c3440" stroke-width="1.6"/>`;
    g += `<path d="M0,120 Q60,100 130,116 Q200,132 260,112 L260,120 Z" fill="#232c36" opacity=".8"/>`;
    g += `<line x1="30" y1="118" x2="30" y2="76" stroke="#4a4438" stroke-width="2"/>`;
    g += `<path d="M30,80 l16,6 l-16,6 Z" fill="#c05a4a" opacity=".9"/>`;
    g += `<rect width="400" height="220" fill="#0a0e08" opacity=".12"/>`;
    return `<defs>${d}</defs>` + g;
  }

  /* =======================================================
     场景 15 · 龙缸云端帐篷 —— 天坑银河
     ======================================================= */
  function scSkyTent(r, P) {
    let d = grad(P + "sky", "#0c1426", "#05080f") + grad2(P + "mw", "#b8c8e8");
    let g = `<rect width="400" height="220" fill="url(#${P}sky)"/>`;
    g += `<ellipse cx="220" cy="52" rx="180" ry="24" transform="rotate(-14 220 52)" fill="url(#${P}mw)" opacity=".12"/>`;
    g += stars(r, 90, 130);
    for (let i = 0; i < 30; i++) {
      const sx = 60 + r() * 300, sy = 20 + r() * 70;
      g += `<circle cx="${F(sx)}" cy="${F(sy)}" r="${F(.5 + r() * .9)}" fill="#fff" opacity="${F(.4 + r() * .5)}"/>`;
    }
    g += `<g class="sa-meteor"><line x1="300" y1="30" x2="336" y2="52" stroke="#fff" stroke-width="1.4" opacity=".8"/></g>`;
    g += ridge(120, 22, "#0d1420", 6) + ridge(142, 14, "#0a1018", 12);
    g += `<path d="M0,220 L0,150 Q60,128 120,158 Q170,182 210,220 Z" fill="#10161f"/>`;
    g += `<path d="M0,150 Q60,128 120,158" fill="none" stroke="#2c3644" stroke-width="1.6" opacity=".8"/>`;
    const tx = 120, ty = 186;
    g += `<path d="M${F(tx - 34)},${ty} q34,-52 68,0 Z" fill="#c9b08a"/>`;
    g += `<path d="M${F(tx - 34)},${ty} q34,-52 68,0" fill="none" stroke="#a89068" stroke-width="1.4"/>`;
    g += `<path d="M${F(tx - 12)},${ty} q12,-22 24,0 Z" fill="#ffb765" opacity=".85"/>`;
    g += `<path d="M${F(tx - 12)},${ty} q12,-22 24,0" fill="none" stroke="#8a6a42" stroke-width="1"/>`;
    g += `<line x1="${F(tx - 34)}" y1="${ty}" x2="${F(tx - 48)}" y2="${F(ty + 8)}" stroke="#8a8a7a" stroke-width="1"/>`;
    g += `<line x1="${F(tx + 34)}" y1="${ty}" x2="${F(tx + 48)}" y2="${F(ty + 8)}" stroke="#8a8a7a" stroke-width="1"/>`;
    g += `<ellipse cx="${F(tx + 60)}" cy="${F(ty + 4)}" rx="10" ry="3" fill="#2c2620"/>`;
    g += `<path d="M${F(tx + 60)},${F(ty + 2)} q-5,-8 0,-14 q5,6 0,14" fill="#ff8a3a" opacity=".9"/>`;
    g += `<circle cx="${F(tx + 60)}" cy="${F(ty + 4)}" r="12" fill="#ff9a5a" opacity=".14"/>`;
    g += `<rect y="214" width="400" height="6" fill="#000" opacity=".5"/>`;
    g += `<rect width="400" height="220" fill="#04060a" opacity=".08"/>`;
    return `<defs>${d}</defs>` + g;
  }

  /* =======================================================
     场景 16 · 大巴山人家 —— 火塘腊肉土墙房
     ======================================================= */
  function scEarthen(r, P) {
    let d = grad(P + "sky", "#3a4a5c", "#b9c4c0") + grad(P + "hill", "#4a5a4a", "#2e3a30");
    let g = `<rect width="400" height="220" fill="url(#${P}sky)"/>`;
    g += `<circle cx="70" cy="42" r="16" fill="#fff3d8" opacity=".3"/>`;
    g += `<path d="M0,110 Q80,70 170,104 Q260,136 330,96 Q380,72 400,88 L400,130 L0,130 Z" fill="url(#${P}hill)" opacity=".8"/>`;
    for (let i = 0; i < 10; i++) g += pine(20 + i * 40 + r() * 10, 116 + r() * 14, .7, "#2e4438", "#e8f0f0");
    g += `<path d="M0,150 Q120,136 220,150 Q320,164 400,148 L400,220 L0,220 Z" fill="#4a4034"/>`;
    for (let i = 0; i < 12; i++) g += `<ellipse cx="${F(r() * 400)}" cy="${F(190 + r() * 28)}" rx="${F(10 + r() * 22)}" ry="${F(1.6 + r())}" fill="#e8f0f0" opacity=".3"/>`;
    const hx = 140, hy = 118;
    g += `<rect x="${hx}" y="${hy}" width="128" height="56" fill="#8a6a42"/>`;
    for (let i = 0; i < 16; i++) g += `<line x1="${F(hx + r() * 128)}" y1="${hy}" x2="${F(hx + r() * 128)}" y2="${F(hy + 56)}" stroke="#74583a" stroke-width="1.4" opacity=".6"/>`;
    g += roof(hx - 12, hy, 152, 30, "#2c2a22", "#8a6a42");
    g += win(hx + 16, hy + 14, 22, 18, "#ffb765", .95) + win(hx + 88, hy + 14, 22, 18, "#ffc98a", .85);
    g += `<rect x="${F(hx + 52)}" y="${F(hy + 26)}" width="24" height="30" fill="#3a2c1c"/>`;
    g += `<circle cx="${F(hx + 64)}" cy="${F(hy + 40)}" r="2" fill="#c9a44a"/>`;
    g += `<line x1="${F(hx + 4)}" y1="${F(hy + 4)}" x2="${F(hx + 124)}" y2="${F(hy + 4)}" stroke="#4a3a2a" stroke-width="1.4"/>`;
    for (let i = 0; i < 5; i++) {
      const mx = hx + 12 + i * 22;
      g += `<rect x="${mx}" y="${F(hy + 4)}" width="9" height="22" rx="2" fill="#7a3a26"/>`;
      g += `<rect x="${mx}" y="${F(hy + 4)}" width="9" height="4" rx="2" fill="#9a5a3a"/>`;
      g += `<line x1="${mx}" y1="${F(hy + 14)}" x2="${mx + 9}" y2="${F(hy + 14)}" stroke="#5a2a1a" stroke-width="1"/>`;
    }
    for (let i = 0; i < 3; i++) {
      const cx0 = hx + 18 + i * 30;
      g += `<path d="M${F(cx0)},${F(hy + 4)} v14" stroke="#c9a44a" stroke-width="1.2"/>`;
      g += `<ellipse cx="${F(cx0)}" cy="${F(hy + 20)}" rx="4" ry="7" fill="#d4b45a"/>`;
    }
    g += smoke(hx + 140, hy - 4, .9, "#c4ccc8", .3);
    g += `<rect x="${F(hx + 136)}" y="${F(hy + 34)}" width="34" height="22" fill="#4a3a2a"/>`;
    for (let i = 0; i < 5; i++) g += `<ellipse cx="${F(hx + 140 + (i % 3) * 12)}" cy="${F(hy + 38 + Math.floor(i / 3) * 10)}" rx="11" ry="4.5" fill="#5a4632"/>`;
    for (let i = 0; i < 18; i++) g += `<circle class="sa-fall" cx="${F(r() * 400)}" cy="${F(r() * 200)}" r="${F(.7 + r() * 1.2)}" fill="#fff" opacity="${F(.3 + r() * .5)}" style="animation-delay:${F(r() * 5)}s"/>`;
    g += `<rect width="400" height="220" fill="#141a14" opacity=".08"/>`;
    return `<defs>${d}</defs>` + g;
  }

  /* =======================================================
     路由
     ======================================================= */
  const SCENES = {
    "临江门老吊脚楼": scRiverShip,
    "南山云顶崖居": scCityLight,
    "磁器口老院子": scCourtyard,
    "洪崖洞崖壁客栈": scCliffTower,
    "仙女山森林木屋": scSnowGrass,
    "龚滩临江吊脚楼": scFogRiver,
    "金佛山悬崖玻璃房": scGlassBox,
    "黄水林海避暑山居": scForestSea,
    "四面山瀑布小院": scDanxia,
    "濯水风雨桥居": scCoveredBridge,
    "长江索道旁老公寓": scCableApt,
    "缙云山禅意山居": scBambooZen,
    "巫山观峡台民宿": scGorgeView,
    "涞滩古镇禅院": scOldTown,
    "龙缸云端帐篷": scSkyTent,
    "大巴山人家": scEarthen
  };
  const BY_CAT = { jiang: scRiverShip, shan: scForestSea, gu: scCourtyard, ya: scGlassBox };

  function svg(stay, idx) {
    const seed = 1000 + (idx || 0) * 37 + stay.n.length;
    const r = rng(seed);
    const P = "sa" + seed + "_";
    const fn = SCENES[stay.n] || BY_CAT[stay.cat] || scRiverShip;
    return `<svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" class="sa-svg">${fn(r, P)}</svg>`;
  }

  return { svg, scenes: SCENES };
})();

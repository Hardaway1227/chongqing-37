/* ==========================================================
   scenes.js — 地标场景绘制（程序化 SVG）
   render(id, "old"|"new") -> SVG 字符串
   ========================================================== */
window.Scenes = (function () {

  const W = 1600, H = 900;
  let uid = 0;
  const f = n => Math.round(n * 10) / 10;

  /* ---------- 伪随机（按种子稳定） ---------- */
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  /* ---------- 基础图形 ---------- */
  const rect = (x, y, w, h, fill, op, rx) =>
    `<rect x="${f(x)}" y="${f(y)}" width="${f(Math.max(0, w))}" height="${f(Math.max(0, h))}" fill="${fill}"${op != null ? ` opacity="${op}"` : ""}${rx ? ` rx="${rx}"` : ""}/>`;

  const poly = (pts, fill, op) =>
    `<polygon points="${pts.map(p => f(p[0]) + "," + f(p[1])).join(" ")}" fill="${fill}"${op != null ? ` opacity="${op}"` : ""}/>`;

  const line = (x1, y1, x2, y2, c, w, op) =>
    `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${w}"${op != null ? ` opacity="${op}"` : ""}/>`;

  const circ = (x, y, r, fill, op) =>
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}"${op != null ? ` opacity="${op}"` : ""}/>`;

  /* 山脊线 */
  function ridge(y0, amp, seed, fill, op, x0, x1) {
    const r = rng(seed);
    const pts = [];
    const a = x0 == null ? -40 : x0, b = x1 == null ? W + 40 : x1;
    const n = 26;
    for (let i = 0; i <= n; i++) {
      const x = a + (b - a) * i / n;
      const t = i / n;
      const y = y0 - (Math.sin(t * 6.1 + seed * 0.7) * 0.5 + 0.5) * amp * (0.55 + r() * 0.45)
        - Math.sin(t * 15 + seed) * amp * 0.16;
      pts.push([x, y]);
    }
    return poly(pts.concat([[b, H + 10], [a, H + 10]]), fill, op);
  }

  /* 窗格 */
  function winGrid(x, y, w, h, cols, rows, color, seed, litRate) {
    const r = rng(seed || 7);
    let s = "";
    const gw = w / cols, gh = h / rows;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        if (litRate != null && r() > litRate) continue;
        const px = x + i * gw + gw * 0.22, py = y + j * gh + gh * 0.22;
        s += rect(px, py, gw * 0.56, gh * 0.5, color, 0.55 + r() * 0.45);
      }
    }
    return s;
  }

  /* 人形剪影 */
  function person(x, y, s, color, hat) {
    const h = 42 * s, w = 13 * s;
    let g = `<g fill="${color}">`;
    g += `<ellipse cx="${f(x)}" cy="${f(y - h * 0.82)}" rx="${f(w * 0.42)}" ry="${f(w * 0.5)}"/>`;
    g += `<rect x="${f(x - w / 2)}" y="${f(y - h * 0.7)}" width="${f(w)}" height="${f(h * 0.45)}" rx="${f(w * 0.3)}"/>`;
    g += `<rect x="${f(x - w / 2)}" y="${f(y - h * 0.28)}" width="${f(w * 0.34)}" height="${f(h * 0.28)}"/>`;
    g += `<rect x="${f(x + w * 0.16)}" y="${f(y - h * 0.28)}" width="${f(w * 0.34)}" height="${f(h * 0.28)}"/>`;
    if (hat) g += `<ellipse cx="${f(x)}" cy="${f(y - h * 0.95)}" rx="${f(w * 0.9)}" ry="${f(w * 0.28)}"/>`;
    g += `</g>`;
    return g;
  }

  function crowd(x0, x1, y, n, s, color, seed, hat) {
    const r = rng(seed);
    let g = "";
    for (let i = 0; i < n; i++) {
      const x = x0 + (x1 - x0) * r();
      g += person(x, y + (r() - 0.5) * 10, s * (0.85 + r() * 0.3), color, hat && r() > 0.45);
    }
    return g;
  }

  /* 木船 */
  function boat(x, y, s, hull, sail) {
    let g = `<g transform="translate(${f(x)},${f(y)}) scale(${f(s)})">`;
    g += `<path d="M-46,0 L46,0 L34,16 L-34,16 Z" fill="${hull}"/>`;
    g += `<rect x="-3" y="-58" width="4" height="58" fill="${hull}"/>`;
    if (sail) {
      g += `<path d="M3,-56 L52,-14 L3,-8 Z" fill="${sail}" opacity=".92"/>`;
      g += `<path d="M-3,-46 L-38,-14 L-3,-10 Z" fill="${sail}" opacity=".8"/>`;
    }
    g += `</g>`;
    return g;
  }

  /* 树（黄葛树：浓密冠） */
  function tree(x, y, s, trunk, leaf, op) {
    let g = `<g transform="translate(${f(x)},${f(y)}) scale(${s})" ${op != null ? `opacity="${op}"` : ""}>`;
    g += `<rect x="-5" y="-52" width="10" height="54" rx="3" fill="${trunk}"/>`;
    g += `<circle cx="0" cy="-72" r="40" fill="${leaf}"/>`;
    g += `<circle cx="-30" cy="-56" r="27" fill="${leaf}"/>`;
    g += `<circle cx="30" cy="-58" r="29" fill="${leaf}"/>`;
    g += `<circle cx="4" cy="-98" r="24" fill="${leaf}"/>`;
    g += `</g>`;
    return g;
  }

  /* 吊脚楼单元 */
  function diaojiao(x, y, w, h, wall, roof, wood, posts, lit, seed) {
    let g = `<g>`;
    // 吊脚柱
    if (posts) {
      const ph = 26;
      for (let i = 0; i <= 2; i++) {
        g += rect(x + (w / 3) * i - 3, y + h, 5, ph, wood);
      }
    }
    g += rect(x - 4, y + h, w + 8, 5, wood);            // 楼板
    g += rect(x, y, w, h, wall);                         // 主体
    g += winGrid(x, y + h * 0.18, w, h * 0.5, Math.max(2, Math.round(w / 22)), 2, lit, seed, 0.72);
    g += poly([[x - 10, y], [x + w + 10, y], [x + w / 2, y - 26]], roof);  // 坡顶
    g += rect(x - 12, y - 3, w + 24, 4, wood);           // 檐
    g += `</g>`;
    return g;
  }

  /* =========================================================
     滤镜定义
     ========================================================= */
  function defs(era) {
    const u = "s" + (++uid);
    let d = `<defs>`;
    if (era === "old") {
      d += `<filter id="old_${u}" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="
          0.44 0.60 0.14 0 0.030
          0.37 0.52 0.12 0 0.022
          0.27 0.40 0.09 0 0.005
          0    0    0    1 0"/>
        <feComponentTransfer>
          <feFuncR type="gamma" amplitude="1" exponent="0.90"/>
          <feFuncG type="gamma" amplitude="1" exponent="1.00"/>
          <feFuncB type="gamma" amplitude="1" exponent="1.22"/>
        </feComponentTransfer>
        <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="${(uid * 13) % 90}" result="grain"/>
        <feColorMatrix in="grain" type="saturate" values="0" result="g2"/>
        <feComponentTransfer in="g2" result="g3"><feFuncA type="linear" slope="0.20" intercept="0"/></feComponentTransfer>
        <feBlend in2="SourceGraphic" mode="multiply" result="b1"/>
        <feBlend in="g3" in2="b1" mode="screen"/>
      </filter>`;
      d += `<radialGradient id="vig_${u}" cx="50%" cy="48%" r="72%">
        <stop offset="55%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#2a1d0c" stop-opacity="0.62"/></radialGradient>`;
    } else {
      d += `<filter id="new_${u}" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
        <feColorMatrix type="saturate" values="1.16"/>
        <feComponentTransfer>
          <feFuncR type="linear" slope="1.03" intercept="-0.008"/>
          <feFuncG type="linear" slope="1.01" intercept="-0.004"/>
          <feFuncB type="linear" slope="1.05" intercept="0.004"/>
        </feComponentTransfer>
      </filter>`;
      d += `<radialGradient id="vig_${u}" cx="50%" cy="46%" r="76%">
        <stop offset="62%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#04070d" stop-opacity="0.42"/></radialGradient>`;
    }
    d += `</defs>`;
    return { d, u };
  }

  function finish(era, u) {
    let s = "";
    s += rect(0, 0, W, H, `url(#vig_${u})`);
    if (era === "old") {
      // 划痕 + 斑点 + 折痕
      const r = rng(uid * 977 + 3);
      s += `<g opacity=".5">`;
      for (let i = 0; i < 5; i++) {
        const x = 60 + r() * (W - 120);
        s += line(x, 20 + r() * 60, x + (r() - 0.5) * 40, H - 30 - r() * 80, "#f0e6d2", 0.6 + r() * 0.9, 0.18 + r() * 0.22);
      }
      for (let i = 0; i < 3; i++) {
        const y = 100 + r() * (H - 200);
        s += line(20, y, W - 20, y + (r() - 0.5) * 30, "#3a2b16", 0.7, 0.13);
      }
      for (let i = 0; i < 22; i++) {
        s += circ(40 + r() * (W - 80), 30 + r() * (H - 60), 0.8 + r() * 2.4, "#4a3a22", 0.10 + r() * 0.22);
      }
      s += `<path d="M0,${f(H * 0.72)} Q ${f(W * 0.35)},${f(H * 0.70)} ${W},${f(H * 0.735)}" stroke="#fff" stroke-width="1.2" fill="none" opacity=".07"/>`;
      s += `</g>`;
      // 相纸边框
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#e8dcc2" stroke-width="26" opacity=".55"/>`;
      s += `<rect x="13" y="13" width="${W - 26}" height="${H - 26}" fill="none" stroke="#8a7a5c" stroke-width="1.5" opacity=".4"/>`;
    } else {
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#0a0e14" stroke-width="14" opacity=".5"/>`;
    }
    return s;
  }

  /* =========================================================
     场景：解放碑
     ========================================================= */
  function scMonument(era) {
    const O = era === "old";
    let s = "";
    if (O) {
      s += rect(0, 0, W, H, "#c8c0ae");
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky_o)"/>`;
      s += ridge(430, 120, 3, "#9a9382", 0.75);
      s += ridge(500, 80, 9, "#847d6e", 0.85);
      s += rect(0, 620, W, 280, "#8d8574");                         // 广场
      s += rect(0, 620, W, 6, "#6f6858");
      // 精神堡垒（木塔）
      s += poly([[760, 620], [840, 620], [812, 250], [788, 250]], "#5f5142");
      s += poly([[788, 250], [812, 250], [800, 180]], "#4d4134");
      s += rect(770, 560, 60, 60, "#efe6cf", 0.85);
      for (let i = 0; i < 5; i++) s += line(775, 300 + i * 55, 825, 300 + i * 55, "#4a3f33", 2, 0.5);
      // 周围低矮房屋
      const r = rng(21);
      for (let i = 0; i < 9; i++) {
        const x = 40 + i * 175 + r() * 30, w = 130 + r() * 50, h = 90 + r() * 70;
        s += rect(x, 620 - h, w, h, i % 2 ? "#6f6759" : "#7d7566");
        s += poly([[x - 12, 620 - h], [x + w + 12, 620 - h], [x + w / 2, 620 - h - 34]], "#51493d");
        s += winGrid(x + 8, 620 - h + 12, w - 16, h * 0.55, 3, 2, "#d8cfb8", 31 + i, 0.5);
      }
      s += crowd(200, 1400, 700, 16, 1, "#4f483c", 5, true);
      s += line(1180, 620, 1180, 400, "#4a4235", 3);
      s += line(1150, 415, 1210, 415, "#4a4235", 3);
    } else {
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky_n)"/>`;
      s += ridge(400, 130, 3, "#8e9aa6", 0.45);
      s += ridge(470, 90, 9, "#6d7a88", 0.6);
      // 现代楼群
      const r = rng(44);
      const cols = ["#5a6a80", "#48566b", "#66788f", "#3f4c5e", "#7086a0"];
      for (let i = 0; i < 11; i++) {
        const x = -20 + i * 155 + r() * 24, w = 118 + r() * 46, h = 220 + r() * 300;
        if (x > 700 && x < 900) continue;
        s += rect(x, 660 - h, w, h, cols[i % 5]);
        s += winGrid(x + 8, 660 - h + 16, w - 16, h - 40, 4, Math.max(3, Math.round(h / 60)),
          i % 2 ? "#a8d4ff" : "#ffd9a0", 71 + i, 0.62);
      }
      s += rect(0, 660, W, 240, "#3a4048");                         // 广场
      s += rect(0, 660, W, 5, "#5a626c");
      for (let i = 0; i < 9; i++) s += rect(0 + i * 190, 670, 120, 4, "#555c66", 0.5);
      // 解放碑
      s += rect(770, 660, 60, 8, "#b9b3a4");
      s += poly([[772, 660], [828, 660], [822, 240], [778, 240]], "#e6e0d2");
      s += poly([[778, 240], [822, 240], [800, 196]], "#f2ece0");
      s += rect(792, 196, 16, 40, "#cfc8b8");
      s += circ(800, 190, 9, "#f2c14e");
      for (let i = 0; i < 4; i++) s += line(779, 300 + i * 90, 821, 300 + i * 90, "#c3bcac", 2, 0.35);
      s += rect(786, 400, 28, 90, "#b8b1a2", 0.55);
      s += crowd(240, 1360, 720, 22, 1, "#2f3540", 8, false);
      s += tree(650, 668, 1.1, "#4a3f30", "#3d5a3a");
      s += tree(1000, 672, 0.95, "#4a3f30", "#45603c");
    }
    return s;
  }

  /* =========================================================
     场景：洪崖洞
     ========================================================= */
  function scCliff(era) {
    const O = era === "old";
    let s = "";
    if (O) {
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky_o)"/>`;
      s += ridge(420, 110, 5, "#8f8878", 0.7);
      s += rect(0, 560, W, 340, "#6d6656");                          // 崖壁
      s += poly([[0, 560], [W, 520], [W, 900], [0, 900]], "#5f5949", 0.9);
      for (let i = 0; i < 30; i++) {
        const r = rng(200 + i);
        s += rect(r() * W, 560 + r() * 300, 40 + r() * 90, 6 + r() * 12, "#514b3d", 0.35);
      }
      // 稀疏散布的旧吊脚楼
      const r2 = rng(77);
      const pos = [[120, 470], [300, 430], [470, 500], [640, 455], [810, 505], [980, 440], [1150, 485], [1330, 450]];
      pos.forEach((p, i) => {
        const w = 90 + r2() * 50, h = 70 + r2() * 40;
        s += diaojiao(p[0], p[1], w, h, i % 2 ? "#6d5f4c" : "#7a6b56", "#432f22", "#4a3a29", true, "#e8d6a8", 300 + i);
      });
      // 江面
      s += rect(0, 700, W, 200, "#7a7a68");
      for (let i = 0; i < 16; i++) s += line(0, 715 + i * 11, W, 712 + i * 11, "#8d8d78", 2, 0.4);
      s += boat(360, 760, 1.1, "#4c4235", "#b9ac8e");
      s += boat(1180, 800, 0.85, "#463c31", "#a89c80");
      s += crowd(700, 1000, 880, 6, 0.9, "#443c30", 12, true);
    } else {
      // 夜景
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky_night)"/>`;
      const r = rng(900);
      for (let i = 0; i < 70; i++) s += circ(r() * W, r() * 340, 0.7 + r() * 1.5, "#fff", 0.25 + r() * 0.55);
      s += ridge(430, 120, 5, "#131c2c", 0.9);
      s += ridge(490, 80, 12, "#0e1622", 0.95);
      // 顶部现代楼群
      for (let i = 0; i < 8; i++) {
        const x = -20 + i * 210 + r() * 30, w = 150 + r() * 50, h = 150 + r() * 170;
        s += rect(x, 400 - h, w, h, "#1b2434");
        s += winGrid(x + 8, 400 - h + 14, w - 16, h - 24, 4, Math.max(2, Math.round(h / 55)), "#8fc2ff", 400 + i, 0.5);
      }
      // 崖壁
      s += poly([[0, 380], [W, 360], [W, 900], [0, 900]], "#1a1712");
      s += `<g opacity=".55">`;
      for (let i = 0; i < 26; i++) s += rect(r() * W, 400 + r() * 320, 50 + r() * 100, 5 + r() * 10, "#2a251c", 0.5);
      s += `</g>`;
      // 11 层吊脚楼
      for (let i = 0; i < 11; i++) {
        const t = i / 10;
        const y = 760 - i * 40;
        const n = i < 3 ? 6 : i < 7 ? 5 : 4;
        const w = 190 - t * 40;
        for (let k = 0; k < n; k++) {
          const x = 40 + k * (W - 80) / n + Math.sin(i * 1.7 + k) * 14;
          s += rect(x - 8, y, w, 40, "#3b2b1d");
          s += rect(x - 8, y, w, 5, "#6b4a2c");
          // 暖光窗
          s += winGrid(x, y + 9, w - 16, 22, 6, 1, "#ffb765", 500 + i * 10 + k, 0.85);
          // 金色轮廓灯
          s += rect(x - 10, y - 3, w + 4, 3, "#ffcf7a", 0.9);
          s += poly([[x - 34, y], [x + w + 26, y], [x + w / 2 - 4, y - 30]], "#241a12");
          s += `<path d="M${f(x - 34)},${f(y)} L${f(x + w / 2 - 4)},${f(y - 30)} L${f(x + w + 26)},${f(y)}" fill="none" stroke="#ffbe63" stroke-width="2.6" opacity=".85"/>`;
        }
      }
      // 江面倒影
      s += rect(0, 790, W, 110, "#0d1a2a");
      const r3 = rng(1234);
      for (let i = 0; i < 60; i++) {
        const x = r3() * W, w = 6 + r3() * 26;
        s += rect(x, 790, w, 20 + r3() * 90, "#ff9a4a", 0.10 + r3() * 0.26);
      }
      for (let i = 0; i < 14; i++) s += line(0, 800 + i * 7, W, 798 + i * 7, "#7fc0ff", 1.6, 0.12);
      s += boat(300, 850, 1.0, "#1a2330", "#3a4a5e");
    }
    return s;
  }

  /* =========================================================
     场景：朝天门（两江汇流）
     ========================================================= */
  function scConfluence(era) {
    const O = era === "old";
    let s = "";
    if (O) {
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky_o)"/>`;
      s += ridge(400, 130, 2, "#948c7b", 0.7);
      s += ridge(470, 85, 8, "#7e7768", 0.85);
      s += rect(0, 520, W, 380, "#8a7f63");                   // 长江（浑黄）
      s += poly([[820, 520], [W, 520], [W, 900], [700, 900]], "#6f7a63");   // 嘉陵江（碧）
      s += line(760, 520, 640, 900, "#c2b48c", 5, 0.5);       // 分界线
      // 石阶码头
      for (let i = 0; i < 12; i++) {
        s += rect(560 - i * 8, 530 + i * 26, 320 + i * 16, 22, i % 2 ? "#8e8471" : "#7e7462");
      }
      // 老房屋
      const r = rng(31);
      for (let i = 0; i < 8; i++) {
        const x = i * 205, w = 150 + r() * 40, h = 100 + r() * 80;
        s += rect(x, 520 - h, w, h, i % 2 ? "#6e6656" : "#7b7362");
        s += poly([[x - 14, 520 - h], [x + w + 14, 520 - h], [x + w / 2, 520 - h - 38]], "#504737");
      }
      s += boat(240, 620, 1.15, "#4e453a", "#bdb096");
      s += boat(1180, 720, 1.0, "#453c32", "#ac9f84");
      s += boat(880, 800, 0.8, "#453c32", "#ac9f84");
      s += crowd(620, 1000, 560, 8, 1.05, "#4b4437", 15, true);
      // 挑担
      s += line(700, 520, 760, 500, "#4a4235", 3);
    } else {
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky_n)"/>`;
      s += ridge(390, 125, 2, "#93a0ad", 0.4);
      s += ridge(460, 85, 8, "#71808f", 0.55);
      s += rect(0, 540, W, 360, "#5c6b52");
      s += poly([[860, 540], [W, 540], [W, 900], [720, 900]], "#2f6b7a");
      s += line(800, 540, 660, 900, "#cbd6b0", 5, 0.45);
      s += rect(0, 540, W, 4, "#8b9a7a", 0.5);
      // 来福士：4 塔 + 水晶连廊
      const towers = [[520, 300], [640, 340], [760, 320], [880, 285]];
      towers.forEach((t, i) => {
        const w = 92, x = t[0] - w / 2, h = 260 + t[1] * 0.9;
        s += rect(x, 540 - h, w, h, i % 2 ? "#8f9aa8" : "#7d8896");
        s += poly([[x, 540 - h], [x + w, 540 - h], [x + w * 0.72, 540 - h - 34]], "#a4aebb");
        s += winGrid(x + 6, 540 - h + 14, w - 12, h - 30, 3, Math.round(h / 46), "#bcdcff", 610 + i, 0.66);
      });
      // 水晶连廊
      s += rect(470, 210, 460, 38, "#c8d6e4", 0.95);
      s += rect(470, 210, 460, 8, "#eaf2fa", 0.9);
      s += winGrid(470, 216, 460, 26, 14, 1, "#e8f4ff", 777, 0.8);
      s += rect(470, 246, 460, 5, "#8b98a6", 0.8);
      // 广场阶梯
      for (let i = 0; i < 10; i++) s += rect(340 - i * 10, 545 + i * 24, 620 + i * 20, 20, i % 2 ? "#5f6670" : "#68707b");
      s += crowd(400, 1150, 620, 18, 1, "#39414c", 17, false);
      s += boat(200, 700, 1.0, "#3d4a56", "#dfe6ec");
      s += boat(1300, 760, 0.85, "#37424e", "#d3dbe3");
      s += tree(300, 560, 1.0, "#463a2c", "#4a6b40");
      s += tree(1250, 570, 0.9, "#463a2c", "#42603a");
    }
    return s;
  }

  /* =========================================================
     场景：磁器口老街
     ========================================================= */
  function scOldStreet(era) {
    const O = era === "old";
    let s = "";
    const vx = 800, vy = 430;   // 灭点
    if (O) {
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky_o2)"/>`;
      s += rect(0, 430, W, 470, "#8a8272");                     // 街面
      // 透视街面石纹
      for (let i = -6; i <= 6; i++) {
        s += poly([[vx + i * 130, 440], [vx + i * 300, 900], [vx + i * 300 + 26, 900], [vx + i * 130 + 12, 440]], "#776f60", 0.5);
      }
      for (let i = 0; i < 14; i++) {
        const t = i / 14, y = 440 + Math.pow(t, 2.1) * 460;
        s += line(120 + t * 130, y, 1480 - t * 130, y, "#6d6557", 2, 0.45);
      }
      // 两侧房屋（透视）
      for (let i = 0; i < 5; i++) {
        const t = i / 5;
        const yTop = 200 + t * 150, yBot = 430 + Math.pow(t + 0.16, 2.1) * 460;
        const wL = 250 - t * 130, wR = 250 - t * 130;
        const xL = 60 + t * 220, xR = W - 60 - t * 220 - wR;
        // 左
        s += rect(xL, yTop, wL, yBot - yTop, i % 2 ? "#736b5b" : "#7f7766");
        s += poly([[xL - 16, yTop], [xL + wL + 16, yTop], [xL + wL / 2, yTop - 34]], "#4e4639");
        s += rect(xL + 20, yBot - 110, wL * 0.4, 110, "#4f4436");    // 门板
        s += winGrid(xL + 20, yTop + 30, wL - 40, 70, 3, 1, "#cfc4a8", 810 + i, 0.45);
        // 右
        s += rect(xR, yTop, wR, yBot - yTop, i % 2 ? "#7c7463" : "#6e6657");
        s += poly([[xR - 16, yTop], [xR + wR + 16, yTop], [xR + wR / 2, yTop - 34]], "#524a3c");
        s += rect(xR + wR * 0.5, yBot - 105, wR * 0.38, 105, "#4a3f32");
        s += winGrid(xR + 20, yTop + 32, wR - 40, 68, 3, 1, "#c9bea2", 820 + i, 0.4);
      }
      s += crowd(560, 1050, 640, 9, 1.0, "#4a4336", 19, true);
      s += line(1180, 470, 1180, 250, "#4c4335", 3);
    } else {
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky_n2)"/>`;
      s += rect(0, 430, W, 470, "#7d7466");
      for (let i = -6; i <= 6; i++) {
        s += poly([[vx + i * 130, 440], [vx + i * 300, 900], [vx + i * 300 + 26, 900], [vx + i * 130 + 12, 440]], "#6d6557", 0.45);
      }
      for (let i = 0; i < 14; i++) {
        const t = i / 14, y = 440 + Math.pow(t, 2.1) * 460;
        s += line(120 + t * 130, y, 1480 - t * 130, y, "#5f5849", 2, 0.4);
      }
      const r = rng(55);
      for (let i = 0; i < 5; i++) {
        const t = i / 5;
        const yTop = 200 + t * 150, yBot = 430 + Math.pow(t + 0.16, 2.1) * 460;
        const wL = 250 - t * 130, wR = 250 - t * 130;
        const xL = 60 + t * 220, xR = W - 60 - t * 220 - wR;
        [["L", xL, wL], ["R", xR, wR]].forEach(side => {
          const [tag, x, w] = side;
          s += rect(x, yTop, w, yBot - yTop, i % 2 ? "#8a6f52" : "#7a6248");
          s += poly([[x - 16, yTop], [x + w + 16, yTop], [x + w / 2, yTop - 34]], "#3f3630");
          s += rect(x + 18, yBot - 115, w * 0.42, 115, "#5b4130");
          s += winGrid(x + 18, yTop + 28, w - 36, 66, 3, 1, "#ffe0a8", 830 + i, 0.8);
          // 红灯笼
          for (let k = 0; k < 3; k++) {
            const lx = x + 24 + k * (w - 48) / 2;
            s += line(lx, yTop - 6, lx, yTop + 16, "#7a3020", 2);
            s += `<ellipse cx="${f(lx)}" cy="${f(yTop + 26)}" rx="11" ry="14" fill="#e0402a"/>`;
            s += `<ellipse cx="${f(lx)}" cy="${f(yTop + 26)}" rx="11" ry="14" fill="none" stroke="#ffd27a" stroke-width="1.6" opacity=".7"/>`;
          }
          // 招牌
          s += rect(x + w * 0.18, yTop + 100, w * 0.64, 34, "#3b2d22");
          s += rect(x + w * 0.22, yTop + 108, w * 0.56, 18, "#f2c14e", 0.75);
        });
      }
      s += crowd(540, 1080, 650, 24, 1.0, "#3b3a3f", 23, false);
      s += crowd(600, 1000, 520, 6, 0.8, "#4a4048", 29, false);
    }
    return s;
  }

  /* =========================================================
     场景：李子坝轻轨穿楼
     ========================================================= */
  function scRail(era) {
    const O = era === "old";
    let s = "";
    if (O) {
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky_o)"/>`;
      s += ridge(400, 110, 6, "#8d8676", 0.65);
      s += rect(0, 620, W, 280, "#7f7767");
      // 楼（旧）
      s += rect(430, 180, 700, 460, "#7b7364");
      s += rect(430, 180, 700, 14, "#665f52");
      s += winGrid(450, 220, 660, 300, 8, 5, "#cdc2a6", 91, 0.55);
      // 轨道（简单）
      s += rect(380, 430, 800, 22, "#5a5346");
      s += rect(380, 452, 800, 10, "#4d4739");
      for (let i = 0; i < 10; i++) s += rect(400 + i * 80, 462, 8, 40, "#5a5346", 0.7);
      // 老式列车
      s += rect(560, 380, 420, 54, "#a9a392", 0.95);
      s += rect(560, 380, 420, 10, "#c4bda9");
      s += winGrid(572, 392, 396, 26, 7, 1, "#e4dcc4", 92, 0.9);
      s += rect(560, 428, 420, 8, "#6f6858");
      s += line(380, 470, 1180, 470, "#4f493c", 3);
      s += crowd(120, 420, 700, 6, 0.9, "#4a4235", 33, true);
      s += tree(1330, 640, 1.1, "#463a2c", "#556b47");
    } else {
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky_n)"/>`;
      s += ridge(390, 120, 6, "#8f9ca9", 0.4);
      s += rect(0, 640, W, 260, "#4a5158");
      // 楼（现代，8 层，轨道穿 6-8 层）
      s += rect(430, 150, 700, 490, "#c2b6a2");
      s += rect(430, 150, 700, 16, "#a09581");
      // 阳台层
      for (let i = 0; i < 5; i++) {
        s += rect(444, 190 + i * 68, 672, 44, "#b3a692");
        s += winGrid(452, 196 + i * 68, 656, 30, 9, 1, "#7fa8c4", 101 + i, 0.7);
        s += rect(444, 230 + i * 68, 672, 6, "#93876f");
      }
      // 6-8 层轨道开口
      s += rect(400, 400, 760, 108, "#2b3138");
      s += rect(400, 400, 760, 10, "#1d2228");
      // 墩 + 轨道梁
      s += rect(452, 508, 56, 132, "#8d8578");
      s += rect(1052, 508, 56, 132, "#8d8578");
      s += rect(400, 470, 760, 26, "#9a9284");
      s += rect(400, 496, 760, 8, "#6f6a5e");
      s += line(410, 466, 1150, 466, "#d8d3c6", 3, 0.6);
      // 列车
      s += `<g>`;
      s += rect(430, 404, 700, 62, "#eef1f4", 0.98);
      s += rect(430, 404, 700, 12, "#f7f9fb");
      s += rect(430, 452, 700, 14, "#dfe3e8");
      s += rect(430, 428, 700, 8, "#e8552e", 0.92);
      s += winGrid(440, 414, 680, 26, 9, 1, "#9fc4dd", 111, 1);
      s += rect(430, 404, 700, 62, "none");
      s += `<rect x="430" y="404" width="700" height="62" fill="none" stroke="#b6bcc4" stroke-width="2"/>`;
      s += `</g>`;
      // 观景台
      s += rect(60, 620, 320, 22, "#6b7280");
      s += rect(60, 642, 320, 8, "#4d545e");
      s += crowd(110, 430, 620, 16, 1.05, "#2f3540", 37, false);
      s += tree(1310, 660, 1.15, "#463a2c", "#4f6b45");
      s += rect(1180, 560, 260, 82, "#39424e", 0.9);
      s += rect(1192, 574, 236, 54, "#7fc0ff", 0.35);
    }
    return s;
  }

  /* =========================================================
     场景：长江索道
     ========================================================= */
  function scCable(era) {
    const O = era === "old";
    let s = "";
    if (O) {
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky_o)"/>`;
      s += ridge(400, 120, 4, "#8f8878", 0.65);
      s += rect(0, 560, W, 340, "#78786a");                       // 江
      for (let i = 0; i < 18; i++) s += line(0, 575 + i * 18, W, 572 + i * 18, "#8a8a78", 2, 0.35);
      // 两岸低矮楼
      const r = rng(41);
      for (let i = 0; i < 10; i++) {
        const x = i * 165, w = 130 + r() * 40, h = 110 + r() * 90;
        s += rect(x, 560 - h, w, h, i % 2 ? "#6f6757" : "#7c7465");
        s += poly([[x - 12, 560 - h], [x + w + 12, 560 - h], [x + w / 2, 560 - h - 32]], "#4f4739");
      }
      // 索道塔
      s += rect(180, 250, 26, 320, "#5d5546");
      s += rect(1390, 260, 26, 310, "#5d5546");
      s += line(150, 300, 216, 300, "#5d5546", 6);
      s += line(1360, 310, 1426, 310, "#5d5546", 6);
      // 缆绳
      s += `<path d="M193,268 Q 800,406 1403,278" fill="none" stroke="#4a4438" stroke-width="4"/>`;
      s += `<path d="M193,300 Q 800,438 1403,310" fill="none" stroke="#4a4438" stroke-width="3" opacity=".7"/>`;
      // 老式轿厢
      s += rect(660, 372, 150, 108, "#9a9280");
      s += rect(660, 372, 150, 12, "#b0a894");
      s += winGrid(670, 388, 130, 56, 3, 1, "#ded5bd", 51, 0.9);
      s += rect(660, 470, 150, 10, "#6f6858");
      s += line(720, 366, 720, 372, "#4a4438", 8);
      s += line(750, 366, 750, 372, "#4a4438", 8);
      s += boat(360, 640, 0.9, "#4b4237", "#b0a488");
      s += boat(1100, 700, 0.75, "#453c32", "#a3997e");
    } else {
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky_n)"/>`;
      s += ridge(390, 125, 4, "#94a1ae", 0.38);
      // 现代天际线
      const r = rng(63);
      const cols = ["#5b6a80", "#48566b", "#6d7f96", "#3f4c5e"];
      for (let i = 0; i < 12; i++) {
        const x = -20 + i * 145 + r() * 22, w = 110 + r() * 40, h = 180 + r() * 280;
        s += rect(x, 560 - h, w, h, cols[i % 4]);
        s += winGrid(x + 7, 560 - h + 14, w - 14, h - 26, 4, Math.max(2, Math.round(h / 58)), "#aad3ff", 200 + i, 0.6);
      }
      s += rect(0, 560, W, 340, "#2f6b8a");
      for (let i = 0; i < 16; i++) s += line(0, 578 + i * 20, W, 574 + i * 20, "#8fd0ff", 2, 0.16);
      // 塔
      s += rect(180, 200, 30, 370, "#8d8578");
      s += rect(1390, 210, 30, 360, "#8d8578");
      s += rect(160, 250, 70, 16, "#6f6a5e");
      s += rect(1370, 260, 70, 16, "#6f6a5e");
      s += `<path d="M195,232 Q 800,382 1405,242" fill="none" stroke="#3d4756" stroke-width="5"/>`;
      s += `<path d="M195,264 Q 800,414 1405,274" fill="none" stroke="#3d4756" stroke-width="4" opacity=".65"/>`;
      // 现代轿厢
      s += rect(650, 336, 190, 116, "#e8edf2", 0.98);
      s += rect(650, 336, 190, 14, "#f4f8fb");
      s += winGrid(660, 354, 170, 62, 5, 1, "#8fc8f0", 61, 1);
      s += rect(650, 428, 190, 12, "#a8b2be");
      s += rect(650, 440, 190, 12, "#e8552e", 0.9);
      s += line(720, 330, 720, 336, "#3d4756", 9);
      s += line(770, 330, 770, 336, "#3d4756", 9);
      // 倒影
      s += rect(650, 600, 190, 90, "#dfe8f0", 0.14);
      s += boat(340, 660, 0.95, "#3d4a56", "#dde5ec");
      s += boat(1080, 730, 0.8, "#37424e", "#d3dbe3");
    }
    return s;
  }

  /* =========================================================
     场景：十八梯
     ========================================================= */
  function scSteps(era) {
    const O = era === "old";
    let s = "";
    if (O) {
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky_o2)"/>`;
      // 阶梯（向上收窄）
      for (let i = 0; i < 22; i++) {
        const t = i / 22;
        const y = 860 - i * 34;
        const w = 900 - t * 620;
        const x = 800 - w / 2 + Math.sin(i * 0.7) * 12;
        s += rect(x, y, w, 26, i % 2 ? "#8a8272" : "#7b7364");
        s += rect(x, y, w, 5, "#9a9282", 0.5);
      }
      // 两侧老屋
      const r = rng(71);
      for (let i = 0; i < 7; i++) {
        const t = i / 7;
        const y = 760 - i * 96, h = 150 + r() * 70;
        const wL = 330 - t * 130, wR = 330 - t * 130;
        const xL = 60 + t * 250, xR = W - 60 - t * 250 - wR;
        s += rect(xL, y - h, wL, h, i % 2 ? "#6f6758" : "#7c7465");
        s += poly([[xL - 14, y - h], [xL + wL + 14, y - h], [xL + wL / 2, y - h - 32]], "#4c4437");
        s += winGrid(xL + 16, y - h + 22, wL - 32, 62, 3, 1, "#cec3a7", 301 + i, 0.45);
        s += rect(xR, y - h, wR, h, i % 2 ? "#787060" : "#6b6354");
        s += poly([[xR - 14, y - h], [xR + wR + 14, y - h], [xR + wR / 2, y - h - 32]], "#514939");
        s += winGrid(xR + 16, y - h + 24, wR - 32, 60, 3, 1, "#c9bea2", 311 + i, 0.4);
        // 晾衣绳
        if (i < 5) {
          s += line(xL + wL, y - h + 46, xR, y - h + 30, "#5c5344", 1.6, 0.7);
          for (let k = 0; k < 4; k++) {
            const tt = 0.2 + k * 0.2;
            const cx = (xL + wL) + ((xR) - (xL + wL)) * tt;
            const cy = (y - h + 46) + ((y - h + 30) - (y - h + 46)) * tt;
            s += rect(cx - 9, cy, 18, 26, ["#a89a80", "#8e8570", "#b5a68c", "#7e7565"][k], 0.85);
          }
        }
      }
      s += crowd(620, 1000, 700, 7, 0.95, "#4a4336", 39, true);
      s += tree(1300, 800, 1.0, "#463a2c", "#53684a");
    } else {
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky_n2)"/>`;
      for (let i = 0; i < 22; i++) {
        const t = i / 22;
        const y = 860 - i * 34;
        const w = 900 - t * 620;
        const x = 800 - w / 2;
        s += rect(x, y, w, 26, i % 2 ? "#7e7770" : "#716a63");
        s += rect(x, y, w, 5, "#948d85", 0.6);
        s += line(x + w / 2, y, x + w / 2, y + 26, "#615b54", 1.4, 0.35);
      }
      const r = rng(73);
      for (let i = 0; i < 7; i++) {
        const t = i / 7;
        const y = 760 - i * 96, h = 150 + r() * 70;
        const wL = 330 - t * 130, wR = 330 - t * 130;
        const xL = 60 + t * 250, xR = W - 60 - t * 250 - wR;
        [["L", xL, wL], ["R", xR, wR]].forEach((sd, si) => {
          const [, x, w] = sd;
          s += rect(x, y - h, w, h, i % 2 ? "#8d7c66" : "#7d6e5a");
          s += poly([[x - 14, y - h], [x + w + 14, y - h], [x + w / 2, y - h - 32]], "#3f3630");
          s += rect(x + 14, y - 96, w * 0.5, 96, "#4f3f30");
          s += winGrid(x + 14, y - h + 20, w - 28, 60, 3, 1, "#ffdca6", 321 + i + si, 0.85);
          // 灯笼
          for (let k = 0; k < 2; k++) {
            const lx = x + 24 + k * (w - 48);
            s += line(lx, y - h + 78, lx, y - h + 96, "#7a3020", 2);
            s += `<ellipse cx="${f(lx)}" cy="${f(y - h + 106)}" rx="10" ry="13" fill="#e0402a"/>`;
          }
          // 招牌
          s += rect(x + w * 0.2, y - h + 116, w * 0.6, 30, "#38291d");
          s += rect(x + w * 0.24, y - h + 122, w * 0.52, 16, "#f2c14e", 0.7);
        });
      }
      s += crowd(600, 1020, 720, 20, 1.0, "#3b3a3f", 41, false);
      s += tree(1310, 810, 1.05, "#463a2c", "#4f6b45");
    }
    return s;
  }

  /* =========================================================
     场景：湖广会馆
     ========================================================= */
  function scHall(era) {
    const O = era === "old";
    let s = "";
    if (O) {
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky_o)"/>`;
      s += ridge(380, 100, 7, "#8b8474", 0.6);
      s += rect(0, 640, W, 260, "#827a6a");
      // 主体（褪色黄墙）
      s += rect(340, 320, 920, 320, "#a08d63");
      s += rect(340, 320, 920, 320, "#000", 0.10);
      // 破损斑
      const r = rng(83);
      for (let i = 0; i < 26; i++) {
        s += rect(340 + r() * 900, 330 + r() * 300, 22 + r() * 66, 16 + r() * 44, "#7d6c4c", 0.35);
      }
      // 屋顶（残破灰瓦）
      s += poly([[300, 320], [1300, 320], [1240, 200], [360, 200]], "#5c5445");
      s += `<g opacity=".5">`;
      for (let i = 0; i < 22; i++) s += rect(320 + r() * 900, 210 + r() * 100, 30 + r() * 60, 8, "#807868", 0.5);
      s += `</g>`;
      // 封火墙（马头墙）
      s += poly([[300, 320], [300, 170], [360, 170], [360, 200]], "#6b6252");
      s += poly([[1300, 320], [1300, 170], [1240, 170], [1240, 200]], "#6b6252");
      // 门洞
      s += rect(700, 470, 200, 170, "#4b4133");
      s += poly([[700, 470], [900, 470], [800, 420]], "#4b4133");
      s += rect(720, 500, 160, 140, "#3f3729", 0.6);
      // 窗
      s += winGrid(400, 380, 240, 120, 4, 2, "#5c503a", 331, 0.8);
      s += winGrid(960, 380, 240, 120, 4, 2, "#5c503a", 333, 0.8);
      // 杂物
      s += rect(200, 580, 110, 60, "#6b6152");
      s += rect(1330, 590, 90, 50, "#655c4d");
      for (let i = 0; i < 6; i++) s += rect(180 + i * 30, 560 + (i % 2) * 12, 24, 22, "#746a59", 0.8);
      s += line(1250, 640, 1250, 470, "#5c5344", 3);
      s += crowd(520, 1100, 760, 5, 0.95, "#4a4336", 43, true);
    } else {
      s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky_n)"/>`;
      s += ridge(370, 100, 7, "#8f9ca9", 0.35);
      s += rect(0, 640, W, 260, "#6d6a62");
      for (let i = 0; i < 6; i++) s += line(0, 660 + i * 40, W, 656 + i * 40, "#827e74", 2, 0.3);
      // 修复后的黄墙
      s += rect(340, 320, 920, 320, "#d8a63a");
      s += rect(340, 320, 920, 12, "#c1912c");
      s += rect(340, 628, 920, 12, "#b0821f");
      // 屋顶（完整灰瓦）
      s += poly([[290, 320], [1310, 320], [1240, 190], [360, 190]], "#3d3b38");
      for (let i = 0; i < 30; i++) s += line(330 + i * 32, 196 + (i % 3) * 2, 330 + i * 32, 318, "#54514c", 2, 0.55);
      s += poly([[290, 320], [1310, 320], [1310, 332], [290, 332]], "#2b2926");
      // 封火墙
      s += poly([[290, 320], [290, 150], [368, 150], [368, 196]], "#57534c");
      s += poly([[1310, 320], [1310, 150], [1232, 150], [1232, 196]], "#57534c");
      s += poly([[290, 150], [368, 150], [368, 138], [290, 138]], "#3d3b38");
      s += poly([[1232, 150], [1310, 150], [1310, 138], [1232, 138]], "#3d3b38");
      // 门洞（朱漆）
      s += rect(690, 450, 220, 190, "#7a2a1e");
      s += poly([[690, 450], [910, 450], [800, 386]], "#7a2a1e");
      s += rect(710, 486, 180, 154, "#3a2018");
      s += rect(716, 492, 168, 142, "#8e3524", 0.35);
      for (let i = 0; i < 3; i++) s += circ(800, 540 + i * 40, 6, "#f2c14e", 0.8);
      s += rect(676, 440, 248, 16, "#3d3b38");
      // 匾额
      s += rect(700, 400, 200, 40, "#4a3520");
      s += rect(710, 408, 180, 24, "#f2c14e", 0.85);
      // 窗（木格）
      s += winGrid(400, 376, 250, 130, 4, 2, "#5c3d22", 341, 1);
      s += winGrid(950, 376, 250, 130, 4, 2, "#5c3d22", 343, 1);
      // 石狮 + 灯笼
      s += circ(630, 620, 22, "#9a9184"); s += circ(630, 606, 14, "#a9a094");
      s += circ(970, 620, 22, "#9a9184"); s += circ(970, 606, 14, "#a9a094");
      [470, 1130].forEach(x => {
        s += line(x, 320, x, 348, "#7a3020", 2);
        s += `<ellipse cx="${x}" cy="${f(360)}" rx="13" ry="16" fill="#e0402a"/>`;
        s += `<ellipse cx="${x}" cy="${f(360)}" rx="13" ry="16" fill="none" stroke="#ffd27a" stroke-width="1.6" opacity=".7"/>`;
      });
      s += crowd(560, 1080, 780, 14, 1.0, "#3b3a3f", 47, false);
      s += tree(180, 660, 1.1, "#463a2c", "#4f6b45");
      s += tree(1430, 670, 1.0, "#463a2c", "#4a6642");
    }
    return s;
  }

  /* =========================================================
     天空渐变（注入 defs）
     ========================================================= */
  const SKY = `
  <linearGradient id="sky_o" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#d6cfbe"/><stop offset="55%" stop-color="#c3bba8"/><stop offset="100%" stop-color="#a89f8c"/></linearGradient>
  <linearGradient id="sky_o2" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#cdc6b4"/><stop offset="100%" stop-color="#b0a795"/></linearGradient>
  <linearGradient id="sky_n" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#7fb0e0"/><stop offset="48%" stop-color="#bcd9f0"/><stop offset="100%" stop-color="#e6eef5"/></linearGradient>
  <linearGradient id="sky_n2" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#9dc4e4"/><stop offset="100%" stop-color="#dde8f0"/></linearGradient>
  <linearGradient id="sky_night" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#070d1c"/><stop offset="52%" stop-color="#16233d"/><stop offset="100%" stop-color="#2b3350"/></linearGradient>`;

  const DRAW = {
    monument: scMonument, cliff: scCliff, confluence: scConfluence,
    oldstreet: scOldStreet, rail: scRail, cable: scCable,
    steps: scSteps, hall: scHall
  };

  function render(id, era) {
    const spot = window.CHQ.SPOTS.find(s => s.id === id);
    if (!spot) return "";
    const fn = DRAW[spot.scene.kind] || scMonument;
    const { d, u } = defs(era);
    let svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs>${SKY}</defs>` + d;
    svg += `<g filter="url(#${era === "old" ? "old" : "new"}_${u})">`;
    svg += fn(era);
    svg += `</g>`;
    svg += finish(era, u);
    svg += `</svg>`;
    return svg;
  }

  return { render };
})();

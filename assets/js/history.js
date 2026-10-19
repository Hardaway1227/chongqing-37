/* ==========================================================
   历史年表 — 时代切换 / 场景插画 / 时间轴
   ========================================================== */
(function () {
  const ERAS = window.CHQ_HIST.ERAS;
  const MARKS = window.CHQ_HIST.MARKS;

  let cur = -1;
  let playing = false;
  let playTimer = null;

  const $ = s => document.querySelector(s);

  /* ---------- SVG 绘图小工具 ---------- */
  const N = (n, a) => `<${n} ${a}/>`;
  const rect = (x, y, w, h, f, o) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${o != null ? ` opacity="${o}"` : ""}/>`;
  const circ = (x, y, r, f, o) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"${o != null ? ` opacity="${o}"` : ""}/>`;
  const line = (x1, y1, x2, y2, s, w, o) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s}" stroke-width="${w}" stroke-linecap="round"${o != null ? ` opacity="${o}"` : ""}/>`;
  const poly = (pts, f, o) => `<polygon points="${pts}" fill="${f}"${o != null ? ` opacity="${o}"` : ""}/>`;
  const path = (d, f, s, w, o) => `<path d="${d}" fill="${f || "none"}"${s ? ` stroke="${s}" stroke-width="${w || 1}"` : ""}${o != null ? ` opacity="${o}"` : ""} stroke-linejoin="round"/>`;

  /* 山峦剪影 */
  function ridge(y, h, amp, seed, fill, op) {
    let d = `M0,${y + h} L0,${y}`;
    const step = 40;
    for (let x = 0; x <= 800; x += step) {
      const t = x / 800;
      const yy = y - Math.sin(t * 7.3 + seed) * amp * 0.6 - Math.sin(t * 17.1 + seed * 2.3) * amp * 0.3 - Math.sin(t * 3.1 + seed * 0.7) * amp * 0.5;
      d += ` L${x},${yy.toFixed(1)}`;
    }
    d += ` L800,${y + h} Z`;
    return path(d, fill, null, 0, op);
  }

  /* 江面（横向带 + 波纹） */
  function river(y, h, c1, c2) {
    let s = rect(0, y, 800, h, "url(#hRiv)");
    for (let i = 0; i < 16; i++) {
      const rx = (i * 53) % 780 + 10, ry = y + 8 + (i * 37) % (h - 16);
      const rw = 30 + (i * 13) % 60;
      s += `<path d="M${rx},${ry} q${rw / 2},-4 ${rw},0" fill="none" stroke="${c2}" stroke-width="1.4" opacity="${0.18 + (i % 4) * 0.07}" stroke-linecap="round"/>`;
    }
    return s;
  }

  /* 小人剪影（挑担/站立/歌舞） */
  function fig(x, y, s, c, op, arm) {
    const a = arm || "d"; // d=垂手 u=举手(歌舞) p=挑担
    let ex = "";
    if (a === "u") ex = line(x - 5 * s, y + 6 * s, x - 9 * s, y - 2 * s, c, 2.2 * s) + line(x + 5 * s, y + 6 * s, x + 9 * s, y - 2 * s, c, 2.2 * s);
    else if (a === "p") ex = line(x - 9 * s, y - 1 * s, x + 9 * s, y - 1 * s, c, 1.8 * s) + circ(x - 9 * s, y + 4 * s, 2.4 * s, c) + circ(x + 9 * s, y + 4 * s, 2.4 * s, c);
    else ex = line(x - 5 * s, y + 6 * s, x - 7 * s, y + 13 * s, c, 2 * s);
    return `<g opacity="${op == null ? 1 : op}">` +
      circ(x, y, 3.2 * s, c) +
      line(x, y + 4 * s, x, y + 13 * s, c, 3 * s) +
      line(x, y + 13 * s, x - 4 * s, y + 22 * s, c, 2.2 * s) +
      line(x, y + 13 * s, x + 4 * s, y + 22 * s, c, 2.2 * s) +
      line(x, y + 6 * s, x + 6 * s, y + 12 * s, c, 2 * s) + ex + `</g>`;
  }

  /* 帆船 */
  function junk(x, y, s, hull, sail) {
    return `<g transform="translate(${x},${y}) scale(${s})">` +
      path("M-26,0 L26,0 L18,9 L-18,9 Z", hull) +
      rect(22, -3, 5, 3, hull) +
      line(0, 0, 0, -34, "#2a2f38", 2) +
      path("M2,-33 L2,-3 L24,-6 Z", sail, "#fff", 0.5, 0.92) +
      path("M-2,-28 L-2,-4 L-20,-8 Z", sail, "#fff", 0.5, 0.82) +
      `</g>`;
  }

  /* 吊脚楼（一栋：坡屋顶 + 木架 + 支撑柱） */
  function stilt(x, y, w, h, wood, roof, lit) {
    let s = `<g>`;
    // 支撑柱
    for (let i = 0; i < 3; i++) s += rect(x + 4 + i * (w - 10) / 2, y + h, 2.6, 16, wood, 0.85);
    s += rect(x, y, w, h, wood, 0.32);
    s += rect(x + 1.5, y + 1.5, w - 3, h - 3, "#0e131a", 0.55);
    // 窗
    for (let r = 0; r < 2; r++) for (let c2 = 0; c2 < 2; c2++)
      s += rect(x + 5 + c2 * (w - 15) / 1.4, y + 5 + r * (h / 2.4), (w - 16) / 2.2, h / 4.2, lit, r === 0 ? 0.9 : 0.55);
    // 屋檐
    s += rect(x - 3, y - 3, w + 6, 3.4, roof, 0.95);
    s += poly(`${x - 5},${y - 3} ${x + w / 2},${y - 14} ${x + w + 5},${y - 3}`, roof, 0.9);
    return s + `</g>`;
  }

  /* ---------------- 场景：巴国 ---------------- */
  function scBa(c) {
    let s = ridge(180, 300, 46, 0.5, "#0c1119", 0.95) + ridge(150, 300, 62, 2.2, "#101725", 0.9);
    // 崖壁
    s += path("M90,300 L90,120 L120,86 L176,74 L214,104 L238,200 L232,300 Z", "#121a26");
    // 船棺（崖壁凹槽里的棺）
    for (let i = 0; i < 3; i++) {
      const cy = 130 + i * 46;
      s += rect(104, cy, 62, 13, c, 0.5) + rect(104, cy, 62, 13, "none", c, 1.6, 0.85);
      s += line(108, cy + 13, 162, cy + 13, c, 1, 0.35);
    }
    // 白虎图腾（抽象虎纹大圆）
    const tx = 620, ty = 190;
    s += `<g opacity="0.95">` + circ(tx, ty, 92, c, 0.07) +
      `<circle cx="${tx}" cy="${ty}" r="92" fill="none" stroke="${c}" stroke-width="2.4" opacity="0.5"/>`;
    // 虎头纹：菱形眼 + 王的竖纹
    s += path(`M${tx - 58},${ty - 24} L${tx - 16},${ty - 52} L${tx + 26},${ty - 30} L${tx - 6},${ty - 4} Z`, c, c, 2.6, 0.85);
    s += path(`M${tx + 6},${ty + 6} L${tx + 52},${ty - 2} L${tx + 64},${ty + 30} L${tx + 20},${ty + 34} Z`, c, c, 2.6, 0.7);
    s += line(tx, ty - 46, tx, ty - 12, c, 3, 0.75);
    s += line(tx, ty + 16, tx, ty + 58, c, 3, 0.6);
    for (let i = 0; i < 5; i++) s += line(tx - 40 + i * 20, ty + 60, tx - 34 + i * 20, ty + 78, c, 2, 0.45);
    s += `</g>`;
    // 盐井井架
    s += `<g>` + line(300, 300, 306, 214, "#7a6a4e", 4) + line(330, 300, 324, 214, "#7a6a4e", 4) +
      line(300, 236, 330, 236, "#7a6a4e", 3) + line(306, 214, 324, 214, "#7a6a4e", 3) +
      circ(315, 210, 5, "#8d7a58") + line(315, 210, 315, 262, "#5c5140", 1.6) + rect(306, 262, 18, 11, c, 0.55) + `</g>`;
    // 江与船
    s += river(340, 130, "", c);
    s += junk(470, 388, 0.9, "#2b3038", c);
    s += junk(210, 412, 0.66, "#242931", "#b9c4d4");
    // 巴人歌舞小人
    [360, 392, 424].forEach((x, i) => s += fig(x, 470 - i % 2 * 4, 1.5, c, 0.8 - i * 0.06, i === 1 ? "u" : "u"));
    s += fig(452, 472, 1.5, c, 0.72, "u");
    return s;
  }

  /* ---------------- 场景：秦汉隋唐 ---------------- */
  function scQin(c) {
    let s = ridge(150, 300, 54, 1.1, "#0c1119", 0.95) + ridge(120, 300, 40, 3.4, "#111926", 0.85);
    s += river(352, 128, "", c);
    // 江州城墙
    const wx = 180, wy = 268;
    s += rect(wx, wy, 300, 84, "#1a2130");
    for (let r = 0; r < 5; r++) for (let q = 0; q < 12; q++)
      s += rect(wx + 6 + q * 24 + (r % 2 ? 12 : 0), wy + 6 + r * 16, 20, 12, "#222b3c", 0.75);
    // 城垛
    for (let q = 0; q < 9; q++) s += rect(wx + q * 34, wy - 14, 20, 14, "#1a2130");
    // 城门
    s += path(`M${wx + 118},${wy + 84} L${wx + 118},${wy + 40} q${31},-26 ${62},0 L${wx + 180},${wy + 84} Z`, "#050a10");
    s += `<path d="M${wx + 118},${wy + 84} L${wx + 118},${wy + 40} q${31},-26 ${62},0 L${wx + 180},${wy + 84}" fill="none" stroke="${c}" stroke-width="2.4" opacity="0.75"/>`;
    // 城楼
    s += rect(wx + 100, wy - 46, 98, 34, "#172030");
    s += poly(`${wx + 92},${wy - 46} ${wx + 149},${wy - 76} ${wx + 206},${wy - 46}`, "#1e2838");
    s += poly(`${wx + 92},${wy - 46} ${wx + 149},${wy - 76} ${wx + 206},${wy - 46}`, "none", c, 1.8, 0.6);
    s += rect(wx + 128, wy - 34, 16, 20, c, 0.7) + rect(wx + 152, wy - 34, 16, 20, c, 0.7);
    // 旗
    s += line(wx + 149, wy - 76, wx + 149, wy - 108, "#6b7688", 2);
    s += poly(`${wx + 149},${wy - 108} ${wx + 186},${wy - 100} ${wx + 149},${wy - 86}`, c, 0.8);
    // 码头台阶
    for (let i = 0; i < 9; i++) s += rect(wx + 210 + i * 12, wy + 84 + i * 8, 12, 8, "#1a2130", 0.8);
    // 帆船三艘
    s += junk(600, 400, 1.0, "#2b3038", c);
    s += junk(120, 430, 0.72, "#242931", "#b9c4d4");
    s += junk(700, 452, 0.55, "#20252d", "#9aa6b6");
    // 荔枝道：山间小路与马
    s += `<path d="M40,470 q120,-30 210,10 q90,40 200,4" fill="none" stroke="${c}" stroke-width="2" opacity="0.35" stroke-dasharray="7 6"/>`;
    s += fig(250, 484, 1.3, c, 0.55, "d");
    return s;
  }

  /* ---------------- 场景：宋元（钓鱼城） ---------------- */
  function scSong(c) {
    let s = ridge(160, 320, 58, 2.7, "#0c1119", 0.95);
    s += river(368, 122, "", c);
    // 钓鱼山主峰
    s += path("M240,368 L300,150 L352,96 L430,74 L520,110 L580,196 L616,368 Z", "#131b28");
    s += path("M300,150 L352,96 L430,74 L520,110 L580,196", "none", c, 2, 0.4);
    // 城墙沿山脊
    const wall = [[286, 176], [330, 122], [372, 96], [430, 84], [492, 100], [548, 148]];
    for (let i = 0; i < wall.length - 1; i++) {
      const a = wall[i], b = wall[i + 1];
      s += `<path d="M${a[0]},${a[1]} L${b[0]},${b[1]}" stroke="#28323f" stroke-width="13" stroke-linecap="butt"/>`;
      s += `<path d="M${a[0]},${a[1]} L${b[0]},${b[1]}" stroke="${c}" stroke-width="1.4" opacity="0.45"/>`;
    }
    // 城垛
    wall.forEach(p => s += rect(p[0] - 5, p[1] - 12, 10, 9, "#28323f"));
    // 城内屋舍与守军
    s += rect(392, 128, 44, 26, "#1b2432") + poly("386,128 414,110 442,128", "#232e3e");
    s += rect(440, 138, 32, 20, "#1b2432") + poly("435,138 456,124 477,138", "#232e3e");
    [368, 386, 404, 422].forEach((x, i) => s += fig(x, 158 + (i % 2) * 6, 1.15, c, 0.75, i % 2 ? "u" : "d"));
    // 大旗（宋）
    s += line(470, 116, 470, 46, "#6b7688", 2.4);
    s += poly(`470,50 512,62 470,80`, c, 0.9);
    s += `<text x="480" y="72" font-size="13" fill="#0a0d12" font-weight="700" opacity="0.8">宋</text>`;
    // 蒙古军帐（山脚）
    for (let i = 0; i < 4; i++) {
      const bx = 90 + i * 62, by = 396 + (i % 2) * 10;
      s += path(`M${bx},${by} L${bx + 18},${by - 22} L${bx + 36},${by} Z`, "#1a1f28", c, 1, 0.35);
      s += line(bx + 18, by - 22, bx + 18, by, "#0e131a", 1);
    }
    // 江上水军船
    s += junk(640, 420, 0.85, "#2b3038", c);
    s += junk(190, 448, 0.62, "#242931", "#b9c4d4");
    // 星光（蒙哥殁）
    s += circ(596, 130, 3, c, 0.9) + circ(612, 112, 2, c, 0.6) + circ(578, 148, 2, c, 0.5);
    return s;
  }

  /* ---------------- 场景：明清（湖广填四川） ---------------- */
  function scMing(c) {
    let s = ridge(140, 320, 50, 4.1, "#0c1119", 0.95) + ridge(112, 320, 38, 1.3, "#121a27", 0.8);
    s += river(372, 118, "", c);
    // 马头墙会馆群（左）
    [60, 132, 204].forEach((x, i) => {
      const h = 96 - i * 10;
      s += rect(x, 300 - h, 68, h, "#171f2c");
      s += rect(x + 2, 300 - h + 2, 64, h - 4, "none", "#2b3a4e", 1);
      s += poly(`${x - 8},${300 - h} ${x + 34},${300 - h - 26} ${x + 76},${300 - h}`, "#1e2836");

      s += poly(`${x - 8},${300 - h} ${x + 34},${300 - h - 26} ${x + 76},${300 - h}`, "none", c, 1.6, 0.5);
      s += rect(x + 12, 300 - h + 30, 18, 26, c, 0.55) + rect(x + 40, 300 - h + 30, 18, 26, c, 0.4);
    });
    // 吊脚楼群（右，沿江）
    [[560, 250], [612, 268], [664, 244], [716, 272]].forEach((p, i) =>
      s += stilt(p[0], p[1], 44, 40 + (i % 2) * 8, "#6b5433", "#3a2f22", c));
    // 山路
    s += `<path d="M290,410 q60,-46 130,-30 q70,16 120,-26 q40,-34 96,-40" fill="none" stroke="${c}" stroke-width="2.2" opacity="0.4" stroke-dasharray="8 7"/>`;
    // 移民队伍（挑担）
    const ppl = [[300, 404], [336, 392], [372, 380], [410, 372], [452, 350], [492, 322], [536, 300]];
    ppl.forEach((p, i) => s += fig(p[0], p[1], 1.35, c, 0.85 - i * 0.05, i % 3 === 0 ? "p" : "d"));
    // 江帆
    s += junk(150, 420, 0.8, "#2b3038", c);
    s += junk(430, 448, 0.6, "#242931", "#b9c4d4");
    s += junk(660, 424, 0.5, "#20252d", "#9aa6b6");
    return s;
  }

  /* ---------------- 场景：开埠 ---------------- */
  function scPort(c) {
    let s = ridge(150, 300, 44, 5.5, "#0c1119", 0.95);
    s += river(358, 132, "", c);
    // 洋行建筑（拱窗）
    [[70, 190], [176, 208], [286, 196]].forEach((p, i) => {
      const w = 96, h = 150 - i * 10;
      s += rect(p[0], 358 - h, w, h, "#182130");
      for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++)
        s += `<path d="M${p[0] + 12 + q * 28},${358 - h + 26 + r * 40} v-18 a9,9 0 0 1 18,0 v18 Z" fill="${c}" opacity="${0.5 - r * 0.08}"/>`;
      s += rect(p[0] - 4, 358 - h - 8, w + 8, 9, "#222c3c");
      s += rect(p[0] + w / 2 - 9, 358 - h + 8, 18, 14, "#0b1018");
    });
    // 海关钟楼
    s += rect(410, 150, 56, 208, "#1a2331");
    s += rect(406, 142, 64, 12, "#232e3e");
    s += circ(438, 190, 20, "#0b1018");
    s += `<circle cx="438" cy="190" r="20" fill="none" stroke="${c}" stroke-width="2" opacity="0.7"/>`;
    s += line(438, 190, 438, 178, c, 2, 0.9) + line(438, 190, 448, 194, c, 1.6, 0.7);
    s += poly("404,142 438,100 472,142", "#243040") + poly("404,142 438,100 472,142", "none", c, 1.6, 0.55);
    s += line(438, 100, 438, 76, c, 2, 0.7) + circ(438, 74, 4, c, 0.9);
    // 工厂烟囱 + 烟
    s += rect(524, 236, 20, 122, "#1c2532") + rect(520, 230, 28, 8, "#26303f");
    s += rect(560, 268, 15, 90, "#1c2532") + rect(556, 263, 23, 7, "#26303f");
    for (let i = 0; i < 7; i++) s += circ(534 + Math.sin(i * 1.5) * 26, 214 - i * 24, 13 - i * 1.2, "#8d97a6", 0.14 - i * 0.014);
    for (let i = 0; i < 5; i++) s += circ(568 + Math.sin(i * 1.9 + 1) * 20, 248 - i * 22, 10 - i * 1.1, "#8d97a6", 0.12 - i * 0.015);
    // 蒸汽轮船（利川号）
    const sx = 620, sy = 400;
    s += `<g transform="translate(${sx},${sy})">` +
      path("M-84,0 L84,0 L66,26 L-66,26 Z", "#26303f") +
      rect(-72, -22, 132, 22, "#1e2733") +
      rect(-40, -52, 30, 30, "#2c3746") +
      rect(10, -46, 20, 24, "#2c3746") +
      rect(48, -60, 16, 60, "#1a222d") +
      rect(46, -62, 20, 8, c, 0.75) +
      circ(60, 8, 8, "#141a23") +
      `<circle cx="60" cy="8" r="8" fill="none" stroke="${c}" stroke-width="1.6" opacity="0.7"/>` +
      line(60, 8, 66, 2, c, 1.6, 0.8) + line(60, 8, 66, 14, c, 1.6, 0.8) +
      `</g>`;
    // 烟
    for (let i = 0; i < 8; i++) s += circ(668 + Math.sin(i * 1.3) * 30, 336 - i * 26, 14 - i * 1.2, "#8d97a6", 0.15 - i * 0.015);
    // 货箱与工人
    for (let i = 0; i < 3; i++) s += rect(120 + i * 26, 388, 22, 20, "#3a3226", 0.9) + rect(120 + i * 26, 388, 22, 20, "none", c, 1, 0.4);
    s += fig(230, 384, 1.4, c, 0.8, "p") + fig(268, 386, 1.35, c, 0.7, "d");
    return s;
  }

  /* ---------------- 场景：陪都抗战 ---------------- */
  function scWar(c) {
    let s = rect(0, 0, 800, 520, "#070a10");
    s += ridge(190, 330, 54, 6.2, "#0a0e15", 0.95) + ridge(160, 330, 42, 0.4, "#101725", 0.9);
    s += river(392, 128, "", "#2a3a52");
    // 探照灯光束
    const beams = [[180, 470, 300, 60], [420, 478, 520, 40], [640, 468, 700, 70]];
    beams.forEach(b => {
      s += `<path d="M${b[0]},${b[1]} L${b[2] - 40},${b[3]} L${b[2] + 40},${b[3]} Z" fill="url(#hBeam)" opacity="0.16"/>`;
      s += circ(b[0], b[1] - 4, 4, "#ffd98a", 0.9);
    });
    // 轰炸机剪影（3 架）
    function bomber(x, y, s2) {
      return `<g transform="translate(${x},${y}) scale(${s2})" opacity="0.9">` +
        path("M-30,0 L30,0 L22,6 L-22,6 Z", "#0b0f16") +
        path("M-30,0 L-6,-3 L6,-3 L30,0 Z", "#141a24") +
        line(-2, 0, -2, -14, "#0b0f16", 2.4) + line(-2, -14, 14, -8, "#0b0f16", 2) +
        line(-2, -14, -18, -8, "#0b0f16", 2) +
        rect(-6, 6, 5, 4, "#0b0f16") + rect(2, 6, 5, 4, "#0b0f16") + `</g>`;
    }
    s += bomber(240, 96, 1.15) + bomber(430, 130, 0.85) + bomber(590, 74, 0.7);
    // 防空警报红光
    s += circ(720, 60, 42, c, 0.08) + circ(720, 60, 26, c, 0.1) + circ(720, 60, 11, c, 0.5);
    // 山体与防空洞
    s += path("M40,392 L40,210 L96,170 L190,158 L268,196 L306,392 Z", "#0d121b");
    s += `<path d="M40,392 L40,210 L96,170 L190,158 L268,196 L306,392" fill="none" stroke="${c}" stroke-width="1.6" opacity="0.35"/>`;
    s += `<path d="M120,392 v-70 a44,44 0 0 1 88,0 v70 Z" fill="#04070c"/>`;
    s += `<path d="M120,392 v-70 a44,44 0 0 1 88,0 v70" fill="none" stroke="${c}" stroke-width="2.4" opacity="0.7"/>`;
    s += line(164, 316, 164, 392, c, 1.4, 0.35);
    // 洞内人影
    [140, 158, 176, 192].forEach((x, i) => s += fig(x, 358 - (i % 2) * 3, 1.2, c, 0.55, "d"));
    // 纪功碑（解放碑前身）
    const px = 500;
    s += rect(px - 16, 190, 32, 202, "#1b2029");
    for (let i = 0; i < 8; i++) s += line(px - 16, 200 + i * 24, px + 16, 200 + i * 24, "#0e131b", 1.4, 0.7);
    s += rect(px - 22, 180, 44, 12, "#232a35");
    s += poly(`${px - 20},${180} ${px},${146} ${px + 20},${180}`, "#26324140");
    s += `<path d="M${px - 20},${180} L${px},${146} L${px + 20},${180}" fill="none" stroke="${c}" stroke-width="2" opacity="0.85"/>`;
    s += circ(px, 138, 5, c, 0.9);
    s += `<circle cx="${px}" cy="138" r="13" fill="none" stroke="${c}" stroke-width="1.4" opacity="0.45"/>`;
    // 街巷人影与轰炸残迹
    [380, 404, 428, 452].forEach((x, i) => s += fig(x, 430 + (i % 2) * 6, 1.3, "#0b0f16", 1, "d"));
    s += rect(560, 400, 60, 6, "#0b0f16", 0.8) + rect(580, 386, 8, 20, "#0b0f16", 0.8);
    s += circ(660, 200, 3, "#ffd98a", 0.5) + circ(690, 240, 2.4, "#ffd98a", 0.4);
    return s;
  }

  /* ---------------- 场景：解放·建设 ---------------- */
  function scBuild(c) {
    let s = ridge(150, 300, 46, 2.4, "#0c1119", 0.95);
    s += river(376, 124, "", c);
    // 长江大桥：双塔 + 主梁 + 斜拉索
    const bx = 150, by = 340;
    s += rect(0, by + 34, 800, 12, "#1b2431");
    [bx + 60, bx + 320].forEach(tx => {
      s += rect(tx - 8, by - 96, 16, 130, "#202a38");
      s += rect(tx - 12, by - 100, 24, 8, "#28323f");
      for (let i = 0; i < 7; i++) {
        s += line(tx, by - 92 + i * 14, tx + 130, by + 30, c, 1.2, 0.4);
        s += line(tx, by - 92 + i * 14, tx - 130, by + 30, c, 1.2, 0.4);
      }
    });
    // 桥墩
    [bx + 60, bx + 320].forEach(tx => s += rect(tx - 16, by + 34, 32, 44, "#1b2431") + rect(tx - 20, by + 76, 40, 10, "#161e29"));
    // 索道（缆车）
    s += line(60, 250, 740, 214, "#5b6675", 2.2);
    s += `<g transform="translate(300,236)">` +
      rect(-16, 0, 32, 24, "#28323f") + rect(-13, 3, 26, 12, c, 0.75) +
      line(0, 0, 0, -14, "#5b6675", 2) + circ(0, -16, 3.4, "#6b7688") + `</g>`;
    s += `<g transform="translate(560,224)">` +
      rect(-14, 0, 28, 21, "#28323f") + rect(-11, 3, 22, 10, c, 0.65) +
      line(0, 0, 0, -12, "#5b6675", 2) + circ(0, -14, 3, "#6b7688") + `</g>`;
    // 工厂烟囱群 + 烟
    [[80, 214], [110, 236], [140, 226]].forEach(p => {
      s += rect(p[0] - 6, p[1], 12, 126 - p[1] + 214, "#1a222e") + rect(p[0] - 9, p[1] - 6, 18, 8, "#242e3c");
    });
    for (let i = 0; i < 6; i++) s += circ(110 + Math.sin(i * 1.4) * 32, 200 - i * 22, 13 - i * 1.2, "#8d97a6", 0.12 - i * 0.014);
    // 成渝铁路：路基 + 蒸汽机车
    s += rect(0, 470, 800, 6, "#1e2634", 0.9);
    for (let i = 0; i < 26; i++) s += rect(i * 32 + 6, 476, 12, 5, "#3a3226", 0.7);
    s += `<g transform="translate(470,470)">` +
      rect(-52, -26, 104, 20, "#232c3a") +
      rect(-52, -34, 30, 12, "#2b3543") +
      rect(20, -20, 26, 14, "#2b3543") +
      rect(-16, -48, 18, 18, "#1a222d") +
      circ(-26, -4, 8, "#141a23") + circ(-6, -4, 8, "#141a23") + circ(16, -4, 8, "#141a23") +
      `<circle cx="-26" cy="-4" r="8" fill="none" stroke="${c}" stroke-width="1.4" opacity="0.6"/>` +
      line(-26, -4, -20, -9, c, 1.4, 0.7) +
      `</g>`;
    for (let i = 0; i < 7; i++) s += circ(474 + Math.sin(i * 1.2) * 22, 416 - i * 20, 12 - i * 1.1, "#8d97a6", 0.13 - i * 0.015);
    // 三轮车 / 行人
    s += fig(200, 452, 1.3, c, 0.6, "d") + fig(236, 454, 1.28, c, 0.55, "d");
    // 江轮
    s += junk(700, 430, 0.6, "#242931", "#b9c4d4");
    return s;
  }

  /* ---------------- 场景：直辖·今日 ---------------- */
  function scNow(c) {
    let s = ridge(160, 300, 42, 3.8, "#0c1119", 0.92);
    s += river(384, 136, "", c);
    // 摩天楼群（高低错落）
    const towers = [
      [40, 300, 40], [86, 244, 48], [140, 196, 44], [190, 288, 36], [232, 160, 52],
      [292, 232, 40], [340, 128, 46], [394, 268, 38], [470, 176, 50], [528, 300, 34],
      [640, 140, 54], [704, 220, 46], [758, 178, 42]
    ];
    towers.forEach((t, i) => {
      const [x, y, w] = t, h = 384 - y;
      s += rect(x, y, w, h, "#141c27");
      s += rect(x + 2, y + 2, w - 4, h - 2, "none", c, 1, 0.18);
      // 亮窗
      for (let r = 0; r < Math.floor(h / 16); r++) for (let q = 0; q < Math.floor(w / 12); q++) {
        const on = (r * 7 + q * 5 + i * 3) % 5 < 3;
        s += rect(x + 4 + q * 12, y + 8 + r * 16, 6, 8, on ? c : "#1e2733", on ? 0.85 : 0.12);
      }
      if (i % 3 === 0) s += line(x + w / 2, y, x + w / 2, y - 22, "#3a4658", 1.6) + circ(x + w / 2, y - 24, 2.4, c, 0.8);
    });
    // 来福士（拱形塔楼连体）
    s += `<path d="M560,384 L560,150 q46,-40 92,0 L652,384 Z" fill="#18202c"/>`;
    s += `<path d="M560,384 L560,150 q46,-40 92,0 L652,384" fill="none" stroke="${c}" stroke-width="1.8" opacity="0.6"/>`;
    for (let r = 0; r < 13; r++) s += line(566, 168 + r * 17, 646, 168 + r * 17, c, 1, 0.22);
    // 单轨穿楼（李子坝）
    const lx = 300, ly = 300;
    s += rect(lx, ly, 108, 84, "#16202c");
    s += rect(lx + 4, ly + 4, 100, 76, "none", c, 1, 0.16);
    // 轨道穿楼
    s += `<path d="M0,${ly + 52} L${lx + 108},${ly + 46} L800,${ly + 30}" fill="none" stroke="#39445a" stroke-width="5" opacity="0.9"/>`;
    s += `<path d="M0,${ly + 56} L${lx + 108},${ly + 50} L800,${ly + 34}" fill="none" stroke="${c}" stroke-width="1.6" opacity="0.5"/>`;
    // 列车
    s += `<g transform="translate(${lx + 40},${ly + 40})">` +
      rect(-34, -14, 68, 26, "#232d3c") +
      rect(-30, -10, 22, 14, c, 0.8) + rect(-3, -10, 22, 14, c, 0.8) + rect(24, -10, 16, 14, c, 0.8) +
      rect(-34, 12, 68, 5, "#1a222e") + `</g>`;
    // 立交桥（螺旋曲线）
    s += `<path d="M440,470 q60,-90 160,-70 q80,16 120,-56" fill="none" stroke="#2b3543" stroke-width="7" stroke-linecap="round"/>`;
    s += `<path d="M440,470 q60,-90 160,-70 q80,16 120,-56" fill="none" stroke="${c}" stroke-width="1.6" opacity="0.45"/>`;
    for (let i = 0; i < 6; i++) s += line(470 + i * 52, 470 - i * 6, 470 + i * 52, 400 - i * 12, "#2b3543", 4, 0.9);
    // 游船与江
    s += `<g transform="translate(140,452)">` + rect(-26, -6, 52, 14, "#28323f") + rect(-20, -18, 34, 13, c, 0.7) +
      rect(-26, -22, 8, 6, "#1a222e") + `</g>`;
    s += `<g transform="translate(690,468)">` + rect(-20, -5, 40, 11, "#28323f") + rect(-15, -14, 26, 10, c, 0.6) + `</g>`;
    // 灯光点缀
    for (let i = 0; i < 22; i++) s += circ(30 + (i * 137) % 740, 120 + (i * 71) % 220, 1.8, c, 0.35);
    return s;
  }

  const SCENE = { ba: scBa, qin: scQin, song: scSong, ming: scMing, port: scPort, wartime: scWar, build: scBuild, now: scNow };

  /* ---------- 构建场景 SVG ---------- */
  function svgScene(era) {
    const c = era.color;
    return `<svg viewBox="0 0 800 520" class="hs-svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${era.name}场景">
      <defs>
        <linearGradient id="hSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0a0e15"/><stop offset="1" stop-color="#141b26"/>
        </linearGradient>
        <linearGradient id="hRiv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#16334f"/><stop offset="1" stop-color="#0c1e30"/>
        </linearGradient>
        <linearGradient id="hBeam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#cfe6ff" stop-opacity=".55"/><stop offset="1" stop-color="#cfe6ff" stop-opacity="0"/>
        </linearGradient>
        <radialGradient id="hGlow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stop-color="${c}" stop-opacity=".30"/><stop offset="1" stop-color="${c}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="520" fill="url(#hSky)"/>
      <rect width="800" height="520" fill="url(#hGlow)"/>
      ${(SCENE[era.scene] || scBa)(c)}
    </svg>`;
  }

  /* ==========================================================
     真实影像：每个时代一张实拍图（旧影优先），含"看今貌"切换
     图片均来自站内已核验的真实照片库 assets/pic/guess 与 hist
     ========================================================== */
  const PHOTOS = {
    ba: { img: "assets/pic/hist/ba-relic.jpg", alt2: null, heroOld: false,
      cap: "虎钮錞于 · 巴人军乐器，三峡博物馆藏",
      stats: [{ v: "前 11 世纪", k: "立国" }, { v: "江州", k: "都城" }, { v: "白虎", k: "图腾" }] },
    qin: { img: "assets/pic/guess/dazu-old.jpg", alt2: "assets/pic/guess/dazu.jpg", heroOld: true,
      cap: "大足北山石刻 · 唐末韦君靖首凿",
      stats: [{ v: "前 314 年", k: "置巴郡" }, { v: "581 年", k: "「渝」之始" }, { v: "十六里", k: "李严大城" }] },
    song: { img: "assets/pic/guess/diaoyucheng-old.jpg", alt2: "assets/pic/guess/diaoyucheng.jpg", heroOld: true,
      cap: "合川钓鱼城 · 上帝折鞭处",
      stats: [{ v: "1189 年", k: "重庆得名" }, { v: "36 年", k: "钓鱼城坚守" }, { v: "1363 年", k: "大夏国都" }] },
    ming: { img: "assets/pic/guess/huguang-old.jpg", alt2: "assets/pic/guess/huguang.jpg", heroOld: true,
      cap: "湖广会馆 · 湖广填四川的见证",
      stats: [{ v: "1371 年", k: "置重庆府" }, { v: "百年", k: "移民潮" }, { v: "八省", k: "会馆群" }] },
    port: { img: "assets/pic/guess/chaotianmen-old.jpg", alt2: "assets/pic/guess/chaotianmen.jpg", heroOld: true,
      cap: "朝天门码头 · 重庆开埠",
      stats: [{ v: "1891.3.1", k: "海关开关" }, { v: "1929.2.15", k: "正式建市" }, { v: "利川号", k: "1898 首航" }] },
    wartime: { img: "assets/pic/guess/erling-old.jpg", alt2: "assets/pic/guess/erling.jpg", heroOld: true,
      cap: "鹅岭二厂 · 陪都时期的印钞厂",
      stats: [{ v: "1937.11.20", k: "国府移驻" }, { v: "1940.9.6", k: "定陪都" }, { v: "五年半", k: "大轰炸" }] },
    build: { img: "assets/pic/guess/jiefangbei-old.jpg", alt2: "assets/pic/guess/jiefangbei.jpg", heroOld: true,
      cap: "解放碑 · 从抗战胜利纪功碑走来",
      stats: [{ v: "1949.11.30", k: "重庆解放" }, { v: "1952.7.1", k: "成渝铁路" }, { v: "1980 年", k: "首座长江大桥" }] },
    now: { img: "assets/pic/guess/hongyadong.jpg", alt2: "assets/pic/guess/hongyadong-old.jpg", heroOld: false,
      cap: "洪崖洞 · 今天的重庆",
      stats: [{ v: "1997.6.18", k: "直辖挂牌" }, { v: "8.24 万", k: "km²" }, { v: "2010 年", k: "两江新区" }] }
  };

  /* 相关地点：把历史事件连到今天的区县页 */
  const PLACES = {
    "巴蔓子以头留城": { n: "渝中半岛", d: "yuzhong" },
    "秦灭巴蜀": { n: "渝中半岛", d: "yuzhong" },
    "李严筑大城": { n: "渝中半岛", d: "yuzhong" },
    "韦君靖与北山石刻": { n: "大足北山石刻", d: "dazu" },
    "荔枝道": { n: "涪陵", d: "fuling" },
    "余玠筑钓鱼城": { n: "合川钓鱼城", d: "hechuan" },
    "钓鱼城之战": { n: "合川钓鱼城", d: "hechuan" },
    "钓鱼城开城": { n: "合川钓鱼城", d: "hechuan" },
    "明玉珍建大夏": { n: "明玉珍睿陵", d: "jiangbei" },
    "湖广填四川": { n: "湖广会馆", d: "yuzhong" },
    "川江水运枢纽": { n: "湖广会馆", d: "yuzhong" },
    "重庆开埠": { n: "朝天门", d: "yuzhong" },
    "重庆正式建市": { n: "渝中半岛", d: "yuzhong" },
    "国府移驻重庆": { n: "渝中半岛", d: "yuzhong" },
    "重庆大轰炸": { n: "渝中半岛", d: "yuzhong" },
    "定陪都": { n: "渝中半岛", d: "yuzhong" },
    "抗战胜利": { n: "解放碑", d: "yuzhong" },
    "重庆解放": { n: "解放碑", d: "yuzhong" },
    "嘉陵江索道": { n: "长江索道", d: "yuzhong" },
    "三峡工程与移民": { n: "万州库区", d: "wanzhou" },
    "重庆直辖": { n: "渝中半岛", d: "yuzhong" },
    "两江新区": { n: "渝北", d: "yubei" },
    "轻轨穿楼": { n: "李子坝", d: "yuzhong" }
  };
  function placeHref(slug) { return slug === "wanzhou" ? "wanzhou/index.html" : "districts/" + slug + ".html"; }

  /* ---------- 渲染时代按钮 ---------- */
  function buildEras() {
    const box = $("#histEras");
    if (!box) return;
    box.innerHTML = ERAS.map((e, i) =>
      `<button class="he" data-i="${i}" style="--ec:${e.color}">
         <span class="he-no">${String(i + 1).padStart(2, "0")}</span>
         <span class="he-nm">${e.name}</span>
         <span class="he-yr">${e.span}</span>
       </button>`).join("");
    box.addEventListener("click", ev => {
      const b = ev.target.closest(".he");
      if (b) go(+b.dataset.i);
    });
  }

  /* ---------- 渲染时间轴 ---------- */
  function buildAxis() {
    const box = $("#histAxis");
    if (!box) return;
    box.innerHTML = `<div class="ha-track"></div>` + ERAS.map((e, i) =>
      `<button class="ha" data-i="${i}" style="--ec:${e.color}">
         <span class="ha-dot"></span>
         <span class="ha-lb">${e.name}</span>
         <span class="ha-y">${e.y1 < 0 ? "前" + Math.abs(e.y1) : e.y1}</span>
       </button>`).join("");
    box.addEventListener("click", ev => {
      const b = ev.target.closest(".ha");
      if (b) go(+b.dataset.i);
    });
  }

  /* ---------- 底部里程碑条 ---------- */
  function buildMarks() {
    const box = $("#histMarks");
    if (!box) return;
    box.innerHTML = MARKS.map(m => {
      const era = ERAS.find(e => m.y >= e.y0 && m.y <= e.y1) || ERAS[ERAS.length - 1];
      const i = ERAS.indexOf(era);
      const yr = m.y < 0 ? "前" + Math.abs(m.y) : m.y;
      return `<button class="hm" data-i="${i}" style="--ec:${era.color}">
                <span class="hm-y">${yr}</span><span class="hm-s">${m.s}</span>
              </button>`;
    }).join("");
    box.addEventListener("click", ev => {
      const b = ev.target.closest(".hm");
      if (b) go(+b.dataset.i);
    });
  }

  /* ---------- 切换时代 ---------- */
  function go(i, silent) {
    if (i < 0 || i >= ERAS.length || i === cur) return;
    cur = i;
    const e = ERAS[i];

    // 按钮 / 轴 / 里程碑 同步
    document.querySelectorAll(".he").forEach(b => b.classList.toggle("on", +b.dataset.i === i));
    document.querySelectorAll(".ha").forEach(b => b.classList.toggle("on", +b.dataset.i === i));
    document.querySelectorAll(".hm").forEach(b => b.classList.toggle("on", +b.dataset.i === i));

    // 场景：真实影像（旧影 / 今貌 可切换）+ 时代速览
    const sc = $("#hsScene");
    if (sc) {
      const P = PHOTOS[e.k] || {};
      sc.style.setProperty("--ec", e.color);
      if (P.img) {
        sc.innerHTML = `
          <figure class="hs-fig">
            <img class="hs-img" id="hsImg" src="${P.img}" alt="${e.name} 影像"
                 onerror="this.closest('.hs-fig').classList.add('noimg')">
            ${P.alt2 ? `<button class="hs-swap" id="hsSwap" type="button" data-now="${P.alt2}" data-old="${P.img}">${P.heroOld ? "看今貌" : "看旧影"}</button>` : ""}
            <figcaption class="hs-cap">${P.cap || ""}</figcaption>
          </figure>
          <div class="hs-stats">${(P.stats || []).map(x => `<div class="hs-st"><b>${x.v}</b><span>${x.k}</span></div>`).join("")}</div>`;
        const sw = $("#hsSwap");
        if (sw) sw.addEventListener("click", () => {
          const im = $("#hsImg");
          const toOld = sw.dataset.cur !== "old";
          im.src = toOld ? sw.dataset.old : sw.dataset.now;
          sw.dataset.cur = toOld ? "old" : "now";
          sw.textContent = toOld ? "看今貌" : "看旧影";
        });
        if (sw) sw.dataset.cur = P.heroOld ? "old" : "now";
      } else {
        sc.innerHTML = svgScene(e);
      }
      sc.classList.remove("anim");
      void sc.offsetWidth;
      sc.classList.add("anim");
    }

    // 文案
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set("#hsEn", e.en);
    set("#hsName", e.name);
    set("#hsSpan", e.span);
    set("#hsLead", e.lead);
    $("#hsTags").innerHTML = e.tags.map(t => `<span style="--ec:${e.color}">${t}</span>`).join("");
    set("#hsRelic", "现存 · " + e.relic);

    // 事件卡
    $("#hsEvents").innerHTML = e.events.map((ev, k) =>
      `<article class="hev" style="--ec:${e.color};--d:${k * 70}ms">
         <div class="hev-y">${ev.y}</div>
         <div class="hev-b">
           <h4>${ev.t}</h4>
           <p>${ev.d}</p>
           <div class="hev-g">${ev.g.map(g => `<span>${g}</span>`).join("")}${PLACES[ev.t] ? `<a class="hev-pl" href="${placeHref(PLACES[ev.t].d)}" target="_blank" rel="noopener">${PLACES[ev.t].n} ›</a>` : ""}</div>
         </div>
       </article>`).join("");

    // 主色调
    const sec = document.getElementById("history");
    if (sec) sec.style.setProperty("--ec", e.color);

    if (!silent && playing) restartPlay();
  }

  /* ---------- 自动巡游 ---------- */
  function restartPlay() {
    clearInterval(playTimer);
    playTimer = setInterval(() => {
      if (cur >= ERAS.length - 1) { stopPlay(); return; }
      go(cur + 1, true);
    }, 4200);
  }
  function stopPlay() {
    playing = false; clearInterval(playTimer);
    const b = $("#hsPlay"); if (b) { b.classList.remove("on"); b.textContent = "▶ 自动巡游"; }
  }
  function startPlay() {
    playing = true;
    const b = $("#hsPlay"); if (b) { b.classList.add("on"); b.textContent = "⏸ 暂停巡游"; }
    if (cur >= ERAS.length - 1) go(0);
    restartPlay();
  }

  /* ---------- 初始化 ---------- */
  function init() {
    if (!$("#histEras")) return;
    buildEras(); buildAxis(); buildMarks();
    go(0);

    const play = $("#hsPlay");
    if (play) play.addEventListener("click", () => playing ? stopPlay() : startPlay());

    document.addEventListener("keydown", ev => {
      const sec = document.getElementById("history");
      if (!sec) return;
      const r = sec.getBoundingClientRect();
      if (r.bottom < 80 || r.top > innerHeight - 80) return;
      if (ev.key === "ArrowLeft") { ev.preventDefault(); stopPlay(); go(cur - 1); }
      if (ev.key === "ArrowRight") { ev.preventDefault(); stopPlay(); go(cur + 1); }
    });
  }

  window.History = { init, go };
})();

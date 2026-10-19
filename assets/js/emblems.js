/* ==========================================================
   emblems.js — 山城印记 · 区县徽章与纹样装饰
   纹样库（0–100 坐标盒）→ 圆形徽章 seal() / 纹样带 band()
   小徽标 mini() / 城市纹样条 cityStrip()
   ========================================================== */
window.Emblems = (function () {
  "use strict";
  const DATA = window.EMBLEM || {};
  const FONT = '"PingFang SC","HarmonyOS Sans SC","Microsoft YaHei",system-ui,sans-serif';
  let uid = 0;

  /* ---------- 基础元件 ---------- */
  const P = (d, w, c, o) =>
    `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w || 5}" stroke-linecap="round" stroke-linejoin="round"${o != null ? ` opacity="${o}"` : ""}/>`;
  const F = (d, c, o) =>
    `<path d="${d}" fill="${c}"${o != null ? ` opacity="${o}"` : ""}/>`;
  const CI = (cx, cy, r, c, o) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"${o != null ? ` opacity="${o}"` : ""}/>`;
  const R = (x, y, w, h, rx, c, o) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx || 0}" fill="${c}"${o != null ? ` opacity="${o}"` : ""}/>`;

  /* =======================================================
     纹样库 —— 每个函数在 100×100 盒子里作画
     ======================================================= */
  const G = {
    /* 两江 */
    river: c =>
      P("M8,30 q12,-11 24,0 t24,0 t24,0", 5, c) +
      P("M8,52 q12,-11 24,0 t24,0 t24,0", 5, c, .8) +
      P("M8,74 q12,-11 24,0 t24,0 t24,0", 5, c, .55),
    /* 拱桥 */
    bridge: c =>
      P("M6,72 Q50,22 94,72", 5, c) + P("M4,72 H96", 5, c) +
      P("M28,72 V54", 4, c, .85) + P("M50,72 V44", 4, c, .85) + P("M72,72 V54", 4, c, .85),
    /* 索道 */
    cable: c =>
      P("M12,22 L88,82", 4, c, .65) + P("M12,38 L88,98", 4, c, .5) +
      R(40,44,20,16,5,c,.9) + CI(46,50,2.4,"#0b1017",.9) + CI(54,50,2.4,"#0b1017",.9),
    /* 楼群 */
    tower: c =>
      R(16,38,20,42,2,c,.85) + R(42,18,26,62,2,c,.95) + R(74,48,14,32,2,c,.85) +
      P("M8,80 H92", 5, c) +
      CI(26,48,2.4,"#0b1017") + CI(26,60,2.4,"#0b1017") +
      CI(55,32,2.4,"#0b1017") + CI(55,46,2.4,"#0b1017") + CI(55,60,2.4,"#0b1017") +
      CI(81,58,2.4,"#0b1017"),
    /* 吊脚楼 */
    stilt: c =>
      P("M8,88 L92,62", 4, c, .55) + P("M26,62 V32 h38 V62", 5, c) +
      P("M18,34 L45,14 L72,34", 5, c) + P("M32,62 V88", 4, c, .85) +
      P("M58,62 V78", 4, c, .85) + P("M45,32 V62", 3, c, .5),
    /* 古镇街 */
    town: c =>
      P("M8,84 H92", 5, c) + P("M12,84 V60 h22 V84", 5, c) + P("M8,62 L23,46 L38,62", 5, c) +
      P("M42,84 V48 h24 V84", 5, c) + P("M38,50 L54,32 L70,50", 5, c) +
      P("M74,84 V66 h16 V84", 5, c) + P("M70,68 L82,56 L94,68", 5, c),
    /* 山峰 */
    mountain: c =>
      F("M6,84 L34,26 L52,58 L64,36 L94,84 Z", c, .15) +
      P("M6,84 L34,26 L52,58 L64,36 L94,84", 5, c) +
      P("M34,26 l-7,10 M34,26 l7,10", 4, c, .7) + CI(78,24,6,c,.9),
    /* 天生桥 */
    karst: c =>
      F("M14,84 V50 Q50,16 86,50 V84 Z", c, .13) + P("M14,84 V50 Q50,16 86,50 V84", 5, c) +
      P("M32,84 V54 Q50,32 68,54 V84", 5, c) +
      P("M10,84 q10,-7 20,0 t20,0 t20,0 t20,0", 4, c, .8),
    /* 天坑龙缸 */
    sinkhole: c =>
      P("M16,32 V76 Q50,94 84,76 V32", 5, c) + P("M16,32 q34,-14 68,0", 4, c, .8) +
      P("M84,32 L96,24", 4, c, .8) + CI(50,32,3,c),
    /* 夔门 */
    cliff: c =>
      F("M4,84 V20 Q16,8 28,18 V84 Z", c, .2) + F("M96,84 V30 Q84,16 72,26 V84 Z", c, .2) +
      P("M30,74 q9,-7 18,0 t18,0 t18,0", 4, c, .85) + CI(50,30,5,c,.8),
    /* 神女峰 */
    goddess: c =>
      P("M16,84 L42,24 L56,50 L68,30 L90,84", 5, c) +
      CI(42,15,4,c) + P("M42,19 v8 M38,25 h8", 3.5, c, .8) +
      P("M8,62 q22,-12 44,0 t40,-4", 4, c, .55),
    /* 石刻 */
    grotto: c =>
      P("M24,84 V44 Q50,20 76,44 V84", 5, c) + P("M34,84 V48 Q50,30 66,48 V84", 4, c, .5) +
      CI(50,40,5,c,.95) + F("M40,80 Q40,52 50,48 Q60,52 60,80 Z", c, .8) +
      P("M50,18 v-8 M34,26 l-6,-6 M66,26 l6,-6", 3.5, c, .7),
    /* 溶洞 */
    cave: c =>
      F("M16,84 V48 Q50,12 84,48 V84 Z", c, .15) + P("M16,84 V48 Q50,12 84,48 V84", 5, c) +
      F("M32,48 l5,14 l5,-14 Z", c, .8) + F("M50,48 l5,17 l5,-17 Z", c, .8) +
      F("M66,48 l4,11 l4,-11 Z", c, .8) + P("M8,84 H92", 5, c),
    /* 瀑布 */
    waterfall: c =>
      F("M12,84 V26 h18 V84 Z", c, .15) + P("M12,84 V26 h18 V84", 5, c) +
      P("M34,28 q5,16 0,28 t0,28", 4, c, .85) + P("M44,28 q5,16 0,28 t0,28", 4, c, .7) +
      P("M54,28 q5,16 0,28 t0,28", 4, c, .55) +
      P("M10,84 q12,-8 24,0 t24,0 t24,0", 4, c, .8),
    /* 湖岛 */
    lake: c =>
      CI(74,26,7,c,.9) +
      F("M22,68 q10,-18 20,0 Z", c, .22) + F("M56,68 q9,-14 18,0 Z", c, .22) +
      P("M22,68 q10,-18 20,0", 4, c) + P("M56,68 q9,-14 18,0", 4, c) +
      P("M8,80 q11,-8 22,0 t22,0 t22,0 t22,0", 4, c, .8),
    /* 大坝平湖 */
    dam: c =>
      P("M16,34 H84 V84 H16 Z", 5, c) + P("M8,34 q14,-9 28,0 t28,0 t28,0", 4, c, .7) +
      P("M28,84 V50 M44,84 V50 M60,84 V50 M76,84 V50", 3.5, c, .5) +
      P("M10,72 q11,-8 22,0 t22,0 t22,0 t22,0", 4, c, .85),
    /* 帆船 */
    boat: c =>
      F("M20,72 Q50,90 80,72 Z", c, .85) + P("M50,72 V20", 5, c) +
      F("M50,24 Q74,52 50,52 Z", c, .25) +
      P("M12,84 q10,-8 20,0 t20,0 t20,0 t20,0", 4, c, .8),
    /* 茶山 */
    tea: c =>
      P("M10,82 Q50,66 90,82", 4, c, .9) + P("M10,64 Q50,48 90,64", 4, c, .7) +
      P("M10,46 Q50,30 90,46", 4, c, .5) +
      CI(24,36,3,c,.9) + CI(50,26,3,c,.9) + CI(76,36,3,c,.9),
    /* 竹 */
    bamboo: c =>
      P("M30,88 V26", 5, c) + P("M50,88 V14", 5, c) + P("M70,88 V38", 5, c) +
      P("M30,44 h12 M30,62 h12", 3.5, c, .8) + P("M50,36 h14 M50,58 h14", 3.5, c, .8) +
      P("M70,52 h10", 3.5, c, .8) +
      P("M50,20 q12,-10 20,-6 q-8,12 -20,6", 4, c, .8) +
      P("M70,36 q12,-10 20,-6 q-8,12 -20,6", 4, c, .8),
    /* 油菜花海 */
    flower: c => {
      const pts = [[20,52],[36,44],[52,58],[68,42],[84,54]];
      let s = P("M8,80 H92", 4, c, .6);
      pts.forEach(p => {
        s += P(`M${p[0]},80 V${p[1] + 6}`, 3.5, c, .8) + CI(p[0], p[1], 4.5, c, .9) +
             CI(p[0], p[1], 1.6, "#0b1017", .9);
      });
      return s;
    },
    /* 牡丹 */
    peony: c =>
      CI(50,50,7,c,.95) +
      CI(50,31,9,c,.8) + CI(64,42,9,c,.8) + CI(59,63,9,c,.8) +
      CI(41,63,9,c,.8) + CI(36,42,9,c,.8) +
      P("M50,68 V88", 4, c) + P("M50,78 q12,-8 18,2 q-12,6 -18,-2", 4, c, .85),
    /* 桃花源 */
    peach: c =>
      P("M18,84 Q42,62 80,32", 4, c, .9) +
      [[36,68],[54,54],[70,40],[84,30]].map(p => CI(p[0], p[1], 5, c, .85) + CI(p[0], p[1], 1.8, "#0b1017", .9)).join(""),
    /* 脐橙 */
    orange: c =>
      CI(46,58,17,c,.9) + CI(38,52,4,"#0b1017",.22) + CI(52,66,5,"#0b1017",.22) +
      CI(60,50,4,"#0b1017",.22) + P("M46,42 V32", 4, c) +
      P("M56,42 q10,-14 22,-10 q-6,14 -22,10", 4, c),
    /* 脆李 */
    plum: c =>
      CI(40,56,13,c,.9) + CI(62,64,10,c,.8) + P("M40,43 q4,-8 12,-10", 4, c) +
      P("M52,42 q12,-8 20,-2 q-8,12 -20,2", 4, c, .9),
    /* 烤鱼 */
    fish: c =>
      F("M22,52 Q46,30 68,52 Q46,74 22,52 Z", c, .85) + F("M68,52 L86,38 V66 Z", c, .7) +
      CI(32,48,2.5,"#0b1017",.9) + P("M40,40 V64 M50,38 V66", 3, c, .5) +
      P("M10,80 q10,-8 20,0 t20,0", 4, c, .7),
    /* 火锅 */
    hotpot: c =>
      F("M26,44 H74 V68 Q74,80 64,80 H36 Q26,80 26,68 Z", c, .18) +
      P("M26,44 H74 V68 Q74,80 64,80 H36 Q26,80 26,68 Z", 5, c) +
      P("M26,52 H14 M74,52 H86", 5, c) +
      P("M42,36 q-7,-9 0,-18 M58,36 q-7,-9 0,-18", 4, c, .8) + P("M20,88 H80", 5, c),
    /* 龙舞 */
    dragon: c =>
      P("M20,76 Q38,42 56,56 Q74,70 84,42", 7, c, .9) +
      P("M84,42 l12,-8 M84,42 l12,6", 4, c) +
      P("M40,62 l-6,10 M60,64 l6,10", 4, c, .8) + CI(20,76,4.5,c),
    /* 盐灶 */
    salt: c =>
      F("M28,56 H72 V84 H28 Z", c, .15) + P("M28,56 H72 V84 H28 Z", 5, c) +
      F("M50,56 q-9,-13 0,-22 q9,9 0,22", c, .9) +
      F("M38,40 H62 V52 H38 Z", c, .2) + P("M38,40 H62 V52 H38 Z", 4, c, .9) +
      P("M44,34 q-6,-8 0,-14 M56,34 q-6,-8 0,-14", 3.5, c, .75),
    /* 塔寺 */
    temple: c =>
      F("M50,10 L68,26 H32 Z", c, .9) + F("M50,30 L74,48 H26 Z", c, .75) +
      F("M50,52 L80,72 H20 Z", c, .6) + P("M50,2 V10", 4, c) +
      P("M18,84 H82", 5, c) + P("M38,84 V72 M62,84 V72", 4, c, .8),
    /* 钓鱼城 / 石宝寨 */
    fort: c =>
      F("M8,84 Q28,58 50,64 Q74,70 92,84 Z", c, .13) +
      P("M8,84 Q28,58 50,64 Q74,70 92,84", 4, c, .7) +
      P("M24,64 V44 H76 V64", 5, c) +
      P("M24,44 v-7 h9 v7 M43,44 v-7 h9 v7 M62,44 v-7 h9 v7", 4, c) +
      P("M60,44 V22 l14,5 l-14,5", 4, c),
    /* 码头 */
    wharf: c =>
      P("M30,50 V18", 5, c) + P("M30,18 l18,6 l-18,6", 4, c, .9) +
      P("M12,50 H88", 5, c) + P("M20,58 H80 M28,66 H72 M36,74 H64", 4, c, .8) +
      P("M8,86 q11,-8 22,0 t22,0 t22,0", 4, c, .7),
    /* 调色盘 */
    art: c =>
      F("M26,52 a24,21 0 1,1 48,0 a24,21 0 1,1 -48,0", c, .18) +
      P("M26,52 a24,21 0 1,1 48,0 a24,21 0 1,1 -48,0", 5, c) +
      CI(38,44,4,c,.95) + CI(52,38,4,c,.95) + CI(60,52,4,c,.95) + CI(42,60,4,c,.95) +
      CI(64,64,4,"#0b1017",.8),
    /* 飞机 */
    airport: c =>
      P("M50,16 V76", 5, c) +
      F("M50,36 L22,56 V63 L50,52 Z", c, .8) + F("M50,36 L78,56 V63 L50,52 Z", c, .8) +
      F("M50,68 L36,80 V85 L50,78 Z", c, .8) +
      P("M50,16 q6,-6 12,-4 q-4,6 -8,8", 4, c) + P("M8,92 H92", 4, c, .6),
    /* 温泉 */
    hotspring: c =>
      F("M16,66 a34,14 0 1,0 68,0 a34,14 0 1,0 -68,0", c, .2) +
      P("M16,66 a34,14 0 1,0 68,0 a34,14 0 1,0 -68,0", 4, c) +
      P("M38,52 q-7,-9 0,-18 M58,52 q-7,-9 0,-18", 4, c, .8) +
      CI(30,62,3,c,.8) + CI(66,60,3,c,.8) + CI(50,66,2.5,c,.8),
    /* 原始森林 */
    forest: c =>
      F("M26,84 L38,40 L50,84 Z", c, .8) + F("M52,84 L66,30 L80,84 Z", c, .6) +
      F("M8,84 L18,52 L28,84 Z", c, .7) +
      P("M38,84 V90 M66,84 V90 M18,84 V90", 3.5, c, .6) + P("M4,92 H96", 4, c, .5),
    /* 草场 */
    grassland: c =>
      F("M6,78 Q30,56 54,74 Q78,90 94,68 L94,92 L6,92 Z", c, .15) +
      P("M6,78 Q30,56 54,74 Q78,90 94,68", 4, c, .9) + CI(76,24,8,c,.85) +
      P("M20,88 v-8 M30,90 v-8 M40,88 v-8", 3.5, c, .6),
    /* 石碑 */
    stele: c =>
      F("M36,32 Q50,16 64,32 V82 H36 Z", c, .18) + P("M36,32 Q50,16 64,32 V82 H36 Z", 5, c) +
      P("M28,82 H72 V90 H28 Z", 4, c) + P("M42,44 H58 M42,54 H58 M42,64 H58", 3.5, c, .65),
    /* 陶坛 */
    pot: c =>
      F("M34,46 Q24,66 34,82 Q50,92 66,82 Q76,66 66,46 Z", c, .18) +
      P("M34,46 Q24,66 34,82 Q50,92 66,82 Q76,66 66,46", 5, c) +
      P("M40,36 H60 V46 H40 Z", 4, c, .9) + P("M38,36 Q50,28 62,36", 4, c, .9) +
      P("M42,60 h16 M44,70 h12", 3.5, c, .6),
    /* 编织 */
    weave: c =>
      P("M22,22 H78 V78 H22 Z", 4, c) +
      P("M22,22 L78,78 M78,22 L22,78", 3, c, .55) + P("M50,22 V78 M22,50 H78", 3, c, .55),
    /* 花灯 */
    lantern: c =>
      F("M32,50 a18,22 0 1,1 36,0 a18,22 0 1,1 -36,0", c, .2) +
      P("M32,50 a18,22 0 1,1 36,0 a18,22 0 1,1 -36,0", 5, c) +
      P("M32,32 H68 M32,68 H68", 4, c, .9) + P("M50,28 V22 M50,68 V78", 4, c) +
      P("M50,78 v10", 3, c, .8) + P("M42,40 v20 M58,40 v20", 3, c, .5)
  };

  function glyph(key, c) { const f = G[key]; return f ? f(c) : G.mountain(c); }

  /* =======================================================
     圆形徽章
     ======================================================= */
  function seal(name, opt) {
    opt = opt || {};
    const E = DATA[name];
    const c = (E && E.c) || "#ff7a45";
    const tag = (E && E.tag) || "山城印记";
    const m = (E && E.m) || ["mountain", "river", "tower"];
    const S = opt.size || 200;
    const id = "em" + (++uid);
    const fs = name.length > 4 ? 14 : 17;

    let g = `<svg viewBox="0 0 200 200" width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg" class="em-seal" role="img" aria-label="${name}印记">`;
    g += `<defs>
        <radialGradient id="${id}g" cx="50%" cy="36%" r="78%">
          <stop offset="0%" stop-color="#1c2735"/><stop offset="100%" stop-color="#0b1017"/>
        </radialGradient>
        <path id="${id}top" d="M42,100 A58,58 0 0 1 158,100" fill="none"/>
        <path id="${id}bot" d="M46,100 A54,54 0 0 0 154,100" fill="none"/>
      </defs>`;
    g += `<circle cx="100" cy="100" r="98" fill="url(#${id}g)"/>`;
    g += `<circle cx="100" cy="100" r="91" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 9" opacity=".5"/>`;
    g += `<circle cx="100" cy="100" r="84" fill="none" stroke="${c}" stroke-width="1.6" opacity=".85"/>`;
    g += `<circle cx="100" cy="100" r="79" fill="#0b1017" opacity=".92"/>`;
    g += `<g transform="translate(100,104) scale(1.22) translate(-50,-50)" opacity=".12">${glyph(m[0], c)}</g>`;
    g += `<g transform="translate(100,101) scale(.9) translate(-50,-50)">${glyph(m[1], c)}</g>`;
    g += `<text text-anchor="middle" font-family="${FONT}" font-size="${fs}" font-weight="800" letter-spacing="5" fill="#eef3f9"><textPath href="#${id}top" startOffset="50%">${name}</textPath></text>`;
    g += `<text text-anchor="middle" font-family="${FONT}" font-size="11" font-weight="600" letter-spacing="4" fill="${c}"><textPath href="#${id}bot" startOffset="50%">${tag}</textPath></text>`;
    g += `<rect x="45" y="145" width="7" height="7" transform="rotate(45 48.5 148.5)" fill="${c}" opacity=".9"/>`;
    g += `<rect x="148" y="145" width="7" height="7" transform="rotate(45 151.5 148.5)" fill="${c}" opacity=".9"/>`;
    g += `</svg>`;
    return g;
  }

  /* =======================================================
     纹样带（分隔装饰）
     ======================================================= */
  function band(name) {
    const E = DATA[name] || {};
    const c = E.c || "#ff7a45";
    const tag = E.tag || "山城印记";
    const m = E.m || ["mountain", "river", "tower"];
    const W = 1200, H = 52;

    let w = "M0,40";
    for (let x = 0; x < W; x += 60) w += " q30,-9 60,0";

    let g = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" class="em-band-svg" aria-hidden="true">`;
    g += `<path d="${w}" fill="none" stroke="${c}" stroke-width="1.2" opacity=".26"/>`;
    g += `<text x="26" y="30" font-family="${FONT}" font-size="19" font-weight="800" letter-spacing="3" fill="#e8eef6">「${name}」</text>`;
    let x = 26 + name.length * 24 + 26;
    g += `<text x="${x}" y="30" font-family="${FONT}" font-size="12" letter-spacing="3" fill="${c}">${tag}</text>`;
    x += tag.length * 16 + 56;
    const motifs = [m[1], m[2], m[0]];
    motifs.forEach((k, i) => {
      g += `<g transform="translate(${x},26) scale(.3) translate(-50,-50)" opacity="${(.95 - i * .2).toFixed(2)}">${glyph(k, c)}</g>`;
      x += 58;
      if (i < motifs.length - 1) {
        g += `<rect x="${x - 9}" y="22" width="5" height="5" transform="rotate(45 ${x - 6.5} 24.5)" fill="${c}" opacity=".7"/>`;
        x += 16;
      }
    });
    g += `</svg>`;
    return g;
  }

  /* =======================================================
     小徽标
     ======================================================= */
  function mini(name, size) {
    const E = DATA[name] || {};
    const c = (E && E.c) || "#ff7a45";
    const k = (E && E.m && E.m[1]) || "mountain";
    const S = size || 30;
    return `<svg viewBox="0 0 40 40" width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg" class="em-mini" aria-hidden="true">
      <rect x="2" y="2" width="36" height="36" rx="10" fill="${c}" opacity=".14"/>
      <rect x="2" y="2" width="36" height="36" rx="10" fill="none" stroke="${c}" stroke-width="1.4" opacity=".5"/>
      <g transform="translate(20,20) scale(.56) translate(-50,-50)">${glyph(k, c)}</g>
    </svg>`;
  }

  /* =======================================================
     城市纹样条（首页各版块标题用）
     ======================================================= */
  function cityStrip(w) {
    const keys = ["bridge", "hotpot", "mountain", "river", "cable"];
    const c = "#ff7a45";
    let x = 4;
    let g = `<svg viewBox="0 0 300 30" width="${w || 300}" height="30" xmlns="http://www.w3.org/2000/svg" class="em-strip" aria-hidden="true">`;
    keys.forEach((k, i) => {
      g += `<g transform="translate(${x},15) scale(.24) translate(-50,-50)">${glyph(k, c)}</g>`;
      x += 46;
      if (i < keys.length - 1) {
        g += `<rect x="${x - 9}" y="12.5" width="4" height="4" transform="rotate(45 ${x - 7} 14.5)" fill="${c}" opacity=".65"/>`;
        x += 14;
      }
    });
    g += `</svg>`;
    return g;
  }

  return {
    seal, band, mini, cityStrip, glyph,
    has: n => !!DATA[n],
    data: DATA
  };
})();

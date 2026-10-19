# -*- coding: utf-8 -*-
"""gen-detail.py — 为 37 个区县生成万州式二级详情子页，并接入区县页
产出：districts/pages/{slug}-s{n}.html / -f{n}.html / -c{n}.html
同步改造 districts/{slug}.html：卡片→子页链接、轮播加 CTA、导航下拉加子页入口
"""
import re, os, json, glob, html as H

ROOT = r"D:\新建文件夹 (6)\2026-10-13-20-28-46"
DST = os.path.join(ROOT, "districts")
PG = os.path.join(DST, "pages")
os.makedirs(PG, exist_ok=True)

# ---------- 1. 读取区县页，抽取数据 ----------
def parse_district(slug):
    fp = os.path.join(DST, slug + ".html")
    h = open(fp, encoding="utf-8").read()
    root = re.search(r':root\{([^}]*)\}', h).group(1)
    ac = re.search(r'--ac:(\S+?);', root).group(1)
    ac2 = re.search(r'--ac2:(\S+?);', root).group(1)
    name = re.search(r'<title>([^·<]+)', h).group(1).strip()
    note = re.search(r'class="note">([^<]*)<', h).group(1)
    m = re.search(r'class="tipbox"><b>旅行贴士</b><p>([^<]*)<', h)
    tip = m.group(1) if m else ""
    spots = re.findall(r'<button class="spot openable"[^>]*?data-cat="([^"]*)"[^>]*?data-title="([^"]*)"[^>]*?data-desc="([^"]*)"[^>]*?data-img="([^"]*)"', h)
    if not spots:
        # 已接入子页的版本：anchor 卡片（按 s 序号排序）
        sa = re.findall(r'<a href="pages/'+slug+r'-s(\d)\.html" class="spot"[^>]*?data-cat="([^"]*)"[^>]*?data-title="([^"]*)"[^>]*?data-desc="([^"]*)"[^>]*?data-img="([^"]*)"', h)
        if not sa:
            sa = re.findall(r'<a href="pages/'+slug+r'-s(\d)\.html" class="spot"[^>]*?data-title="([^"]*)"[^>]*?data-desc="([^"]*)"[^>]*?data-img="([^"]*)"', h)
            sa = [(n, "风景", tt, dd, ii) for (n, tt, dd, ii) in sa]
        sa.sort(key=lambda x: int(x[0]))
        spots = [(c, tt, dd, ii) for (_, c, tt, dd, ii) in sa]
    foods = re.findall(r'data-cat="美食"[^>]*data-title="([^"]*)"[^>]*data-desc="([^"]*)"[^>]*data-img="([^"]*)"', h)
    if not foods:
        foods = re.findall(r'<a href="pages/'+slug+r'-f\d\.html"[^>]*?data-cat="美食"[^>]*?data-title="([^"]*)"[^>]*?data-desc="([^"]*)"[^>]*?data-img="([^"]*)"', h)
    hist = re.findall(r'class="hcard[^"]*openable"[^>]*data-title="([^"]*)"[^>]*data-desc="([^"]*)"[^>]*(?:data-img="([^"]*)")?', h)
    if not hist:
        hist = re.findall(r'<a href="pages/'+slug+r'-c\d\.html" class="hcard[^"]*"[^>]*?data-title="([^"]*)"[^>]*?data-desc="([^"]*)"[^>]*(?:data-img="([^"]*)")?', h)
    return dict(slug=slug, name=name, ac=ac, ac2=ac2, note=note, tip=tip,
                spots=spots, foods=foods, hist=[x for x in hist if x[0]])

# ---------- 2. CLOUD 词库（同名词条的补充一句话） ----------
def load_cloud():
    t = open(os.path.join(ROOT, "assets", "js", "clouds-data.js"), encoding="utf-8").read()
    cloud = {}
    for m in re.finditer(r'"([^"]+)":\s*\{', t):
        name = m.group(1)
        i = m.end() - 1; depth = 0
        for j in range(i, len(t)):
            if t[j] == '{': depth += 1
            elif t[j] == '}':
                depth -= 1
                if depth == 0: break
        cloud[name] = t[i:j+1]
    out = {}
    for name, blk in cloud.items():
        wm = re.search(r'words:\s*\[(.*?)\n\s*\]', blk, re.S)
        if not wm: continue
        words = re.findall(r'\["([^"]+)",\s*\d+,\s*"\w+",\s*"([^"]+)"\]', wm.group(1))
        out[name] = dict(words)
    return out

CLOUD = load_cloud()
PLAY = {
    "自然奇观": "徒步上山 · 观景台拍照 · 避开正午暴晒",
    "古镇乡愁": "老街慢逛 · 找家茶馆坐下 · 赶早人少",
    "城市地标": "打卡拍照 · 顺路步行周边 · 夜景更佳",
    "历史文化": "请讲解或扫说明牌 · 慢慢看 · 顺访周边老建筑",
    "非遗民俗": "赶上有表演最好 · 顺便带点手信",
    "美食": "就地吃一顿 · 老店优先 · 别错过早市",
    "风景": "选个晴天 · 预留半天 · 带够水",
}

def esc(s): return H.escape(s, quote=True)

CATPAGE = {"美食": "f", "历史人文": "c"}
def build_pages(d):
    items = []  # (kind, idx, title, desc, cat, img_rel)
    for i, (cat, t, ds, img) in enumerate(d["spots"]):
        items.append(("s", i + 1, t, ds, cat, img))
    for i, (t, ds, img) in enumerate(d["foods"]):
        items.append(("f", i + 1, t, ds, "美食", img))
    for i, (t, ds, img) in enumerate(d["hist"]):
        img = img if (len(img) > 4) else ""
        items.append(("c", i + 1, t, ds, "历史人文", img))
    d["items"] = items
    d["page_of"] = {t: f"pages/{d['slug']}-{k}{n}.html" for (k, n, t, ds, cat, img) in items}

THEME = {
 "yuzhong":"urban","jiangbei":"urban","jiulongpo":"urban","yubei":"urban",
 "nanan":"river","dadukou":"river","banan":"river","beibei":"river","fuling":"river",
 "zhongxian":"river","fengdu":"river","changshou":"river",
 "shapingba":"ancient","hechuan":"ancient","dazu":"ancient","tongliang":"ancient",
 "rongchang":"ancient","bishan":"ancient","jiangjin":"ancient",
 "chengkou":"mountain","wuxi":"mountain","wushan":"mountain","fengjie":"mountain",
 "yunyang":"mountain","kaizhou":"mountain","qianjiang":"mountain","pengshui":"mountain",
 "shizhu":"mountain","yongchuan":"mountain","qijiang":"mountain",
 "wulong":"karst","nanchuan":"karst",
 "liangping":"terrace","dianjiang":"terrace","tongnan":"terrace","youyang":"terrace","xiushan":"terrace",
}
MOTIF = {}
for _k in ("mountain","river","ancient","urban","karst","terrace"):
    MOTIF[_k] = re.search(r'\.bgdeco\[data-t="'+_k+r'"\] \.motif path\{d:path\("([^"]+)"\)', open(os.path.join(ROOT,"assets","css","style.css"),encoding="utf-8").read()).group(1)
DECO_SNIPPET = ('<div class="bgdeco" data-t="{theme}" aria-hidden="true">'
                '<div class="pat"></div>'
                '<svg class="motif" viewBox="0 0 1440 160" preserveAspectRatio="none">'
                '<path d="{motif}"/></svg></div>')

# ---------- 2.5 坐标与相邻区县（用于「怎么去」板块） ----------
import math

def _load_coords():
    t = open(os.path.join(ROOT, "assets", "js", "data.js"), encoding="utf-8").read()
    out = {}
    for m in re.finditer(r'\{\s*n:"([^"]+)",\s*c:"([^"]+)",\s*lon:([\d.]+),\s*lat:([\d.]+)', t):
        out[m.group(1)] = (float(m.group(3)), float(m.group(4)), m.group(2))
    return out

def _load_slugs():
    t = open(os.path.join(ROOT, "assets", "js", "district-links.js"), encoding="utf-8").read()
    return dict(re.findall(r'"([^"]+)":\s*"([a-z]+)"', t))

COORDS = _load_coords()
SLUGS = _load_slugs()

def _hav(a, b):
    R0 = 6371.0
    dlat = math.radians(b[1] - a[1]); dlon = math.radians(b[0] - a[0])
    h = math.sin(dlat / 2) ** 2 + math.cos(math.radians(a[1])) * math.cos(math.radians(b[1])) * math.sin(dlon / 2) ** 2
    return 2 * R0 * math.asin(math.sqrt(h))

def _km(a, b):
    return _hav(a, b) * 1.32

def _hm(km):
    m = int(round(km / 52 * 60))
    return (f"{m // 60} 小时" if m >= 60 else "") + (f"{m % 60} 分" if m % 60 else "")

def more_of(d, it):
    slug, name = d["slug"], d["name"]
    cur_title = it[2]

    # 本区看点：该区县收录的景点（图片取自区内 s*.jpg）
    cards = []
    for k, i, t, ds, cat, img in d["items"]:
        if k != "s":
            continue
        src = ("../../" + img.replace("../", "")) if img else ""
        cur = " cur" if t == cur_title else ""
        ph = f'<img src="{src}" alt="{esc(t)}" loading="lazy">' if src else '<span class="ph-empty"></span>'
        cards.append(f'<a class="scard{cur}" href="{slug}-s{i}.html"><span class="ph">{ph}</span>'
                     f'<b>{esc(t)}</b><em>{esc(cat)}</em></a>')

    # 同区风物：美食 + 人文
    fcards = []
    for k, i, t, ds, cat, img in d["items"]:
        if k not in ("f", "c"):
            continue
        src = ("../../" + img.replace("../", "")) if img else ""
        ph = f'<img src="{src}" alt="{esc(t)}" loading="lazy">' if src else ""
        fcards.append(f'<a class="fcard" href="{slug}-{k}{i}.html"><span class="ph">{ph}</span>'
                      f'<b>{esc(t)}</b><em>{esc(ds) if ds else cat}</em></a>')
    fcards = fcards[:6]

    # 怎么去：到主城距离 + 最近三个区县
    go = ""
    me = COORDS.get(name)
    if me:
        cq = COORDS.get("渝中区")
        if cq:
            km = _km(me, cq)
            go += f'<div class="gorow"><b>到主城（渝中）</b><span>约 {int(round(km))} km · 车程约 {_hm(km)}</span></div>'
        go += f'<div class="gorow"><b>所属片区</b><span>{me[2]}</span></div>'
        near = []
        for n2, c2 in COORDS.items():
            if n2 == name:
                continue
            near.append((_km(me, c2), n2))
        near.sort()
        parts = []
        for km2, n2 in near[:3]:
            s2 = SLUGS.get(n2)
            parts.append(f'<a href="../{s2}.html">{n2} {int(round(km2))} km</a>' if s2 else f'{n2} {int(round(km2))} km')
        go += f'<div class="gorow"><b>最近的三个区县</b><span>{" · ".join(parts)}</span></div>'

    html = ""
    if cards:
        html += ('\n  <section class="sec" id="spots">\n'
                 '    <div class="sec-head"><span class="idx">肆</span><h2>本区看点</h2><span class="line"></span></div>\n'
                 f'    <div class="sgrid">{"".join(cards)}</div>\n  </section>')
    if fcards:
        html += ('\n  <section class="sec" id="flavor">\n'
                 '    <div class="sec-head"><span class="idx">伍</span><h2>同区风物</h2><span class="line"></span></div>\n'
                 f'    <div class="fgrid">{"".join(fcards[:6])}</div>\n  </section>')
    if go:
        html += ('\n  <section class="sec" id="go">\n'
                 '    <div class="sec-head"><span class="idx">陆</span><h2>怎么去</h2><span class="line"></span></div>\n'
                 f'    <div class="golist glass">{go}<div class="gonote">距离按直线 ×1.32 折算、均速 52 km/h 估算，实际以导航为准。</div></div>\n  </section>')
    return html

# ---------- 3. 子页模板（万州子页结构 × 区县深色主题） ----------
TPL = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} · {dname} · 山城重庆</title>
<link rel="stylesheet" href="../../assets/css/style.css">
<link rel="stylesheet" href="../../wanzhou/fonts/fonts.css">
<style>
:root{{--bg:#0a0d12;--card:rgba(255,255,255,.045);--card2:rgba(255,255,255,.07);--line:rgba(255,255,255,.09);--line2:rgba(255,255,255,.17);
--ink:#eaf0f8;--ink2:#aeb9c9;--dim:#7d8798;--ac:{ac};--ac2:{ac2};--fd:"Ma Shan Zheng","STKaiti","KaiTi",cursive;--serif:"Noto Serif SC",serif;--sans:"PingFang SC","Microsoft YaHei",system-ui,sans-serif}}
*{{margin:0;padding:0;box-sizing:border-box}}html{{scroll-behavior:smooth}}
body{{background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.85;-webkit-font-smoothing:antialiased}}
body::before{{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(900px 480px at 85% -6%,{ac}22,transparent 60%)}}
.wrap{{position:relative;z-index:1;max-width:1000px;margin:0 auto;padding:0 24px}}
.glass{{background:var(--card);backdrop-filter:blur(18px);border:1px solid var(--line);box-shadow:0 14px 40px rgba(0,0,0,.38)}}
.topbar{{position:sticky;top:0;z-index:40;backdrop-filter:blur(14px);background:color-mix(in srgb,var(--ac,#FF9F1C) 7%, rgba(10,13,18,.86));border-bottom:1px solid color-mix(in srgb,var(--ac,#FF9F1C) 30%, transparent)}}
.topbar .wrap{{display:flex;align-items:center;justify-content:space-between;height:60px}}
.brand{{font-family:var(--fd);font-size:22px;color:var(--ac);text-decoration:none;letter-spacing:.05em}}
.topbar nav a{{color:var(--ink2);text-decoration:none;font-size:14px;margin-left:16px;transition:.2s}}
.topbar nav a:hover{{color:var(--ac)}}
.hero{{position:relative;height:min(52vh,430px);min-height:300px;overflow:hidden}}
.hero img{{width:100%;height:100%;object-fit:cover;transform:scale(1.03)}}
.hero .mask{{position:absolute;inset:0;background:linear-gradient(180deg,{ac}22 0%,rgba(10,13,18,.30) 40%,var(--bg) 100%)}}
.hero .cap{{position:absolute;left:0;right:0;bottom:0;max-width:1000px;margin:0 auto;padding:0 24px 34px}}
.tag{{display:inline-block;font-size:12px;letter-spacing:.26em;color:var(--ac);border:1px solid {ac}66;padding:4px 14px;border-radius:99px;margin-bottom:12px;background:rgba(10,13,18,.4)}}
.hero h1{{font-family:var(--fd);font-size:clamp(38px,6vw,62px);font-weight:400;line-height:1.1;text-shadow:0 4px 24px rgba(0,0,0,.6)}}
.sec{{padding:0;border-top:0;margin-top:56px}}
.sec-head{{display:flex;align-items:baseline;gap:14px;margin-bottom:16px}}
.sec-head .idx{{font-family:var(--fd);font-size:24px;color:var(--ac)}}
.sec-head h2{{font-size:clamp(21px,3vw,28px);font-weight:800;background:linear-gradient(120deg,var(--ac),var(--ac2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}}
.sec-head .line{{flex:1;height:1px;background:linear-gradient(90deg,var(--line2),transparent)}}
.prose{{max-width:40em}}
.prose p{{color:var(--ink2);font-size:15.5px;line-height:2;margin-bottom:14px}}
.prose b{{color:var(--ink)}}
.stats{{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}}
.stat{{padding:20px;border-radius:16px}}
.stat b{{display:block;font-size:12px;color:var(--dim);font-weight:500;letter-spacing:.08em;margin-bottom:6px}}
.stat span{{font-size:16.5px;font-weight:700;color:var(--ink)}}
.tipbox{{background:linear-gradient(160deg,{ac}1c,transparent 72%);border:1px solid {ac}44;border-radius:16px;padding:22px 26px}}
.tipbox b{{color:var(--ac);display:block;margin-bottom:6px;letter-spacing:.1em;font-size:13px}}
.tipbox p{{color:var(--ink2);font-size:14.5px}}
.grid3{{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}}
.rcard{{display:block;text-decoration:none;background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;transition:.3s;position:relative}}
.rcard:hover{{transform:translateY(-5px);box-shadow:0 18px 38px rgba(0,0,0,.5);border-color:var(--line2)}}
.rcard .ph{{height:130px;background:linear-gradient(140deg,#1a2330,#0f141c)}}.rcard .ph img{{width:100%;height:100%;object-fit:cover}}
.rcard .tx{{padding:14px 16px}}.rcard h4{{font-size:15px;margin-bottom:4px}}.rcard p{{color:var(--ink2);font-size:12.5px;line-height:1.6}}
.pager{{margin-top:52px;display:grid;grid-template-columns:1fr 1fr;gap:16px}}
.pg{{text-decoration:none;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px 22px;transition:.3s;display:flex;flex-direction:column;gap:4px}}
.pg:hover{{border-color:var(--ac);transform:translateY(-3px)}}
.pg .dir{{font-size:11px;letter-spacing:.2em;color:var(--dim)}}.pg .nm{{font-family:var(--fd);font-size:21px;color:var(--ac)}}
.pg.next{{text-align:right;align-items:flex-end}}
.foot{{margin-top:56px;padding:40px 0 48px;border-top:1px solid var(--line);text-align:center}}
.foot .seal{{font-family:var(--fd);font-size:60px;line-height:1;color:var(--ac);opacity:.12;user-select:none}}
.foot p{{color:var(--dim);font-size:13px;margin-top:6px}}
.sgrid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}}
.scard{{display:block;text-decoration:none;color:inherit;border:1px solid var(--line);border-radius:14px;overflow:hidden;
  background:var(--card);transition:.3s;position:relative}}
.scard:hover{{transform:translateY(-4px);border-color:var(--ac);box-shadow:0 14px 30px rgba(0,0,0,.45)}}
.scard .ph{{display:block;height:104px;background:linear-gradient(140deg,#1a2330,#0f141c)}}
.scard .ph img{{width:100%;height:100%;object-fit:cover;display:block}}
.scard b{{display:block;font-size:13.5px;padding:9px 11px 2px}}
.scard em{{display:block;font-style:normal;font-size:11px;color:var(--dim);padding:0 11px 11px}}
.scard.cur{{border-color:var(--ac);box-shadow:0 0 0 1px var(--ac) inset}}
.scard.cur b::after{{content:" · 当前";color:var(--ac);font-weight:400;font-size:11px}}
.fgrid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}}
.fcard{{display:grid;grid-template-columns:56px minmax(0,1fr);grid-auto-rows:min-content;gap:2px 11px;align-items:center;
  text-decoration:none;color:inherit;border:1px solid var(--line);border-radius:13px;
  background:var(--card);padding:10px;transition:.28s}}
.fcard:hover{{border-color:var(--line2);transform:translateY(-3px)}}
.fcard .ph{{grid-row:1 / span 2;width:56px;height:56px;border-radius:9px;overflow:hidden;background:#151c26}}
.fcard .ph img{{width:100%;height:100%;object-fit:cover}}
.fcard b{{display:block;font-size:13.5px;line-height:1.4}}
.fcard em{{display:block;font-style:normal;font-size:11.5px;color:var(--dim);line-height:1.5;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}}
.golist{{border-radius:16px;padding:18px 20px}}
.gorow{{display:flex;gap:16px;justify-content:space-between;padding:9px 0;border-bottom:1px dashed rgba(255,255,255,.07);font-size:13.5px}}
.gorow:last-of-type{{border:0}}
.gorow b{{color:var(--dim);font-weight:500;flex:none}}
.gorow span{{color:var(--ink2);text-align:right}}
.gorow a{{color:var(--ac);text-decoration:none}}
.gorow a:hover{{text-decoration:underline}}
.gonote{{margin-top:10px;padding-top:10px;border-top:1px solid var(--line);font-size:11px;color:var(--dim)}}
.side-toc{{position:fixed;right:22px;top:50%;transform:translateY(-50%);z-index:20;width:196px;display:none;padding:14px 12px 12px;border-radius:14px;background:rgba(8,11,16,.62);border:1px solid var(--line);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 16px 40px rgba(0,0,0,.35)}}
@media(min-width:1380px){{.side-toc{{display:block}}}}
.side-toc .st-h{{font-size:10px;letter-spacing:.2em;color:var(--dim);padding:0 10px 8px}}
.side-toc a{{display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:9px;
  color:var(--ink2);text-decoration:none;font-size:12.5px;line-height:1.4;
  border:1px solid transparent;transition:background .2s,color .2s,border-color .2s}}
.side-toc a::before{{content:"";width:5px;height:5px;border-radius:50%;background:var(--line2);flex:none;transition:background .2s,box-shadow .2s}}
.side-toc a:hover{{background:var(--card);color:var(--ink)}}
.side-toc a.on{{background:var(--card);border-color:var(--line);color:var(--ac)}}
.side-toc a.on::before{{background:var(--ac);box-shadow:0 0 8px {ac}99}}
.side-toc .st-back{{margin-top:14px;padding-top:12px;border-top:1px solid var(--line);font-size:11.5px;color:var(--dim)}}
.side-toc .st-back::before{{display:none}}
.side-toc .st-back:hover{{color:var(--ac)}}
.backtop{{position:fixed;right:20px;bottom:20px;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;background:linear-gradient(135deg,var(--ac),var(--ac2));box-shadow:0 10px 28px {ac}55;text-decoration:none;font-size:18px;opacity:0;pointer-events:none;transition:.3s;z-index:50}}
.backtop.show{{opacity:1;pointer-events:auto}}
@media(max-width:720px){{.stats{{grid-template-columns:1fr}}.pager{{grid-template-columns:1fr}}.pg.next{{text-align:left;align-items:flex-start}}}}
</style>
</head>
<body>
{deco}
<header class="topbar"><div class="wrap">
  <a class="brand" href="../{slug}.html">‹ {dname}</a>
  <nav><a href="../{slug}.html">区县主页</a><a href="../../index.html">重庆总览</a></nav>
</div></header>

<section class="hero">
  <img src="{hero}" alt="{title}">
  <div class="mask"></div>
  <div class="cap"><span class="tag">{cat} · {dname}</span><h1>{title}</h1></div>
</section>

<div class="wrap">
  <section class="sec" id="ov">
    <div class="sec-head"><span class="idx">壹</span><h2>概览</h2><span class="line"></span></div>
    <div class="prose">{prose}</div>
  </section>

  <section class="sec" id="info">
    <div class="sec-head"><span class="idx">贰</span><h2>实用信息</h2><span class="line"></span></div>
    <div class="stats">
      <div class="stat glass"><b>所属区县</b><span>{dname}</span></div>
      <div class="stat glass"><b>类别</b><span>{cat}</span></div>
      <div class="stat glass"><b>建议玩法</b><span style="font-size:14.5px">{play}</span></div>
    </div>
    {tiphtml}
  </section>

  {nearsec}

  {moresec}

  <nav class="pager">{prev}{next}</nav>

  <footer class="foot">
    <div class="seal">{dname}</div>
    <p>{dname} · 山城重庆 —— 一城山水，一区一性格</p>
  </footer>
</div>
<script defer src="../../assets/js/districtfx.js?v=20261019a"></script>
<script defer src="../../assets/js/pagefx.js?v=20261019k"></script>
<aside class="side-toc" aria-label="本页导航">
  <div class="st-h">本页</div>
  <a href="#ov" data-i="0">概览</a>
  <a href="#info" data-i="1">实用信息</a>
  <a href="#near" data-i="2">同区更多</a>
  <a href="#spots" data-i="3">本区看点</a>
  <a href="#flavor" data-i="4">同区风物</a>
  <a href="#go" data-i="5">怎么去</a>
  <a class="st-back" href="../{slug}.html">← 返回 {dname}</a>
</aside>
<script>
(function(){{
  var toc=document.querySelector('.side-toc'); if(!toc) return;
  var secs=[].slice.call(document.querySelectorAll('.sec'));
  toc.querySelectorAll('a[data-i]').forEach(function(a){{
    a.addEventListener('click',function(e){{
      e.preventDefault();
      var s=secs[+a.dataset.i]; if(s) s.scrollIntoView({{behavior:'smooth',block:'start'}});
    }});
  }});
  function spy(){{
    var line=innerHeight*0.35, best=0;
    for(var i=0;i<secs.length;i++){{ if(secs[i].getBoundingClientRect().top<line) best=i; }}
    toc.querySelectorAll('a[data-i]').forEach(function(a){{
      a.classList.toggle('on', +a.dataset.i===best);
    }});
  }}
  addEventListener('scroll',spy,{{passive:true}});
  addEventListener('resize',spy);
  spy();
}})();
</script>
<a href="#" class="backtop" aria-label="回到顶部" onclick="window.scrollTo({{top:0,behavior:'smooth'}});return false;">↑</a>
<script>
var bt=document.querySelector('.backtop');
window.addEventListener('scroll',function(){{bt.classList.toggle('show',window.scrollY>400);}},{{passive:true}});
</script>
</body>
</html>"""

def prose_of(d, it):
    k, n, t, ds, cat, img = it
    p1 = f"<p><b>{esc(t)}</b>——{esc(ds)}</p>"
    line = (CLOUD.get(d["name"], {}).get(t) or "")
    p2 = ""
    if line and line != ds:
        p2 = f"<p>{esc(line)}。</p>"
    p3 = f"<p>{esc(d['note'])}</p>"
    return p1 + p2 + p3

def near_of(d, it):
    others = [x for x in d["items"] if x[2] != it[2]][:3]
    if not others: return ""
    cards = ""
    for (k, n, t, ds, cat, img) in others:
        imgrel = ("../../" + img.replace("../", "")) if img else ""
        ph = f'<div class="ph"><img src="{imgrel}" alt="{esc(t)}" loading="lazy"></div>' if imgrel else '<div class="ph"></div>'
        cards += f'<a class="rcard" href="{d["page_of"][t]}">{ph}<div class="tx"><h4>{esc(t)}</h4><p>{esc(ds)}</p></div></a>'
    return f'<section class="sec" id="near"><div class="sec-head"><span class="idx">叁</span><h2>同区更多</h2><span class="line"></span></div><div class="grid3">{cards}</div></section>'

# ---------- 4. 生成全部子页 + 建 slug 页面清单 ----------
all_slugs = sorted(f[:-5] for f in os.listdir(DST) if f.endswith(".html"))
for slug in all_slugs:
    d = parse_district(slug)
    build_pages(d)
    seq = d["items"]
    for idx, it in enumerate(seq):
        k, n, t, ds, cat, img = it
        prev_it = seq[idx - 1] if idx > 0 else seq[-1]
        next_it = seq[idx + 1] if idx < len(seq) - 1 else seq[0]
        prev = f'<a class="pg prev" href="{d["page_of"][prev_it[2]]}"><span class="dir">上一处</span><span class="nm">{esc(prev_it[2])}</span></a>'
        nxt = f'<a class="pg next" href="{d["page_of"][next_it[2]]}"><span class="dir">下一处</span><span class="nm">{esc(next_it[2])}</span></a>'
        hero = ("../../" + img.replace("../", "")) if img else "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"
        tiphtml = f'<div class="tipbox" style="margin-top:22px"><b>{esc(d["name"])}旅行贴士</b><p>{esc(d["tip"])}</p></div>' if d["tip"] else ""
        page = TPL.format(title=esc(t), dname=esc(d["name"]), ac=d["ac"], ac2=d["ac2"],
                          deco=DECO_SNIPPET.format(theme=THEME.get(slug,"mountain"), motif=MOTIF[THEME.get(slug,"mountain")]),
                          slug=slug, hero=hero, cat=esc(cat), prose=prose_of(d, it),
                          play=esc(PLAY.get(cat, PLAY["风景"])), tiphtml=tiphtml,
                          nearsec=near_of(d, it), moresec=more_of(d, it), prev=prev, next=nxt)
        fp = os.path.join(PG, f"{slug}-{k}{n}.html")
        open(fp, "w", encoding="utf-8").write(page)
    print(slug, len(seq), "pages")

# ---------- 5. 改造区县页：卡片接子页 / 轮播 CTA / 导航下拉 ----------
def patch_district(slug):
    d = parse_district(slug)
    build_pages(d)
    fp = os.path.join(DST, slug + ".html")
    h = open(fp, encoding="utf-8").read()

    # 5.1 景点卡 → 子页链接
    def spot_rep(m, i=[0]):
        i[0] += 1
        tag = m.group(0)
        href = d["page_of"].get(m.group(3))
        if not href: return tag
        a = tag.replace('<button class="spot openable" type="button"', f'<a class="spot" href="{href}"')
        a = re.sub(r'</button>\s*(<span class="open-tip">点开查看 ›</span></button>)?', '</a>', a)
        a = a.replace('<span class="open-tip">点开查看 ›</span>', '<span class="open-tip">进入专页 ›</span>')
        a = a.replace('<span class="more">点开查看 ›</span>', '<span class="more">进入专页 ›</span>')
        return a
    h = re.sub(r'<button class="spot openable" type="button"[^>]*?data-title="([^"]*)"[^>]*?data-desc="([^"]*)"[^>]*?data-img="([^"]*)"[^>]*?>.*?</button>',
               lambda m: spot_link(m, d, "spot"), h, flags=re.S)

    # 5.2 美食/人文卡 → 子页链接
    if 'class="c-cta slide-cta"' not in h:
        h = re.sub(r'<button class="card card-hover glass openable" type="button"[^>]*?>.*?</button>',
               lambda m: spot_link(m, d, "card"), h, flags=re.S)
    h = re.sub(r'<button class="hcard card-hover glass openable" type="button"[^>]*?>.*?</button>',
               lambda m: spot_link(m, d, "card"), h, flags=re.S)

    # 5.3 轮播每屏 CTA 已在区县页固化为 slide-cta，无需再注入
    # 5.4 导航下拉「热门景点」加入前三个景点子页
    if d["items"]:
        top = [x for x in d["items"] if x[0] == "s"][:3]
        links = "".join(f'<a href="{d["page_of"][t]}">{esc(t)}</a>' for (k, n, t, ds, cat, img) in top)
        h = re.sub(r'(<div class="nav-menu">)(\s*<a href="#scenic" data-filter="全部">全部景点</a>)',
                   r'\1' + links + r'\2', h, count=1)
    if "bgdeco" not in h:
        th = THEME.get(slug, "mountain")
        h = h.replace("<body>", "<body>\n" + DECO_SNIPPET.format(theme=th, motif=MOTIF[th]), 1)
    open(fp, "w", encoding="utf-8").write(h)

def cta_wrap(p, img, d):
    target = None
    for (k, n, t, ds, cat, im) in d["items"]:
        if im and img.endswith(os.path.basename(im)) and k == "s":
            target = (t, d["page_of"][t]); break
    if not target and d["items"]:
        t0 = d["items"][0]; target = (t0[2], d["page_of"][t0[2]])
    btn = f'<a class="c-cta" href="{target[1]}">探索 {esc(target[0])} ›</a>'
    return p.replace('<div class="wrap">', '<div class="wrap">' + btn, 1)

def spot_link(m, d, kind):
    tag = m.group(0)
    mt = re.search(r'data-title="([^"]*)"', tag)
    if not mt: return tag
    t = mt.group(1)
    href = d["page_of"].get(t)
    if not href: return tag
    a = tag.replace('<button ', f'<a href="{href}" ', 1)
    a = re.sub(r'\s*type="button"', '', a, count=1)
    a = a.replace('openable ', '').replace(' openable', '')
    a = a.replace('</button>', '</a>')
    a = a.replace('<span class="open-tip">点开查看 ›</span>', '<span class="open-tip">进入专页 ›</span>')
    a = a.replace('<span class="more">点开查看 ›</span>', '<span class="more">进入专页 ›</span>')
    return a

for slug in all_slugs:
    patch_district(slug)
    print("patched", slug)

# 6. 子页内链修正：pages/ 目录内链接去掉 pages/ 前缀
for fp in glob.glob(os.path.join(PG, "*.html")):
    t2 = open(fp, encoding="utf-8").read()
    t3 = re.sub(r'href="pages/([\w-]+\.html)"', r'href="\1"', t2)
    if t3 != t2:
        open(fp, "w", encoding="utf-8").write(t3)
print("ALL DONE")

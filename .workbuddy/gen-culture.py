# -*- coding: utf-8 -*-
"""gen-culture.py — 生成 12 个人文色彩专页 culture/c{1..12}.html
每页：独立主题色 + 专属纹样剪影 + 由来/活动习俗/描述 + 相关推荐 + 上一下一
"""
import os, re, html as H

ROOT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(ROOT)  # 项目根

# 顺序与 data.js CULTURE 一致
ITEMS = [
 dict(t="巴渝根脉", ac="#ff4d2e", ac2="#ffb08a", img="c1.jpg", pat="diamond", motif="wall",
  hero="巴国古城墙浮雕",
  laiy=["巴人是重庆最早的居民。先秦时期，巴人以江州（今渝中半岛一带）为都，"
        "靠井盐贸易立邦，『以盐立邦』是这片土地的第一桶金。",
        "巴蔓子将军为保城池自刎留头的传说，把『忠义』两个字刻进了重庆的城市性格。",
        "后来巴渝舞进入汉宫成为武舞，'其气势猛烈'的底色，至今还在这座城市的脾气里。"],
  customs=["逛钓鱼城、涞滩古镇，触摸巴宋战争的遗址现场",
           "看一场巴渝舞或川剧开场鼓，感受'武舞同源'的节奏",
           "到中国三峡博物馆看巴人青铜器与船棺"],
  desc="巴渝根脉不是博物馆里的概念——它是火锅桌上的豪爽、爬坡上坎的耐力、"
       "和说走就走的江湖气共同的来处。"),
 dict(t="川江号子", ac="#3f8fe0", ac2="#9cc8ff", img="c2.jpg", pat="wave", motif="wave",
  hero="长江纤夫老照片",
  laiy=["川江航道滩多水急，木船上行全靠纤夫拉纤。号子是劳动的口令，也是航行的'交通调度'。",
        "一人领、众人和，领号人（号工）见景生情现编词，声浪要压过江水——这是长江上活了千年的合唱。",
        "机动船取代木船后，号子退出江面；2006 年，川江号子列入首批国家级非物质文化遗产。"],
  customs=["听一场川江号子展演（三峡博物馆、磁器口常有）",
           "走朝天门—弹子石滨江段，看航道与码头遗址",
           "读口述史《老重庆影像志》，对照纤夫老照片"],
  desc="号子唱的是逆流而上的狠劲——一篙不可放缓，一步不可后退，"
       "这是重庆人面对陡坡陡坎时共同的姿态。"),
 dict(t="火锅江湖", ac="#ff7a45", ac2="#ffd28a", img="c3.jpg", pat="flame", motif="flame",
  hero="九宫格牛油火锅",
  laiy=["火锅的前身是码头苦力的'水八块'：牛下水便宜，一锅麻辣卤汁滚着吃，围锅而坐不分贵贱。",
        "九宫格最初不是讲究，是功能——不同格火力不同，毛肚鸭肠烫中间，脑花血旺煨边角。",
        "如今'围着一口锅'的热闹没变：火锅是重庆人的客厅、会议室和和解现场。"],
  customs=["按行家吃法来：毛肚'七上八下'十五秒，鸭肠烫卷即起",
           "配香油蒜泥碟降温和解辣，老荫茶是本地标配",
           "从老巷苍蝇馆子到防空洞火锅，各体验一次"],
  desc="麻辣是配角，'一桌人围着一口锅'才是主角——这是重庆式社交的全部秘密。"),
 dict(t="吊脚楼营造", ac="#f2c14e", ac2="#ffe6a8", img="c4.jpg", pat="lattice", motif="roof",
  hero="依山而建的吊脚楼群",
  laiy=["重庆山多平地少，先民借鉴干栏式建筑，发明了'不挖山、不填方'的吊脚楼："
        "用木柱把房子撑在陡坡上，一柱落地、三面悬空。",
        "穿斗式木构架不用一颗铁钉，靠榫卯咬合，抗震又透气，是山城最聪明的建筑解法。",
        "洪崖洞、龚滩、濯水保存至今的吊脚楼群，都是这套营造体系的活标本。"],
  customs=["夜游洪崖洞看'千与千寻'式的崖壁灯火",
           "去龚滩、中山古镇看原生态吊脚楼群",
           "在湖广会馆看穿斗式构架的实物展示"],
  desc="吊脚楼是重庆人和山的谈判结果——不征服，也不退让，借用坡度把日子架起来。"),
 dict(t="铜梁龙舞", ac="#ff4d2e", ac2="#ff9a6a", img="c5.jpg", pat="flame", motif="flame",
  hero="火龙在铁水花中穿行",
  laiy=["铜梁龙舞起于明代，兴于清代，龙具'大蠕龙'长几十米，被誉为'中华第一龙'。",
        "最震撼的是火龙：舞龙人赤膊上阵，1600℃ 的铁水被拍向夜空，火花如瀑，龙在其中穿行。",
        "2006 年铜梁龙舞列入首批国家级非遗，国庆大典上天安门广场的巨龙就来自铜梁。"],
  customs=["元宵节到铜梁看火龙表演（铁水花是高潮）",
           "参观铜梁龙舞艺术团驻地，看龙具扎制工艺",
           "春节逛龙灯会，看大蠕龙巡游"],
  desc="铁水花溅在皮肤上是勋章——铜梁人把'勇'字舞成了全世界看得懂的语言。"),
 dict(t="土家摆手舞", ac="#3ecfa0", ac2="#a8e6cf", img="c6.jpg", pat="weave", motif="weave",
  hero="土王祠前摆手舞",
  laiy=["摆手舞是土家族祭祀性舞蹈，'舍巴日'（摆手节）上，人们围着摆手堂的旗杆跳通宵。",
        "动作全部来自农耕：犁田、播种、插秧、收割，一步一弯腰，是'写在身体里的生产史'。",
        "酉阳、秀山是核心传承区，2008 年摆手舞（酉阳）列入国家级非遗扩展名录。"],
  customs=["正月到酉阳龚滩、后溪参加摆手节",
           "学几个基本动作：单摆、双摆、回旋摆",
           "顺访土家吊脚楼和西兰卡普织锦工坊"],
  desc="'任何舞都从劳动里来'——摆手舞一摆，土家人的迁徙史和农耕史就都活了。"),
 dict(t="綦江农民版画", ac="#f2c14e", ac2="#ffd28a", img="c7.jpg", pat="print", motif="print",
  hero="綦江农民版画作品",
  laiy=["1980 年代，綦江的农民拿起刻刀，把秧歌、婚嫁、赶场刻进木板再拓成画。",
        "不学透视不讲比例，色彩浓烈造型夸张，反而打动了世界——先后在三十多个国家展出。",
        "綦江因此被命名为'中国现代民间绘画画乡'，版画成了这座区的城市名片。"],
  customs=["綦江农民版画院常设展，可看原作与现场刻印",
           "参加版画体验课，亲手拓一张",
           "带一幅小品回家，每一张都有作者签名"],
  desc="农民刻自己的生活，比任何学院派都更有生命力——这是艺术最朴素的来源。"),
 dict(t="秀山花灯", ac="#ff7a45", ac2="#ffcf9e", img="", pat="flame", motif="lamp",
  hero="花灯戏舞台",
  laiy=["秀山花灯是'跳团团'式的灯戏，一旦一丑，两人围着方桌跳，唱山歌调子。",
        "《黄杨扁担》这首传遍全国的民歌，就出自秀山花灯音乐。",
        "过年时灯班挨家挨户'跳团团'，跳到哪家哪家管饭——花灯是流动的年味。"],
  customs=["春节期间到秀山看花灯戏与灯班串户",
           "听原生态《黄杨扁担》与花灯小调",
           "顺访洪安边城，一脚跨渝湘黔"],
  desc="方桌就是舞台，生活就是唱词——秀山花灯把年味跳成了可以传唱的东西。"),
 dict(t="陪都记忆", ac="#6fc0ff", ac2="#b8dcff", img="c9.jpg", pat="arch", motif="arch",
  hero="抗战时期的历史建筑",
  laiy=["1937—1946 年，重庆是战时中国的首都。政府机构、工厂、学校西迁至此，'陪都'由此得名。",
        "大轰炸没把这座城市炸垮——防空洞里照样开课、开工、开戏，'愈炸愈强'刷在墙上。",
        "红岩村、曾家岩、黄山官邸、老厂房……全城散落着抗战遗址上千处。"],
  customs=["按陪都遗址线走一条 citywalk：周公馆—桂园—特园",
           "到三峡博物馆看《大轰炸》复原展区",
           "在防空洞改造的火锅店、书店里坐一坐"],
  desc="陪都记忆是重庆最重的一层底色——坚韧不是口号，是被大轰炸炸出来的日常。"),
 dict(t="三峡移民", ac="#3f8fe0", ac2="#a8d4ff", img="c10.jpg", pat="wave", motif="wave",
  hero="三峡大坝泄洪",
  laiy=["三峡工程蓄水前，113 万移民告别故土，其中重庆占了 85 万以上——"
        "一座座县城、一个个场镇整体沉入江中。",
        "'舍小家、为大家'不是标语，是刻进这一代人骨头的真实经历。",
        "云阳、巫山、奉节的老城原址如今都在水位线以下，新城在山腰上一层层长起来。"],
  customs=["在移民纪念馆（万州）看一座城的水下记忆",
           "乘船过瞿塘峡，对照老照片找淹没线的位置",
           "到巫山、云阳新城的高处看'江上新城'"],
  desc="一百多万人的搬家史，是人类迁徙史上罕见的一页——重庆替国家背起了这一段。"),
 dict(t="川剧与变脸", ac="#ff4d2e", ac2="#ff9aa5", img="c11.jpg", pat="diamond", motif="opera",
  hero="川剧变脸演员",
  laiy=["川剧熔'昆高胡弹灯'五种声腔于一炉，重庆的川剧重'帮打唱'——高腔一起，帮腔众和。",
        "变脸是川剧的看家绝技：脸谱一抹、一吹、一扯，瞬间换一张，机关至今保密。",
        "重庆市川剧院（金汤街）与磁器口的川剧座唱，是听高腔的好去处。"],
  customs=["看一场有变脸折子戏的全本川剧",
           "到磁器口听川剧座唱（茶馆式，原生态）",
           "散场后跟老票友摆一句'帮打唱'的门道"],
  desc="高腔能从巷子这头传到那头——川剧的热闹，是重庆话的唱法。"),
 dict(t="黄葛树与梯坎", ac="#3ecfa0", ac2="#b9e8d2", img="c12.jpg", pat="wave", motif="tree",
  hero="黄葛树下的青石梯坎",
  laiy=["黄葛树是重庆市树，石缝里也能长，根抱着崖壁往下扎——和这座城一个脾气。",
        "梯坎是老重庆的路：十八梯、建兴坡，一级一级全是生活，挑夫、棒棒、学生娃都从上面过。",
        "'黄葛树下好乘凉'，树下龙门阵一摆就是一下午，这是重庆人的露天客厅。"],
  customs=["清晨走一遍十八梯传统风貌区",
           "在中山四路的黄葛树隧道拍照",
           "坐下来听老重庆人摆一段梯坎上的龙门阵"],
  desc="一棵树、一坡梯坎，就是重庆人的性格说明书：见缝就活，越陡越稳。"),
]

PAT = {
 "diamond": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1'%3E%3Cpath d='M36 0 72 36 36 72 0 36Z'/%3E%3Cpath d='M36 14 58 36 36 58 14 36Z'/%3E%3Ccircle cx='36' cy='36' r='3'/%3E%3C/g%3E%3C/svg%3E",
 "wave": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='40'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1.2'%3E%3Cpath d='M0 20q11-9 22 0t22 0 22 0 22 0'/%3E%3Cpath d='M-11 32q11-9 22 0t22 0 22 0 22 0' stroke-opacity='.5'/%3E%3C/g%3E%3C/svg%3E",
 "flame": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='80'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1'%3E%3Cpath d='M32 6C20 22 12 32 12 46a20 20 0 0 0 40 0C52 32 44 22 32 6Z'/%3E%3Cpath d='M32 24c-7 10-11 15-11 24a11 11 0 0 0 22 0c0-9-4-14-11-24Z' stroke-opacity='.55'/%3E%3C/g%3E%3C/svg%3E",
 "lattice": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1'%3E%3Cpath d='M0 32h64M32 0v64'/%3E%3Cpath d='M0 0l32 32L0 64M64 0 32 32l32 32'/%3E%3C/g%3E%3C/svg%3E",
 "weave": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1'%3E%3Crect x='8' y='8' width='64' height='64'/%3E%3Cpath d='M8 8 72 72M72 8 8 72M24 8v64M40 8v64M56 8v64M8 24h64M8 40h64M8 56h64' stroke-opacity='.45'/%3E%3C/g%3E%3C/svg%3E",
 "print": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='88' height='88'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1.2'%3E%3Crect x='6' y='6' width='44' height='58' transform='rotate(-6 28 35)'/%3E%3Crect x='38' y='22' width='44' height='58' transform='rotate(5 60 51)'/%3E%3Ccircle cx='28' cy='30' r='6'/%3E%3Cpath d='M50 60c8-12 14-16 22-16' stroke-opacity='.6'/%3E%3C/g%3E%3C/svg%3E",
 "arch": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='64'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1.2'%3E%3Cpath d='M4 56V28a14 14 0 0 1 28 0v28'/%3E%3Cpath d='M36 56V24a14 14 0 0 1 28 0v32'/%3E%3Cpath d='M68 56V28a14 14 0 0 1 24-4' stroke-opacity='.6'/%3E%3C/g%3E%3C/svg%3E",
}
MOTIF = {
 "wall": "M0 160V110 90 190 74 300 46 420 74 540 40 660 74 780 50 900 74 1020 42 1140 74 1260 50 1380 66 1440 74 1440 160Z",
 "wave": "M0 160V112 140 100 300 116 470 92 640 112 820 88 990 110 1160 92 1330 108 1440 98 1440 160Z",
 "flame": "M0 160V120 60 90 130 30 260 110 340 55 470 120 590 45 720 105 850 60 970 115 1100 50 1230 108 1350 70 1440 95 1440 160Z",
 "roof": "M0 160V118 70 118 100 90 100 90 118 150 118 150 92 178 74 206 92 206 118 270 118 270 100 296 82 322 100 322 118 390 118 390 96 414 78 438 96 438 118 510 118 510 100 536 82 562 100 562 118 640 118 640 94 664 76 688 94 688 118 760 118 760 100 786 82 812 100 812 118 880 118 880 92 908 74 936 92 936 118 1010 118 1010 100 1036 82 1062 100 1062 118 1140 118 1140 94 1164 76 1188 94 1188 118 1260 118 1260 100 1286 82 1312 100 1312 118 1390 118 1390 92 1414 74 1440 92 1440 160Z",
 "weave": "M0 160V120 84 220 108 360 120 500 96 640 112 780 100 920 116 1060 94 1200 112 1340 100 1440 110 1440 160Z",
 "print": "M0 160V110 70 260 110 400 78 560 112 720 70 880 108 1040 76 1200 110 1360 84 1440 100 1440 160Z",
 "lamp": "M0 160V116 80 190 116 360 92 540 114 720 84 900 112 1080 90 1260 114 1440 96 1440 160Z",
 "arch": "M0 160V110 80 190 110 360 86 540 108 720 92 900 110 1080 88 1260 108 1440 94 1440 160Z",
 "opera": "M0 160V120 66 240 104 400 58 560 112 720 64 880 108 1040 60 1200 110 1360 72 1440 96 1440 160Z",
 "tree": "M0 160V110 88 190 112 360 90 540 114 720 86 900 110 1080 92 1260 114 1440 94 1440 160Z",
}

TPL = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} · 山城人文 · 重庆</title>
<link rel="stylesheet" href="../assets/css/style.css">
<link rel="stylesheet" href="../wanzhou/fonts/fonts.css">
<style>
:root{{--bg:#0a0d12;--card:rgba(255,255,255,.045);--card2:rgba(255,255,255,.07);--line:rgba(255,255,255,.09);--line2:rgba(255,255,255,.17);
--ink:#eaf0f8;--ink2:#aeb9c9;--dim:#7d8798;--ac:{ac};--ac2:{ac2};--fd:"Ma Shan Zheng","STKaiti","KaiTi",cursive;--sans:"PingFang SC","Microsoft YaHei",system-ui,sans-serif}}
*{{margin:0;padding:0;box-sizing:border-box}}html{{scroll-behavior:smooth}}
body{{background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.85;-webkit-font-smoothing:antialiased}}
.wrap{{position:relative;z-index:1;max-width:1000px;margin:0 auto;padding:0 24px}}
.glass{{background:var(--card);backdrop-filter:blur(18px);border:1px solid var(--line);box-shadow:0 14px 40px rgba(0,0,0,.38)}}
.topbar{{position:sticky;top:0;z-index:40;backdrop-filter:blur(14px);background:color-mix(in srgb,var(--ac) 7%, rgba(10,13,18,.86));border-bottom:1px solid color-mix(in srgb,var(--ac) 30%, transparent);position:sticky}}
.topbar .wrap{{display:flex;align-items:center;justify-content:space-between;height:60px;position:relative}}
.brand{{font-family:var(--fd);font-size:22px;color:var(--ac);text-decoration:none;letter-spacing:.05em}}
.topbar nav a{{color:var(--ink2);text-decoration:none;font-size:14px;margin-left:16px;transition:.2s}}
.topbar nav a:hover{{color:var(--ac)}}
.hero{{position:relative;height:min(52vh,430px);min-height:300px;overflow:hidden}}
.hero img{{width:100%;height:100%;object-fit:cover;transform:scale(1.03)}}
.hero .mask{{position:absolute;inset:0;background:linear-gradient(180deg,{ac}22 0%,rgba(10,13,18,.30) 40%,var(--bg) 100%)}}
.hero .cap{{position:absolute;left:0;right:0;bottom:0;padding:0 24px 34px}}
.tag{{display:inline-block;font-size:12px;letter-spacing:.26em;color:var(--ac);border:1px solid {ac}66;padding:4px 14px;border-radius:99px;margin-bottom:12px;background:rgba(10,13,18,.4)}}
.hero h1{{font-family:var(--fd);font-size:clamp(38px,6vw,62px);font-weight:400;line-height:1.1;text-shadow:0 4px 24px rgba(0,0,0,.6)}}
.sec{{margin-top:42px}}
.sec-head{{display:flex;align-items:baseline;gap:14px;margin-bottom:16px}}
.sec-head .idx{{font-family:var(--fd);font-size:24px;color:var(--ac)}}
.sec-head h2{{font-size:clamp(21px,3vw,28px);font-weight:800;background:linear-gradient(120deg,var(--ac),var(--ac2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}}
.sec-head .line{{flex:1;height:1px;background:linear-gradient(90deg,var(--line2),transparent)}}
.prose p{{color:var(--ink2);font-size:15.5px;line-height:2;margin-bottom:14px}}
.prose b{{color:var(--ink)}}
.cust{{display:grid;gap:12px}}
.cust li{{list-style:none;display:flex;gap:12px;align-items:flex-start;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:15px 18px;color:var(--ink2);font-size:14.5px;transition:.3s}}
.cust li:hover{{border-color:color-mix(in srgb,var(--ac) 45%, transparent);transform:translateX(4px)}}
.cust .dot{{flex:0 0 8px;width:8px;height:8px;border-radius:50%;background:var(--ac);margin-top:9px;box-shadow:0 0 10px var(--ac)}}
.quotebox{{background:linear-gradient(160deg,{ac}22,transparent 75%);border:1px solid {ac}44;border-radius:16px;padding:22px 26px;color:var(--ink2);font-size:14.5px}}
.quotebox b{{color:var(--ac);display:block;margin-bottom:6px;letter-spacing:.1em;font-size:13px}}
.grid3{{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}}
.rcard{{display:block;text-decoration:none;background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;transition:.3s}}
.rcard:hover{{transform:translateY(-5px);box-shadow:0 18px 38px rgba(0,0,0,.5);border-color:var(--line2)}}
.rcard .ph{{height:130px;background:linear-gradient(140deg,#1a2330,#0f141c)}}.rcard .ph img{{width:100%;height:100%;object-fit:cover}}
.rcard .tx{{padding:14px 16px}}.rcard h4{{font-size:15px;margin-bottom:4px}}.rcard p{{color:var(--ink2);font-size:12.5px;line-height:1.6}}
.pager{{margin-top:52px;display:grid;grid-template-columns:1fr 1fr;gap:16px}}
.pg{{text-decoration:none;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px 22px;transition:.3s;display:flex;flex-direction:column;gap:4px}}
.pg:hover{{border-color:var(--ac);transform:translateY(-3px)}}
.pg .dir{{font-size:11px;letter-spacing:.2em;color:var(--dim)}}.pg .nm{{font-family:var(--fd);font-size:21px;color:var(--ac)}}
.pg.next{{text-align:right;align-items:flex-end}}
.foot{{margin-top:56px;padding:40px 0 48px;border-top:1px solid var(--line);text-align:center}}
.foot .seal{{font-family:var(--fd);font-size:60px;line-height:1;color:var(--ac);opacity:.14;user-select:none}}
.foot p{{color:var(--dim);font-size:13px;margin-top:6px}}
@media(max-width:720px){{.pager{{grid-template-columns:1fr}}.pg.next{{text-align:left;align-items:flex-start}}}}
</style>
</head>
<body>
<div class="bgdeco" aria-hidden="true"><div class="pat" style="background-image:url('{pat}')"></div>
<svg class="motif" viewBox="0 0 1440 160" preserveAspectRatio="none"><path d="{motif}"/></svg></div>

<header class="topbar"><div class="wrap">
  <a class="brand" href="../index.html#culture">‹ 人文色彩</a>
  <nav><a href="../index.html#culture">人文总览</a><a href="../index.html">重庆总览</a></nav>
</div></header>

<section class="hero">
  {heroimg}
  <div class="mask"></div>
  <div class="cap"><span class="tag">{lv} · 人文色彩</span><h1>{title}</h1></div>
</section>

<div class="wrap">
  <section class="sec">
    <div class="sec-head"><span class="idx">壹</span><h2>它的由来</h2><span class="line"></span></div>
    <div class="prose">{laiy}</div>
  </section>

  <section class="sec">
    <div class="sec-head"><span class="idx">贰</span><h2>活动与习俗</h2><span class="line"></span></div>
    <ul class="cust">{cust}</ul>
  </section>

  <section class="sec">
    <div class="sec-head"><span class="idx">叁</span><h2>一句话读懂</h2><span class="line"></span></div>
    <div class="quotebox"><b>{title}</b>{desc}</div>
  </section>

  <section class="sec">
    <div class="sec-head"><span class="idx">肆</span><h2>再看看这几页</h2><span class="line"></span></div>
    <div class="grid3">{near}</div>
  </section>

  <nav class="pager">{prev}{next}</nav>

  <footer class="foot">
    <div class="seal">渝</div>
    <p>山城人文 —— 三千年的巴渝，活在日常里</p>
  </footer>
</div>
</body>
</html>"""

def esc(s): return H.escape(s, quote=True)

os.makedirs(os.path.join(ROOT, "culture"), exist_ok=True)
N = len(ITEMS)
for idx, it in enumerate(ITEMS):
    num = idx + 1
    heroimg = (f'<img src="../assets/pic/culture/{it["img"]}" alt="{esc(it["t"])}">'
               if it["img"] else
               f'<div style="width:100%;height:100%;background:linear-gradient(150deg,{it["ac"]}33,#0a0d12 70%)"></div>')
    laily = "".join(f"<p>{esc(p)}</p>" for p in it["laiy"])
    cust = "".join(f'<li><span class="dot"></span><span>{esc(c)}</span></li>' for c in it["customs"])
    near = "".join(
        f'<a class="rcard" href="c{(idx + d) % N + 1}.html"><div class="ph">'
        + (f'<img src="../assets/pic/culture/{ITEMS[(idx + d) % N]["img"]}" alt="" loading="lazy">'
           if ITEMS[(idx + d) % N]["img"] else "")
        + f'</div><div class="tx"><h4>{esc(ITEMS[(idx + d) % N]["t"])}</h4>'
          f'<p>{esc(ITEMS[(idx + d) % N]["laiy"][0][:38])}…</p></div></a>'
        for d in (1, 2, 3))
    prev = (f'<a class="pg prev" href="c{((idx - 1) % N) + 1}.html">'
            f'<span class="dir">上一页</span><span class="nm">{esc(ITEMS[idx - 1]["t"])}</span></a>')
    nxt = (f'<a class="pg next" href="c{((idx + 1) % N) + 1}.html">'
           f'<span class="dir">下一页</span><span class="nm">{esc(ITEMS[(idx + 1) % N]["t"])}</span></a>')
    page = TPL.format(title=esc(it["t"]), ac=it["ac"], ac2=it["ac2"], lv=esc(it.get("lv", "人文")),
                      pat=PAT[it["pat"]], motif=MOTIF[it["motif"]], heroimg=heroimg,
                      laiy=laily, cust=cust, desc=esc(it["desc"]), near=near, prev=prev, next=nxt)
    open(os.path.join(ROOT, "culture", f"c{num}.html"), "w", encoding="utf-8").write(page)
    print("c%d %s" % (num, it["t"]))
print("ALL DONE")

/* ==========================================================
   wanzhou-data.js — 万州深度版块数据
   内容来源：用户原创万州旅游站（wanzhou/），文字为其原文
   ========================================================== */
window.WANZHOU = {
  home: "wanzhou/index.html",

  hero: [
    { img: "assets/pic/pubu1.png", t: "三峡明珠 · 平湖万州", s: "亚洲第一瀑，奔流千年", link: "wanzhou/pages/scenic-waterfall.html" },
    { img: "assets/pic/tiansheng1.jpg", t: "千年古遗址 · 天生城", s: "登三国古城，瞰高峡平湖", link: "wanzhou/pages/scenic-tiansheng.html" },
    { img: "assets/pic/yejing.png", t: "平湖夜景 · 璀璨万州", s: "城在湖中，湖在城里", link: "wanzhou/pages/scenic-pinghu.html" }
  ],

  about: {
    img: "assets/pic/quan.jpg",
    title: "三峡明珠 · 平湖之城",
    paras: [
      "万州地处长江上游、重庆东北部，是三峡库区最大的移民城市。高峡出平湖的壮丽景观与现代化城市风貌交织，长江穿城而过，南北滨江路蜿蜒数十公里，形成了“城在湖中、湖在山中”的独特画卷。万州拥有1800余年建城史，是国家优秀旅游城市、全国双拥模范城，也是渝东北、川东、鄂西的区域性中心城市。",
      "这里四季分明，气候宜人，森林覆盖率超过53%，拥有众多国家级景区、森林公园和自然保护区。无论是壮美的自然风光，还是厚重的历史遗迹，亦或是麻辣鲜香的特色美食，都让万州成为三峡旅游线上不可错过的核心目的地。"
    ],
    metrics: [
      { i: "⛰", v: "3457 km²", k: "辖区面积" },
      { i: "👥", v: "156 万", k: "常住人口" },
      { i: "🕰", v: "1800+ 年", k: "建城历史" },
      { i: "🌲", v: "国家森林城市", k: "生态名片" }
    ]
  },

  history: [
    {
      t: "古城肇始", icon: "⚔",
      d: "东汉建安年间，蜀汉昭烈帝刘备置羊渠县，为万州建置之始。天生城雄踞江畔，扼守三峡水道，自古即为兵家必争之地，见证了无数金戈铁马。",
      link: "wanzhou/pages/history-ancient.html"
    },
    {
      t: "唐宋繁华", icon: "⛵",
      d: "唐代正式设立万州，取“万川毕汇”之意。宋代商贾云集，盐运、茶马贸易兴盛，万州成为长江上游重要商埠，享有“万商之城”的美誉，西山碑等文物留存至今。",
      link: "wanzhou/pages/history-tang.html"
    },
    {
      t: "三峡工程", icon: "🏗",
      d: "1994年三峡工程动工，万州成为库区腹心最大的移民城市。半座老城沉入江底，26万移民搬迁，一座崭新的现代化新城在平湖之畔崛起，谱写了感人的移民新篇。",
      link: "wanzhou/pages/history-threegorges.html"
    }
  ],

  scenic: {
    cats: [
      { k: "all", n: "全部" }, { k: "nature", n: "自然景观" },
      { k: "history", n: "历史古迹" }, { k: "park", n: "城市公园" }, { k: "forest", n: "森林公园" }
    ],
    items: [
      { t: "万州大瀑布", c: "nature", tag: "4A景区", img: "assets/pic/pubu2.png", d: "宽115米，高64.5米，亚洲第一宽瀑，水雾彩虹飞架。", link: "wanzhou/pages/scenic-waterfall.html" },
      { t: "天生城遗址", c: "history", tag: "历史古迹", img: "assets/pic/tiansheng2.jpg", d: "三国古战场，宋代抗元山城，国家级文保单位。", link: "wanzhou/pages/scenic-tiansheng.html" },
      { t: "西山公园", c: "park", tag: "城市公园", img: "assets/pic/xi1.png", d: "百年历史城市公园，古木参天，钟楼远眺长江。", link: "wanzhou/pages/scenic-xishan.html" },
      { t: "三峡平湖旅游区", c: "nature", tag: "自然景观", img: "assets/pic/pinghu1.png", d: "高峡出平湖核心景观，乘船夜游，璀璨夜景如画。", link: "wanzhou/pages/scenic-pinghu.html" },
      { t: "潭獐峡", c: "nature", tag: "自然保护区", img: "assets/pic/tan1.jpg", d: "国家级风景名胜区，峡谷幽深，溪流清澈，原生态秘境。", link: "wanzhou/pages/scenic-tanzhuxia.html" },
      { t: "铁峰山国家森林公园", c: "forest", tag: "森林公园", img: "assets/pic/tie1.png", d: "森林覆盖率95%，夏季均温22℃，露营避暑天堂。", link: "wanzhou/pages/scenic-tiefeng.html" }
    ]
  },

  food: [
    { t: "万州烤鱼", img: "assets/pic/kao1.jpg", d: "国家级非遗，先烤后炖，外焦里嫩，麻辣鲜香，是三峡美食的灵魂代表。", link: "wanzhou/pages/food-kaoyu.html", badge: "非遗" },
    { t: "万州杂酱面", img: "assets/pic/zha1.jpg", d: "杂酱浓郁，面条劲道，配以葱花花生碎，是万州人早餐的灵魂，被誉为重庆小面的天花板。", link: "wanzhou/pages/food-noodles.html" },
    { t: "万州格格", img: "assets/pic/gege1.jpg", d: "竹笼粉蒸系列小吃，羊肉、肥肠、排骨各有风味，软糯麻辣，是万州市井美食的代表。", link: "wanzhou/pages/food-gege.html" }
  ],

  traffic: [
    { i: "🚄", t: "高铁", d: "万州北站 · 直达全国", link: "https://www.12306.cn" },
    { i: "✈", t: "航空", d: "五桥机场 · 通航20+城市", link: "https://www.ctrip.com/flight/" },
    { i: "🚢", t: "水运", d: "长江黄金水道 · 三峡游轮", link: "https://www.sxdsx.com" },
    { i: "🚌", t: "公路", d: "高速路网密集 · 自驾便捷", link: "https://www.amap.com" }
  ]
};

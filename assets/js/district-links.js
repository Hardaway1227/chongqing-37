/* district-links.js — 区县名 → 万州风格静态页（districts/{slug}.html）跳转助手
   用法：window.districtURL("渝中区") => "districts/yuzhong.html"
   未知区县返回 null，调用方可回退到 district.html?d=... */
(function () {
  "use strict";
  var SLUG = {
    "渝中区": "yuzhong", "江北区": "jiangbei", "南岸区": "nanan", "沙坪坝区": "shapingba",
    "九龙坡区": "jiulongpo", "大渡口区": "dadukou", "渝北区": "yubei", "巴南区": "banan",
    "北碚区": "beibei", "涪陵区": "fuling", "长寿区": "changshou", "江津区": "jiangjin",
    "合川区": "hechuan", "永川区": "yongchuan", "南川区": "nanchuan", "綦江区": "qijiang",
    "大足区": "dazu", "璧山区": "bishan", "铜梁区": "tongliang", "潼南区": "tongnan",
    "荣昌区": "rongchang", "开州区": "kaizhou", "梁平区": "liangping", "城口县": "chengkou",
    "丰都县": "fengdu", "垫江县": "dianjiang", "忠县": "zhongxian", "云阳县": "yunyang",
    "奉节县": "fengjie", "巫山县": "wushan", "巫溪县": "wuxi", "黔江区": "qianjiang",
    "武隆区": "wulong", "石柱县": "shizhu", "秀山县": "xiushan", "酉阳县": "youyang",
    "彭水县": "pengshui", "万州区": "wanzhou"
  };
  window.DISTRICT_SLUG = SLUG;
  window.districtURL = function (name) {
    if (name === "万州区") return "wanzhou/index.html";
    var s = SLUG[name];
    return s ? "districts/" + s + ".html" : null;
  };
})();

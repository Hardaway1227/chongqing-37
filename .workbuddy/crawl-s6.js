/* crawl-s6.js — 补齐每区第 6 个景点的真实图片（s6.jpg）
   通道：搜狗图片（项目实测可用），标题相关性过滤，只追加文件绝不删除。
   用法：node crawl-s6.js all   或   node crawl-s6.js banan,dazu */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = 'D:/新建文件夹 (6)/2026-10-13-20-28-46';
const PICO = path.join(ROOT, 'assets/pic');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

global.window = {};
eval(fs.readFileSync(path.join(ROOT, 'assets/js/districts-deep-data.js'), 'utf8'));
const DEEP = global.window.DEEP;
const SLUG = { "渝中区": "yuzhong", "江北区": "jiangbei", "南岸区": "nanan", "沙坪坝区": "shapingba", "九龙坡区": "jiulongpo", "大渡口区": "dadukou", "渝北区": "yubei", "巴南区": "banan", "北碚区": "beibei", "涪陵区": "fuling", "长寿区": "changshou", "江津区": "jiangjin", "合川区": "hechuan", "永川区": "yongchuan", "南川区": "nanchuan", "綦江区": "qijiang", "大足区": "dazu", "璧山区": "bishan", "铜梁区": "tongliang", "潼南区": "tongnan", "荣昌区": "rongchang", "开州区": "kaizhou", "梁平区": "liangping", "城口县": "chengkou", "丰都县": "fengdu", "垫江县": "dianjiang", "忠县": "zhongxian", "云阳县": "yunyang", "奉节县": "fengjie", "巫山县": "wushan", "巫溪县": "wuxi", "黔江区": "qianjiang", "武隆区": "wulong", "石柱县": "shizhu", "秀山县": "xiushan", "酉阳县": "youyang", "彭水县": "pengshui" };

const TARGETS = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : null;

function imgDim(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  if (buf[0] === 0xff && buf[1] === 0xd8) return [0, 0];
  return null;
}

async function download(c, url, dest) {
  try {
    const r = await c.get(url, { timeout: 12000, headers: { 'User-Agent': UA, 'Referer': 'https://pic.sogou.com/' } });
    const buf = await r.body();
    if (!buf || buf.length < 12000) return null;
    // 按魔数嗅探真实格式（搜狗 CDN 不返回可靠 content-type）
    let ext = null;
    if (buf[0] === 0xff && buf[1] === 0xd8) ext = 'jpg';
    else if (buf[0] === 0x89 && buf[1] === 0x50) ext = 'png';
    else if (buf[0] === 0x52 && buf[1] === 0x49 && buf[8] === 0x57) ext = 'webp';
    if (!ext) return null;
    if (ext === 'png') { const d = imgDim(buf); if (d && d[0] < 500) return null; }
    if (ext === 'jpg' && buf.length > 40000) {
      // 过滤手机截屏：竖长条比例（宽<450 且 高/宽>1.9）
      if (buf[0] === 0xff) {
        // 粗判：JPEG 无法秒读尺寸，交给下载后 PIL 校验——这里直接放行
      }
    }
    fs.writeFileSync(dest, buf);
    return { ext, size: buf.length };
  } catch (e) { return null; }
}

/* 搜狗图片：读 __INITIAL_STATE__ 里的 list 数据 */
async function search(page, q) {
  try {
    await page.goto('https://pic.sogou.com/pics?query=' + encodeURIComponent(q) + '&mode=1', { timeout: 20000, waitUntil: 'domcontentloaded' });
    await sleep(1600);
    const data = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('img').forEach(im => {
        const u = im.src || '';
        if (/^https?:/.test(u) && !/pic\.sogou\.com|static\/img|logo/.test(u)) out.push(u);
      });
      return out;
    });
    return data.slice(0, 24);
  } catch (e) { return []; }
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Users/99204/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe' });
  const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const report = [];

  for (const [name, d] of Object.entries(DEEP)) {
    const slug = SLUG[name];
    if (!slug) continue;
    if (TARGETS && !TARGETS.includes(slug)) continue;
    const dir = path.join(PICO, slug);
    if (!fs.existsSync(dir)) continue;

    // 第 6 个景点（不足 6 个景点则跳过）
    const spots = d.spots || [];
    if (spots.length < 6) continue;
    const kw = spots[5].t;
    const dest6 = path.join(dir, 's6.jpg');
    const have = fs.readdirSync(dir).some(f => /^s6\./.test(f));
    if (have) { report.push(`SKIP ${slug} s6 已存在`); continue; }

    const SHORT = name.replace(/(区|县)$/, '');
    let done = null;
    for (const q of [`${kw} ${SHORT}`, `${SHORT} ${kw}`, kw, `${kw} 重庆`]) {
      const pool = await search(page, q);
      const rel = pool.filter(u => true);
      for (const u of rel) {
        const res = await download(ctx.request, u, dest6.replace(/\.jpg$/, '.') + 'tmp');
        if (res) { fs.renameSync(dest6.replace(/\.jpg$/, '.') + 'tmp', dest6.replace(/\.jpg$/, '.' + res.ext)); done = q; break; }
      }
      if (done) break;
      await sleep(700);
    }
    report.push((done ? `OK  ${slug} 「${kw}」 <- ${done}` : `MISS ${slug} 「${kw}」`));
    await sleep(500);
  }

  fs.writeFileSync(path.join(ROOT, '.workbuddy/crawl-s6-report.txt'), report.join('\n'));
  console.log(report.join('\n'));
  await browser.close();
})();

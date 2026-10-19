/* ==========================================================
   guess.js — 猜地方（老照片 → 今日照）
   ========================================================== */
window.Guess = (function () {
  let order = [], i = 0, right = 0, combo = 0, bestCombo = 0;
  let revealed = false, answered = false, locked = false;

  const $ = id => document.getElementById(id);

  function shuffle(a) {
    a = a.slice();
    for (let k = a.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [a[k], a[j]] = [a[j], a[k]];
    }
    return a;
  }

  function start() {
    order = shuffle(window.CHQ.SPOTS.map((s, k) => k));
    i = 0; right = 0; combo = 0; bestCombo = 0;
    $("gsTotal").textContent = order.length;
    $("gsRestart").hidden = true;
    $("gsNext").hidden = true;
    $("gsSkip").hidden = false;
    load();
  }

  function load() {
    const spot = window.CHQ.SPOTS[order[i]];
    revealed = false; answered = false; locked = false;

    // 真实照片：老照片态用同图黑白泛黄滤镜，"今日照"原色显现
    const ph = "assets/pic/guess/" + spot.id + ".jpg";
    const phOld = "assets/pic/guess/" + spot.id + "-old.jpg";
    $("gsOld").innerHTML = `<img src="${phOld}" alt="${spot.name} 老照片" onerror="this.onerror=null;this.src='${ph}';">`;
    $("gsNew").innerHTML = `<img src="${ph}" alt="${spot.name} 今日照">`;
    $("gsNew").classList.remove("show");
    $("gsOld").classList.remove("hide");
    $("gsScan").classList.remove("run");

    const stamp = $("gsStamp");
    stamp.textContent = spot.era + " 老照片";
    stamp.classList.remove("new");

    const hint = $("gsHint");
    hint.textContent = "点击照片 → 时间快进";
    hint.classList.remove("gone");

    $("gsCaption").textContent = spot.oldCap;
    $("gsIdx").textContent = i + 1;
    $("gsRight").textContent = right;
    $("gsCombo").textContent = combo;

    $("gsResult").classList.remove("show");
    $("gsResult").innerHTML = "";
    $("gsNext").hidden = true;

    // 选项
    const opts = shuffle(spot.opts.slice());
    $("gsOptions").innerHTML = opts.map((o, k) =>
      `<button class="go" data-v="${o}"><span class="go-k">${"ABCD"[k]}</span>${o}</button>`).join("");
    $("gsOptions").querySelectorAll(".go").forEach(b => b.addEventListener("click", () => pick(b, spot)));
  }

  function reveal() {
    if (revealed || locked) return;
    revealed = true;
    const sc = $("gsScan");
    sc.classList.remove("run");
    void sc.offsetWidth;
    sc.classList.add("run");
    $("gsNew").classList.add("show");
    $("gsOld").classList.add("hide");
    const stamp = $("gsStamp");
    stamp.textContent = "今 日 照";
    stamp.classList.add("new");
    $("gsHint").classList.add("gone");
    const spot = window.CHQ.SPOTS[order[i]];
    $("gsCaption").textContent = spot.newCap;
  }

  function pick(btn, spot) {
    if (answered || locked) return;
    answered = true;
    const val = btn.dataset.v;
    const ok = val === spot.name;
    $("gsOptions").querySelectorAll(".go").forEach(b => {
      b.disabled = true;
      if (b.dataset.v === spot.name) b.classList.add("right");
      else if (b === btn) b.classList.add("wrong");
    });

    if (ok) { right++; combo++; bestCombo = Math.max(bestCombo, combo); }
    else combo = 0;
    $("gsRight").textContent = right;
    $("gsCombo").textContent = combo;

    $('gsResult').innerHTML =
      `<span class="gr-t">${ok ? "✓ 猜对了" : "✕ 差一点"}　${spot.name}　<span style="color:var(--dim);font-weight:400">${spot.era}</span></span>` +
      `${ok ? "" : `正确答案是 <b>${spot.name}</b>。`}${spot.note}` +
      `<div style="margin-top:10px;font-size:12px;color:var(--dim)">老照片：${spot.oldCap}　·　今日：${spot.newCap}</div>`;
    $("gsResult").classList.add("show");

    if (!revealed) reveal();

    $("gsSkip").hidden = true;
    const nx = $("gsNext");
    nx.hidden = false;
    nx.textContent = i === order.length - 1 ? "看结果 →" : "下一张 →";
  }

  function next() {
    if (i === order.length - 1) { finish(); return; }
    i++;
    $("gsSkip").hidden = false;
    load();
  }

  function finish() {
    locked = true;
    const pct = Math.round(right / order.length * 100);
    let word = pct >= 90 ? "重庆通，没跑了" : pct >= 60 ? "有点东西，继续" : "多来重庆走走";
    $("gsResult").innerHTML =
      `<span class="gr-t">结果：${right} / ${order.length}　（${pct}%）— ${word}</span>` +
      `最高连击 <b>${bestCombo}</b> 题。` +
      (pct >= 90 ? " 你已经能分清十八梯和山城步道了。" :
        pct >= 60 ? " 渝东南那几个古镇确实容易混。" : " 从洪崖洞开始认，慢慢来。");
    $("gsResult").classList.add("show");
    $("gsNext").hidden = true;
    $("gsSkip").hidden = true;
    $("gsRestart").hidden = false;
    $("gsOptions").innerHTML = "";
  }

  function skip() {
    if (locked) return;
    combo = 0;
    $("gsCombo").textContent = combo;
    if (!revealed) reveal();
    if (i === order.length - 1) { finish(); return; }
    i++;
    setTimeout(load, 260);
  }

  function init() {
    const photo = $("gsPhoto");
    if (!photo) return;
    photo.addEventListener("click", reveal);
    photo.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reveal(); }
    });
    $("gsSkip").addEventListener("click", skip);
    $("gsNext").addEventListener("click", next);
    $("gsRestart").addEventListener("click", start);
    document.addEventListener("keydown", e => {
      if (locked || answered) return;
      const k = e.key.toUpperCase();
      if ("ABCD".includes(k)) {
        const bs = $("gsOptions").querySelectorAll(".go");
        const idx = "ABCD".indexOf(k);
        if (bs[idx]) bs[idx].click();
      }
      if (e.key === "ArrowRight") reveal();
    });
    start();
  }

  return { init };
})();

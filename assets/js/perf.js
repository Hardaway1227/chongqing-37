/* ==========================================================
   perf.js — 设备性能探测 / 动效偏好 / 视口节流
   无依赖，需最先于各渲染模块加载（index.html 中放在数据文件之后、
   terrain.js 等渲染模块之前）
   ========================================================== */
window.CHQ_PERF = (function () {
  'use strict';

  /* ----------  prefers-reduced-motion ---------- */
  const rmQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let reduced = rmQuery ? rmQuery.matches : false;
  if (rmQuery && rmQuery.addEventListener) {
    rmQuery.addEventListener('change', e => { reduced = e.matches; });
  }

  /* ---------- GPU 探测（软件渲染 = 低端） ---------- */
  function glRendererName() {
    try {
      const cv = document.createElement('canvas');
      const gl = cv.getContext('webgl') || cv.getContext('experimental-webgl');
      if (!gl) return '';
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '') : '';
    } catch (e) { return ''; }
  }
  const gpu = glRendererName();
  const softGL = /swiftshader|software|llvmpipe|basic render|microsoft basic/i.test(gpu);

  /* ---------- 综合低端判定 ---------- */
  const cores = navigator.hardwareConcurrency || 4;
  // Device Memory API（Chrome）：近似内存 GiB，缺失时按充足处理
  const mem = ('deviceMemory' in navigator) ? navigator.deviceMemory : 8;
  const conn = navigator.connection || {};
  const saveData = conn.saveData === true;
  const slowNet = /(?:^|-)(?:2g|slow-2g)$/.test(conn.effectiveType || '');
  const smallScreen = Math.min(screen.width || 0, screen.height || 0) <= 480;
  const lowEnd = softGL || saveData || slowNet || mem <= 1 || (smallScreen && cores <= 6);

  /* ---------- 视口内才渲染 ---------- */
  function onVisible(el, onEnter, onLeave) {
    if (!el) return function () {};
    if (!('IntersectionObserver' in window)) { if (onEnter) onEnter(); return function () {}; }
    let inside = false;
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting && !inside) { inside = true; if (onEnter) onEnter(); }
        else if (!e.isIntersecting && inside) { inside = false; if (onLeave) onLeave(); }
      });
    }, { rootMargin: '160px 0px' });
    io.observe(el);
    return function () { io.disconnect(); };
  }

  return {
    /* 用户是否偏好减少动效（系统级） */
    reducedMotion() { return reduced; },
    /* 是否为低端设备（降分辨率 / 降特效） */
    isLow() { return lowEnd; },
    /* GPU 名称（调试用） */
    gpuName() { return gpu || '未知'; },
    /* 设备像素比上限：低端机锁 1，防高 DPI 填充率爆炸 */
    pixelRatio(cap) { return Math.min(window.devicePixelRatio || 1, lowEnd ? 1 : (cap || 2)); },
    /* 网格边长：低端机减半（1024 -> 512，顶点数降为 1/4） */
    gridSize(full) { return lowEnd ? Math.round((full || 1024) / 2) : (full || 1024); },
    /* 纹理画布边长：低端机 512 */
    texSize(full) { return lowEnd ? 512 : (full || 1024); },
    onVisible
  };
})();

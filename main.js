(function () {
  'use strict';

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var themeBtn = document.querySelector('.theme');
  function currentTheme() {
    return root.dataset.theme === 'light' ? 'light' : 'dark';
  }
  themeBtn.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    themeChanged();
  });

  /* ---------- Top bar ---------- */
  var bar = document.querySelector('.bar');
  function onScroll() { bar.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.bar nav a'));
  if ('IntersectionObserver' in window) {
    var sectionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.setAttribute('aria-current', a.getAttribute('href') === '#' + en.target.id ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['work', 'experience', 'projects', 'contact'].forEach(function (id) {
      var el = document.getElementById(id); if (el) sectionObs.observe(el);
    });
  }

  /* ---------- Exploration demo ---------- */
  var canvas = document.getElementById('map');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var coverageOut = document.getElementById('coverage');
  var replayBtn = document.getElementById('replay');
  var segBtns = Array.prototype.slice.call(document.querySelectorAll('.seg button'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var N = 48;
  var WALL = 1, FREE = 0;
  var UNKNOWN = 0, K_FREE = 1, K_WALL = 2;

  // Ground-truth floor plan: a 3 x 3 grid of rooms with doorways, plus interior partitions.
  var truth = new Uint8Array(N * N);
  function setW(x, y) { if (x >= 0 && y >= 0 && x < N && y < N) truth[y * N + x] = WALL; }
  function hline(y, x0, x1) { for (var x = x0; x <= x1; x++) setW(x, y); }
  function vline(x, y0, y1) { for (var y = y0; y <= y1; y++) setW(x, y); }
  function clear(x0, y0, x1, y1) { for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) truth[y * N + x] = FREE; }

  hline(0, 0, N - 1); hline(N - 1, 0, N - 1); vline(0, 0, N - 1); vline(N - 1, 0, N - 1);
  vline(16, 0, N - 1); vline(31, 0, N - 1); hline(16, 0, N - 1); hline(31, 0, N - 1);
  // Doorways
  [[7, 10], [22, 25], [37, 40]].forEach(function (d) {
    clear(16, d[0], 16, d[1]); clear(31, d[0], 31, d[1]);
    clear(d[0], 16, d[1], 16); clear(d[0], 31, d[1], 31);
  });
  // Cut the corners of the central room so it reads as a hub
  for (var i = 0; i < 4; i++) {
    setW(17 + i, 20 - i); setW(30 - i, 20 - i); setW(17 + i, 27 + i); setW(30 - i, 27 + i);
  }
  // Partitions inside corner and side rooms
  hline(6, 4, 11); vline(4, 6, 11);
  hline(6, 36, 43); vline(43, 6, 11);
  hline(41, 4, 11); vline(4, 36, 41);
  hline(41, 36, 43); vline(43, 36, 41);
  vline(23, 4, 11); vline(23, 36, 43);
  hline(23, 4, 11); hline(23, 36, 43);
  clear(23, 22, 25, 25);

  var starts = [[22, 23], [25, 23], [22, 25], [25, 25]];

  // Free cells reachable from the start: the denominator for "mapped %".
  var reachable = (function () {
    var seen = new Uint8Array(N * N), q = [starts[0][1] * N + starts[0][0]], n = 0;
    seen[q[0]] = 1;
    while (q.length) {
      var c = q.shift(); n++;
      var cx = c % N, cy = (c / N) | 0;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        var nx = cx + d[0], ny = cy + d[1];
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) return;
        var k = ny * N + nx;
        if (!seen[k] && truth[k] === FREE) { seen[k] = 1; q.push(k); }
      });
    }
    return n;
  })();

  var known, robots, step, done, knownFree;
  var RANGE = 8.5, RAYS = 90;

  function reset(count) {
    known = new Uint8Array(N * N);
    knownFree = 0;
    step = 0; done = false;
    robots = [];
    for (var r = 0; r < count; r++) {
      var s = count === 1 ? [23.5, 24] : starts[r];
      var x = Math.floor(s[0]), y = Math.floor(s[1]);
      robots.push({ x: x, y: y, px: x, py: y, path: [], target: -1, trail: [[x, y]] });
    }
    robots.forEach(sense);
  }

  function mark(k, v) {
    if (known[k] === UNKNOWN) { known[k] = v; if (v === K_FREE) knownFree++; }
  }

  function sense(rb) {
    var ox = rb.x + 0.5, oy = rb.y + 0.5;
    mark(rb.y * N + rb.x, K_FREE);
    for (var a = 0; a < RAYS; a++) {
      var th = (a / RAYS) * Math.PI * 2, dx = Math.cos(th), dy = Math.sin(th);
      for (var t = 0.4; t <= RANGE; t += 0.4) {
        var cx = Math.floor(ox + dx * t), cy = Math.floor(oy + dy * t);
        if (cx < 0 || cy < 0 || cx >= N || cy >= N) break;
        var k = cy * N + cx;
        if (truth[k] === WALL) { mark(k, K_WALL); break; }
        mark(k, K_FREE);
      }
    }
  }

  function isFrontier(k) {
    if (known[k] !== K_FREE) return false;
    var x = k % N, y = (k / N) | 0;
    return (x > 0 && known[k - 1] === UNKNOWN) || (x < N - 1 && known[k + 1] === UNKNOWN) ||
           (y > 0 && known[k - N] === UNKNOWN) || (y < N - 1 && known[k + N] === UNKNOWN);
  }

  function plan(rb, others) {
    var startK = rb.y * N + rb.x;
    var parent = new Int32Array(N * N).fill(-2);
    parent[startK] = -1;
    var q = [startK], head = 0, best = -1, fallback = -1;
    while (head < q.length) {
      var c = q[head++];
      if (c !== startK && isFrontier(c)) {
        if (fallback < 0) fallback = c;
        var cx = c % N, cy = (c / N) | 0, claimed = false;
        for (var o = 0; o < others.length; o++) {
          var t = others[o].target; if (t < 0) continue;
          var tx = t % N, ty = (t / N) | 0;
          if ((tx - cx) * (tx - cx) + (ty - cy) * (ty - cy) < 100) { claimed = true; break; }
        }
        if (!claimed) { best = c; break; }
      }
      var x = c % N, y = (c / N) | 0;
      var nb = [c + 1, c - 1, c + N, c - N];
      var ok = [x < N - 1, x > 0, y < N - 1, y > 0];
      for (var j = 0; j < 4; j++) {
        if (!ok[j]) continue;
        var n2 = nb[j];
        if (parent[n2] === -2 && known[n2] === K_FREE) { parent[n2] = c; q.push(n2); }
      }
    }
    var goal = best >= 0 ? best : fallback;
    rb.target = goal;
    rb.path = [];
    if (goal < 0) return;
    for (var p = goal; p !== startK && p >= 0; p = parent[p]) rb.path.push(p);
    rb.path.reverse();
  }

  function tick() {
    if (done) return;
    step++;
    var anyActive = false;
    robots.forEach(function (rb, idx) {
      if (rb.target >= 0 && !isFrontier(rb.target)) rb.target = -1;
      if (rb.target < 0 || rb.path.length === 0) {
        plan(rb, robots.filter(function (_, j) { return j !== idx; }));
      }
      if (rb.path.length) {
        anyActive = true;
        var next = rb.path.shift();
        rb.px = rb.x; rb.py = rb.y;
        rb.x = next % N; rb.y = (next / N) | 0;
        rb.trail.push([rb.x, rb.y]);
        sense(rb);
      } else { rb.px = rb.x; rb.py = rb.y; }
    });
    if (!anyActive) done = true;
    updateCoverage();
  }

  function updateCoverage() {
    var pct = Math.min(100, Math.round((knownFree / reachable) * 100));
    if (done) pct = Math.max(pct, 100);
    coverageOut.textContent = pct + '% mapped in ' + step + ' steps';
  }

  /* Drawing */
  var colors = {};
  function readColors() {
    var cs = getComputedStyle(root);
    ['map-unknown', 'map-free', 'map-wall', 'map-trail', 'robot', 'accent', 'surface'].forEach(function (n) {
      colors[n] = cs.getPropertyValue('--' + n).trim();
    });
  }
  function themeChanged() { readColors(); draw(1); }

  var size = 0, dpr = 1;
  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = rect.width;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    draw(1);
  }

  function draw(frac) {
    if (!size) return;
    var cell = (size * dpr) / N;
    ctx.fillStyle = colors['map-unknown'];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colors['map-free'];
    function rect(k) {
      var x = k % N, y = (k / N) | 0;
      var x0 = Math.round(x * cell), y0 = Math.round(y * cell);
      ctx.fillRect(x0, y0, Math.round((x + 1) * cell) - x0, Math.round((y + 1) * cell) - y0);
    }
    for (var k = 0; k < N * N; k++) { if (known[k] === K_FREE) rect(k); }
    // frontier hint
    ctx.fillStyle = colors['map-trail'];
    ctx.globalAlpha = 0.35;
    for (var f = 0; f < N * N; f++) {
      if (isFrontier(f)) ctx.fillRect((f % N) * cell + cell * 0.3, ((f / N) | 0) * cell + cell * 0.3, cell * 0.4, cell * 0.4);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = colors['map-wall'];
    for (var w = 0; w < N * N; w++) {
      if (known[w] === K_WALL) rect(w);
    }
    // trails
    ctx.lineWidth = Math.max(1, cell * 0.16);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = colors['map-trail'];
    robots.forEach(function (rb) {
      if (rb.trail.length < 2) return;
      ctx.beginPath();
      for (var i = 0; i < rb.trail.length; i++) {
        var pt = rb.trail[i], tx = (pt[0] + 0.5) * cell, ty = (pt[1] + 0.5) * cell;
        if (i === rb.trail.length - 1) {
          tx = (rb.px + (rb.x - rb.px) * frac + 0.5) * cell;
          ty = (rb.py + (rb.y - rb.py) * frac + 0.5) * cell;
        }
        if (i === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
      }
      ctx.stroke();
    });
    // robots
    robots.forEach(function (rb) {
      var cx = (rb.px + (rb.x - rb.px) * frac + 0.5) * cell;
      var cy = (rb.py + (rb.y - rb.py) * frac + 0.5) * cell;
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.95, 0, Math.PI * 2);
      ctx.fillStyle = colors['robot'];
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, cell * 0.22);
      ctx.strokeStyle = colors['surface'];
      ctx.stroke();
    });
  }

  /* Loop */
  var TICK_MS = 75, last = 0, acc = 0, running = false, visible = true, rafId = 0;
  function frame(ts) {
    rafId = 0;
    if (!running) return;
    if (!last) last = ts;
    acc += Math.min(ts - last, 200);
    last = ts;
    while (acc >= TICK_MS && !done) { tick(); acc -= TICK_MS; }
    draw(done ? 1 : acc / TICK_MS);
    if (done) { running = false; return; }
    rafId = requestAnimationFrame(frame);
  }
  function play() {
    if (done || reduceMotion) return;
    if (!visible || document.hidden) return;
    running = true; last = 0;
    if (!rafId) rafId = requestAnimationFrame(frame);
  }
  function pause() { running = false; if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }

  var robotCount = 4;
  function start() {
    pause();
    reset(robotCount);
    if (reduceMotion) {
      var guard = 0; while (!done && guard++ < 5000) tick();
      draw(1); updateCoverage();
      return;
    }
    updateCoverage();
    draw(0);
    acc = 0;
    play();
  }

  segBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      robotCount = parseInt(b.dataset.robots, 10);
      segBtns.forEach(function (o) { o.setAttribute('aria-checked', o === b ? 'true' : 'false'); });
      start();
    });
  });
  replayBtn.addEventListener('click', start);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) play(); else pause();
    }, { threshold: 0.1 }).observe(canvas);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else play(); });

  readColors();
  window.addEventListener('resize', resize);
  reset(robotCount);
  resize();
  start();
})();

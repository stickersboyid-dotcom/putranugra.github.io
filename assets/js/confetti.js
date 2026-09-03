/* =============================================================
   confetti.js — confetti jatuh di dalam box About (halaman Home)
   -------------------------------------------------------------
   Jalan sekali tiap halaman dibuka. Canvas-nya dibuat lewat JS
   dan dibuang lagi setelah animasinya habis, jadi tidak ada
   elemen sisa yang menumpuk di DOM.

   Confetti-nya dikurung di dalam box About karena box itu sudah
   punya `position: relative` + `overflow: hidden`.

   Warnanya: kuning dari favicon (#fad60d -> #e7f73a) plus abu-abu
   dari palet situs, supaya tidak terasa nyasar dari desain.
   ============================================================= */

(function () {
  "use strict";

  var COLORS = [
    "#ef4444", // merah
    "#fad60d", // kuning (favicon)
    "#3b82f6", // biru
    "#22c55e", // hijau
    "#a855f7", // ungu
    "#ec4899", // pink
    "#f97316"  // oranye
  ];

  var COUNT = 70;
  var START_DELAY = 450; // tunggu box About selesai muncul dulu
  var SAFETY_STOP = 8000;

  var host = document.querySelector("[data-confetti]");
  if (!host) return;

  if (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  var canvas = null;
  var ctx = null;
  var pieces = [];
  var raf = null;
  var startedAt = 0;
  var lastAt = 0;
  var boxW = 0;
  var boxH = 0;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function sizeCanvas() {
    boxW = host.clientWidth;
    boxH = host.clientHeight;
    canvas.width = Math.round(boxW * dpr);
    canvas.height = Math.round(boxH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    pieces = [];
    for (var i = 0; i < COUNT; i++) {
      pieces.push({
        x: rand(0, boxW),
        y: rand(-160, -10),          // mulai di atas box, waktunya bertahap
        w: rand(4, 8),
        h: rand(7, 14),
        vy: rand(180, 340),          // px per detik
        sway: rand(10, 34),          // lebar goyangan kiri-kanan
        swaySpeed: rand(0.8, 2.2),
        phase: rand(0, Math.PI * 2),
        rot: rand(0, Math.PI * 2),
        vr: rand(-3.4, 3.4),         // radian per detik
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      });
    }
  }

  function teardown() {
    if (raf) window.cancelAnimationFrame(raf);
    raf = null;
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null;
    ctx = null;
    pieces = [];
  }

  function frame(now) {
    if (!ctx) return;

    var dt = Math.min((now - lastAt) / 1000, 0.05); // batasi lompatan waktu
    lastAt = now;
    var elapsed = now - startedAt;
    var t = elapsed / 1000;

    ctx.clearRect(0, 0, boxW, boxH);

    var alive = 0;

    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      p.y += p.vy * dt;
      p.rot += p.vr * dt;

      if (p.y - p.h > boxH) continue; // sudah lewat bawah box
      alive++;

      // Larut perlahan di 25% terakhir, biar tidak terpotong mendadak
      var fadeFrom = boxH * 0.75;
      var alpha = p.y <= fadeFrom
        ? 1
        : Math.max(0, 1 - (p.y - fadeFrom) / (boxH - fadeFrom));

      if (alpha <= 0) continue;

      var x = p.x + Math.sin(t * p.swaySpeed + p.phase) * p.sway;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (alive === 0 || elapsed > SAFETY_STOP) {
      teardown();
      return;
    }

    raf = window.requestAnimationFrame(frame);
  }

  function play() {
    teardown();

    canvas = document.createElement("canvas");
    canvas.className = "about__confetti";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    ctx = canvas.getContext("2d");
    if (!ctx) {
      teardown();
      return;
    }

    sizeCanvas();
    if (!boxW || !boxH) {
      teardown();
      return;
    }

    seed();
    startedAt = lastAt = window.performance
      ? window.performance.now()
      : Date.now();
    raf = window.requestAnimationFrame(frame);
  }

  function start() {
    window.setTimeout(play, START_DELAY);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  // Balik ke Home lewat tombol back bisa memakai halaman dari cache,
  // yang tidak menjalankan ulang script. Putar lagi kalau itu terjadi.
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) start();
  });
})();

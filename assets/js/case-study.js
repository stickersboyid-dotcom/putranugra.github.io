/* =============================================================
   case-study.js — interaksi khusus halaman detail project
   1. Bar chart tumbuh saat masuk layar
   2. Mockup telepon yang di-scroll menyalakan step di sebelahnya
   3. Tooltip yang mengikuti kursor di atas bar chart
   4. Mockup laptop: slide deck yang main sendiri + klik palsu
   ============================================================= */

(function () {
  "use strict";

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canHover =
    window.matchMedia && window.matchMedia("(hover: hover)").matches;

  /* -----------------------------------------------------------
     1. Bar chart
     Bar-nya sudah digambar penuh di CSS. Di sini kita ratakan
     dulu (is-pending), lalu lepas begitu chart-nya kelihatan.
     Ada timer cadangan supaya bar tidak pernah tertinggal rata
     kalau observer-nya tidak pernah jalan.
     ----------------------------------------------------------- */
  function initBars() {
    var bars = document.querySelectorAll(".cs-bar");
    if (!bars.length || reduceMotion) return;

    Array.prototype.forEach.call(bars, function (bar) {
      bar.classList.add("is-pending");
    });

    var grown = false;
    function growBars() {
      if (grown) return;
      grown = true;
      Array.prototype.forEach.call(bars, function (bar) {
        bar.classList.remove("is-pending");
      });
    }

    if ("IntersectionObserver" in window) {
      var watcher = new IntersectionObserver(
        function (entries) {
          var seen = entries.some(function (e) { return e.isIntersecting; });
          if (seen) {
            watcher.disconnect();
            growBars();
          }
        },
        { threshold: 0.25 }
      );

      Array.prototype.forEach.call(
        document.querySelectorAll(".cs-bars"),
        function (group) { watcher.observe(group); }
      );
    }

    window.setTimeout(growBars, 2500);
  }

  /* -----------------------------------------------------------
     2. Mockup telepon
     data-stops berisi posisi scroll (0-1) tempat tiap step mulai.
     ----------------------------------------------------------- */
  function initScrollSync() {
    var pane = document.querySelector("[data-scroll-sync]");
    if (!pane) return;

    var steps = document.querySelectorAll("[data-step]");
    var stops = (pane.getAttribute("data-stops") || "0")
      .split(",")
      .map(parseFloat);

    function sync() {
      var travel = pane.scrollHeight - pane.clientHeight;
      var progress = travel > 0 ? pane.scrollTop / travel : 0;
      var active = 0;

      for (var i = stops.length - 1; i >= 0; i--) {
        if (progress >= stops[i]) {
          active = i;
          break;
        }
      }

      Array.prototype.forEach.call(steps, function (step, i) {
        step.classList.toggle("is-active", i === active);
      });
    }

    pane.addEventListener("scroll", sync, { passive: true });
    sync();
  }

  /* -----------------------------------------------------------
     3. Tooltip kursor untuk elemen ber-atribut data-tip
     ----------------------------------------------------------- */
  function initCursorTip() {
    var tip = document.querySelector("[data-cursor-tip]");
    if (!tip || !canHover) return;

    function place(event) {
      var margin = 16;
      var x = event.clientX + 16;
      var y = event.clientY + 18;

      // Pindah ke sisi lain kursor daripada keluar dari layar
      if (x + tip.offsetWidth + margin > window.innerWidth) {
        x = event.clientX - tip.offsetWidth - 16;
      }
      if (y + tip.offsetHeight + margin > window.innerHeight) {
        y = event.clientY - tip.offsetHeight - 16;
      }

      tip.style.setProperty("--tip-x", x + "px");
      tip.style.setProperty("--tip-y", y + "px");
    }

    Array.prototype.forEach.call(
      document.querySelectorAll("[data-tip]"),
      function (el) {
        el.addEventListener("mouseenter", function (event) {
          tip.textContent = el.getAttribute("data-tip");
          place(event);
          tip.classList.add("is-visible");
        });
        el.addEventListener("mousemove", place);
        el.addEventListener("mouseleave", function () {
          tip.classList.remove("is-visible");
        });
      }
    );

    // Kursor bisa lepas dari bar tanpa mouseleave saat halaman digeser
    window.addEventListener(
      "scroll",
      function () { tip.classList.remove("is-visible"); },
      { passive: true }
    );
  }

  /* -----------------------------------------------------------
     4. Mockup laptop — deck slide yang main sendiri
     Timeline: rantai delay yang bisa dibatalkan & di-"bekukan".
     Membekukan menyimpan sisa waktu tiap tugas yang masih
     menunggu, jadi saat dilanjut dia meneruskan dari tengah,
     bukan mengulang dari awal.
     ----------------------------------------------------------- */
  function Timeline() {
    this.tasks = [];
    this.alive = false;
  }

  Timeline.prototype.begin = function () {
    this.alive = true;
  };

  Timeline.prototype.wait = function (ms, fn) {
    var self = this;
    var id = window.setTimeout(function () {
      var i = self.tasks.indexOf(id);
      if (i !== -1) self.tasks.splice(i, 1);
      if (self.alive) fn();
    }, ms);
    this.tasks.push(id);
  };

  Timeline.prototype.end = function () {
    this.alive = false;
    this.tasks.forEach(function (id) { window.clearTimeout(id); });
    this.tasks = [];
  };

  function clickAt(timeline, screen, xRatio, yRatio, done) {
    var pointer = screen.querySelector("[data-pointer]");
    var ripple = screen.querySelector("[data-ripple]");
    if (!pointer || !ripple) {
      done();
      return;
    }

    var rect = screen.getBoundingClientRect();
    var x = xRatio * rect.width;
    var y = yRatio * rect.height;

    pointer.style.transition = "none";
    pointer.style.left = x - 20 + "px";
    pointer.style.top = y - 14 + "px";
    pointer.classList.add("is-visible");

    timeline.wait(80, function () {
      pointer.style.transition =
        "left 300ms ease, top 300ms ease, opacity 200ms ease, transform 150ms ease";
      pointer.style.left = x + "px";
      pointer.style.top = y + "px";

      timeline.wait(350, function () {
        pointer.classList.add("is-pressing");
        ripple.style.left = x + "px";
        ripple.style.top = y + "px";
        ripple.classList.add("is-popping");

        timeline.wait(200, function () {
          pointer.classList.remove("is-pressing");

          timeline.wait(200, function () {
            pointer.classList.remove("is-visible");
            pointer.style.transition = "";
            ripple.classList.remove("is-popping");
            done();
          });
        });
      });
    });
  }

  function resetCursor(screen) {
    if (!screen) return;
    var pointer = screen.querySelector("[data-pointer]");
    var ripple = screen.querySelector("[data-ripple]");
    if (pointer) {
      pointer.classList.remove("is-visible", "is-pressing");
      pointer.style.transition = "";
    }
    if (ripple) ripple.classList.remove("is-popping");
  }

  function slidesOf(screen) {
    return Array.prototype.slice.call(screen.querySelectorAll(".slide"));
  }

  function showSlide(slides, index) {
    Array.prototype.forEach.call(slides, function (slide, i) {
      slide.classList.toggle("is-active", i === index);
    });
  }

  // Lepas transisi cross-fade sesaat supaya loop balik ke slide
  // pertama tidak kelihatan berkedip.
  function snapOut(slide) {
    slide.classList.add("no-fade");
    slide.classList.remove("is-active");
    void slide.offsetHeight; // paksa reflow
    slide.classList.remove("no-fade");
  }

  function parseDwell(value, count) {
    var parts = (value || "").split(",");
    var out = [];
    for (var i = 0; i < count; i++) {
      var ms = parseInt(parts[i], 10);
      out.push(isNaN(ms) ? 1000 : ms);
    }
    return out;
  }

  function parseClicks(value) {
    var out = {};
    (value || "").trim().split(/\s+/).forEach(function (entry) {
      var m = entry.match(/^(\d+):([\d.]+),([\d.]+)$/);
      if (m) out[m[1]] = { x: parseFloat(m[2]), y: parseFloat(m[3]) };
    });
    return out;
  }

  // Markup: data-dwell="3000,2000,3000" data-clicks="0:0.93,0.05"
  function buildDeckMock(card) {
    var screen = card.querySelector("[data-screen]");
    var slides = slidesOf(screen);
    var timeline = new Timeline();
    var current = 0;

    var dwell = parseDwell(card.getAttribute("data-dwell"), slides.length);
    var clicks = parseClicks(card.getAttribute("data-clicks"));

    function goTo(next) {
      if (current === slides.length - 1 && next === 0) snapOut(slides[current]);
      showSlide(slides, next);
      current = next;
    }

    function loop() {
      var next = (current + 1) % slides.length;
      timeline.wait(dwell[current], function () {
        var spot = clicks[current];
        if (spot) {
          clickAt(timeline, screen, spot.x, spot.y, function () {
            goTo(next);
            loop();
          });
        } else {
          goTo(next);
          loop();
        }
      });
    }

    return {
      start: function () {
        timeline.begin();
        loop();
      },
      stop: function () {
        timeline.end();
        resetCursor(screen);
        showSlide(slides, 0);
        current = 0;
      }
    };
  }

  function initMockups() {
    var cards = document.querySelectorAll("[data-mock='deck']");
    if (!cards.length || reduceMotion) return;

    // Guard: cegah start/stop dobel dari observer yang menembak berulang
    function guard(mock) {
      var running = false;
      return {
        start: function () {
          if (!running) {
            running = true;
            mock.start();
          }
        },
        stop: function () {
          if (running) {
            running = false;
            mock.stop();
          }
        }
      };
    }

    var hasObserver = "IntersectionObserver" in window;
    var watcher = hasObserver
      ? new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              var mock = entry.target.__mock;
              if (!mock) return;
              if (entry.isIntersecting) mock.start();
              else mock.stop();
            });
          },
          { threshold: 0.01 }
        )
      : null;

    Array.prototype.forEach.call(cards, function (card) {
      var mock = guard(buildDeckMock(card));
      card.__mock = mock;

      if (watcher) {
        watcher.observe(card);
      } else {
        mock.start();
      }
    });
  }

  function init() {
    initBars();
    initScrollSync();
    initCursorTip();
    initMockups();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

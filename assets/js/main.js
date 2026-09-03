/* =============================================================
   main.js — interaksi kecil di seluruh halaman
   1. Tombol "Email" di navbar -> copy alamat email ke clipboard
   2. Tahun di footer -> otomatis mengikuti tahun berjalan
   ============================================================= */

(function () {
  "use strict";

  /* -----------------------------------------------------------
     1. Copy email ke clipboard
     Markup yang dibutuhkan (lihat navbar di tiap halaman):
       <button data-copy-email="alamat@email.com">Email</button>
       <span data-copy-toast role="status" aria-live="polite"></span>
     ----------------------------------------------------------- */
  // Cara lama: bikin textarea sementara lalu execCommand("copy").
  // Dipakai kalau Clipboard API tidak ada atau ditolak browser.
  function legacyCopy(text) {
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-1000px";
    document.body.appendChild(field);
    field.select();

    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }

    document.body.removeChild(field);
    return ok;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        // Clipboard API bisa ditolak (misal tab tidak fokus) -> coba cara lama
        return legacyCopy(text)
          ? Promise.resolve()
          : Promise.reject(new Error("copy gagal"));
      });
    }

    return legacyCopy(text)
      ? Promise.resolve()
      : Promise.reject(new Error("copy gagal"));
  }

  function initCopyEmail() {
    var button = document.querySelector("[data-copy-email]");
    var toast = document.querySelector("[data-copy-toast]");
    if (!button) return;

    var email = button.getAttribute("data-copy-email");
    var timer = null;

    function showToast(message) {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add("is-visible");
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        toast.classList.remove("is-visible");
      }, 2000);
    }

    button.addEventListener("click", function () {
      copyToClipboard(email).then(
        function () {
          showToast("Email copied");
        },
        function () {
          showToast(email);
        }
      );
    });
  }

  /* -----------------------------------------------------------
     2. Tahun berjalan di footer: <span data-year>2026</span>
     ----------------------------------------------------------- */
  function initYear() {
    var nodes = document.querySelectorAll("[data-year]");
    var year = String(new Date().getFullYear());
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = year;
    }
  }

  function init() {
    initCopyEmail();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

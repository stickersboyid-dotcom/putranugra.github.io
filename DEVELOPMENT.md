# Development Notes — Personal Space (Nugraha Putra)

Website personal statis (HTML + CSS + JavaScript, tanpa build tool) yang siap
di-hosting di GitHub Pages dengan custom domain.

Desain: Figma — [Exploration](https://www.figma.com/design/nUlw1ujOzyA5ikqsUj2IFE/Exploration)

---

## Struktur folder

```
.
├── index.html                  # Home  — kurasi project, writing, reading + hobbies
├── project.html                # Project
├── writing.html                # Writing
├── reading.html                # Reading
├── 404.html                    # Halaman error GitHub Pages
├── favicon.ico                 # Favicon 16/32/48 untuk browser lama & bookmark
├── robots.txt
├── .nojekyll                   # Matikan Jekyll di GitHub Pages
│
├── assets/
│   ├── css/
│   │   ├── tokens.css          # Design token: warna, tipografi, radius, spasi, motion
│   │   ├── base.css            # Reset, tipografi dasar, navbar, footer, page header
│   │   ├── components.css      # Bento grid + semua varian box & animasi hover
│   │   └── case-study.css      # Khusus halaman detail project
│   ├── js/
│   │   ├── main.js             # Copy email ke clipboard + tahun otomatis di footer
│   │   └── case-study.js       # Bar chart, mockup scroll-sync, tooltip kursor
│   ├── img/
│   │   ├── project/            # Gambar project
│   │   ├── reading/            # Cover buku
│   │   ├── hobbies/            # Foto hobi (hasil convert dari HEIC ke JPG)
│   │   ├── loyalty/            # Mockup untuk case study Loyalty Page
│   │   └── dashboard/          # Mockup untuk case study Replacement Order Module
│   ├── icons/
│   │   └── favicon.png         # Favicon 160x160 (favicon.ico di root dibuat dari file ini)
│   └── docs/
│       └── nugraha-eka-putra-cv.pdf
│
├── projects/
│   ├── loyalty-page.html       # Case study Loyalty Page
│   └── replacement-order-module.html  # Case study Replacement Order Module
│
└── _source/                    # File asli sebelum diolah (HEIC, PDF asli, dll)
```

**Kenapa foto hobi di-convert?** File `.HEIC` tidak bisa ditampilkan browser.
Semua foto di `_source/Hobbies/` sudah di-convert ke `.jpg` (maks 1600px, kualitas 85)
dan disimpan di `assets/img/hobbies/`.

---

## Menjalankan di lokal

Butuh server lokal (bukan buka file langsung), supaya path aset benar:

```bash
py -m http.server 5173
```

Lalu buka `http://localhost:5173`.

---

## Deploy ke GitHub Pages

1. Push seluruh isi folder ini ke branch `main` di repo GitHub kamu.
2. Buka **Settings → Pages**, pilih **Deploy from a branch** → `main` → `/ (root)`.
3. Di bagian **Custom domain**, isi domain kamu lalu **Save**.
   GitHub akan otomatis membuat file `CNAME` di root repo.
4. Centang **Enforce HTTPS** setelah sertifikat selesai dibuat.

> Kalau mau, kamu juga bisa bikin file `CNAME` manual di root berisi satu baris
> nama domain (contoh: `nugrahaputra.com`).

---

## Cara update konten

### Menambah tulisan (Writing)

Copy salah satu blok `<a class="card card--interactive card--writing">` di
`writing.html`. Box ini satu tag `<a>` yang membungkus semua isinya — jadi
seluruh box jadi area klik, bukan cuma ikon panahnya. Yang perlu diganti:

- `href` pada tag `<a>` pembungkus (bukan pada `.card__action`, itu cuma
  `<span>` dekoratif) → link tulisannya
- `aria-label` pada tag `<a>` yang sama → `Baca: [judul tulisan]`
- `<h2 class="card__title">` → judul
- `<p class="card__excerpt">` → cuplikan

Contoh satu blok lengkap:

```html
<a class="card card--interactive card--writing" href="https://link-tulisan"
   target="_blank" rel="noopener noreferrer" aria-label="Baca: Judul Tulisan">
  <div class="card__content">
    <div class="card__head">
      <p class="card__label">Writing &middot; Blog</p>
      <span class="card__action" data-tooltip="Read article" aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" focusable="false"><path d="M3.79167 9.20833L9.20833 3.79167M9.20833 9.20833V3.79167H3.79167" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
    </div>
    <div class="card__body">
      <h2 class="card__title">Judul Tulisan</h2>
      <p class="card__excerpt">Cuplikan singkat.</p>
    </div>
  </div>
</a>
```

### Menambah buku (Reading)

Copy blok `<a class="card card--interactive card--reading">` di `reading.html`:

1. Simpan cover buku di `assets/img/reading/` (rasio kira-kira 2:3).
2. Ganti `src`, `alt`, `width`, `height` pada `<img>`.
3. Ganti judul, penulis, dan `href` pada tag `<a>` pembungkus ke link
   Goodreads-nya (bukan pada `.card__action`).

### Menambah foto hobi (Home)

```html
<article class="card card--hobby">              <!-- tambahkan card--wide untuk box 2 kolom -->
  <p class="card__label">Hobbies &middot; Peripheral</p>
  <img class="hobby__photo" src="assets/img/hobbies/nama-file.jpg" alt="..." loading="lazy">
  <span class="hobby__caption">Judul Foto</span>
</article>
```

### Status link tiap card project

| Card | Tujuan |
|---|---|
| Hangry App | https://apps.apple.com/id/app/hangry/id1498223490 |
| Replacement Order Module | `projects/replacement-order-module.html` (case study) |
| Loyalty Page | `projects/loyalty-page.html` (case study) |
| Hangry Website | https://www.ishangry.com/ |

Semua card project sekarang sudah punya link.

### Menambah halaman detail project

Begitu satu case study siap:

1. Copy `projects/loyalty-page.html` → `projects/nama-project.html`, lalu ganti isinya.
   Halaman itu sudah memakai semua komponen case study, jadi paling gampang
   dipakai sebagai titik awal.
2. Untuk **project baru** (box belum ada di grid): copy salah satu blok
   `<a class="card card--interactive card--project">` di `project.html`
   (dan `index.html` kalau mau ditampilkan di Home juga), lalu ganti `href`
   dan `aria-label` pada tag `<a>` pembungkusnya ke `projects/nama-project.html`,
   plus gambar/label di dalamnya.
3. Untuk **project yang box-nya sudah ada tapi belum ada link** (masih
   `<article class="card ...">` biasa, `.card__action`-nya `<span>` tanpa
   `data-tooltip` yang mengarah ke mana-mana): ubah tag pembungkusnya dari
   `<article>` menjadi `<a>`, lalu tambahkan `href="projects/nama-project.html"`
   dan `aria-label="Baca case study ..."` di situ.

---

## Catatan desain & interaksi

Semua nilai visual diambil langsung dari Figma dan disimpan sebagai token di
`assets/css/tokens.css`.

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `--color-bg` | `#fafafa` | Background halaman & navbar |
| `--color-surface` | `#f4f4f5` @ 50% | Background box (default) |
| `--color-surface-hover` | `#f4f4f5` @ 100% | Background box saat hover |
| `--color-border` | `#e4e4e7` | Border navbar, footer, tombol panah |
| `--color-text` | `#52525b` | Teks utama |
| `--color-text-muted` | `#a1a1aa` | Label & teks sekunder |

Grid: 4 kolom, jarak 8px, box 294&times;294 (box lebar 596&times;294), radius 10px,
padding 24px. Font **Nunito Sans** dari Google Fonts.

**Animasi hover box:**

- **Semua box interaktif** — background box tetap satu warna (`#f4f4f5`), yang
  berubah cuma opacity-nya: 50% saat diam → 100% saat hover. Perubahannya halus
  supaya stroke lingkaran tombol panah tetap kelihatan. Barengan itu, tombol
  panah yang tadinya polos berubah jadi lingkaran putih ber-border.
  **Seluruh box adalah area klik** — box interaktif dirender sebagai satu tag
  `<a>` yang membungkus semua isinya (label, gambar, judul, dst); panahnya
  murni dekoratif (`<span class="card__action">`, bukan link sendiri).
  Karena satu box = satu `<a>`, box juga cuma butuh satu kali Tab untuk
  di-fokus, dan garis fokus keyboard melingkupi seluruh box, bukan cuma
  panahnya.
- **Tooltip** — muncul di dekat panah saat box di-hover atau di-fokus lewat
  keyboard. Teksnya diatur lewat atribut `data-tooltip` di `.card__action`:
  `Read article` (writing), `View on Goodreads` (reading), `View project` /
  `View on the App Store` (project).
- **Box project** — gambarnya zoom `scale(1.05)`.
- **Box reading** — cover bukunya `rotate(-5deg)`.
- **Box writing** — hanya animasi default di atas.
- **Box hobbies** — foto turun 59px sehingga judul box terlihat, lalu label judul
  foto muncul di kiri bawah. Box ini tidak punya tombol panah.

Di perangkat sentuh (tidak ada hover), state akhir langsung ditampilkan:
tombol panah selalu berlingkaran dan box hobbies langsung menampilkan labelnya.

**Animasi masuk halaman:** setiap kali halaman dibuka, navbar → judul → box-box →
footer muncul turun dari atas secara berurutan (`@keyframes reveal-down` di
`base.css`). Pakai `animation-fill-mode: backwards`, jadi kalau animasinya tidak
jalan konten tetap terlihat normal. Otomatis dimatikan kalau OS pengguna
mengaktifkan *reduce motion*.

**Responsive:** 4 kolom di desktop, 2 kolom di bawah 900px, 1 kolom di bawah 640px.

---

## Halaman case study

Ada dua contoh: [projects/loyalty-page.html](projects/loyalty-page.html)
([node 3575-7192](https://www.figma.com/design/nUlw1ujOzyA5ikqsUj2IFE/Exploration?node-id=3575-7192))
dan [projects/replacement-order-module.html](projects/replacement-order-module.html)
([node 3578-7643](https://www.figma.com/design/nUlw1ujOzyA5ikqsUj2IFE/Exploration?node-id=3578-7643)).
Kolom tulisannya 800px, di tengah frame 1440px (`.container--narrow`).

**Navbar-nya beda dari halaman lain:** isinya cuma tombol
&larr;&nbsp;Back to Project (`.navbar__inner--case`), tanpa menu Home/Project/
Writing/Reading dan tanpa LinkedIn/Email/CV — supaya halaman baca tidak
terganggu. Tombolnya sejajar tepi kiri navbar (120px), sama seperti garis
footer, bukan sejajar kolom tulisan.

**Dua font**, mengikuti Figma:

- **Nunito Sans** — semua teks naratif (judul, paragraf, kutipan)
- **Geist** — komponen data: diagram alur, tabel perbandingan, card, bar chart

**Komponen yang tersedia** (semua di `assets/css/case-study.css`):

| Kelas | Isi |
|---|---|
| `.cs-overview` | Ringkasan project (Product / Role / Team / Outcome) |
| `.cs-quote` | Kutipan wawancara — italic, warna redup |
| `.cs-statement` | Kalimat kesimpulan — warna lebih pekat |
| `.cs-panel` + `.cs-graph` | Diagram alur; posisi node diatur lewat `--c` (kolom) dan `--r` (baris). `.cs-node--success` / `.cs-node--danger` untuk node hijau/merah, `.cs-elbow--ld` + `.cs-flag--reject`/`--approve` untuk percabangan setuju-tolak |
| `.cs-tablewrap` + `.cs-table` | Tabel perbandingan, `.cs-yes` / `.cs-no` untuk warna |
| `.cs-cardrow` + `.cs-splitcard` | Dua card berdampingan (daftar bullet) |
| `.cs-cardrow` + `.cs-metric` | Dua (atau satu, tanpa `.cs-cardrow`) card statistik: label kecil, angka besar, catatan |
| `.cs-problem-grid` + `.cs-problemcard` | Grid 2 kolom untuk kartu masalah (label, judul, catatan) |
| `.cs-craft` + `.phone` | Mockup telepon yang di-scroll dan menyalakan step di sebelahnya |
| `.cs-mockup` + `.laptop` | Mockup laptop dengan slide yang main sendiri + klik palsu (lihat Interaksi) |
| `.cs-chart` + `.cs-bars` | Bar chart; tinggi bar dari `--h`, urutan animasi dari `--i` |

Tiap blok komponen dikasih class `cs-block` supaya jaraknya jadi 24px
(teks biasa 16px). Antar section 60px.

**Interaksi** (`assets/js/case-study.js`):

- Bar chart tumbuh dari nol saat masuk layar
- Mockup telepon di-scroll → step di sebelahnya ikut menyala
  (`data-stops` = posisi scroll 0–1 tempat tiap step dimulai)
- Hover bar chart → tooltip mengikuti kursor (`data-tip`)
- Mockup laptop main sendiri: ganti slide otomatis, dengan kursor +
  ripple palsu yang "mengklik" sebelum pindah slide. Diatur lewat
  `data-dwell="3000,2000,3000"` (ms tiap slide ditahan) dan
  `data-clicks="0:0.93,0.06 2:0.91,0.93"` (slide:x,y — rasio 0–1
  posisi klik di layar). Cuma jalan saat mockup-nya kelihatan di
  layar (`IntersectionObserver`), berhenti saat digulung lewat

Di layar kecil diagram alur dan tabel bisa digeser ke samping di dalam
kotaknya sendiri, halaman tidak ikut melebar.

---

## Navbar

- **LinkedIn** → https://www.linkedin.com/in/nugrahaekaputra/
- **Email** → tombol yang menyalin `nugrahaekaputra.id@gmail.com` ke clipboard
- **CV** → download `assets/docs/nugraha-eka-putra-cv.pdf`

Kalau alamat email atau CV berubah, ganti di keempat halaman HTML
(`data-copy-email` dan `href` tombol CV).

/* =========================================================
   Website Ulang Tahun untuk Mamah — script.js
   Semua pengaturan penting ada di bagian KONFIGURASI di bawah.
   ========================================================= */

"use strict";

/* ============================================================
   1) KONFIGURASI SUPABASE — WAJIB diisi agar buku tamu online
   ------------------------------------------------------------
   Cara mendapatkan URL & anon key: lihat README.md
   Catatan: gunakan ANON/PUBLIC key, BUKAN service role key.
   ============================================================ */
const SUPABASE_URL = "YOUR_SUPABASE_URL";           // contoh: "https://abcdxyz.supabase.co"
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"; // contoh: "eyJhbGciOiJIUzI1NiIs..."

/* ============================================================
   2) KONFIGURASI WEBSITE — ubah sesuai kebutuhan
   ============================================================ */
const CONFIG = {
  namaMamah: "Mamah",
  usia: 58,
  tanggalUlangTahun: "28 Agustus 2026",

  // Foto utama
  heroImage: "assets/images/mamah_1.jpg",   // foto besar di halaman pembuka
  aboutImage: "assets/images/mamah_2.jpg",  // foto di halaman "Tentang Mamah"

  // Musik latar (tidak autoplay; diputar setelah tombol musik ditekan)
  // Ganti sesuai nama file lagu di folder assets/music/
  musicFile: "assets/music/POTRET - Bunda.mp3",

  // Durasi tiap foto pada slideshow galeri (milidetik)
  slideDelay: 5000,

  // Kata sandi mode pengelola (menghapus ucapan kasar) — SEGERA GANTI ini!
  adminPassword: "mamah58",

  // Jumlah ucapan terbaru yang tampil di halaman beranda
  homeMessageCount: 6,

  // Isi "Surat dari Anak".
  // null  -> teks surat diambil dari index.html (bagian id="surat")
  // array -> mengganti isi surat dari sini, contoh:
  // surat: ["Selamat ulang tahun, Mamah.", "Terima kasih untuk semuanya."],
  surat: null,

  // Galeri kenangan — tambah/hapus/ganti sesuai foto di assets/images/
  galeri: [
    { src: "assets/images/mamah_1.jpg", caption: "Senyum yang tak pernah lekang oleh waktu" },
    { src: "assets/images/mamah_2.jpg", caption: "Kehangatan pelukan Mamah" },
    { src: "assets/images/mamah_3.jpg", caption: "Momen kebersamaan keluarga" },
    { src: "assets/images/mamah_4.jpg", caption: "Tawa yang menghangatkan hati" },
    { src: "assets/images/mamah_5.jpg", caption: "Perjalanan dan cerita di setiap langkah" },
    { src: "assets/images/mamah_6.jpg", caption: "Hari-hari sederhana yang berharga" },
    { src: "assets/images/mamah_7.jpg", caption: "Kasih sayang yang tumbuh setiap hari" },
    { src: "assets/images/mamah_8.jpg", caption: "Bahagia bersama orang-orang tercinta" },
    { src: "assets/images/mamah_9.jpg", caption: "Kenangan yang tersimpan dalam hati" },
    { src: "assets/images/mamah_10.jpg", caption: "Waktu bersama yang tak ternilai" },
    { src: "assets/images/mamah_11.jpg", caption: "Cinta yang tumbuh sepanjang waktu" },
    { src: "assets/images/mamah_12.jpg", caption: "Hangatnya kebersamaan di setiap musim" },
    { src: "assets/images/mamah_13.jpg", caption: "Doa yang selalu Mamah panjatkan" },
    { src: "assets/images/mamah_14.jpg", caption: "Senyum Mamah, rumah bagi kami semua" },
    { src: "assets/images/mamah_15.jpg", caption: "Setiap detik bersama Mamah berharga" },
    { src: "assets/images/mamah_16.jpg", caption: "Selamanya kenangan indah bersama Mamah" }
  ],

  // Buku tamu
  table: "birthday_messages",
  maxNama: 60,
  maxUcapan: 500
};

/* ============================================================
   3) HELPER
   ============================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function formatTanggal(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return h;
}

function getInitials(nama) {
  const parts = String(nama || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

/* ============================================================
   4) NOTIFIKASI (TOAST)
   ============================================================ */
const TOAST_ICONS = {
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};

function toast(message, type = "info", duration = 4500) {
  const container = $("#toastContainer");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</span><p>${escapeHtml(message)}</p>`;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 500);
  }, duration);
}

/* ============================================================
   5) KONFIGURASI DINAMIS + GALERI
   ============================================================ */
function applyConfig() {
  $$("[data-config]").forEach((el) => {
    const key = el.dataset.config;
    if (CONFIG[key] !== undefined && CONFIG[key] !== null) el.textContent = String(CONFIG[key]);
  });

  if (CONFIG.heroImage) { const img = $("#heroPhoto"); if (img) img.src = CONFIG.heroImage; }
  if (CONFIG.aboutImage) { const img = $("#aboutPhoto"); if (img) img.src = CONFIG.aboutImage; }

  if (Array.isArray(CONFIG.surat) && CONFIG.surat.length) {
    const body = $("#letterBody");
    if (body) body.innerHTML = CONFIG.surat.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  }

  document.title = `Selamat Ulang Tahun ke-${CONFIG.usia}, ${CONFIG.namaMamah}`;
}

const galeriItems = CONFIG.galeri;
let currentIndex = 0;
let slideTimer = null;
let lightboxOpen = false;

const ICON_EXPAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';

function buildGallery() {
  const wrap = $("#gallery");
  if (!wrap) return;
  wrap.innerHTML = galeriItems.map((item, i) => `
    <figure class="g-item reveal" style="--d:${((i % 4) * 0.08).toFixed(2)}s" data-index="${i}" tabindex="0" role="button" aria-label="Lihat foto: ${escapeHtml(item.caption)}">
      <img src="${item.src}" alt="${escapeHtml(item.caption)}" loading="lazy" />
      <figcaption class="g-overlay">
        <span class="g-icon">${ICON_EXPAND}</span>
        <span class="g-caption">${escapeHtml(item.caption)}</span>
      </figcaption>
    </figure>`).join("");

  wrap.addEventListener("click", (e) => {
    const item = e.target.closest(".g-item");
    if (item) openLightbox(Number(item.dataset.index));
  });
  wrap.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const item = e.target.closest(".g-item");
    if (item) { e.preventDefault(); openLightbox(Number(item.dataset.index)); }
  });
}

/* ============================================================
   6) SLIDESHOW GALERI
   Klik foto → musik otomatis diputar + foto berganti sendiri
   dengan transisi slide yang halus.
   ============================================================ */
function buildLightboxSlides() {
  const track = $("#lbTrack");
  const dots = $("#lbDots");
  if (!track || !galeriItems.length) return;
  track.innerHTML = galeriItems.map((item, i) => `
    <div class="lb-slide" data-index="${i}">
      <img src="${item.src}" alt="${escapeHtml(item.caption)}" />
    </div>`).join("");
  if (dots) {
    dots.innerHTML = galeriItems.map((_, i) =>
      `<button class="lb-dot" data-index="${i}" aria-label="Foto ${i + 1}"></button>`).join("");
    dots.addEventListener("click", (e) => {
      const dot = e.target.closest(".lb-dot");
      if (dot) goToSlide(Number(dot.dataset.index), true);
    });
  }
}

function updateSlideUI() {
  const track = $("#lbTrack");
  if (track) track.style.transform = `translateX(-${currentIndex * 100}%)`;
  const item = galeriItems[currentIndex];
  const cap = $("#lightboxCaption");
  if (cap && item) cap.textContent = item.caption;
  const count = $("#lightboxCount");
  if (count) count.textContent = `${currentIndex + 1} / ${galeriItems.length}`;
  $$("#lbDots .lb-dot").forEach((d, i) => d.classList.toggle("active", i === currentIndex));
}

function goToSlide(index, manual = false) {
  const total = galeriItems.length;
  if (!total) return;
  currentIndex = ((index % total) + total) % total;
  updateSlideUI();
  if (manual && lightboxOpen) startSlideTimer();
}

function startSlideTimer() {
  stopSlideTimer();
  slideTimer = setInterval(() => goToSlide(currentIndex + 1), CONFIG.slideDelay || 5000);
}

function stopSlideTimer() {
  if (slideTimer) { clearInterval(slideTimer); slideTimer = null; }
}

function startMusicForSlideshow() {
  const audio = $("#bgMusic");
  if (!audio || !audio.paused) return;
  const volume = $("#musicVolume");
  if (volume) audio.volume = Math.min(1, Math.max(0, volume.value / 100));
  const playing = audio.play();
  if (playing && playing.catch) {
    playing.catch(() => toast("Tekan tombol Musik di pojok kanan bawah untuk memutar lagu.", "info"));
  }
}

function openLightbox(index) {
  const lightbox = $("#lightbox");
  if (!lightbox || !galeriItems.length) return;
  lightboxOpen = true;
  currentIndex = ((index % galeriItems.length) + galeriItems.length) % galeriItems.length;
  updateSlideUI();
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  startSlideTimer();
  startMusicForSlideshow();
}

function closeLightbox() {
  const lightbox = $("#lightbox");
  if (!lightbox) return;
  lightboxOpen = false;
  stopSlideTimer();
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

function initLightbox() {
  const lightbox = $("#lightbox");
  if (!lightbox) return;
  buildLightboxSlides();
  const closeBtn = $("#lbClose");
  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
  const prevBtn = $("#lbPrev");
  if (prevBtn) prevBtn.addEventListener("click", () => goToSlide(currentIndex - 1, true));
  const nextBtn = $("#lbNext");
  if (nextBtn) nextBtn.addEventListener("click", () => goToSlide(currentIndex + 1, true));
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (!lightboxOpen) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") goToSlide(currentIndex - 1, true);
    else if (e.key === "ArrowRight") goToSlide(currentIndex + 1, true);
  });
  const track = $("#lbTrack");
  if (track) {
    let touchX = 0;
    track.addEventListener("touchstart", (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) goToSlide(currentIndex + (dx < 0 ? 1 : -1), true);
    }, { passive: true });
  }
}

/* ============================================================
   7) NAVBAR: EFEK SCROLL + MENU MOBILE
   ============================================================ */
function initNav() {
  const navbar = $("#navbar");
  const hamburger = $("#hamburger");
  const mobileMenu = $("#mobileMenu");
  if (!navbar || !hamburger || !mobileMenu) return;

  const onScroll = () => navbar.classList.toggle("scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const closeMobileMenu = () => {
    hamburger.classList.remove("open");
    mobileMenu.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  };

  hamburger.addEventListener("click", () => {
    const open = !mobileMenu.classList.contains("open");
    hamburger.classList.toggle("open", open);
    mobileMenu.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    mobileMenu.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("no-scroll", open);
  });

  $$(".mobile-link").forEach((link) => link.addEventListener("click", closeMobileMenu));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu.classList.contains("open")) closeMobileMenu();
  });
}

/* ============================================================
   8) ANIMASI REVEAL SAAT SCROLL
   ============================================================ */
function initReveal() {
  const els = $$(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("visible"); obs.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  els.forEach((el) => observer.observe(el));
}

/* ============================================================
   9) PARTIKEL MELAYANG (halus, sedikit)
   ============================================================ */
function buildParticles() {
  if (prefersReducedMotion) return;
  const wrap = $("#particles");
  if (!wrap) return;
  const colors = ["255,255,255", "236,72,153", "139,92,246", "249,168,212"];
  const count = window.innerWidth < 640 ? 10 : 16;
  for (let i = 0; i < count; i++) {
    const s = document.createElement("span");
    s.className = "particle";
    const size = 3 + Math.random() * 6;
    s.style.width = `${size.toFixed(1)}px`;
    s.style.height = `${size.toFixed(1)}px`;
    s.style.left = `${(Math.random() * 100).toFixed(2)}%`;
    s.style.background = `rgba(${colors[i % colors.length]},1)`;
    s.style.filter = `blur(${(Math.random() * 2).toFixed(1)}px)`;
    s.style.animationDuration = `${(16 + Math.random() * 18).toFixed(1)}s`;
    s.style.animationDelay = `${(-Math.random() * 30).toFixed(1)}s`;
    s.style.setProperty("--po", (0.08 + Math.random() * 0.22).toFixed(2));
    s.style.setProperty("--px", `${(Math.random() * 80 - 40).toFixed(0)}px`);
    wrap.appendChild(s);
  }
}

/* ============================================================
   10) MUSIK LATAR (tanpa autoplay)
   ============================================================ */
function initMusic() {
  const btn = $("#musicBtn");
  const audio = $("#bgMusic");
  const volume = $("#musicVolume");
  if (!btn || !audio) return;

  if (CONFIG.musicFile) audio.src = CONFIG.musicFile;

  const label = () => btn.querySelector(".music-label");
  const setIcon = () => {
    const icons = btn.querySelectorAll(".music-icon");
    if (!icons.length) return;
    const paused = audio.paused;
    icons[0].classList.toggle("hidden", !paused);
    icons[1].classList.toggle("hidden", paused);
  };
  const syncVolume = () => { if (volume) volume.value = String(Math.round((audio.volume || 0.7) * 100)); };

  btn.addEventListener("click", () => {
    if (audio.paused) {
      audio.volume = volume ? volume.value / 100 : 0.7;
      const p = audio.play();
      if (p && p.catch) p.catch(() => toast("Browser memblokir pemutaran musik. Coba tekan tombol musik sekali lagi.", "info"));
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => { setIcon(); if (label()) label().textContent = "Musik"; toast("Musik diputar. Semoga Mamah menyukainya.", "success", 2500); });
  audio.addEventListener("pause", () => { setIcon(); if (label()) label().textContent = "Musik"; });
  audio.addEventListener("error", () => toast("File musik tidak ditemukan: " + (CONFIG.musicFile || "-"), "error"));
  setIcon();
  if (volume) {
    syncVolume();
    volume.addEventListener("input", () => { audio.volume = volume.value / 100; });
  }
}

/* ============================================================
   11) REVEAL GALERI + ANIMASI KARTU DOA
   ============================================================ */
function observeAddedReveals() {
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    $$(".reveal:not(.visible)").forEach((el) => el.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("visible"); obs.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal:not(.visible)").forEach((el) => observer.observe(el));
}

/* ============================================================
   12) BUKU TAMU — SUPABASE
   ------------------------------------------------------------
   Jika SUPABASE_URL / SUPABASE_ANON_KEY belum diisi,
   website tetap berjalan dalam mode demo (pesan hanya
   tersimpan di browser ini dan tidak sync antar perangkat).
   ============================================================ */
let supabaseClient = null;

function initSupabase() {
  const configured = SUPABASE_URL && SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("YOUR_") && !SUPABASE_ANON_KEY.includes("YOUR_");
  if (!configured) {
    console.info("Buku tamu: mode demo. Isi SUPABASE_URL & SUPABASE_ANON_KEY di script.js untuk mengaktifkan penyimpanan online.");
    return null;
  }
  try {
    if (typeof window.supabase === "undefined" || !window.supabase.createClient) {
      console.warn("Supabase JS belum termuat — buku tamu berjalan dalam mode demo.");
      return null;
    }
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClient;
  } catch (err) {
    console.error("Gagal inisialisasi Supabase:", err);
    return null;
  }
}

const DEMO_KEY = "birthday_messages_demo";
let messagesCache = [];
let adminMode = false;

function getDemoMessages() {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDemoMessages(list) {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(list.slice(0, 100))); } catch { /* abaikan */ }
}

const TRASH_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';

function messageCard(msg, allowDelete = false) {
  const nama = escapeHtml(msg.nama || "Anonim");
  const ucapan = escapeHtml(msg.ucapan || "");
  const tanggal = escapeHtml(formatTanggal(msg.created_at) || "");
  const hue = hashString(msg.nama || "") % 360;
  const initials = escapeHtml(getInitials(msg.nama));
  const canDelete = allowDelete && adminMode && msg.id !== undefined && msg.id !== null;
  return `
    <article class="message-card reveal">
      <div class="message-head">
        <span class="message-avatar" style="--av:hsl(${hue} 65% 62%)">${initials}</span>
        <div>
          <h4 class="message-nama">${nama}</h4>
          <time class="message-tanggal">${tanggal}</time>
        </div>
        ${canDelete ? `<button type="button" class="message-delete" data-id="${escapeHtml(String(msg.id))}" aria-label="Hapus ucapan" title="Hapus ucapan">${TRASH_SVG}</button>` : ""}
      </div>
      <p class="message-ucapan">&ldquo;${ucapan}&rdquo;</p>
    </article>`;
}

function renderMessages() {
  // Daftar lengkap di halaman buku tamu
  const wrap = $("#messageList");
  if (wrap) {
    if (messagesCache.length === 0) {
      wrap.innerHTML = `<div class="messages-empty glass"><p>Belum ada ucapan. Jadilah yang pertama mengirim doa dan ucapan untuk Mamah.</p></div>`;
    } else {
      wrap.innerHTML = messagesCache.map((m) => messageCard(m, true)).join("");
    }
  }
  // Pratinjau ucapan terbaru di halaman beranda
  const home = $("#homeMessageList");
  if (home) {
    const items = messagesCache.slice(0, CONFIG.homeMessageCount || 6);
    const emptyNote = $("#homeMessagesEmpty");
    if (emptyNote) emptyNote.hidden = items.length > 0;
    home.innerHTML = items.map((m) => messageCard(m, false)).join("");
  }
  observeAddedReveals();
}

async function fetchMessages() {
  const wrap = $("#messageList");
  if (wrap) wrap.innerHTML = `<div class="messages-loading"><span class="loader"></span><p>Memuat ucapan...</p></div>`;
  const home = $("#homeMessageList");
  if (home) home.innerHTML = "";

  if (!supabaseClient) {
    messagesCache = getDemoMessages();
    renderMessages();
    return;
  }
  try {
    const { data, error } = await supabaseClient
      .from(CONFIG.table)
      .select("id, nama, ucapan, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    messagesCache = data || [];
    renderMessages();
  } catch (err) {
    console.error("Gagal memuat ucapan:", err);
    messagesCache = [];
    renderMessages();
    toast("Gagal memuat ucapan dari Supabase. Periksa koneksi atau konfigurasi Supabase.", "error");
  }
}

async function deleteMessage(id) {
  if (adminMode === false) return;
  try {
    if (supabaseClient) {
      const { error } = await supabaseClient.from(CONFIG.table).delete().eq("id", id);
      if (error) throw error;
    } else {
      saveDemoMessages(messagesCache.filter((m) => String(m.id) !== String(id)));
    }
    messagesCache = messagesCache.filter((m) => String(m.id) !== String(id));
    renderMessages();
    toast("Ucapan berhasil dihapus.", "success");
  } catch (err) {
    console.error("Gagal menghapus ucapan:", err);
    toast("Gagal menghapus ucapan. Pastikan policy delete Supabase sudah aktif.", "error");
  }
}

/* ============================================================
   13) FORM BUKU TAMU, MODE PENGELOLA + REALTIME
   ============================================================ */
function initGuestbookForm() {
  const form = $("#guestbookForm");
  if (!form) return;
  const namaInput = $("#nama");
  const ucapanInput = $("#ucapan");
  const submitBtn = $("#submitBtn");
  const namaCount = $("#namaCount");
  const ucapanCount = $("#ucapanCount");

  // Penghitung karakter
  if (namaInput && namaCount) {
    namaInput.addEventListener("input", () => { namaCount.textContent = `${namaInput.value.length}/${CONFIG.maxNama}`; });
  }
  if (ucapanInput && ucapanCount) {
    ucapanInput.addEventListener("input", () => { ucapanCount.textContent = `${ucapanInput.value.length}/${CONFIG.maxUcapan}`; });
  }

  const setLoading = (loading) => {
    if (!submitBtn) return;
    submitBtn.classList.toggle("loading", loading);
    submitBtn.disabled = loading;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nama = (namaInput?.value || "").trim();
    const ucapan = (ucapanInput?.value || "").trim();

    if (!nama) { toast("Nama wajib diisi.", "error"); namaInput?.focus(); return; }
    if (nama.length > CONFIG.maxNama) { toast(`Nama maksimal ${CONFIG.maxNama} karakter.`, "error"); return; }
    if (!ucapan) { toast("Ucapan wajib diisi.", "error"); ucapanInput?.focus(); return; }
    if (ucapan.length > CONFIG.maxUcapan) { toast(`Ucapan maksimal ${CONFIG.maxUcapan} karakter.`, "error"); return; }

    setLoading(true);
    try {
      if (supabaseClient) {
        const { error } = await supabaseClient
          .from(CONFIG.table)
          .insert([{ nama, ucapan }]);
        if (error) throw error;
        // Muat ulang daftar; di perangkat lain ucapan muncul lewat realtime
        await fetchMessages();
      } else {
        // Mode demo: simpan lokal, tampilkan tanpa reload
        const msg = { id: Date.now(), nama, ucapan, created_at: new Date().toISOString() };
        messagesCache.unshift(msg);
        saveDemoMessages(messagesCache);
        renderMessages();
      }
      form.reset();
      if (namaCount) namaCount.textContent = `0/${CONFIG.maxNama}`;
      if (ucapanCount) ucapanCount.textContent = `0/${CONFIG.maxUcapan}`;
      toast("Ucapan berhasil terkirim. Terima kasih telah mendoakan Mamah.", "success");
    } catch (err) {
      console.error("Gagal mengirim ucapan:", err);
      toast("Gagal mengirim ucapan. Silakan coba lagi.", "error");
    } finally {
      setLoading(false);
    }
  });

  // ---- Mode pengelola: aktifkan tombol hapus dengan kata sandi ----
  const adminBtn = $("#adminBtn");
  const adminPanel = $("#adminPanel");
  const adminPass = $("#adminPass");
  const adminOk = $("#adminOk");

  if (adminBtn && adminPanel) {
    adminBtn.addEventListener("click", () => {
      if (adminMode) {
        adminMode = false;
        adminBtn.classList.remove("active");
        renderMessages();
        toast("Mode pengelola dimatikan.", "info");
        return;
      }
      adminPanel.hidden = !adminPanel.hidden;
      if (adminPanel.hidden === false && adminPass) adminPass.focus();
    });

    const tryActivate = () => {
      const val = adminPass ? adminPass.value : "";
      if (val === CONFIG.adminPassword) {
        adminMode = true;
        adminPanel.hidden = true;
        if (adminPass) adminPass.value = "";
        adminBtn.classList.add("active");
        renderMessages();
        toast("Mode pengelola aktif — tombol hapus tersedia di setiap ucapan.", "success");
      } else {
        toast("Kata sandi salah.", "error");
      }
    };

    if (adminOk) adminOk.addEventListener("click", tryActivate);
    if (adminPass) {
      adminPass.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); tryActivate(); }
      });
    }
  }

  // ---- Tombol hapus ucapan (delegasi klik) ----
  const listWrap = $("#messageList");
  if (listWrap) {
    listWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".message-delete");
      if (btn === null) return;
      const id = btn.dataset.id;
      if (window.confirm("Hapus ucapan ini secara permanen?")) deleteMessage(id);
    });
  }
}

function subscribeRealtime() {
  if (!supabaseClient || !supabaseClient.channel) return;
  try {
    supabaseClient
      .channel("birthday_messages_stream")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: CONFIG.table }, (payload) => {
        const fresh = payload && payload.new;
        if (fresh === null || fresh === undefined) return;
        // Hindari duplikat (sudah dimuat lewat fetch)
        const exists = messagesCache.some((m) => fresh.id !== undefined && String(m.id) === String(fresh.id));
        if (exists) return;
        messagesCache.unshift(fresh);
        renderMessages();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") console.info("Realtime aktif: ucapan baru akan muncul otomatis.");
      });
  } catch (err) {
    console.warn("Realtime tidak tersedia:", err);
  }
}

/* ============================================================
   14) INISIALISASI
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  applyConfig();
  buildParticles();
  buildGallery();
  initNav();
  initReveal();
  initLightbox();
  initMusic();
  initGuestbookForm();

  initSupabase();
  fetchMessages();
  subscribeRealtime();

  // Tampilkan elemen yang sudah terlihat (galeri dirender setelah halaman siap)
  observeAddedReveals();
});

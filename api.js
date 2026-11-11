/* Pengganti google.script.run untuk halaman di GitHub Pages.
 * Halaman memanggil google.script.run.withSuccessHandler(..).namaFungsi(args)
 * seperti biasa; di sini dikirim ke Apps Script lewat fetch (POST, text/plain
 * supaya tidak memicu preflight CORS). */
(function () {
  var cfg = window.APP_CONFIG || {};
  var TIMEOUT_MS = 90000;

  // Buka sambungan ke Apps Script lebih awal (hemat sekitar 0,2-0,5 detik).
  try {
    var o = new URL(cfg.API_URL).origin;
    ['preconnect', 'dns-prefetch'].forEach(function (rel) {
      var l = document.createElement('link'); l.rel = rel; l.href = o;
      if (rel === 'preconnect') l.crossOrigin = '';
      document.head.appendChild(l);
    });
  } catch (e) { }

  function call(fn, args, ok, fail) {
    function gagal(msg) { if (fail) fail(new Error(msg)); else if (window.console) console.error(msg); }
    if (!cfg.API_URL || /^GANTI/.test(cfg.API_URL)) { gagal('API_URL belum diisi di config.js'); return; }

    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;

    fetch(cfg.API_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: fn, args: args }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { return r.text(); })
      .then(function (txt) {
        if (timer) clearTimeout(timer);
        var j;
        try { j = JSON.parse(txt); } catch (e) {
          gagal('Respons server tidak valid. Pastikan deployment Apps Script berakses "Siapa saja" dan URL di config.js benar.');
          return;
        }
        if (j && j.ok) { if (ok) ok(j.result); }
        else gagal((j && j.error) || 'Server mengembalikan kesalahan.');
      })
      .catch(function (err) {
        if (timer) clearTimeout(timer);
        gagal('Koneksi gagal: ' + (err && err.message ? err.message : err));
      });
  }

  function makeRunner(ok, fail) {
    var base = {
      withSuccessHandler: function (fn) { return makeRunner(fn, fail); },
      withFailureHandler: function (fn) { return makeRunner(ok, fn); }
    };
    return new Proxy(base, {
      get: function (t, prop) {
        if (typeof prop !== 'string') return undefined;
        if (prop in t) return t[prop];
        return function () { call(prop, Array.prototype.slice.call(arguments), ok, fail); };
      }
    });
  }

  window.google = {
    script: {
      run: makeRunner(null, null),
      url: {
        getLocation: function (cb) {
          var p = {};
          try { new URLSearchParams(location.search).forEach(function (v, k) { p[k] = v; }); } catch (e) { }
          cb({ parameter: p, parameters: {}, hash: (location.hash || '').replace(/^#/, ''), queryString: (location.search || '').replace(/^\?/, '') });
        }
      }
    }
  };
})();

/* ===== Popup (pengganti confirm / alert / prompt bawaan browser) =====
 * Popup.tanya(pesan, {judul, ok, batal, bahaya, ikon}, function () { ...dijalankan jika OK })
 * Popup.info(pesan, {judul, ikon})
 * Popup.isi(pesan, {judul, ok, batal, placeholder, wajib}, function (teks) { ... }) */
(function () {
  if (window.Popup) return;
  var css = '.pp-bg{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(10,16,34,.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;transition:opacity .16s}' +
    '.pp-bg.on{opacity:1}' +
    '.pp-box{width:100%;max-width:340px;background:#fff;color:#14213D;border-radius:26px;padding:24px 20px 16px;box-shadow:0 24px 60px rgba(0,0,0,.35);text-align:center;transform:translateY(14px) scale(.94);transition:transform .2s cubic-bezier(.2,.9,.3,1.2);font-family:inherit}' +
    '.pp-bg.on .pp-box{transform:none}' +
    '.pp-ic{width:58px;height:58px;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;background:#e8efff;color:#1d4ed8}' +
    '.pp-ic svg{width:30px;height:30px}' +
    '.pp-ic.bahaya{background:#fee2e2;color:#dc2626}.pp-ic.ok{background:#dcfce7;color:#16a34a}.pp-ic.warn{background:#fef3c7;color:#d97706}' +
    '.pp-t{font-size:18px;font-weight:800;margin:0 0 6px}' +
    '.pp-m{font-size:14px;line-height:1.5;color:#5B6475;font-weight:600;white-space:pre-line;word-break:break-word;margin:0}' +
    '.pp-rc{margin:12px 0 0;padding:10px 12px;border-radius:14px;background:#f1f4fa;border-left:4px solid #dc2626;text-align:left;font-size:13px;line-height:1.45;font-weight:700;word-break:break-word;white-space:pre-line;max-height:120px;overflow:auto}.pp-rc small{display:block;font-weight:600;color:#5B6475;margin-bottom:2px}' +
    '.pp-in{width:100%;box-sizing:border-box;margin-top:12px;border:1.5px solid #D5DBE8;border-radius:14px;padding:11px 12px;font-size:14px;font-weight:600;line-height:1.4;font-family:inherit;color:inherit;background:transparent;resize:vertical;min-height:84px}' +
    '.pp-in:focus{outline:0;border-color:#1d4ed8}' +
    '.pp-bt{display:flex;gap:10px;margin-top:18px}' +
    '.pp-bt button{flex:1;min-height:46px;border:0;border-radius:15px;font-size:14.5px;font-weight:800;font-family:inherit;cursor:pointer;background:#eef1f7;color:#334155}' +
    '.pp-bt button.pp-ok{background:linear-gradient(135deg,#1e3a8a,#1d4ed8);color:#fff;box-shadow:0 8px 18px rgba(29,78,216,.3)}' +
    '.pp-bt button.pp-ok.bahaya{background:linear-gradient(135deg,#b91c1c,#dc2626);box-shadow:0 8px 18px rgba(220,38,38,.3)}' +
    '.pp-bt button:active{transform:scale(.97)}' +
    '@media (prefers-color-scheme:dark){.pp-rc{background:rgba(255,255,255,.07)}.pp-rc small{color:#A8AFBF}.pp-box{background:#1c1c24;color:#F2F2F7;box-shadow:0 24px 60px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.08)}.pp-m{color:#A8AFBF}.pp-ic{background:rgba(59,130,246,.2);color:#9DB7FF}.pp-ic.bahaya{background:rgba(239,68,68,.2);color:#FCA5A5}.pp-ic.ok{background:rgba(34,197,94,.2);color:#5EE08A}.pp-ic.warn{background:rgba(245,158,11,.2);color:#FBBF4D}.pp-in{border-color:rgba(255,255,255,.18)}.pp-bt button{background:rgba(255,255,255,.09);color:#E2E8F0}}' +
    '@media (prefers-reduced-motion:reduce){.pp-bg,.pp-box{transition:none}}';
  var IK = {
    tanya: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/></svg>',
    bahaya: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l9 16H3L12 4zM12 10v4M12 17.5h.01"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>'
  };
  function gaya() { if (document.getElementById('ppCss')) return; var s = document.createElement('style'); s.id = 'ppCss'; s.textContent = css; document.head.appendChild(s); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function buka(o) {
    gaya();
    var lama = document.activeElement;
    var bg = document.createElement('div'); bg.className = 'pp-bg'; bg.setAttribute('role', 'dialog'); bg.setAttribute('aria-modal', 'true');
    var tipe = o.bahaya ? 'bahaya' : (o.tipe || '');
    bg.innerHTML = '<div class="pp-box"><div class="pp-ic ' + tipe + '">' + (IK[o.ikon || (o.bahaya ? 'bahaya' : (o.tipe || 'tanya'))] || IK.tanya) + '</div>' +
      '<h3 class="pp-t">' + esc(o.judul) + '</h3><p class="pp-m">' + esc(o.pesan) + '</p>' +
      (o.rincian ? '<div class="pp-rc">' + (o.rincianJudul ? '<small>' + esc(o.rincianJudul) + '</small>' : '') + esc(o.rincian) + '</div>' : '') +
      (o.isi ? (o.sandi ? '<input type="password" inputmode="numeric" autocomplete="off" class="pp-in" style="min-height:0" placeholder="' + esc(o.placeholder || '') + '">' : '<textarea class="pp-in" placeholder="' + esc(o.placeholder || '') + '"></textarea>') : '') +
      '<div class="pp-bt">' + (o.batal === false ? '' : '<button type="button" class="pp-no">' + esc(o.batal || 'Batal') + '</button>') +
      '<button type="button" class="pp-ok ' + (o.bahaya ? 'bahaya' : '') + '">' + esc(o.ok || 'Oke') + '</button></div></div>';
    document.body.appendChild(bg);
    var ta = bg.querySelector('.pp-in'), tutup = false;
    function selesai(ya) {
      if (tutup) return; tutup = true;
      var v = ta ? ta.value.trim() : '';
      if (ya && o.isi && o.wajib && !v) { tutup = false; ta.focus(); ta.style.borderColor = '#dc2626'; return; }
      document.removeEventListener('keydown', kunci, true);
      bg.classList.remove('on'); setTimeout(function () { if (bg.parentNode) bg.parentNode.removeChild(bg); }, 170);
      document.body.style.overflow = oldOv;
      try { if (lama && lama.focus) lama.focus(); } catch (e) { }
      if (ya && o.cb) o.cb(v);
    }
    function kunci(e) { if (e.key === 'Escape') { e.preventDefault(); } else if (e.key === 'Enter' && (!ta || ta.tagName === 'INPUT')) { e.preventDefault(); selesai(true); } }
    var oldOv = document.body.style.overflow; document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', kunci, true);
    var no = bg.querySelector('.pp-no'); if (no) no.addEventListener('click', function () { selesai(false); });
    bg.querySelector('.pp-ok').addEventListener('click', function () { selesai(true); });
    requestAnimationFrame(function () { bg.classList.add('on'); (ta || bg.querySelector('.pp-ok')).focus(); });
  }
  window.Popup = {
    tanya: function (pesan, opt, cb) { opt = opt || {}; opt.pesan = pesan; opt.cb = cb; opt.judul = opt.judul || (opt.bahaya ? 'Hapus data ini?' : 'Konfirmasi'); buka(opt); },
    info: function (pesan, opt) { opt = opt || {}; opt.pesan = pesan; opt.batal = false; opt.judul = opt.judul || 'Perhatian'; opt.tipe = opt.tipe || 'warn'; opt.ikon = opt.ikon || 'warn'; buka(opt); },
    isi: function (pesan, opt, cb) { opt = opt || {}; opt.pesan = pesan; opt.cb = cb; opt.isi = true; opt.ikon = opt.ikon || 'edit'; opt.judul = opt.judul || 'Catatan'; buka(opt); }
  };
})();

/* ===== Foto: gambar kecil + penampil layar penuh yang bisa digeser =====
 * Foto.strip(daftarTautan, ukuranPx) -> HTML deretan gambar kecil (ketuk = buka penampil)
 * Foto.buka(daftarTautan, indeks)     -> buka penampil langsung */
(function () {
  if (window.Foto) return;
  var css = '.ft-row{display:flex;gap:6px;flex-wrap:wrap}' +
    '.ft-th{width:56px;height:56px;padding:0;border:0;border-radius:12px;overflow:hidden;background:#dbe3f3;position:relative;flex-shrink:0;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.18)}' +
    '.ft-th img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.ft-th.err img{display:none}.ft-th.err::after{content:"\\1F5BC";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:22px;color:#64748b}' +
    '.ft-th b{position:absolute;right:3px;bottom:3px;background:rgba(0,0,0,.65);color:#fff;font-size:10px;font-weight:800;padding:1px 6px;border-radius:99px}' +
    '@media (prefers-color-scheme:dark){.ft-th{background:#2a2f3d}}' +
    '.fv{position:fixed;inset:0;z-index:100000;background:#05070d;display:flex;flex-direction:column;opacity:0;transition:opacity .15s;color:#fff;font-family:inherit}.fv.on{opacity:1}' +
    '.fv-top{display:flex;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top,0px)) 14px 10px}' +
    '.fv-top .fv-n{flex:1;font-size:14px;font-weight:800}' +
    '.fv-top a,.fv-top button{min-height:40px;padding:0 14px;border:0;border-radius:12px;background:rgba(255,255,255,.14);color:#fff;font-size:13px;font-weight:800;text-decoration:none;display:inline-flex;align-items:center;font-family:inherit;cursor:pointer}' +
    '.fv-sc{flex:1;min-height:0;display:flex;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none}.fv-sc::-webkit-scrollbar{display:none}' +
    '.fv-s{flex:0 0 100%;scroll-snap-align:center;display:flex;align-items:center;justify-content:center;overflow:auto;padding:4px;position:relative}' +
    '.fv-s img{max-width:100%;max-height:100%;object-fit:contain;transition:transform .2s;touch-action:pan-x pan-y pinch-zoom;user-select:none;-webkit-user-drag:none}' +
    '.fv-s.z img{transform:scale(2.4);max-width:none;max-height:none;cursor:zoom-out}' +
    '.fv-s.err::after{content:"Foto tidak bisa ditampilkan.\\A Ketuk \\201CBuka di Drive\\201D di atas.";white-space:pre;text-align:center;color:#A8AFBF;font-weight:700;font-size:14px;line-height:1.6;position:absolute}' +
    '.fv-s.err img{display:none}' +
    '.fv-dt{display:flex;justify-content:center;gap:7px;padding:10px 0 calc(16px + env(safe-area-inset-bottom,0px))}.fv-dt i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.3)}.fv-dt i.on{background:#fff;width:20px;border-radius:99px}' +
    '.fv-ar{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border:0;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font-size:22px;font-weight:800;cursor:pointer;display:none}.fv-ar.l{left:10px}.fv-ar.r{right:10px}' +
    '@media (hover:hover) and (pointer:fine){.fv-ar{display:block}}' +
    '@media (prefers-reduced-motion:reduce){.fv,.fv-s img{transition:none}}';
  function gaya() { if (document.getElementById('ftCss')) return; var s = document.createElement('style'); s.id = 'ftCss'; s.textContent = css; document.head.appendChild(s); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function aman(v) { v = String(v || '').trim(); return /^https?:\/\/\S+$/i.test(v) ? v : ''; }
  function idDrive(u) { var m = /\/d\/([\w-]+)/.exec(u) || /[?&]id=([\w-]+)/.exec(u); return m ? m[1] : ''; }
  function gbr(u, w) { var id = idDrive(u); return id ? 'https://drive.google.com/thumbnail?id=' + id + '&sz=w' + w : u; }
  function daftar(l) { return (Array.isArray(l) ? l : String(l || '').split(/\s+/)).map(aman).filter(function (x) { return x; }); }
  function strip(l, px) {
    var ls = daftar(l); if (!ls.length) return ''; gaya();
    var w = px || 56, tampil = ls.slice(0, 4);
    return '<div class="ft-row">' + tampil.map(function (u, i) {
      return '<button type="button" class="ft-th" style="width:' + w + 'px;height:' + w + 'px" data-fl="' + esc(ls.join(' ')) + '" data-fi="' + i + '" aria-label="Lihat foto ' + (i + 1) + ' dari ' + ls.length + '"><img loading="lazy" alt="" src="' + esc(gbr(u, 300)) + '" onerror="this.parentNode.classList.add(\'err\')">' + (i === 3 && ls.length > 4 ? '<b>+' + (ls.length - 4) + '</b>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function buka(l, idx) {
    var ls = daftar(l); if (!ls.length) return; gaya();
    var lama = document.activeElement, oldOv = document.body.style.overflow;
    var v = document.createElement('div'); v.className = 'fv'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', 'Penampil foto');
    v.innerHTML = '<div class="fv-top"><span class="fv-n"></span><a target="_blank" rel="noopener">Buka di Drive</a><button type="button" class="fv-x">Tutup</button></div>' +
      '<div class="fv-sc">' + ls.map(function (u) { return '<div class="fv-s"><img alt="" src="' + esc(gbr(u, 1600)) + '" draggable="false"></div>'; }).join('') + '</div>' +
      (ls.length > 1 ? '<button type="button" class="fv-ar l" aria-label="Sebelumnya">‹</button><button type="button" class="fv-ar r" aria-label="Berikutnya">›</button>' : '') +
      '<div class="fv-dt">' + (ls.length > 1 ? ls.map(function () { return '<i></i>'; }).join('') : '') + '</div>';
    document.body.appendChild(v); document.body.style.overflow = 'hidden';
    var sc = v.querySelector('.fv-sc'), sl = v.querySelectorAll('.fv-s'), dt = v.querySelectorAll('.fv-dt i'), no = v.querySelector('.fv-n'), lk = v.querySelector('.fv-top a'), cur = -1;
    function tampil(i) {
      if (i === cur) return; cur = i; no.textContent = 'Foto ' + (i + 1) + ' / ' + ls.length; lk.href = ls[i];
      for (var k = 0; k < dt.length; k++) dt[k].className = k === i ? 'on' : '';
    }
    function ke(i) { i = Math.max(0, Math.min(ls.length - 1, i)); sc.scrollTo({ left: i * sc.clientWidth, behavior: 'smooth' }); }
    sc.addEventListener('scroll', function () { tampil(Math.round(sc.scrollLeft / Math.max(1, sc.clientWidth))); }, { passive: true });
    for (var q = 0; q < sl.length; q++) (function (s) {
      var im = s.querySelector('img'); im.addEventListener('error', function () { s.classList.add('err'); });
      var tap = 0; s.addEventListener('click', function () { var n = Date.now(); if (n - tap < 320) { s.classList.toggle('z'); if (!s.classList.contains('z')) { s.scrollLeft = 0; s.scrollTop = 0; } } tap = n; });
    })(sl[q]);
    function tutup() { document.removeEventListener('keydown', kunci, true); v.classList.remove('on'); setTimeout(function () { if (v.parentNode) v.parentNode.removeChild(v); }, 160); document.body.style.overflow = oldOv; try { if (lama && lama.focus) lama.focus(); } catch (e) { } }
    function kunci(e) { if (e.key === 'Escape') { e.preventDefault(); tutup(); } else if (e.key === 'ArrowLeft') ke(cur - 1); else if (e.key === 'ArrowRight') ke(cur + 1); }
    document.addEventListener('keydown', kunci, true);
    v.querySelector('.fv-x').addEventListener('click', tutup);
    var al = v.querySelector('.fv-ar.l'), ar = v.querySelector('.fv-ar.r'); if (al) { al.addEventListener('click', function () { ke(cur - 1); }); ar.addEventListener('click', function () { ke(cur + 1); }); }
    var mulai = Math.max(0, Math.min(ls.length - 1, idx || 0));
    requestAnimationFrame(function () { v.classList.add('on'); sc.scrollLeft = mulai * sc.clientWidth; tampil(mulai); v.querySelector('.fv-x').focus(); });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.ft-th'); if (!b) return;
    e.preventDefault(); buka(b.getAttribute('data-fl'), +b.getAttribute('data-fi') || 0);
  });
  window.Foto = { strip: strip, buka: buka, aman: aman };
})();

/* Menu "Kelas" di bilah bawah (disisipkan otomatis di semua halaman yang punya menu bawah). */
(function () {
  function pasang() {
    var row = document.querySelector('.bnav .bn-row');
    if (!row || document.getElementById('navKelasLink') || document.getElementById('navKelas')) return;
    var adm = document.getElementById('navAdminLink') || document.getElementById('navAdmin');
    if (!adm) return;
    var ref = adm.previousElementSibling || adm;
    var el = document.createElement(ref.tagName === 'BUTTON' ? 'button' : 'a');
    if (el.tagName === 'BUTTON') el.type = 'button'; else el.href = '#';
    el.id = 'navKelas';
    el.innerHTML = '<span class="ni"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20h18"/><path d="M5 20V9l7-5 7 5v11"/><path d="M10 20v-5h4v5"/></svg></span>Kelas';
    row.insertBefore(el, adm);
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var k = '', d = '';
      try { var qs = new URLSearchParams(location.search); k = qs.get('kode') || localStorage.getItem('absensi_guru_terakhir') || ''; d = qs.get('dev') || localStorage.getItem('absensi_device_id') || ''; } catch (x) { }
      location.href = 'kelas.html?kode=' + encodeURIComponent(k) + '&dev=' + encodeURIComponent(d);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pasang); else pasang();
})();

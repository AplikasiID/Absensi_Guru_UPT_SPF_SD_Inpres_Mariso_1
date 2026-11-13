/* SMART Mariso 1 - tambahan tampilan laptop. Hanya bekerja di layar >= 1100px; di HP tidak melakukan apa pun. */
(function () {
  var mq = window.matchMedia ? window.matchMedia('(min-width: 1100px)') : null;
  if (!mq) return;
  var done = false;
  function $(id) { return document.getElementById(id); }
  function jalan() {
    if (done || !mq.matches) return;
    if (document.documentElement.classList.contains('emb')) return;  // Pengaturan di dalam iframe: tanpa sidebar
    done = true;
    // Logo sekolah: ambil dari banner, taruh di sidebar (CSS menyembunyikan logo di banner).
    var bnavEl = document.querySelector('.bnav');
    var lg = document.querySelector('.ban-top > img, .brand-row > img, .bt > img');
    if (bnavEl && lg && !bnavEl.querySelector('.dsk-logo')) {
      var im = document.createElement('img'); im.className = 'dsk-logo'; im.alt = ''; im.src = lg.getAttribute('src');
      bnavEl.insertBefore(im, bnavEl.firstChild);
    }
    // Halaman utama: tab pertama disebut "Beranda" + catatan bahwa absen dilakukan dari HP.
    var nav = $('navAbsen') || document.querySelector('.bn-row a[href="index.html"]');
    if (nav) {
      var n = nav.lastChild; while (n && !(n.nodeType === 3 && n.nodeValue.trim())) n = n.previousSibling;
      if (n) n.nodeValue = 'Beranda'; else { var sp = document.createElement('span'); sp.textContent = 'Beranda'; nav.appendChild(sp); }
      var va = $('viewAbsen');  // hanya ada di halaman utama
      if (va && !$('dskNote')) { var d = document.createElement('div'); d.id = 'dskNote'; d.className = 'dsk-note'; d.textContent = 'Absen Masuk, Absen Pulang, dan absen siswa dilakukan dari HP. Di laptop kamu bisa melihat data, mengisi jurnal, dan mencetak laporan.'; va.parentNode.insertBefore(d, va); }
    }
    // "Sambungkan HP": baris di halaman utama dipindah jadi menu di sidebar (muncul hanya kalau izin laptop ON).
    var rowL = $('lnkLaptopRow'), lnkL = $('lnkLaptop'), rowNav = document.querySelector('.bnav .bn-row');
    if (rowL && lnkL && rowNav && !$('dskLaptop')) {
      var bl = document.createElement('button'); bl.type = 'button'; bl.id = 'dskLaptop'; bl.style.display = 'none';
      bl.innerHTML = '<span class="ni"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="11" rx="2"/><path d="M2 20h20"/></svg></span>Sambungkan HP';
      rowNav.appendChild(bl);
      bl.addEventListener('click', function () { lnkL.click(); });
      var selaras = function () { bl.style.display = (rowL.style.display === 'none') ? 'none' : ''; };
      new MutationObserver(selaras).observe(rowL, { attributes: true, attributeFilter: ['style'] });
      selaras();
    }
    keluarLaptop();
    berandaLaptop();
    // Menu admin di sidebar.
    var na = $('navAdmin'), bn = $('bnav');
    if (na && bn && window.admSub) {
      var box = document.createElement('div'); box.className = 'dsk-adm'; box.id = 'dskAdm';
      var item = [['pan', 'Pantauan'], ['ds', 'Dashboard Siswa'], ['kl', 'Kelas & Siswa'], ['rek', 'Ringkasan Sekolah'], ['lap', 'Verifikasi Laporan'], ['aj', 'Perangkat Ajar'], ['dev', 'Perangkat Guru'], ['pengaturan', 'Pengaturan']];
      box.innerHTML = item.map(function (x) { return '<button type="button" data-k="' + x[0] + '">' + x[1] + '</button>'; }).join('');
      na.parentNode.insertBefore(box, na.nextSibling);
      box.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return; var k = b.getAttribute('data-k');
        if (k === 'pengaturan') { location.href = 'pengaturan.html'; return; }
        if (!document.body.classList.contains('mode-admin')) na.click();
        window.admSub(k);
      });
      function sinkron() {
        var a = document.body.classList.contains('mode-admin') && na.style.display !== 'none';
        box.classList.toggle('on', a);
        var t = !!window.__admTerbatas;
        [].forEach.call(box.children, function (b) { var k = b.getAttribute('data-k'); b.style.display = (t && (k === 'dev' || k === 'pengaturan')) ? 'none' : ''; });
        var aktif = ''; ['Pan', 'Ds', 'Kl', 'Rek', 'Lap', 'Aj', 'Dev'].forEach(function (p) { var el = $('admPane' + p); if (el && el.classList.contains('on')) aktif = p.toLowerCase(); });
        [].forEach.call(box.children, function (b) { b.classList.toggle('on', b.getAttribute('data-k') === aktif); });
      }
      new MutationObserver(sinkron).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: false });
      var pn = $('viewAdmin'); if (pn) new MutationObserver(sinkron).observe(pn, { attributes: true, subtree: true, attributeFilter: ['class'] });
      na.addEventListener('click', function () { setTimeout(function () { if (mq.matches && !window.__admTerbatas && window.__admPin) window.admSub('pan'); sinkron(); }, 30); });
      sinkron();
    }
  }

  // Tombol "Keluar dari laptop ini": hanya muncul di perangkat yang terdaftar sebagai laptop (bukan HP utama).
  function keluarLaptop() {
    var bn = $('bnav'); if (!bn || $('dskKeluar') || !(window.google && google.script && google.script.run)) return;
    var kode = '', dev = '';
    try { kode = localStorage.getItem('absensi_guru_terakhir') || ''; dev = localStorage.getItem('absensi_device_id') || ''; } catch (e) { }
    if (!kode || !dev) return;
    function tampil(nama) {
      var b = document.createElement('button'); b.type = 'button'; b.id = 'dskKeluar'; b.className = 'dsk-keluar';
      b.innerHTML = '<span>Keluar dari laptop ini</span><small>' + String(nama || '').replace(/[&<>"]/g, '') + '</small>';
      var cr = bn.querySelector('.bn-credit'); if (cr) bn.insertBefore(b, cr); else bn.appendChild(b);
      b.onclick = function () {
        if (!confirm('Keluar dari laptop ini?\n\nLaptop akan dilepas dari akun ' + (nama || kode) + '. Untuk masuk lagi, pindai QR dari HP utama.')) return;
        b.disabled = true;
        google.script.run.withSuccessHandler(function (r) {
          if (r && r.ok) { try { localStorage.removeItem('absensi_guru_terakhir'); sessionStorage.removeItem('sm1_lp'); } catch (e) { } location.href = 'laptop.html'; }
          else { b.disabled = false; alert((r && r.message) || 'Gagal keluar. Coba lagi.'); }
        }).withFailureHandler(function () { b.disabled = false; alert('Tidak bisa terhubung ke server. Coba lagi.'); }).lepasLaptopSendiri(kode, dev);
      };
    }
    var cache = null; try { cache = JSON.parse(sessionStorage.getItem('sm1_lp') || 'null'); } catch (e) { }
    if (cache && cache.k === kode && cache.d === dev && Date.now() - cache.t < 600000) { if (cache.n) tampil(cache.nama); return; }
    google.script.run.withSuccessHandler(function (r) {
      var n = !!(r && r.ok && r.iniTambahan);
      try { sessionStorage.setItem('sm1_lp', JSON.stringify({ k: kode, d: dev, t: Date.now(), n: n, nama: r && r.nama })); } catch (e) { }
      if (n) tampil(r.nama);
    }).infoLaptopGuru(kode, dev);
  }
  // Beranda laptop: kartu angka + Jurnal hari ini + Riwayat absen (hanya membaca data yang sudah ada).
  function berandaLaptop() {
    var va = $('viewAbsen'), sel = $('guruSelect');
    if (!va || !sel || $('dskDash')) return;
    var GR = window.google && window.google.script && window.google.script.run;
    if (!GR) return;
    var box = document.createElement('div'); box.id = 'dskDash'; box.className = 'dsk-dash'; box.style.display = 'none';
    va.parentNode.insertBefore(box, va);
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function dev() { try { return localStorage.getItem('absensi_device_id') || ''; } catch (e) { return ''; } }
    function panggil(fn, args, cb) {
      try { var r = GR.withSuccessHandler(function (x) { cb(x && x.ok !== false ? x : null); }).withFailureHandler(function () { cb(null); }); r[fn].apply(r, args); } catch (e) { cb(null); }
    }
    var D = {}, last = '', lnkKelas = (document.querySelector('.bn-row a[href^="kelas.html"]') || {}).href || 'kelas.html';
    var lnkRiw = (document.querySelector('.bn-row a[href^="riwayat.html"]') || {}).href || 'riwayat.html';
    function gambar() {
      var r = D.riw && D.riw.ringkasan || {}, js = D.jur && D.jur.items || [], hari = D.jur && D.jur.hariIni || '';
      var hariIni = js.filter(function (j) { return j.tanggal === hari; });
      var siswa = '-';
      if (D.kls && D.kls.tampil !== false) { siswa = 0; (D.kls.kelas || []).forEach(function (k) { if (k.saya) siswa += (k.jumlahSiswa || 0); }); }
      var ik = function (p) { return '<span class="dd-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg></span>'; };
      var st = function (ic, n, t) { return '<div class="dd-st">' + ik(ic) + '<div><b>' + esc(n) + '</b><span>' + t + '</span></div></div>'; };
      var h = '<div class="dd-stats">' +
        st('<path d="M5 12l5 5L20 7"/>', (r.hadir || 0) + (r.terlambat || 0), 'Hari hadir bulan ini') +
        st('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6"/>', js.length, 'Jurnal bulan ini') +
        st('<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M16 5a3 3 0 010 6M18 15c2 .6 3 2.2 3 5"/>', siswa, 'Siswa di kelas saya') + '</div>';
      h += '<div class="dd-cols"><div class="dd-card"><h3>Jurnal mengajar hari ini</h3>';
      if (!hariIni.length) h += '<p class="dd-nol">Belum ada jurnal yang diisi hari ini.</p>';
      else hariIni.forEach(function (j) { h += '<div class="dd-row"><i>' + esc(String(j.kelas).replace(/\D/g, '') ? 'K' + String(j.kelas).replace(/\D/g, '') : 'K') + '</i><div><b>' + esc(j.kelas) + ' · ' + esc(j.mapel) + '</b><small>Jam ke-' + esc(j.jamKe) + ' · ' + esc(j.cara) + '</small></div><span class="dd-ok">Jurnal terisi</span></div>'; });
      h += '<a class="dd-btn" href="' + esc(lnkKelas) + '">Buka Jurnal Mengajar</a></div><div class="dd-side"><div class="dd-card"><h3>Riwayat absen saya</h3><p class="dd-sub">Bulan ini</p><div class="dd-chips"><span class="c1">Hadir ' + (r.hadir || 0) + '</span><span class="c2">Terlambat ' + (r.terlambat || 0) + '</span><span class="c4">Izin ' + (r.izin || 0) + '</span><span class="c3">Alpa ' + (r.alpa || 0) + '</span></div><a class="dd-btn" href="' + esc(lnkRiw) + '">Lihat riwayat lengkap</a></div>';
      h += '</div></div>';
      box.innerHTML = h; box.style.display = '';
    }
    function muat() {
      var kode = sel.value, d = dev(); D = {};
      if (!kode || !d) { box.style.display = 'none'; return; }
      var t = new Date(), bln = t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2), n = 3;
      function sel1() { if (--n === 0 && sel.value === kode) gambar(); }
      panggil('getRiwayatAbsen', [kode, d, bln], function (x) { D.riw = x; sel1(); });
      panggil('getJurnalGuru', [kode, d, bln], function (x) { D.jur = x; sel1(); });
      panggil('getKelasGuru', [kode, d], function (x) { D.kls = x; sel1(); });
    }
    setInterval(function () { if (sel.value !== last) { last = sel.value; muat(); } }, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', jalan); else jalan();
  if (mq.addEventListener) mq.addEventListener('change', jalan);
})();

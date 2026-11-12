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
    // Menu admin di sidebar.
    var na = $('navAdmin'), bn = $('bnav');
    if (na && bn && window.admSub) {
      var box = document.createElement('div'); box.className = 'dsk-adm'; box.id = 'dskAdm';
      var item = [['pan', 'Pantauan'], ['kl', 'Kelas & Siswa'], ['rek', 'Ringkasan Sekolah'], ['lap', 'Verifikasi Laporan'], ['aj', 'Perangkat Ajar'], ['dev', 'Perangkat Guru'], ['pengaturan', 'Pengaturan']];
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
        var aktif = ''; ['Pan', 'Kl', 'Rek', 'Lap', 'Aj', 'Dev'].forEach(function (p) { var el = $('admPane' + p); if (el && el.classList.contains('on')) aktif = p.toLowerCase(); });
        [].forEach.call(box.children, function (b) { b.classList.toggle('on', b.getAttribute('data-k') === aktif); });
      }
      new MutationObserver(sinkron).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: false });
      var pn = $('viewAdmin'); if (pn) new MutationObserver(sinkron).observe(pn, { attributes: true, subtree: true, attributeFilter: ['class'] });
      na.addEventListener('click', function () { setTimeout(function () { if (mq.matches && !window.__admTerbatas && window.__admPin) window.admSub('pan'); sinkron(); }, 30); });
      sinkron();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', jalan); else jalan();
  if (mq.addEventListener) mq.addEventListener('change', jalan);
})();

/* Menu bawah 4 tab (HP): Absen · Riwayat · Mengajar · Admin.
   Laporan, Kelas, Nilai & Perangkat Ajar dikumpulkan di halaman "Mengajar".
   Mode laptop (>=1100px) tidak diubah sama sekali. */
(function () {
  if (window.__nav4) return; window.__nav4 = 1;
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>';
  var st = document.createElement('style');
  st.textContent =
    '@media (max-width:1099px){'
    + '#navLaporan,#navKelas,#navLaporanLink,#navKelasLink,#dskNilai,.bnav .bn-row>a[href^="laporan.html"],.bnav .bn-row>a[href^="kelas.html"],.bnav .bn-row>a[href^="nilai.html"]{display:none!important}'
    + '.gb-grp{display:none!important}body.gerbang .bnav{padding-top:7px!important}'
    + '.bnav{border-radius:999px!important;padding:7px!important;width:calc(100% - 28px)!important}'
    + '.bnav .bn-row{gap:2px!important}'
    + '.bnav .bn-row>*{border-radius:999px!important;padding:7px 0 6px!important}'
    + '.bnav .bn-row>.on,.bnav .bn-row>[aria-current]{background:#E8F2FD!important;color:#1d6fd8!important}'
    + '.n4-cr{text-align:center;font-size:11px;color:#94a3b8;margin:18px 0 0;padding:0 12px}body:has(#lnkLaptopRow) .n4-cr{margin-bottom:56px}'
    + 'body.gerbang #navMengajar{opacity:.55}'
    + '#navMengajar{position:relative}#navMengajar .n4k{display:none;position:absolute;top:1px;left:calc(50% + 4px);min-width:17px;height:17px;border-radius:9px;background:#ef4444;font-size:9px;line-height:17px;text-align:center}'
    + 'body.gerbang #navMengajar .n4k{display:block}'
    + '#navMengajar.punya-rev::after{content:"";position:absolute;top:6px;left:calc(50% + 8px);width:10px;height:10px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 2px #fff}'
    + '}'
    + '@media (min-width:1100px){#navMengajar{display:none!important}}'
    + '@media (prefers-color-scheme:dark){.bnav .bn-row>.on,.bnav .bn-row>[aria-current]{background:rgba(59,130,246,.22)!important;color:#8DB8FF!important}#navMengajar.punya-rev::after{box-shadow:0 0 0 2px #1c1c24}}';
  document.head.appendChild(st);

  function ls(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function param(n) { try { return new URLSearchParams(location.search).get(n) || ''; } catch (e) { return ''; } }
  function kodeGuru() {
    var s = document.getElementById('guruSelect');
    return (s && s.value) || param('kode') || ls('absensi_guru_terakhir');
  }
  function devId() {
    try { if (typeof getDeviceId === 'function') { var d = getDeviceId(); if (d) return d; } } catch (e) { }
    return param('dev') || ls('absensi_device_id');
  }
  function url() {
    var k = kodeGuru();
    return 'mengajar.html' + (k ? '?kode=' + encodeURIComponent(k) + '&dev=' + encodeURIComponent(devId()) : '');
  }
  window.__nav4Url = url;

  function pasang() {
    var row = document.querySelector('.bnav .bn-row');
    if (!row || document.getElementById('navMengajar')) return !!document.getElementById('navMengajar');
    var sib = row.children[0], isBtn = sib && sib.tagName === 'BUTTON';
    var el = document.createElement(isBtn ? 'button' : 'a');
    el.id = 'navMengajar';
    if (isBtn) el.type = 'button'; else el.href = url();
    el.innerHTML = '<span class="ni">' + ICON + '</span>Mengajar<span class="n4k" aria-hidden="true">🔒</span>';
    var pg = /\/(mengajar|laporan|kelas|nilai)\.html/.test(location.pathname);
    if (pg) { el.classList.add('on'); el.setAttribute('aria-current', 'page'); }
    var adm = document.getElementById('navAdmin') || document.getElementById('navAdminLink');
    row.insertBefore(el, adm || null);
    el.addEventListener('click', function (e) {
      e.preventDefault();
      if (/\/mengajar\.html/.test(location.pathname)) return;
      location.href = url();
    });
    // halaman Laporan/Kelas/Nilai: tab lama tidak lagi "aktif" (disembunyikan di HP)
    return true;
  }
  function sinkron() {
    var el = document.getElementById('navMengajar'); if (!el) return;
    var lap = document.getElementById('navLaporan');
    el.classList.toggle('punya-rev', !!(lap && lap.classList.contains('punya-rev')));
    if (el.tagName === 'A') { var h = url(); if (el.getAttribute('href') !== h) el.setAttribute('href', h); }
  }
  function kredit() {
    if (window.innerWidth >= 1100) return;
    var nav = document.querySelector('.bnav'), cr = nav && nav.querySelector('.bn-credit');
    if (!cr) return;
    cr.classList.add('n4-cr'); cr.style.cssText = '';
    nav.parentNode.insertBefore(cr, nav);
  }
  function mulai() { pasang(); sinkron(); kredit(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai); else mulai();
  window.addEventListener('load', mulai);
  setInterval(function () { pasang(); sinkron(); }, 700);
})();

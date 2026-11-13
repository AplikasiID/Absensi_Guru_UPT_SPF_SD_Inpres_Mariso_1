/* SMART Mariso 1 - percepat pembukaan aplikasi & absen (hanya halaman utama, index.html).
 * 1) Panggilan yang tidak mendesak (revisi, pengumuman, izin laptop, akses Kelas, riwayat, cek admin)
 *    ditunda sampai status absen tampil (maks. 3,5 detik), supaya status & tombol absen muncul lebih dulu.
 * 2) GPS dipanaskan di latar belakang (maks. 45 detik) saat tombol absen bisa dipakai,
 *    supaya saat tombol ditekan lokasi lebih cepat didapat. */
(function () {
  var G = window.google && window.google.script && window.google.script.run;
  if (!G || typeof Proxy === 'undefined') return;
  var TUNDA = { cekRevisiGuru: 1, getInfoGuru: 1, infoLaptopGuru: 1, getKelasGuru: 1, getRiwayatAbsen: 1, cekPerangkatAdmin: 1 };
  var siap = false, antre = [];
  function lepas() {
    if (siap) return; siap = true;
    var a = antre; antre = [];
    a.forEach(function (f, i) { setTimeout(f, i * 120); });
  }
  setTimeout(lepas, 3500);
  function bungkus(o, ok, fail) {
    return new Proxy({}, {
      get: function (_, p) {
        if (typeof p !== 'string') return undefined;
        if (p === 'withSuccessHandler') return function (f) { return bungkus(o.withSuccessHandler(f), f, fail); };
        if (p === 'withFailureHandler') return function (f) { return bungkus(o.withFailureHandler(f), ok, f); };
        if (TUNDA[p]) return function () {
          var a = arguments;
          if (siap) return o[p].apply(o, a);
          antre.push(function () { try { o[p].apply(o, a); } catch (e) { } });
        };
        if (p === 'getStatusHariIni') return function () {
          var a = arguments;
          var s = function (r) { try { if (ok) ok(r); } finally { lepas(); } };
          var f = function (e) { try { if (fail) fail(e); } finally { lepas(); } };
          return G.withSuccessHandler(s).withFailureHandler(f).getStatusHariIni.apply(null, a);
        };
        return o[p];
      }
    });
  }
  window.google.script.run = bungkus(G, null, null);

  // Pemanasan GPS
  var wid = null, akhir = 0, terakhirMulai = 0;
  function henti() { if (wid !== null) { try { navigator.geolocation.clearWatch(wid); } catch (e) { } wid = null; } }
  function cek() {
    var sel = document.getElementById('guruSelect'), s = window.__lastStatus;
    if (!navigator.geolocation) return;
    var perlu = window.innerWidth < 1100 && !document.hidden && sel && sel.value && s && s.hariKerja !== false && s.deviceCocok !== false &&
      !(s.sudahMasuk && s.sudahKeluar) && !document.body.classList.contains('mode-admin');
    if (!perlu) { henti(); return; }
    var n = Date.now();
    if (wid !== null && n > akhir) { henti(); return; }
    if (wid === null && n - terakhirMulai > 180000) {
      terakhirMulai = n; akhir = n + 45000;
      try { wid = navigator.geolocation.watchPosition(function () { }, function () { henti(); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 45000 }); } catch (e) { wid = null; }
    }
  }
  setInterval(cek, 1500);
})();

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

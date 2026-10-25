/* Service worker: halaman langsung tampil dari cache (cepat), lalu diperbarui di
 * belakang layar untuk pembukaan berikutnya (stale-while-revalidate). Kalau belum
 * ada di cache (pertama kali), diambil dari jaringan. Panggilan ke Apps Script
 * TIDAK pernah di-cache. */
var CACHE = "absensi-v3";
var SHELL = ["./", "./index.html", "./dashboard.html", "./pengaturan.html", "./riwayat.html",
             "./config.js", "./api.js", "./ikon-192.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL).catch(function () {}); }));
  self.skipWaiting();
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return; // Apps Script / CDN: biarkan langsung
  e.respondWith(
    caches.match(req).then(function (cached) {
      // no-cache: validasi ke server (304 kalau tidak berubah), hasilnya disimpan untuk pembukaan berikutnya.
      var jaringan = fetch(req, { cache: 'no-cache' }).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      e.waitUntil(jaringan.catch(function () {})); // jaga agar pembaruan di belakang layar selesai
      return cached || jaringan;
    })
  );
});

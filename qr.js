/* SMART Mariso 1 - pembuat kode QR sederhana (mode byte, koreksi kesalahan M, versi 1-10, sampai 213 karakter). */
var SM1QR = (function () {
  var EXP = [], LOG = [], i, x = 1;
  for (i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
  for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
  function gen(n) { var p = [1], j, q; for (var k = 0; k < n; k++) { q = []; for (j = 0; j <= p.length; j++) q[j] = 0; for (j = 0; j < p.length; j++) { q[j] ^= p[j]; q[j + 1] ^= mul(p[j], EXP[k]); } p = q; } return p; }
  function rem(data, n) { var g = gen(n), r = [], j; for (j = 0; j < n; j++) r[j] = 0; data.forEach(function (b) { var f = b ^ r[0]; r.shift(); r.push(0); if (f) for (j = 0; j < n; j++) r[j] ^= mul(g[j + 1], f); }); return r; }
  var TB = { 1: [10, [[1, 16]]], 2: [16, [[1, 28]]], 3: [26, [[1, 44]]], 4: [18, [[2, 32]]], 5: [24, [[2, 43]]], 6: [16, [[4, 27]]], 7: [18, [[4, 31]]], 8: [22, [[2, 38], [2, 39]]], 9: [22, [[3, 36], [2, 37]]], 10: [26, [[4, 43], [1, 44]]] };
  var AL = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50] };
  function totalData(v) { return TB[v][1].reduce(function (a, g) { return a + g[0] * g[1]; }, 0); }
  function utf8(s) { var o = [], c; s = unescape(encodeURIComponent(s)); for (c = 0; c < s.length; c++) o.push(s.charCodeAt(c)); return o; }
  function bit(v, k) { return ((v >>> k) & 1) === 1; }
  function matrix(text) {
    var bytes = utf8(text), v, cap;
    for (v = 1; v <= 10; v++) { cap = Math.floor((totalData(v) * 8 - 4 - (v < 10 ? 8 : 16)) / 8); if (bytes.length <= cap) break; }
    if (v > 10) throw new Error('Teks terlalu panjang untuk QR');
    var D = totalData(v), bits = [];
    function put(val, len) { for (var k = len - 1; k >= 0; k--) bits.push((val >>> k) & 1); }
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(function (b) { put(b, 8); });
    for (var t = 0; t < 4 && bits.length < D * 8; t++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    var data = []; for (i = 0; i < bits.length; i += 8) { var by = 0; for (var k = 0; k < 8; k++) by = (by << 1) | bits[i + k]; data.push(by); }
    for (var pad = 0xEC; data.length < D; pad ^= 0xEC ^ 0x11) data.push(pad);
    var ecn = TB[v][0], blocks = [], pos = 0;
    TB[v][1].forEach(function (g) { for (var n = 0; n < g[0]; n++) { var d = data.slice(pos, pos + g[1]); pos += g[1]; blocks.push({ d: d, e: rem(d, ecn) }); } });
    var out = [], maxd = Math.max.apply(null, blocks.map(function (b) { return b.d.length; }));
    for (i = 0; i < maxd; i++) blocks.forEach(function (b) { if (i < b.d.length) out.push(b.d[i]); });
    for (i = 0; i < ecn; i++) blocks.forEach(function (b) { out.push(b.e[i]); });
    var size = 17 + 4 * v, m = [], f = [], y;
    for (y = 0; y < size; y++) { m.push([]); f.push([]); for (x = 0; x < size; x++) { m[y].push(false); f[y].push(false); } }
    function setF(px, py, dark) { if (px < 0 || py < 0 || px >= size || py >= size) return; m[py][px] = dark; f[py][px] = true; }
    for (i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    function finder(cx, cy) { for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) { var d = Math.max(Math.abs(dx), Math.abs(dy)); setF(cx + dx, cy + dy, d !== 2 && d !== 4); } }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var al = AL[v], last = al.length - 1;
    al.forEach(function (cy, a) { al.forEach(function (cx, b) {
      if ((a === 0 && b === 0) || (a === 0 && b === last) || (a === last && b === 0)) return;
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) setF(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }); });
    function format(mask) {
      var d = mask, r = d, k;
      for (k = 0; k < 10; k++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      var b = ((d << 10) | r) ^ 0x5412;
      for (k = 0; k <= 5; k++) setF(8, k, bit(b, k));
      setF(8, 7, bit(b, 6)); setF(8, 8, bit(b, 7)); setF(7, 8, bit(b, 8));
      for (k = 9; k < 15; k++) setF(14 - k, 8, bit(b, k));
      for (k = 0; k < 8; k++) setF(size - 1 - k, 8, bit(b, k));
      for (k = 8; k < 15; k++) setF(8, size - 15 + k, bit(b, k));
      setF(8, size - 8, true);
    }
    format(0);
    if (v >= 7) { var r2 = v, k2; for (k2 = 0; k2 < 12; k2++) r2 = (r2 << 1) ^ ((r2 >>> 11) * 0x1F25); var vb = (v << 12) | r2; for (k2 = 0; k2 < 18; k2++) { var a2 = size - 11 + (k2 % 3), b2 = Math.floor(k2 / 3); setF(a2, b2, bit(vb, k2)); setF(b2, a2, bit(vb, k2)); } }
    var bi = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (var j = 0; j < 2; j++) {
        var xx = right - j, up = ((right + 1) & 2) === 0, yy = up ? size - 1 - vert : vert;
        if (!f[yy][xx] && bi < out.length * 8) { m[yy][xx] = bit(out[bi >>> 3], 7 - (bi & 7)); bi++; }
      }
    }
    var MASK = [function (a, b) { return (a + b) % 2 === 0; }, function (a, b) { return b % 2 === 0; }, function (a, b) { return a % 3 === 0; }, function (a, b) { return (a + b) % 3 === 0; },
      function (a, b) { return (Math.floor(a / 3) + Math.floor(b / 2)) % 2 === 0; }, function (a, b) { return a * b % 2 + a * b % 3 === 0; }, function (a, b) { return (a * b % 2 + a * b % 3) % 2 === 0; }, function (a, b) { return ((a + b) % 2 + a * b % 3) % 2 === 0; }];
    function pen(mm) {
      var p = 0, n, c, run, ra, rb, dark = 0, tot = size * size, yy, xx, line;
      for (n = 0; n < size; n++) for (c = 0; c < 2; c++) {
        run = 1; line = '';
        for (i = 0; i < size; i++) { ra = c ? mm[i][n] : mm[n][i]; line += ra ? '1' : '0'; if (i > 0) { rb = c ? mm[i - 1][n] : mm[n][i - 1]; if (ra === rb) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } }
        var q = 0, ix; while ((ix = line.indexOf('10111010000', q)) >= 0) { p += 40; q = ix + 1; } q = 0; while ((ix = line.indexOf('00001011101', q)) >= 0) { p += 40; q = ix + 1; }
      }
      for (yy = 0; yy < size; yy++) for (xx = 0; xx < size; xx++) { if (mm[yy][xx]) dark++; if (xx < size - 1 && yy < size - 1 && mm[yy][xx] === mm[yy][xx + 1] && mm[yy][xx] === mm[yy + 1][xx] && mm[yy][xx] === mm[yy + 1][xx + 1]) p += 3; }
      p += (Math.ceil(Math.abs(dark * 20 - tot * 10) / tot) - 1) * 10;
      return p;
    }
    var best = null, bestP = 1e9, mk;
    for (mk = 0; mk < 8; mk++) {
      var save = m.map(function (r) { return r.slice(); });
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (!f[y][x] && MASK[mk](x, y)) m[y][x] = !m[y][x];
      format(mk);
      var pp = pen(m); if (pp < bestP) { bestP = pp; best = m.map(function (r) { return r.slice(); }); }
      m = save;
    }
    return best;
  }
  function svg(text, px) {
    var mm = matrix(text), n = mm.length, q = 4, d = '', y, x;
    for (y = 0; y < n; y++) for (x = 0; x < n; x++) if (mm[y][x]) d += 'M' + (x + q) + ' ' + (y + q) + 'h1v1h-1z';
    var s = n + q * 2;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + ' ' + s + '" width="' + (px || 240) + '" height="' + (px || 240) + '" shape-rendering="crispEdges" role="img" aria-label="Kode QR"><rect width="' + s + '" height="' + s + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }
  return { matrix: matrix, svg: svg };
})();
if (typeof module !== 'undefined') module.exports = SM1QR;

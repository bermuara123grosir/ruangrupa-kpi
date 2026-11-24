/* KPI Ruang Rupa — dashboard web (vanilla JS, tanpa library).
   Data: tab "🌐 Web" di Google Sheet "KPI Ruang Rupa — Skor" (Publish to web → CSV).
   ?demo=1 → data contoh (badge DATA CONTOH). ?src=<url> → sumber CSV lain (untuk uji). */
(function () {
  'use strict';
  var SHEET_ID = '1awZAIJcVzbw_-K0GabkCWWKkjYSwIhUViQBtxbzv5DY';
  var GID = '1533667839';
  var URLS = [
    'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/pub?gid=' + GID + '&single=true&output=csv',
    'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:csv&gid=' + GID
  ];
  var ORDER = ['Hakim', 'Edu', 'Novri', 'Yudhis', 'Ega'];
  var COLORS = { Hakim: '#3b6dcc', Edu: '#7c3aed', Novri: '#c2781e', Yudhis: '#0f766e', Ega: '#be185d' };
  /* Bobot kerja = perkiraan jam kerja per minggu (Page "KPI Tim Ruang Rupa Fatikha" v2, 23 Nov 2026 ±23.00 WIB,
     grafik "Beban kerja sekarang vs usulan"). Dipakai: kolom Usulan (versi yang sudah menyesuaikan keputusan Mas:
     reels dibagi per jadwal, Edu 2 real + desainer 1 AI). Sekarang = sebelum pembagian, hanya pembanding. */
  var JAM = { Hakim: [23, 23], Edu: [42, 26], Novri: [22, 28], Yudhis: [9, 17], Ega: [29, 29] }; // [sekarang, usulan]
  /* Bobot kerja per JENIS pekerjaan (skenario Usulan = setelah pembagian reels real/AI).
     Jam per item: asumsi tertulis di Page "KPI Tim Ruang Rupa Fatikha" v2 (23 Nov 2026), teks di bawah grafik beban kerja.
     Volume: dari tabel KPI di Page yang sama; yang ditandai turunan:true dihitung balik dari total jam per orang di grafik. */
  var JENIS = [
    { n: 'Edit reels real', per: 3, sat: 'jam/reels', vol: [['Edu', 8.5]], vs: 'reels', src: 'Page v2: reels real 3 jam; Edu rata-rata 8,5 reels/minggu' },
    { n: 'Desain feed', per: 1, sat: 'jam/desain', vol: [['Novri', 19], ['Yudhis', 9]], vs: 'desain', src: 'Page v2: desain 1 jam; Novri 19, Yudhis 9 desain/minggu' },
    { n: 'Konten AI Kesatrian', per: 0.75, sat: 'jam/post', vol: [['Ega', 18]], vs: 'post', src: 'Page v2: konten AI Ega 0,75 jam/post; 18/minggu' },
    { n: 'Brief konten', per: 0.5, sat: 'jam/brief', vol: [['Hakim', 19], ['Novri', 6]], vs: 'brief', turunan: true, src: 'Page v2: brief 0,5 jam. Volume turunan: Hakim (23 − 10,5 upload − 3 Meta Ads) ÷ 0,5 = 19; Novri (22 sekarang − 19 desain) ÷ 0,5 = 6' },
    { n: 'Optimasi toko', per: 1, sat: 'jam/toko/hari', vol: [['Ega', 12]], vs: 'toko-hari', turunan: true, src: 'Page v2: optimasi 1 jam per toko per hari; 2 toko (KPI Omset 2 toko) × 6 hari Sen–Sab = 12 (hari turunan dari total Ega 29)' },
    { n: 'Reels AI', per: 2, sat: 'jam/reels', vol: [['Novri', 3], ['Yudhis', 2.5]], vs: 'reels', src: 'Page v2: reels AI 2 jam; Novri ±3, Yudhis ±2,5 reels AI/minggu' },
    { n: 'Upload + caption IG', per: 0.25, sat: 'jam/post', vol: [['Hakim', 42]], vs: 'post', src: 'Page v2: upload + caption 0,25 jam; 42 post/minggu di 11 akun' },
    { n: 'Meta Ads', per: 1, sat: 'jam/akun', vol: [['Hakim', 3]], vs: 'akun', src: 'Page v2: Meta Ads 1 jam per akun; 3 akun (Fatikha, KHN, King Pandanus)' },
    { n: 'Rekap realtime', per: 0.5, sat: 'jam/hari', vol: [['Ega', 6]], vs: 'hari', turunan: true, src: 'Page v2: rekap 0,5 jam per hari; 6 hari Sen–Sab' },
    { n: 'Visual marketplace', per: null, sat: 'rata-rata/minggu', vol: [['Yudhis', 3]], vs: 'jam', flat: true, src: 'Page v2: visual marketplace Yudhis rata-rata 3 jam/minggu' }
  ];
  var JENIS_RR = [ // akun Ruang Rupa mulai Des 2026 — TURUNAN dari jam per item di atas, belum masuk total 123 jam
    { n: 'Edit reels Ruang Rupa', per: 3, sat: 'jam/reels', vol: [['Edu', 3]], vs: 'reels', src: 'Turunan: 3 reels/minggu (Sen/Rab/Jum) × 3 jam reels real' },
    { n: 'Brief Ruang Rupa', per: 0.5, sat: 'jam/brief', vol: [['Yudhis', 3]], vs: 'brief', src: 'Turunan: 3 brief/minggu × 0,5 jam brief' },
    { n: 'Upload IG + TikTok Ruang Rupa', per: 0.25, sat: 'jam/post', vol: [['Yudhis', 6]], vs: 'post', src: 'Turunan: 3 jadwal × 2 platform × 0,25 jam upload + caption' }
  ];
  // Jenis pekerjaan → KPI yang memberi poin (poin dibaca dari baris kpi tab 🌐 Web = BOBOT di ⚙️ Pengaturan)
  var KPI_MAP = {
    'Edit reels real': [['Edu', 'Reels tepat waktu']],
    'Desain feed': [['Novri', 'Desain + reels AI tepat waktu'], ['Yudhis', 'Desain + reels AI tepat waktu']],
    'Konten AI Kesatrian': [['Ega', 'Disiplin']],
    'Brief konten': [['Hakim', 'Brief tepat waktu'], ['Novri', 'Brief tepat waktu']],
    'Optimasi toko': [['Ega', 'Hasil']],
    'Reels AI': [['Novri', 'Desain + reels AI tepat waktu'], ['Yudhis', 'Desain + reels AI tepat waktu']],
    'Upload + caption IG': [['Hakim', 'Upload tepat jadwal']],
    'Meta Ads': [['Hakim', 'Meta Ads']],
    'Rekap realtime': [['Ega', 'Disiplin']],
    'Visual marketplace': [['Yudhis', 'Visual marketplace']],
    'Edit reels Ruang Rupa': [['Edu', 'Reels tepat waktu']],
    'Brief Ruang Rupa': [['Yudhis', 'Brief tepat waktu']],
    'Upload IG + TikTok Ruang Rupa': []
  };
  var BELUM = ['Live Shopee (rolling, 4 jam/sesi)', 'Request divisi & event', 'Brief tambahan dari Mas', 'Laporan data akun (Hakim)', 'Laporan mingguan toko (Ega)', 'Meeting tim'];
  function jenisJam(j) { return j.vol.reduce(function (a, v) { return a + v[1]; }, 0) * (j.flat ? 1 : j.per); }
  var EGA_SUB = { Disiplin: ['Konten AI Kesatrian', 'Rekap realtime', 'Laporan tepat Sabtu'], Hasil: ['Optimasi & omset', 'Kesehatan toko', 'Iklan Shopee'] };
  var GP = window.__PARAMS__ || null; // diisi Apps Script (doGet) saat jalan sebagai web app
  var GAS = !!(GP && window.google && google.script && google.script.run);
  var qs = new URLSearchParams(GP ? GP.query || '' : location.search);
  var BASE = GP && GP.url ? GP.url : location.pathname;
  var DEMO = qs.get('demo') === '1';
  var D = null; // data model
  var S = { mode: 'minggu', wk: 1, bd: 'jam' };

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(v) { if (v == null) return null; v = String(v).trim(); if (v === '' || v === '-') return null; var n = Number(v.replace(',', '.')); return isFinite(n) ? n : null; }
  function f1(n) { return n == null || !isFinite(n) ? '—' : n.toFixed(1).replace('.', ','); }
  function pct(n) { return n == null || !isFinite(n) ? '—' : (n * 100).toFixed(1).replace('.', ',') + '%'; }
  function rp(n) { if (n == null || !isFinite(n)) return '—'; var s = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); return (n < 0 ? '−' : '') + 'Rp ' + s; }
  function signed(n) { return n == null || !isFinite(n) ? '—' : (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(1).replace('.', ','); }
  function grade(s) { if (s == null) return { t: 'Belum ada data', c: 'g-none' }; if (s >= 90) return { t: 'Sangat baik', c: 'g-sb' }; if (s >= 75) return { t: 'Baik', c: 'g-baik' }; if (s >= 60) return { t: 'Perlu perbaikan', c: 'g-perlu' }; return { t: 'Evaluasi', c: 'g-eval' }; }
  function initials(n) { return n.slice(0, 2).toUpperCase(); }
  var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  function ddmm(iso) { if (!iso) return '—'; var p = iso.split('-'); return p[2] + '/' + p[1]; }
  function parseCSV(t) {
    var rows = [], row = [], f = '', q = false;
    for (var i = 0; i < t.length; i++) {
      var c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
      else if (c !== '\r') f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function weeks(arr, from) { var o = []; for (var i = 0; i < 6; i++) o.push(num(arr[from + i])); return o; }

  /* ---------- model ---------- */
  function build(rows) {
    var m = { meta: null, orang: {}, kpi: [], uang: [], ads: [], cek: [], item: [], todo: {}, todoMeta: null, todoErr: null };
    rows.forEach(function (r) {
      var t = r[0];
      if (t === 'meta') m.meta = { bulan: r[1], bulanIso: r[2], mg: num(r[3]) || 1, nw: num(r[4]) || 5, updated: r[5], mulai: r[6], w1: r[7], today: r[8], labels: r.slice(9, 15), curWeek: num(r[15]) || 1, akhir: r[16], roas: r[17] || '' };
      else if (t === 'orang') m.orang[r[1]] = { nama: r[1], peran: r[2], warna: r[3], w: weeks(r, 4), month: num(r[10]), cov: weeks(r, 11), covMonth: num(r[17]) };
      else if (t === 'kpi' && r[1]) m.kpi.push({ nama: r[1], kpi: r[2], bobot: num(r[3]) || 0, target: r[4], tpct: num(r[5]), w: weeks(r, 6), month: num(r[12]), capText: r[13], status: r[14], sumber: r[15] });
      else if (t === 'uang' && r[1]) m.uang.push({ toko: r[1], jenis: r[2], w: weeks(r, 3), month: num(r[9]) });
      else if (t === 'ads' && r[1]) m.ads.push({ akun: r[1], w: r.slice(2, 8), month: r[8], biaya: weeks(r, 9), biayaMonth: num(r[15]) });
      else if (t === 'cek' && r[1]) m.cek.push({ date: r[1], hari: r[2], wk: num(r[3]), akun: r[4], jenis: r[5], stKal: r[6], exe: r[7], jam: r[8], hasil: r[9], minus: r[10] || '' });
      else if (t === 'todo' && r[1]) m.todo[r[1]] = { done: num(r[2]) || 0, qty: num(r[3]) || 0 };
      else if (t === 'todo_meta') m.todoMeta = r[1] || '';
      else if (t === 'todo_err') m.todoErr = r[1] || 'tidak terbaca';
      else if (t === 'item' && r[1]) m.item.push({ nama: r[1], kpi: r[2], date: r[3], wk: num(r[4]), nilai: num(r[5]), pembagi: num(r[6]), ket: r[7], sumber: r[8] });
    });
    if (!m.meta) throw new Error('Baris "meta" tidak ada di CSV — pastikan yang dipublikasikan adalah tab 🌐 Web.');
    return m;
  }

  /* ---------- period helpers ---------- */
  function score(p) { if (!p) return null; return S.mode === 'bulan' ? p.month : p.w[S.wk - 1]; }
  function capOf(k) { return S.mode === 'bulan' ? k.month : k.w[k.w.length ? S.wk - 1 : 0]; }
  function covOf(p) { return S.mode === 'bulan' ? p.covMonth : p.cov[S.wk - 1]; }
  function periodLabel(short) {
    var m = D.meta, yr = (m.bulanIso || '').slice(0, 4);
    if (S.mode === 'bulan') return (short ? '' : 'Rekap bulan ') + m.bulan + ' (minggu 1–' + m.nw + ')';
    var lb = m.labels[S.wk - 1] || '';
    return 'Minggu ' + S.wk + (lb ? ' · ' + lb.replace('–', ' – ') + ' ' + yr : '');
  }
  function inPeriod(it) { return S.mode === 'bulan' ? true : it.wk === S.wk; }
  function agg(nama, kpi) {
    var n = 0, d = 0, c = 0;
    D.item.forEach(function (it) { if (it.nama === nama && it.kpi === kpi && inPeriod(it) && it.pembagi != null) { n += it.nilai || 0; d += it.pembagi; c++; } });
    return c ? { n: n, d: d } : null;
  }
  function unit(k) {
    if (k === 'Live Shopee (tim)') return ' jam';
    if (k === 'Meta Ads') return ' akun-minggu ada iklan';
    if (k === 'Upload tepat jadwal') return ' post tepat waktu';
    if (k === 'Rekap realtime') return ' hari ada catatan';
    if (k === 'Laporan tepat Sabtu') return ' laporan selesai tepat Sabtu';
    if (k === 'Optimasi & omset' || k === 'Kesehatan toko' || k === 'Iklan Shopee') return ' laporan (rata-rata capaian)';
    if (k.indexOf('Kualitas') === 0) return ' lolos ≤1 revisi';
    if (k === 'Konten AI Kesatrian') return ' konten tepat waktu';
    return ' tepat waktu';
  }
  function capText(k) {
    if (k.nama === 'Ega' && EGA_SUB[k.kpi]) {
      var parts = EGA_SUB[k.kpi].map(function (s) { var kk = D.kpi.filter(function (x) { return x.nama === 'Ega' && x.kpi === s; })[0]; var c = kk ? capOf(kk) : null; return c == null ? null : s + ' ' + pct(c); }).filter(Boolean);
      return parts.length ? parts.join(' · ') : 'Belum ada data';
    }
    var a = agg(k.nama, k.kpi);
    if (!a) return 'Belum ada data';
    var r = function (x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); };
    return r(a.n) + ' / ' + r(a.d) + unit(k.kpi);
  }
  function status(c, tp) { if (c == null) return { t: 'Belum ada data', c: 'tag-wait' }; if (c >= (tp == null ? 1 : tp) - 1e-9) return { t: 'Tercapai', c: 'tag-ok' }; if (c >= 0.75) return { t: 'Cukup', c: 'tag-late' }; if (c >= 0.6) return { t: 'Perlu perbaikan', c: 'tag-late' }; return { t: 'Di bawah standar', c: 'tag-miss' }; }
  function barCls(c) { return c >= 0.95 ? 'bar-g' : c >= 0.75 ? 'bar-y' : c >= 0.6 ? 'bar-o' : 'bar-r'; }
  function lastWeekShown() { return S.mode === 'bulan' ? D.meta.nw : S.wk; }

  /* ---------- svg ---------- */
  function spark(vals, color) {
    var pts = []; vals.forEach(function (v, i) { if (v != null) pts.push([i, v]); });
    if (!pts.length) return '<div class="spark-empty">Belum ada skor di periode ini</div>';
    var W = 228, H = 36, n = Math.max(vals.length - 1, 1);
    var lo = Math.min.apply(null, pts.map(function (p) { return p[1]; })), hi = Math.max.apply(null, pts.map(function (p) { return p[1]; }));
    lo = Math.min(lo, hi - 10); hi = Math.max(hi, lo + 10);
    var xy = pts.map(function (p) { return [4 + p[0] / n * (W - 8), 4 + (1 - (p[1] - lo) / (hi - lo)) * (H - 10)]; });
    var line = xy.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    var last = xy[xy.length - 1];
    var area = xy.length > 1 ? '<polyline points="' + line + ' ' + last[0].toFixed(1) + ',36 ' + xy[0][0].toFixed(1) + ',36" fill="' + color + '" fill-opacity="0.10" stroke="none"/>' : '';
    return '<svg class="spark" viewBox="0 0 228 36" preserveAspectRatio="none" width="100%" height="36" aria-hidden="true">' + area +
      '<polyline points="' + line + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3.2" fill="' + color + '"/></svg>';
  }
  function trendChart(series, nWeeks) {
    var all = []; series.forEach(function (s) { s.vals.forEach(function (v) { if (v != null) all.push(v); }); });
    if (!all.length) return '<div class="chart-empty">Belum ada skor di ' + esc(D.meta.bulan) + '. Garis tren muncul setelah ada data minggu pertama yang jatuh tempo.</div>';
    var lo = Math.floor(Math.min.apply(null, all) / 10) * 10, hi = 100;
    lo = Math.max(0, Math.min(lo, 60)); if (lo >= hi) lo = hi - 10;
    var mob = window.innerWidth < 760, W = mob ? 360 : 700, H = mob ? 230 : 260, L = mob ? 30 : 40, R = W - (mob ? 14 : 28), T = 12, B = H - 46;
    var x = function (i) { return nWeeks > 1 ? L + i / (nWeeks - 1) * (R - L) : (L + R) / 2; };
    var y = function (v) { return T + (1 - (v - lo) / (hi - lo)) * (B - T); };
    var g = '';
    for (var v = lo; v <= hi; v += (hi - lo) <= 40 ? 10 : 20) g += '<line x1="' + L + '" y1="' + y(v).toFixed(1) + '" x2="' + R + '" y2="' + y(v).toFixed(1) + '" stroke="#e4ddd3"/><text x="' + (L - 6) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="#6b645b">' + v + '</text>';
    for (var i = 0; i < nWeeks; i++) g += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle" font-size="11" fill="#6b645b">' + (window.innerWidth < 760 ? 'Mg ' : 'Minggu ') + (i + 1) + '</text>';
    series.forEach(function (s) {
      var seg = [], segs = [];
      s.vals.forEach(function (v, i) { if (i >= nWeeks) return; if (v == null) { if (seg.length) segs.push(seg); seg = []; } else seg.push([x(i), y(v)]); });
      if (seg.length) segs.push(seg);
      segs.forEach(function (sg) { if (sg.length > 1) g += '<polyline points="' + sg.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="none" stroke="' + s.color + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>'; sg.forEach(function (p) { g += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5" fill="#fffdf9" stroke="' + s.color + '" stroke-width="2"/>'; }); });
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Tren skor per minggu" style="font-family:var(--sans)">' + g + '</svg>';
  }

  /* ---------- views ---------- */
  function filters() {
    var o = '';
    for (var i = 1; i <= D.meta.nw; i++) o += '<option value="' + i + '"' + (i === S.wk ? ' selected' : '') + '>Minggu ' + i + (D.meta.labels[i - 1] ? ' · ' + esc(D.meta.labels[i - 1]) : '') + (i === D.meta.mg ? ' (dinilai)' : '') + '</option>';
    return '<div class="filters"><div class="seg"><button data-mode="minggu" class="' + (S.mode === 'minggu' ? 'on' : '') + '">Minggu</button><button data-mode="bulan" class="' + (S.mode === 'bulan' ? 'on' : '') + '">Bulan</button></div>' +
      (S.mode === 'minggu' ? '<select class="period-sel" id="wksel" aria-label="Pilih minggu">' + o + '</select>' : '<div class="period">' + esc(D.meta.bulan) + '</div>') + '</div>';
  }
  function people() { return ORDER.filter(function (n) { return D.orang[n]; }).map(function (n) { return D.orang[n]; }); }
  function attention() {
    var list = [];
    D.kpi.forEach(function (k) {
      if (!(k.bobot > 0)) return;
      var c = capOf(k); if (c == null || c >= 0.75) return;
      var why = capText(k);
      list.push({ k: k, c: c, why: why });
    });
    list.sort(function (a, b) { return a.c - b.c || b.k.bobot - a.k.bobot; });
    return list.slice(0, 5);
  }
  function footer() {
    return '<div class="foot"><div>Sumber: Google Sheet KPI Ruang Rupa — Skor · diperbarui ' + esc(D.meta.updated || '—') + ' WIB</div><div>' + (DEMO ? 'Data contoh — bukan penilaian asli · ' : '') + esc(periodLabel()) + ' · ' + toggleLink() + '</div></div>';
  }
  function toggleLink() { return DEMO ? '<a target="_top" href="' + esc(BASE) + '">Buka data asli</a>' : '<a target="_top" href="' + esc(BASE) + '?demo=1">Buka data contoh</a>'; }
  function progressPanel(ps) {
    var have = ps.filter(function (p) { return D.todo[p.nama] && D.todo[p.nama].qty > 0; });
    var h = '<div class="panel"><h2>Progress To-do per orang</h2><div class="sub">Done ÷ Qty dari 📃 To-do List hub' + (D.todoMeta ? ' · per ' + esc(D.todoMeta) : '') + ' · satuan Qty beda-beda per orang, jadi bandingkan persennya dan lihat bobot jamnya</div>';
    if (!have.length) return h + '<div class="att-empty">' + (D.todoErr ? 'Progress To-do belum terbaca: ' + esc(D.todoErr) : 'Progress To-do hanya tersedia di versi Apps Script (dibaca langsung dari hub).') + '</div></div>';
    var sw = 0, swp = 0, td = 0, tq = 0;
    have.forEach(function (p) { var t = D.todo[p.nama], j = JAM[p.nama] ? JAM[p.nama][1] : 0; sw += j; swp += j * Math.min(1, t.done / t.qty); td += t.done; tq += t.qty; });
    var tw = sw ? swp / sw : null;
    h += '<div class="prog-team"><div><span class="k">Progress tim (dibobot jam kerja)</span><b>' + pct(tw) + '</b></div><div><span class="k">Tanpa bobot (Σ Done ÷ Σ Qty)</span><b>' + pct(tq ? td / tq : null) + '</b><small>' + td + ' / ' + tq + '</small></div></div>';
    h += '<ul class="prog">' + ps.map(function (p) {
      var t = D.todo[p.nama], col = COLORS[p.nama] || p.warna, j = JAM[p.nama];
      var r = t && t.qty > 0 ? Math.min(1, t.done / t.qty) : null;
      return '<li><div class="pn"><i style="background:' + col + '"></i><b>' + esc(p.nama) + '</b><span>bobot ≈' + (j ? j[1] : '—') + ' jam/mgg' + (j && sw ? ' · ' + Math.round(j[1] / sw * 100) + '% beban tim' : '') + '</span></div>' +
        '<div class="pbar"><span style="width:' + (r == null ? 0 : (r * 100).toFixed(1)) + '%;background:' + col + '"></span></div>' +
        '<div class="pv"><b>' + pct(r) + '</b><small>' + (t ? t.done + ' / ' + t.qty : '—') + '</small></div></li>';
    }).join('') + '</ul></div>';
    return h;
  }
  function jamPanel(ps) {
    var mx = 0; ps.forEach(function (p) { var j = JAM[p.nama]; if (j) mx = Math.max(mx, j[0], j[1]); });
    mx = Math.ceil(mx / 10) * 10 || 10;
    var tot = ps.reduce(function (a, p) { return a + (JAM[p.nama] ? JAM[p.nama][1] : 0); }, 0);
    var rows = ps.map(function (p) {
      var j = JAM[p.nama]; if (!j) return '';
      var col = COLORS[p.nama] || p.warna;
      return '<li><div class="jn"><b>' + esc(p.nama) + '</b><span>' + Math.round(j[1] / tot * 100) + '% beban</span></div><div class="jb">' +
        '<div class="jrow"><span class="jbar now" style="width:' + (j[0] / mx * 100).toFixed(1) + '%"></span><em>' + j[0] + ' jam</em></div>' +
        '<div class="jrow"><span class="jbar" style="width:' + (j[1] / mx * 100).toFixed(1) + '%;background:' + col + '"></span><em><b>' + j[1] + ' jam</b></em></div></div></li>';
    }).join('');
    return '<div class="panel"><h2>Bobot kerja tim</h2><div class="sub">Perkiraan jam kerja per minggu · dari Page KPI Tim Ruang Rupa Fatikha v2 (23 Nov 2026)</div>' +
      '<div class="legend"><span><i style="background:#d9d2c7"></i>Sebelum pembagian reels</span><span><i style="background:#154736"></i>Dipakai (setelah pembagian reels real/AI)</span></div>' +
      '<ul class="jam">' + rows + '</ul><p class="note">Total ≈' + tot + ' jam/minggu. Perkiraan kasar: belum termasuk live Shopee, request event, brief tambahan dari Mas, dan akun Ruang Rupa (mulai Des: reels Edu, brief + upload Yudhis).</p></div>';
  }
  function nfmt(x) { return (Math.round(x * 100) / 100).toString().replace('.', ','); }
  function kpiOf(n, k) { return D.kpi.filter(function (x) { return x.nama === n && x.kpi === k; })[0]; }
  function sumBobot(n) { return D.kpi.filter(function (x) { return x.nama === n && x.bobot > 0; }).reduce(function (a, x) { return a + x.bobot; }, 0); }
  function kpiShared() { var c = {}; Object.keys(KPI_MAP).forEach(function (w) { KPI_MAP[w].forEach(function (m) { var key = m[0] + '|' + m[1]; c[key] = (c[key] || 0) + 1; }); }); return c; }
  function poinChips(w) {
    var m = KPI_MAP[w] || [], sh = kpiShared();
    if (!m.length) return '<span class="pchip none">tanpa poin KPI · dicek di Cek upload</span>';
    return m.map(function (x) { var r = kpiOf(x[0], x[1]); var shared = (sh[x[0] + '|' + x[1]] || 0) > 1;
      return '<span class="pchip" style="--c:' + (COLORS[x[0]] || '#154736') + '" title="' + esc(x[0] + ' · KPI ' + x[1] + (shared ? ' (satu KPI untuk beberapa jenis pekerjaan)' : '')) + '">' + esc(x[0]) + ' <b>' + (r ? r.bobot : '—') + '</b>' + (shared ? '*' : '') + '</span>'; }).join('');
  }
  function poinView() {
    var mapped = {}; Object.keys(KPI_MAP).forEach(function (w) { KPI_MAP[w].forEach(function (m) { mapped[m[0] + '|' + m[1]] = 1; }); });
    var h = '<div class="poin-grid">' + people().map(function (p) {
      var ks = D.kpi.filter(function (x) { return x.nama === p.nama && x.bobot > 0; }).sort(function (a, b) { return b.bobot - a.bobot; });
      var sb = sumBobot(p.nama);
      return '<div class="poin-card"><div class="pc-h"><i style="background:' + (COLORS[p.nama] || p.warna) + '"></i><b>' + esc(p.nama) + '</b><span>Σ ' + sb + ' poin' + (sb !== 100 ? ' · dinormalkan ke 100' : '') + '</span></div><ul>' +
        ks.map(function (k) {
          var sub = p.nama === 'Ega' && EGA_SUB[k.kpi] ? '<small>' + esc(EGA_SUB[k.kpi].join(' · ')) + '</small>' : '';
          var noJam = !mapped[p.nama + '|' + k.kpi];
          return '<li class="' + (noJam ? 'nojam' : '') + '"><span class="pk">' + esc(k.kpi) + sub + (noJam ? '<em>belum ada estimasi jam</em>' : '') + '</span><span class="pv2"><b>' + k.bobot + '</b> poin<small>' + (sb ? (k.bobot / sb * 100).toFixed(1).replace('.', ',') + '% skor' : '') + '</small></span></li>';
        }).join('') + '</ul></div>';
    }).join('') + '</div>';
    var y = sumBobot('Yudhis');
    return h + '<p class="note">Poin = bobot penilaian KPI, dibaca langsung dari ⚙️ Pengaturan (tab 🌐 Web), jadi ikut berubah kalau Mas mengubah bobot. Skor = Σ(poin × capaian, maks 100% per KPI) ÷ Σ poin KPI yang sudah ada datanya × 100.' + (y && y !== 100 ? ' Σ poin Yudhis = ' + y + ' (ditambah Brief Ruang Rupa 15), jadi dinormalkan: 1 poin Yudhis = ' + (100 / y).toFixed(2).replace('.', ',') + ' dari skor 100.' : '') + ' Rincian Ega (konten AI Kesatrian, rekap realtime, laporan Sabtu / optimasi & omset, kesehatan toko, iklan Shopee) tidak punya poin sendiri; nilainya digabung ke Disiplin dan Hasil.</p>';
  }
  function bobotDetail() {
    var rows = JENIS.map(function (j) { return { j: j, t: jenisJam(j) }; }).sort(function (a, b) { return b.t - a.t; });
    var tot = rows.reduce(function (a, r) { return a + r.t; }, 0);
    var rr = JENIS_RR.map(function (j) { return { j: j, t: jenisJam(j) }; });
    var rrTot = rr.reduce(function (a, r) { return a + r.t; }, 0);
    var mx = Math.max.apply(null, rows.map(function (r) { return r.t; }));
    var line = function (r, base, extra) {
      var j = r.j, vol = j.vol.reduce(function (a, v) { return a + v[1]; }, 0);
      return '<li class="' + (extra ? 'rr' : '') + '" title="' + esc(j.src) + '"><div class="bn"><b>' + esc(j.n) + '</b>' + (j.turunan || extra ? '<span class="tag tag-wait">turunan</span>' : '') +
        '<div class="who-tags">' + j.vol.map(function (v) { return '<span style="--c:' + (COLORS[v[0]] || '#154736') + '">' + esc(v[0]) + (j.vol.length > 1 ? ' ' + nfmt(v[1]) : '') + '</span>'; }).join('') + '</div></div>' +
        '<div class="bc"><span class="k">Per item</span>' + (j.flat ? '—' : nfmt(j.per) + ' ' + esc(j.sat)) + '</div>' +
        '<div class="bc"><span class="k">Volume/mgg</span>' + (j.flat ? 'rata-rata ' + nfmt(vol) + ' jam' : nfmt(vol) + ' ' + esc(j.vs)) + '</div>' +
        '<div class="bc num"><span class="k">Jam/mgg</span><b>' + nfmt(r.t) + '</b></div>' +
        '<div class="bp"><span class="k">Poin KPI</span>' + poinChips(j.n) + '</div>' +
        '<div class="bs"><div class="pbar"><span style="width:' + (r.t / mx * 100).toFixed(1) + '%;background:' + (extra ? '#a67c3d' : '#154736') + '"></span></div><em>' + (extra ? '+' : '') + (r.t / base * 100).toFixed(1).replace('.', ',') + '%</em></div></li>';
    };
    var mapped = {}; Object.keys(KPI_MAP).forEach(function (w) { KPI_MAP[w].forEach(function (m) { mapped[m[0] + '|' + m[1]] = 1; }); });
    var tanpaJam = {}; D.kpi.forEach(function (k) { if (k.bobot > 0 && !mapped[k.nama + '|' + k.kpi]) (tanpaJam[k.kpi] = tanpaJam[k.kpi] || []).push(k.nama + ' ' + k.bobot); });
    var jamBody = '<div class="bd-head"><span>Jenis pekerjaan</span><span>Per item</span><span>Volume/mgg</span><span>Jam/mgg</span><span>Poin KPI</span><span>Porsi jam</span></div>' +
      '<ul class="bd">' + rows.map(function (r) { return line(r, tot); }).join('') + '</ul>' +
      '<div class="bd-sub">Tambahan akun Ruang Rupa mulai Des 2026 (turunan, belum masuk total di atas): +' + nfmt(rrTot) + ' jam/minggu</div>' +
      '<ul class="bd">' + rr.map(function (r) { return line(r, tot, true); }).join('') + '</ul>' +
      '<div class="bd-sub nojam-sub">Punya poin KPI tapi belum ada estimasi jam</div><div class="nojam-list">' + Object.keys(tanpaJam).map(function (k) { return '<span class="pchip plain"><b>' + esc(k) + '</b> ' + esc(tanpaJam[k].join(' · ')) + '</span>'; }).join('') + '</div>' +
      '<p class="note">Poin KPI = bobot penilaian dari ⚙️ Pengaturan (ikut berubah kalau bobot diubah). * = satu KPI mencakup beberapa jenis pekerjaan (mis. Desain + reels AI, Disiplin Ega), jadi poinnya tidak dijumlah per baris. Sumber jam per item: Page “KPI Tim Ruang Rupa Fatikha” v2 (23 Nov 2026), skenario setelah pembagian reels real/AI. “Turunan” = volume dihitung balik dari total jam per orang di grafik Bobot kerja tim (Hakim 23, Edu 26, Novri 28, Yudhis 17, Ega 29 = 123; selisih ke ' + nfmt(tot) + ' karena grafik dibulatkan: Edu 25,5 → 26, Ega 28,5 → 29). Jam belum dihitung: ' + esc(BELUM.join(', ')) + '.</p>';
    return '<details class="bobot-detail" open><summary><span><b>Detail bobot kerja</b> · jam kerja per jenis pekerjaan + poin KPI per orang</span><span class="bd-tot">' + (S.bd === 'poin' ? 'Skor tiap orang = 100 poin' : 'Total ≈' + nfmt(tot) + ' jam/minggu') + '</span></summary>' +
      '<div class="bd-tabs seg"><button data-bd="jam" class="' + (S.bd === 'jam' ? 'on' : '') + '">Jam kerja</button><button data-bd="poin" class="' + (S.bd === 'poin' ? 'on' : '') + '">Poin KPI per orang</button></div>' +
      (S.bd === 'poin' ? poinView() : jamBody) + '</details>';
  }
  function viewDashboard() {
    var ps = people();
    var sc = ps.map(function (p) { return { p: p, s: score(p) }; });
    var have = sc.filter(function (x) { return x.s != null; });
    var avg = have.length ? have.reduce(function (a, x) { return a + x.s; }, 0) / have.length : null;
    var grp = function (lo, hi) { return have.filter(function (x) { return x.s >= lo && x.s < hi; }).map(function (x) { return x.p.nama; }); };
    var sb = grp(90, 1e9), bk = grp(75, 90), pr = grp(-1, 75);
    var ga = grade(avg);
    var h = '<div class="page-head"><div><h1>Penilaian tim</h1><p>Hasil KPI ' + esc(periodLabel()) + (S.mode === 'minggu' && S.wk === D.meta.mg ? ' · minggu yang dinilai' : '') + '</p></div>' + filters() + '</div>';
    h += '<section class="summary">' +
      '<div class="stat"><div class="k">Rata-rata skor tim</div><div class="v"><em>' + f1(avg) + '</em> <span class="g ' + ga.c + '">' + ga.t + '</span></div></div>' +
      '<div class="stat"><div class="k">Sangat baik</div><div class="v"><em>' + sb.length + '</em> <span>' + esc(sb.join(', ') || '—') + '</span></div></div>' +
      '<div class="stat"><div class="k">Baik</div><div class="v"><em>' + bk.length + '</em> <span>' + esc(bk.join(', ') || '—') + '</span></div></div>' +
      '<div class="stat"><div class="k">Perlu perbaikan / evaluasi</div><div class="v"><em>' + pr.length + '</em> <span>' + esc(pr.join(', ') || (have.length ? 'Tidak ada di periode ini' : 'Belum ada skor')) + '</span></div></div></section>';
    h += '<div class="people">' + ps.map(function (p) {
      var s = score(p), g = grade(s), col = COLORS[p.nama] || p.warna, lw = lastWeekShown();
      var vals = p.w.slice(0, lw);
      var prev = S.mode === 'minggu' && S.wk > 1 ? p.w[S.wk - 2] : null;
      var d = s != null && prev != null ? s - prev : null;
      var cov = covOf(p);
      return '<a class="card" href="#/orang/' + encodeURIComponent(p.nama) + '"><div class="top"><div class="avp" style="background:' + col + '">' + initials(p.nama) + '</div><div class="nm"><b>' + esc(p.nama) + '</b><span>' + esc(p.peran) + '</span></div></div>' +
        '<div class="nm-m"><b>' + esc(p.nama) + '</b><span>' + esc(p.peran) + '</span></div>' +
        '<div class="score-row"><div class="score' + (s == null ? ' na' : '') + '">' + f1(s) + '</div><span class="g ' + g.c + '">' + g.t + '</span></div>' + spark(vals, col) +
        '<div class="trend-lbl"><span>' + (s == null ? 'Belum ada data' : 'Data ' + Math.round((cov || 0) * 100) + '% bobot') + '</span>' + (d == null ? '<span class="cov">' + (S.mode === 'bulan' ? 'rekap bulan' : 'Tren minggu 1–' + lw) + '</span>' : '<span class="' + (d >= 0 ? 'up' : 'down') + '">' + signed(d) + ' vs minggu ' + (S.wk - 1) + '</span>') + '</div></a>';
    }).join('') + '</div>';
    var nW = D.meta.nw;
    var series = ps.map(function (p) { return { color: COLORS[p.nama] || p.warna, vals: p.w.slice(0, nW) }; });
    var att = attention();
    h += '<section class="lower"><div class="panel"><h2>Tren skor per orang</h2><div class="sub">' + esc(D.meta.bulan) + ', minggu 1–' + nW + ' · skor 0–100</div><div class="legend">' + ps.map(function (p) { return '<span><i style="background:' + (COLORS[p.nama] || p.warna) + '"></i>' + esc(p.nama) + '</span>'; }).join('') + '</div>' + trendChart(series, nW) + '</div>' +
      '<div class="panel"><h2>KPI yang perlu perhatian</h2><div class="sub">Capaian di bawah 75% · ' + esc(periodLabel(true)) + ' · dari yang paling rendah</div>' +
      (att.length ? '<ul class="att">' + att.map(function (a) { return '<li class="' + (a.c >= 0.5 ? 'mid' : '') + '"><div class="pct">' + pct(a.c) + '</div><div class="who-k"><b>' + esc(a.k.nama + ' · ' + a.k.kpi) + '</b><span>' + esc(a.why) + '</span></div><div class="bobot">Bobot ' + a.k.bobot + '</div></li>'; }).join('') + '</ul>'
        : '<div class="att-empty">' + (have.length ? 'Tidak ada KPI di bawah 75% pada periode ini.' : 'Belum ada KPI yang jatuh tempo pada periode ini — daftar muncul otomatis setelah ada data.') + '</div>') + '</div></section>';
    h += '<section class="lower lower2">' + progressPanel(ps) + jamPanel(ps) + '</section>';
    h += footer();
    return h;
  }
  function kpiRow(k, sub) {
    var c = capOf(k), st = status(c, k.tpct);
    var sk = c != null && k.bobot > 0 ? k.bobot * c : null;
    return '<tr' + (sub ? ' class="sub"' : '') + '><td>' + (sub ? '↳ ' + esc(k.kpi) : '<b>' + esc(k.kpi) + '</b>') + '</td><td class="c">' + (sub ? '<span class="muted">rincian</span>' : k.bobot) + '</td><td>' + esc(k.target) + '</td><td>' + esc(capText(k)) + '</td>' +
      '<td class="r"><b>' + pct(c) + '</b></td><td><div class="bar">' + (c != null ? '<i class="' + barCls(c) + '" style="width:' + Math.max(0, Math.min(100, c * 100)).toFixed(1) + '%"></i>' : '') + '</div></td>' +
      '<td class="r"><b>' + (sub ? '' : f1(sk)) + '</b></td><td class="c"><span class="tag ' + st.c + '">' + st.t + '</span></td></tr>';
  }
  function tagFor(h) { return h === 'Tepat waktu' ? 'tag-ok' : h === 'Terlambat' || h === 'Belum tayang' ? 'tag-late' : h === 'Terlewat' ? 'tag-miss' : h === 'Menunggu log upload' ? 'tag-info' : 'tag-wait'; }
  function viewPerson(nama) {
    var p = D.orang[nama];
    if (!p) return '<div class="err">Orang "' + esc(nama) + '" tidak ada di data.</div>';
    var col = COLORS[nama] || p.warna, s = score(p), g = grade(s);
    var ks = D.kpi.filter(function (k) { return k.nama === nama; });
    var prev = S.mode === 'minggu' && S.wk > 1 ? p.w[S.wk - 2] : null, d = s != null && prev != null ? s - prev : null;
    var trendTxt = p.w.slice(0, lastWeekShown()).map(function (v) { return v == null ? '—' : f1(v); }).join(' → ');
    var h = '<div class="crumb"><a href="#/">Dashboard</a> &nbsp;›&nbsp; ' + esc(nama) + '</div>';
    h += '<div class="page-head" style="margin-bottom:14px"><div><p style="margin:0">' + esc(periodLabel()) + '</p></div>' + filters() + '</div>';
    h += '<section class="hero"><div class="hero-main" style="--c:' + col + '"><div class="av-lg">' + initials(nama) + '</div><div><h1>' + esc(nama) + '</h1><div class="role">' + esc(p.peran) + '</div></div>' +
      '<div class="hero-score"><div class="num' + (s == null ? ' na' : '') + '">' + f1(s) + '</div><div class="lbl"><span class="g ' + g.c + '">' + g.t + '</span> &nbsp; ' + (S.mode === 'bulan' ? 'skor bulan' : 'skor minggu ' + S.wk) + '</div></div></div>' +
      '<div class="hero-side"><div class="k">Skor ' + esc(D.meta.bulan) + '</div><div class="v">' + f1(p.month) + '</div><div class="hint">Rekap minggu 1–' + D.meta.nw + ' · grade <b>' + grade(p.month).t + '</b></div></div>' +
      '<div class="hero-side"><div class="k">' + (S.mode === 'minggu' && S.wk > 1 ? 'Perubahan vs minggu ' + (S.wk - 1) : 'Cakupan data') + '</div>' +
      (S.mode === 'minggu' && S.wk > 1 ? '<div class="v ' + (d == null ? '' : d >= 0 ? 'up' : 'down') + '">' + signed(d) + '</div>' : '<div class="v">' + Math.round((covOf(p) || 0) * 100) + '%</div>') +
      '<div class="hint">Tren: ' + esc(trendTxt) + '</div></div></section>';
    var rows = '';
    ks.forEach(function (k) {
      if (nama === 'Ega' && k.bobot === 0) return;
      rows += kpiRow(k, false);
      if (nama === 'Ega' && EGA_SUB[k.kpi]) EGA_SUB[k.kpi].forEach(function (sn) { var kk = ks.filter(function (x) { return x.kpi === sn; })[0]; if (kk) rows += kpiRow(kk, true); });
    });
    var tb = ks.filter(function (k) { return k.bobot > 0; }).reduce(function (a, k) { return a + k.bobot; }, 0);
    rows += '<tr class="tot"><td>Total</td><td class="c">' + tb + '</td><td colspan="4">Σ bobot × capaian ÷ Σ bobot KPI yang sudah ada datanya (maks 100% per KPI) · data ' + Math.round((covOf(p) || 0) * 100) + '% bobot</td><td class="r">' + f1(s) + '</td><td class="c"><span class="g ' + g.c + '">' + g.t + '</span></td></tr>';
    h += '<div class="tbl-wrap"><table class="kpi-table"><thead><tr><th>KPI</th><th class="c">Bobot</th><th>Target</th><th>Capaian</th><th class="r">Capaian %</th><th></th><th class="r">Skor</th><th class="c">Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    if (nama === 'Ega') {
      h += '<p class="note">Skor Ega = Disiplin (bobot ' + bob('Ega', 'Disiplin') + ') + Hasil (bobot ' + bob('Ega', 'Hasil') + '); bobot bisa diubah Mas di ⚙️ Pengaturan. Disiplin = rata-rata gabungan konten AI Kesatrian, rekap realtime Sen–Sab, dan laporan mingguan selesai tepat Sabtu (Status Selesai). Hasil = rata-rata Aktual ÷ Target 3 toko × 3 jenis, maks 100% per baris. ROAS (Iklan Shopee): 100% di dalam rentang ROAS min–ROAS maks; di bawah = Aktual ÷ ROAS min; di atas = ROAS maks ÷ Aktual. Mode ROAS saat ini: <b>' + esc(D.meta.roas || '—') + '</b>.</p>';
      h += moneyTable();
    }
    var two = '';
    if (nama === 'Hakim') two += uploadTable(function (c) { return c.akun !== 'Ruang Rupa'; }, 'Cek upload terakhir', 'Kalender konten × Log upload IG · 12 jadwal terakhir yang sudah lewat') + adsTable();
    else if (nama === 'Yudhis') two += uploadTable(function (c) { return c.akun === 'Ruang Rupa'; }, 'Upload Ruang Rupa (IG + TikTok)', 'Jadwal Sen/Rab/Jum dari kalender · reels Edu, upload Yudhis · sumber: KPI Yudhis · Log upload (beres jika IG dan TikTok sama-sama tayang < 12.00)');
    h += '<div class="two-col"><div>' + (two || '') + itemTable(nama) + '</div><div>' + notesPanel(p, ks) + '</div></div>';
    h += footer();
    return h;
  }
  function bob(n, k) { var x = D.kpi.filter(function (r) { return r.nama === n && r.kpi === k; })[0]; return x ? x.bobot : '—'; }
  function itemTable(nama) {
    var its = D.item.filter(function (it) { return it.nama === nama && inPeriod(it); }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var head = '<div class="sect-title">Item penilaian · ' + esc(periodLabel(true)) + '</div>';
    if (!its.length) return head + '<div class="panel"><div class="att-empty">Belum ada item yang jatuh tempo di periode ini.</div></div>';
    var shown = its.slice(0, 15);
    return head + '<div class="tbl-wrap"><table class="log-table"><thead><tr><th>Tanggal</th><th>KPI</th><th>Keterangan</th><th class="r">Nilai</th></tr></thead><tbody>' + shown.map(function (it) {
      var v = it.pembagi ? it.nilai / it.pembagi : null;
      return '<tr><td>' + ddmm(it.date) + '</td><td>' + esc(it.kpi) + '</td><td style="white-space:normal">' + esc(it.ket) + '</td><td class="r"><span class="tag ' + (v == null ? 'tag-wait' : v >= 0.999 ? 'tag-ok' : v > 0 ? 'tag-late' : 'tag-miss') + '">' + (it.pembagi === 1 ? (it.nilai >= 0.999 ? '✓' : it.nilai > 0 ? pct(it.nilai) : '✗') : f1(it.nilai) + '/' + f1(it.pembagi)) + '</span></td></tr>';
    }).join('') + '</tbody></table></div>' + (its.length > shown.length ? '<p class="note">Menampilkan 15 dari ' + its.length + ' item · lengkapnya di tab 🧮 Item.</p>' : '');
  }
  function uploadTable(pred, title, sub) {
    var t = D.meta.today || '9999';
    var rows = D.cek.filter(function (c) { return pred(c) && inPeriod(c) && c.date <= t; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 12);
    var h = '<div class="sect-title">' + esc(title) + '</div>';
    if (!rows.length) return h + '<div class="panel"><div class="sub" style="margin:0">' + esc(sub) + '</div><div class="att-empty">Belum ada jadwal yang lewat di periode ini.</div></div>';
    return h + '<div class="tbl-wrap"><table class="log-table"><thead><tr><th>Jadwal</th><th>Akun</th><th>Jenis</th><th>Diunggah</th><th>Hasil</th><th>Minus</th></tr></thead><tbody>' + rows.map(function (c) {
      return '<tr><td>' + esc(c.hari) + ' ' + ddmm(c.date) + '</td><td>' + esc(c.akun) + '</td><td>' + esc(c.jenis || '—') + '</td><td>' + esc(c.jam || '—') + '</td><td><span class="tag ' + tagFor(c.hasil) + '">' + esc(c.hasil) + '</span></td><td>' + esc(c.minus || '') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  function adsTable() {
    if (!D.ads.length) return '';
    var w = S.mode === 'bulan' ? null : S.wk - 1;
    return '<div class="sect-title">Meta Ads (1 iklan/akun/minggu)</div><div class="tbl-wrap"><table class="log-table"><thead><tr><th>Akun</th><th>' + (w == null ? 'Bulan' : 'Minggu ' + S.wk) + '</th><th class="r">Biaya</th></tr></thead><tbody>' + D.ads.map(function (a) {
      var st = w == null ? a.month : a.w[w]; var b = w == null ? a.biayaMonth : a.biaya[w];
      var cls = /^✓/.test(st || '') ? 'tag-ok' : /^✗/.test(st || '') ? 'tag-miss' : 'tag-wait';
      return '<tr><td>' + esc(a.akun) + '</td><td><span class="tag ' + cls + '">' + esc(st || '—') + '</span></td><td class="r mono">' + (b ? rp(b) : '—') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  function moneyTable() {
    if (!D.uang.length) return '';
    var nW = D.meta.nw, cur = D.meta.curWeek;
    var hdr = ''; for (var i = 1; i <= nW; i++) hdr += '<th class="r">Mg ' + i + '</th>';
    return '<div class="sect-title">Omset & pengeluaran 3 toko (dari Rekap Omset, hanya baca)</div><div class="tbl-wrap"><table class="log-table"><thead><tr><th>Toko</th><th>Baris</th>' + hdr + '<th class="r">Bulan</th></tr></thead><tbody>' + D.uang.map(function (u) {
      var c = ''; for (var i = 0; i < nW; i++) c += '<td class="r mono' + (i + 1 > cur ? ' muted' : '') + '">' + (i + 1 > cur && !u.w[i] ? '—' : rp(u.w[i])) + '</td>';
      return '<tr' + (u.toko.indexOf('Total') === 0 ? ' style="font-weight:600"' : '') + '><td>' + esc(u.toko) + '</td><td>' + esc(u.jenis) + '</td>' + c + '<td class="r mono">' + rp(u.month) + '</td></tr>';
    }).join('') + '</tbody></table></div><p class="note">Omset = Masuk + Pending (sama dengan Rekap Penjualan di Rekap Omset). Minggu yang belum berjalan ditandai —.</p>';
  }
  function notesPanel(p, ks) {
    var out = [];
    var s = score(p);
    if (s == null) out.push('Belum ada KPI yang jatuh tempo di ' + periodLabel(true) + '.');
    else {
      out.push('Skor ' + f1(s) + ' (' + grade(s).t + ') dari ' + Math.round((covOf(p) || 0) * 100) + '% bobot yang sudah ada datanya.');
      var low = ks.filter(function (k) { return k.bobot > 0 && capOf(k) != null; }).sort(function (a, b) { return capOf(a) - capOf(b); })[0];
      if (low) out.push('KPI terendah: ' + low.kpi + ' (' + pct(capOf(low)) + ').');
    }
    var miss = ks.filter(function (k) { return k.bobot > 0 && capOf(k) == null; }).map(function (k) { return k.kpi; });
    if (miss.length) out.push('Belum ada data: ' + miss.join(', ') + '.');
    var srcs = {}; ks.forEach(function (k) { if (k.sumber) srcs[k.sumber] = 1; });
    return '<div class="sect-title">Catatan</div><div class="panel"><div class="sub">Otomatis dari data · bukan bagian rumus skor</div><ul class="notes">' + out.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      spark(p.w.slice(0, lastWeekShown()), COLORS[p.nama] || p.warna) + '<div class="sub" style="margin-top:6px">Tren skor ' + esc(p.nama) + ', ' + esc(D.meta.bulan) + '</div>' +
      '<div class="sub" style="margin-top:12px">Sumber: ' + esc(Object.keys(srcs).join(' · ')) + '</div></div>';
  }

  /* ---------- router ---------- */
  function nav() {
    var cur = decodeURIComponent((location.hash.match(/^#\/orang\/(.+)$/) || [])[1] || '');
    var isB = /^#\/bobot/.test(location.hash);
    document.getElementById('navlinks').innerHTML = '<a href="#/" class="' + (cur || isB ? '' : 'on') + '">Dashboard</a>' + ORDER.map(function (n) { return '<a href="#/orang/' + n + '" class="' + (cur === n ? 'on' : '') + '">' + n + '</a>'; }).join('') + '<span class="nav-div" aria-hidden="true"></span><a href="#/bobot" class="nav-bobot' + (isB ? ' on' : '') + '" title="Jam kerja per jenis pekerjaan + poin KPI per orang">Detail bobot</a>';
    return isB ? '#bobot' : cur;
  }
  function viewBobot() {
    return '<div class="crumb"><a href="#/">Dashboard</a> &nbsp;›&nbsp; Detail bobot</div><div class="page-head"><div><h1>Detail bobot kerja</h1><p>Jam kerja per jenis pekerjaan dan poin KPI per orang · ' + (DEMO ? 'data contoh' : 'poin dibaca dari ⚙️ Pengaturan') + '</p></div></div>' + bobotDetail() + footer();
  }
  function render() {
    if (!D) return;
    var cur = nav(), app = document.getElementById('app');
    var isB = cur === '#bobot';
    app.className = cur && !isB ? 'detail-wrap' : 'main';
    app.innerHTML = isB ? viewBobot() : cur ? viewPerson(cur) : viewDashboard();
    document.title = (isB ? 'Detail bobot — ' : cur ? cur + ' — ' : '') + 'KPI Ruang Rupa' + (DEMO ? ' (data contoh)' : '');
    app.querySelectorAll('[data-mode]').forEach(function (b) { b.onclick = function () { S.mode = b.getAttribute('data-mode'); render(); }; });
    app.querySelectorAll('[data-bd]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); S.bd = b.getAttribute('data-bd'); render(); }; });
    var sel = document.getElementById('wksel'); if (sel) sel.onchange = function () { S.wk = Number(sel.value); render(); };
  }
  window.addEventListener('hashchange', function () { render(); window.scrollTo(0, 0); });

  function start(rows) {
    D = build(rows);
    S.wk = Math.min(Math.max(1, D.meta.mg || 1), D.meta.nw);
    if (qs.get('minggu')) S.wk = Math.min(D.meta.nw, Math.max(1, Number(qs.get('minggu')) || S.wk));
    if (qs.get('mode') === 'bulan') S.mode = 'bulan';
    var upd = document.getElementById('upd'); if (upd) upd.textContent = DEMO ? '' : 'Diperbarui ' + (D.meta.updated || '—') + ' WIB';
    document.getElementById('srcnav').textContent = DEMO ? 'DATA CONTOH — bukan penilaian asli' : 'Diperbarui ' + (D.meta.updated || '—') + ' WIB · Sheet KPI Ruang Rupa';
    render();
  }
  function fail(msg) {
    document.getElementById('app').innerHTML = '<div class="err"><b>Data belum bisa dimuat.</b><br>' + esc(msg) +
      '<br><br>' + (GAS ? 'Cek: tab <b>🌐 Web</b> masih ada di sheet <i>KPI Ruang Rupa — Skor</i> dan web app di-deploy dengan <i>Execute as: Me</i>.' : 'File <b>data.json</b> (snapshot dari sheet) belum ada atau rusak — coba muat ulang beberapa menit lagi.') + ' Untuk presentasi tanpa data asli, buka <a target="_top" href="' + esc(BASE) + '?demo=1"><code>?demo=1</code></a>.</div>';
  }
  if (DEMO) {
    document.getElementById('badge').hidden = false;
    start(window.__demoRows ? window.__demoRows() : demoRows());
    return;
  }
  if (GAS) {
    google.script.run
      .withSuccessHandler(function (rows) { try { start(rows); } catch (e) { fail(e.message); } })
      .withFailureHandler(function (e) { fail((e && e.message) || String(e)); })
      .getWebRows();
    return;
  }
  if (!qs.get('src')) { // situs statis (GitHub/Cloudflare Pages): snapshot ./data.json, diperbarui rutin per jam
    fetch('data.json?_=' + Math.floor(Date.now() / 60000), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('data.json HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        var rows = d && d.rows ? d.rows : d;
        if (d && d.generated) rows = rows.map(function (r) { return r[0] === 'meta' ? r.slice(0, 5).concat([d.generated]).concat(r.slice(6)) : r; });
        try { start(rows); } catch (e) { fail(e.message); }
      })
      .catch(function (e) { fail((e && e.message) || String(e)); });
    return;
  }
  var src = [qs.get('src')];
  (function tryNext(i, lastErr) {
    if (i >= src.length) return fail(lastErr || 'Sumber tidak bisa diakses.');
    fetch(src[i] + (src[i].indexOf('?') >= 0 ? '&' : '?') + '_=' + Math.floor(Date.now() / 60000), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (t) { if (/^\s*</.test(t)) throw new Error('Sumber mengembalikan halaman HTML, bukan CSV (belum dipublikasikan?).'); var rows = parseCSV(t); build(rows); start(rows); })
      .catch(function (e) { tryNext(i + 1, e.message); });
  })(0);

  /* ---------- demo data (fiktif) ---------- */
  function demoRows() {
    var r = [['tipe']];
    r.push(['meta', 'Desember 2026', '2026-12-01', '4', '5', '2026-12-26 08:00', '2026-12-01', '2026-11-30', '2026-12-26', '1 Des–6 Des', '7 Des–13 Des', '14 Des–20 Des', '21 Des–27 Des', '28 Des–31 Des', '', '4', '2026-12-31', 'Rentang (Target s.d. Target maks)']);
    var P = { Hakim: 'Sosmed spesialis', Edu: 'Kreator video', Novri: 'Kreator desain', Yudhis: 'Kreator desain', Ega: 'Marketplace & produk' };
    var K = [
      ['Hakim', 'Upload tepat jadwal', 30, '42 post/minggu di 11 akun, tayang < 12.00 WIB', .95, [.7, .76, .78, .81]],
      ['Hakim', 'Brief tepat waktu', 15, 'Brief H-2 sebelum tayang', 1, [.6, .75, .75, .75]],
      ['Hakim', 'Meta Ads', 20, '1 iklan/minggu di Fatikha, KHN, King Pandanus', 1, [.67, 1, 1, 1]],
      ['Hakim', 'Laporan data akun', 15, 'Laporan 11 akun siap tiap meeting', 1, [1, 1, 1, 1]],
      ['Hakim', 'Pertumbuhan akun', 10, 'Reach & followers naik vs bulan lalu', 1, [.5, .5, .55, .55]],
      ['Hakim', 'Live Shopee (tim)', 6, 'Rolling, live 4 jam mulai 18.00', 1, [.75, .75, 1, .75]],
      ['Hakim', 'Meeting tim', 4, 'Hadir + ≥ 1 gagasan/evaluasi', 1, [1, 1, 1, 1]],
      ['Edu', 'Reels tepat waktu', 40, 'Reels real sesuai jadwal', .95, [.95, .9, 1, .97]],
      ['Edu', 'Kualitas sesuai brief', 25, 'Lolos maksimal 1× revisi', .8, [.9, .88, .92, .92]],
      ['Edu', 'Support divisi & event', 25, 'Request selesai sesuai deadline', 1, [1, 1, 1, 1]],
      ['Edu', 'Live Shopee (tim)', 6, 'Rolling, live 4 jam mulai 18.00', 1, [.75, .75, .75, 1]],
      ['Edu', 'Meeting tim', 4, 'Hadir + ≥ 1 gagasan/evaluasi', 1, [1, 1, 1, 1]],
      ['Novri', 'Desain + reels AI tepat waktu', 40, '19 desain + ±3 reels AI/minggu', .95, [.9, .92, .9, .95]],
      ['Novri', 'Brief tepat waktu', 15, 'Brief Cukup Umur & Titan H-2', 1, [.83, .83, 1, .83]],
      ['Novri', 'Kualitas sesuai brief', 20, 'Lolos maksimal 1× revisi', .8, [.85, .9, .85, .9]],
      ['Novri', 'Support divisi & event', 15, 'Request selesai sesuai deadline', 1, [1, 1, .8, 1]],
      ['Novri', 'Live Shopee (tim)', 6, 'Rolling, live 4 jam mulai 18.00', 1, [.75, .75, .75, .75]],
      ['Novri', 'Meeting tim', 4, 'Hadir + ≥ 1 gagasan/evaluasi', 1, [1, 1, 1, 1]],
      ['Yudhis', 'Desain + reels AI tepat waktu', 35, '9 desain + ±2,5 reels AI/minggu', .95, [.85, .9, .9, .92]],
      ['Yudhis', 'Visual marketplace', 25, 'Banner H-3 kampanye + uji cover 2 mingguan', 1, [.5, .6, .6, .6]],
      ['Yudhis', 'Kualitas sesuai brief', 15, 'Lolos maksimal 1× revisi', .8, [.8, .85, .9, .85]],
      ['Yudhis', 'Support divisi & event', 15, 'Request selesai sesuai deadline', 1, [1, 1, 1, 1]],
      ['Yudhis', 'Live Shopee (tim)', 6, 'Rolling, live 4 jam mulai 18.00', 1, [.5, .5, .5, .5]],
      ['Yudhis', 'Brief tepat waktu', 15, 'Brief Ruang Rupa H-2 sebelum tayang', 1, [1, 1, .67, .67]],
      ['Yudhis', 'Meeting tim', 4, 'Hadir + ≥ 1 gagasan/evaluasi', 1, [0, 1, 1, 0]],
      ['Ega', 'Disiplin', 30, 'To-do selesai: konten AI Kesatrian, rekap harian Sen–Sab, laporan mingguan selesai Sabtu', 1, [.9, .93, .95, .94]],
      ['Ega', 'Hasil', 70, 'Rata-rata capaian 3 toko × 3 jenis', 1, [.84, .86, .89, .88]],
      ['Ega', 'Konten AI Kesatrian', 0, 'Rincian Disiplin · 18 konten/minggu', .95, [.89, .94, .94, .94]],
      ['Ega', 'Rekap realtime', 0, 'Rincian Disiplin · catatan tiap Sen–Sab', 1, [1, 1, 1, 1]],
      ['Ega', 'Laporan tepat Sabtu', 0, 'Rincian Disiplin · 9 laporan/minggu', 1, [.78, .78, .89, .89]],
      ['Ega', 'Optimasi & omset', 0, 'Rincian Hasil · omset vs target', 1, [.82, .85, .9, .88]],
      ['Ega', 'Kesehatan toko', 0, 'Rincian Hasil · skor kesehatan vs target', 1, [.95, .95, .96, .96]],
      ['Ega', 'Iklan Shopee', 0, 'Rincian Hasil · ROAS dalam rentang', 1, [.75, .78, .81, .8]]
    ];
    // Ega Disiplin/Hasil = gabungan rincian (pembagi sama → rata-rata); skor orang = Σ(bobot × min(capaian;1)) ÷ Σbobot × 100 — sama dengan rumus sheet
    var mean = function (a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; };
    var kc = function (n, kp) { return K.filter(function (k) { return k[0] === n && k[1] === kp; })[0][5]; };
    K.forEach(function (k) { if (k[0] === 'Ega' && EGA_SUB[k[1]]) k[5] = [0, 1, 2, 3].map(function (i) { return Math.round(mean(EGA_SUB[k[1]].map(function (s) { return kc('Ega', s)[i]; })) * 10000) / 10000; }); });
    var team = [0, 0, 0, 0];
    ORDER.forEach(function (n) {
      var ks = K.filter(function (k) { return k[0] === n && k[2] > 0; }), sb = ks.reduce(function (a, k) { return a + k[2]; }, 0);
      var w = [0, 1, 2, 3].map(function (i) { return ks.reduce(function (a, k) { return a + k[2] * Math.min(1, k[5][i]); }, 0) / sb * 100; });
      var m = ks.reduce(function (a, k) { return a + k[2] * Math.min(1, mean(k[5])); }, 0) / sb * 100;
      w.forEach(function (v, i) { team[i] += v / 5; });
      r.push(['orang', n, P[n], COLORS[n], w[0].toFixed(2), w[1].toFixed(2), w[2].toFixed(2), w[3].toFixed(2), '', '', m.toFixed(2), 1, 1, 1, 1, '', '', 1]);
    });
    r.push(['orang', 'Tim', 'Rata-rata', '#0f3d2e'].concat(team.map(function (v) { return v.toFixed(2); })).concat(['', '', '']));
    K.forEach(function (k) { var w = k[5], m = w.reduce(function (a, b) { return a + b; }, 0) / 4; r.push(['kpi', k[0], k[1], k[2], k[3], k[4], w[0], w[1], w[2], w[3], '', '', m.toFixed(4), '', '', 'Data contoh']); });
    // items so capaian text is consistent with the % above
    K.forEach(function (k) {
      if (k[0] === 'Ega' && (k[1] === 'Disiplin' || k[1] === 'Hasil')) return;
      k[5].forEach(function (c, i) { var d = 10; r.push(['item', k[0], k[1], ['2026-12-02', '2026-12-09', '2026-12-16', '2026-12-23'][i], String(i + 1), (c * d).toFixed(2), String(d), 'Data contoh · minggu ' + (i + 1), 'Data contoh']); });
    });
    [['King Pandanus', [4.1e6, 4.6e6, 5.1e6, 4.9e6], [1.2e6, 1.3e6, 1.25e6, 1.1e6]], ['Intenskin', [2.1e5, 2.4e5, 4.8e5, 3.5e5], [1.1e5, 8e4, 2.2e5, 9e4]], ['Kesatrian', [1.0e6, 4.7e5, 2.8e5, 6.1e5], [9.4e4, 6.1e5, 3.2e5, 2.8e5]]].forEach(function (t) {
      var sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
      r.push(['uang', t[0], 'Omset (Masuk + Pending)'].concat(t[1], [0, 0, sum(t[1])]));
      r.push(['uang', t[0], 'Pengeluaran'].concat(t[2], [0, 0, sum(t[2])]));
    });
    ['Fatikha', 'Kapsul Herbal Nusantara', 'King Pandanus'].forEach(function (a, j) { r.push(['ads', a, '✓ 1 iklan', j === 2 ? '✗ Terlewat' : '✓ 1 iklan', '✓ 1 iklan', '✓ 1 iklan', 'Belum mulai', '', (j === 2 ? 3 : 4) + ' / 4 minggu', 150000, 150000, 175000, 150000, '', '', 625000]); });
    var akun = ['Fatikha', 'Kapsul Herbal Nusantara', 'King Pandanus', 'Digital Marketing Indonesia', 'Pins Beauty', 'Sobatnya Tani', 'M-Nature', 'Visospect', 'Thibbun Nabawi', 'Cukup Umur', 'Titan Gel Gold'];
    var hs = ['Tepat waktu', 'Tepat waktu', 'Tepat waktu', 'Terlambat', 'Tepat waktu', 'Terlewat', 'Tepat waktu', 'Tepat waktu', 'Tepat waktu', 'Tepat waktu', 'Tepat waktu'];
    for (var dday = 21; dday <= 26; dday++) akun.forEach(function (a, j) { var h = hs[(j + dday) % hs.length]; r.push(['cek', '2026-12-' + dday, ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][dday - 21], '4', a, 'Desain', 'Done', '', h === 'Terlewat' ? '' : dday + '/12 ' + (h === 'Terlambat' ? '13:05' : '10:' + (10 + j)), h, h === 'Tepat waktu' ? '' : 'Hakim']); });
    [[21, 'Sen', 'IG 21/12 10:05 · TikTok 21/12 10:20', 'Tepat waktu', ''], [23, 'Rab', 'IG 23/12 09:50 · TikTok 23/12 12:40', 'Terlambat', 'Yudhis'], [25, 'Jum', 'IG 25/12 10:10 · TikTok 25/12 10:12', 'Tepat waktu', '']].forEach(function (c) { r.push(['cek', '2026-12-' + c[0], c[1], '4', 'Ruang Rupa', 'Video', 'Done', 'Edu', c[2], c[3], c[4]]); });
    [['Hakim', 236, 332], ['Edu', 43, 55], ['Novri', 121, 157], ['Yudhis', 78, 106], ['Ega', 117, 153]].forEach(function (t) { r.push(['todo', t[0], String(t[1]), String(t[2])]); });
    r.push(['todo_meta', 'Sabtu, 26 Desember 2026']);
    return r;
  }
})();

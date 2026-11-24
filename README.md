# KPI Tim Ruang Rupa — dashboard publik (statis)

- Front-end: `index.html`, `app.js`, `app.css` (tanpa build).
- Data: `data.json` = snapshot tab 🌐 Web sheet *KPI Ruang Rupa — Skor* + blok Progress Individu hub, dibuat oleh
  `/workspace/ruangrupa_kpi/data_snapshot/build_data.py` dan di-push tiap jam (`publish.sh`).
- `?demo=1` = data contoh.
- Hosting: GitHub Pages (branch `main`, folder `/`) dan/atau Cloudflare Pages (production branch `main`, build command kosong, output directory `/`).

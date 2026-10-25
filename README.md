# Academic Support Service — Website & Sistem Pemesanan

Website company profile dan sistem proses bisnis (pesan → review → bayar → dikerjakan → quality check → revisi → selesai)
untuk tim **Academic Support Service** (LKM P1 Web Development, S1 Bisnis Digital — Universitas Pahlawan Tuanku Tambusai).

- **Backend:** Flask (Python) + Flask-SQLAlchemy + SQLite, REST API di `/api/*`
- **Frontend:** Vue 3 + Vue Router (SPA, tanpa build step; library ada di `app/static/vendor`)

📘 **Dokumentasi:** [Panduan Penggunaan](docs/PANDUAN-PENGGUNAAN.md) (pelanggan, admin, editor) ·
[Dokumentasi Pengembangan](docs/DOKUMENTASI-PENGEMBANGAN.md) (arsitektur, API, alur status, deployment)

## Menjalankan

**Windows (paling mudah):** dobel-klik **`run.bat`**. Skrip ini membuat virtualenv, memasang dependensi, mengisi data
demo, lalu membuka http://127.0.0.1:5000 di browser. Di Linux/macOS: `./run.sh`.

Manual:

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows  (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt
python run.py --demo            # tanpa --demo = database hanya berisi layanan & akun tim
```

`python run.py --reset --demo` menghapus database & unggahan lalu mengisi ulang data demo.
Test: `pip install -r requirements-dev.txt` lalu `python -m pytest`.

### Akun demo

| Peran | Email | Kata sandi |
|---|---|---|
| Admin & CS (Felycia) | admin@academicsupport.id | admin123 |
| Editor & Tutor (Bintang) | editor@academicsupport.id | editor123 |
| Marketing & Web (Inayah, akses admin) | marketing@academicsupport.id | marketing123 |
| Pelanggan | mahasiswa@demo.id | mahasiswa123 |
| Pelanggan demo lain | dinda@demo.id, rizky@demo.id | demo123 |

Ganti kata sandi dan `SECRET_KEY` (environment variable) sebelum dipublikasikan.

## Halaman

**Company profile:** Beranda, Tentang (visi-misi, tim, komitmen integritas akademik), Layanan & Harga (+ simulasi harga), Kontak (form tersimpan ke database).

**Aplikasi:** Dashboard per peran, Daftar pesanan, Pesan layanan, Detail pesanan (aksi alur kerja, file, riwayat & diskusi), Kelola (harga layanan, akun staf, pesan kontak).

## Alur proses bisnis

| # | Status | Siapa | Aksi |
|---|---|---|---|
| 1 | Menunggu Review | Pelanggan | Pilih layanan, isi detail, unggah dokumen, setujui pernyataan integritas |
| 2 | → Menunggu Pembayaran / Ditolak | Admin | Tinjau, tetapkan harga final, atau tolak (mis. permintaan joki) |
| 3 | → Verifikasi Pembayaran | Pelanggan | Unggah bukti bayar (transfer/e-wallet/QRIS) — bisa batal sebelum bayar |
| 4 | → Sedang Dikerjakan | Admin | Verifikasi pembayaran & tunjuk editor (atau tolak bukti) |
| 5 | → Quality Check | Editor | Unggah hasil editing/proofreading |
| 6 | → Hasil Dikirim | Admin | Lolos QC (file baru terlihat pelanggan) atau kembalikan ke editor |
| 7 | → Proses Revisi | Pelanggan | Ajukan revisi (gratis maks. 2x) → kembali ke langkah 5 |
| 8 | → Selesai | Pelanggan | Terima hasil, beri rating & ulasan (opsional tampil sebagai testimoni) |

Harga: harga dasar mencakup sejumlah halaman/slide/sesi, kelebihannya per unit; deadline lebih cepat dari waktu
pengerjaan normal otomatis ekspres (+50%). Dashboard admin menghitung ekonomi unit & titik impas dari LKM Bagian C
(biaya variabel Rp1.000/order, biaya tetap Rp55.000/bulan, promosi Rp30.000, CAC Rp3.000) — ubah di `app/__init__.py`.

Hak akses file: editor tidak melihat bukti pembayaran; pelanggan hanya melihat hasil yang sudah lolos QC;
catatan internal admin/editor tidak terlihat pelanggan.

## Yang perlu disesuaikan tim

- Nomor WhatsApp & email: `app/static/js/api.js` (`WA_NUMBER`) dan footer di `app/static/js/main.js`
- Rekening pembayaran: `PAYMENT_INFO` di `app/static/js/pages/order-detail.js`
- Layanan & harga awal: `app/seed.py` (atau lewat menu **Kelola** setelah login admin)

## Struktur

```
app/
  __init__.py      create_app, konfigurasi, SPA fallback
  models.py        User, Service, Order, OrderFile, OrderLog, ContactMessage
  workflow.py      status, transisi & perhitungan harga
  routes/          auth.py, public.py, orders.py, admin.py
  static/          index.html, css/, js/ (Vue), vendor/
run.py
```

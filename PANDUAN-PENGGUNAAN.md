# Panduan Penggunaan — Academic Support Service

Panduan ini menjelaskan cara memakai website Academic Support Service untuk tiga jenis pengguna:

- **[A. Pelanggan (mahasiswa)](#a-panduan-pelanggan)**: memesan layanan, membayar, mengunduh hasil, meminta revisi.
- **[B. Admin & Customer Service](#b-panduan-admin)**: meninjau pesanan, memverifikasi pembayaran, quality check, mengelola layanan.
- **[C. Editor & Tutor](#c-panduan-editor)**: mengerjakan pesanan dan mengunggah hasil.

---

## Memulai

**Membuka aplikasi di komputer tim:** dobel-klik **`run.bat`** di folder `academic-support`. Jendela hitam akan muncul
dan browser terbuka otomatis ke **http://127.0.0.1:5000**. Biarkan jendela hitam tetap terbuka selama aplikasi dipakai.
Tutup jendela itu (atau tekan `CTRL+C`) untuk menghentikan aplikasi.

**Akun percobaan** (tersedia setelah dijalankan dengan data demo):

| Peran | Email | Kata sandi |
|---|---|---|
| Admin & CS | admin@academicsupport.id | admin123 |
| Editor & Tutor | editor@academicsupport.id | editor123 |
| Pelanggan | mahasiswa@demo.id | mahasiswa123 |
| Pelanggan lain | dinda@demo.id · rizky@demo.id | demo123 |

### Alur pesanan secara singkat

```
Pelanggan pesan → Admin review → Pelanggan bayar → Admin verifikasi & tunjuk editor
→ Editor kerjakan → Admin quality check → Pelanggan terima (atau minta revisi) → Selesai
```

Setiap pesanan menampilkan **progress bar 7 langkah** dan kotak kuning berisi **langkah berikutnya**, jadi setiap
pengguna selalu tahu apa yang harus dilakukan.

| Status | Artinya | Menunggu siapa |
|---|---|---|
| Menunggu Review Admin | Pesanan baru masuk | Admin |
| Menunggu Pembayaran | Harga sudah dikonfirmasi | Pelanggan |
| Verifikasi Pembayaran | Bukti bayar sudah diunggah | Admin |
| Sedang Dikerjakan | Editor sedang bekerja | Editor |
| Quality Check | Hasil sedang diperiksa sebelum dikirim | Admin |
| Hasil Dikirim | Hasil siap diunduh | Pelanggan |
| Proses Revisi | Pelanggan meminta perbaikan | Editor |
| Selesai | Pesanan diterima pelanggan | – |
| Dibatalkan / Ditolak | Pesanan berhenti | – |

---

## Halaman company profile

Halaman ini bisa dibuka siapa saja tanpa login:

- **Beranda**: pengenalan layanan, cara kerja, testimoni, dan FAQ.
- **Tentang**: visi-misi, tim, dan komitmen integritas akademik.
- **Layanan**: detail harga tiap layanan dan **simulasi harga**.
- **Kontak**: WhatsApp, email, lokasi, dan formulir pesan.

![Beranda](img/01-beranda.png)

![Cara kerja](img/02-cara-kerja.png)

Di halaman **Layanan**, pilih layanan dan jumlah halaman/slide untuk melihat estimasi biaya, lalu klik
**Pesan dengan estimasi ini**.

![Simulasi harga](img/03-simulasi-harga.png)

Website juga nyaman dibuka di ponsel. Menu ada di tombol ☰ kanan atas.

<img src="img/06-mobile.png" alt="Tampilan ponsel" width="300">

---

## A. Panduan Pelanggan

### A1. Daftar akun

1. Klik **Pesan Sekarang** atau **Masuk → Daftar gratis**.
2. Isi nama lengkap, email, nomor WhatsApp, dan kata sandi (minimal 6 karakter).
3. Klik **Daftar**. Anda langsung masuk ke akun.

![Daftar](img/05-daftar.png)

### A2. Dashboard

Dashboard menampilkan pesanan yang **perlu tindakan Anda** (membayar atau memeriksa hasil), pesanan yang sedang
diproses, dan pesanan selesai. Klik salah satu baris untuk membuka detailnya.

![Dashboard pelanggan](img/10-pelanggan-dashboard.png)

### A3. Membuat pesanan

1. Klik **Pesan Baru** di menu kiri.
2. **Pilih layanan.**
3. Isi **detail dokumen**: judul, mata kuliah, jumlah halaman/slide, gaya sitasi, bahasa, deadline, dan catatan untuk editor.
   - Jika deadline lebih cepat dari waktu pengerjaan normal, pesanan otomatis menjadi **ekspres (+50%)** dan akan muncul pemberitahuan.
4. **Unggah dokumen** (DOC, DOCX, PDF, PPT, PPTX, ODT, TXT, maksimal 20 MB). Untuk tutoring, unggahan bersifat opsional.
5. Periksa **Ringkasan** biaya di sebelah kanan, lalu centang **pernyataan integritas akademik**.
6. Klik **Kirim Pesanan**. Belum perlu membayar sekarang.

![Form pesanan](img/11-pelanggan-form-pesan.png)

> Academic Support Service membantu memperbaiki bahasa, format, dan presentasi dari **karya Anda sendiri**. Kami tidak
> menerima permintaan menulis tugas dari nol, joki ujian, atau manipulasi plagiasi. Pesanan seperti itu akan ditolak.

### A4. Membayar

Setelah admin menyetujui pesanan, status berubah menjadi **Menunggu Pembayaran** dan harga final ditampilkan.

1. Buka pesanan, lalu transfer sesuai nominal ke rekening/e-wallet yang tertera.
2. Pilih **metode pembayaran** dan unggah **bukti pembayaran** (JPG/PNG/PDF).
3. Klik **Kirim Bukti Pembayaran**. Admin akan memverifikasi, lalu pesanan mulai dikerjakan.

![Pembayaran](img/12-pelanggan-pembayaran.png)

Selama pesanan belum dibayar, Anda masih bisa membatalkannya lewat tautan **Batalkan pesanan**.

### A5. Mengunduh hasil, menerima, atau meminta revisi

Saat status menjadi **Hasil Dikirim**, file hasil muncul di bagian **File → Hasil pekerjaan** (kotak hijau).
Klik file untuk mengunduh.

![Hasil dikirim](img/13-pelanggan-hasil-dikirim.png)

- **Sudah sesuai?** Pilih **Terima hasil**, beri rating bintang dan ulasan, lalu klik **Terima & Selesaikan**.
  Jika Anda mencentang izin tampil, ulasan akan muncul di beranda dengan nama yang disingkat.
- **Masih ada yang kurang?** Pilih **Ajukan revisi**, jelaskan bagian yang perlu diperbaiki (boleh melampirkan file),
  lalu klik **Kirim Permintaan Revisi**. Revisi gratis maksimal **2 kali**.

![Ajukan revisi](img/14-pelanggan-revisi.png)

![Pesanan selesai](img/15-pelanggan-selesai.png)

### A6. Berdiskusi tentang pesanan

Di bagian bawah detail pesanan ada **Riwayat & diskusi**. Semua perubahan status tercatat di sana, dan Anda bisa
menulis pesan untuk admin/editor.

---

## B. Panduan Admin

Login dengan akun admin. Menu kiri berisi **Dashboard**, **Pesanan**, dan **Kelola**.

### B1. Dashboard admin

- **Empat kartu teratas** menunjukkan pekerjaan yang menunggu Anda: pesanan perlu direview, pembayaran perlu diverifikasi,
  hasil menunggu quality check, dan pesan kontak belum dibaca. Klik kartu untuk langsung membuka daftarnya.
- **Ekonomi unit bulan ini** menghitung pendapatan, biaya variabel, biaya tetap, promosi, laba bersih, dan bagi hasil
  per anggota (1/3), sesuai LKM Bagian C.
- **Titik impas** menunjukkan progres jumlah pesanan terbayar terhadap target minimal per bulan.
- **Beban kerja editor** membantu membagi tugas secara merata.

![Dashboard admin](img/20-admin-dashboard.png)

### B2. Daftar pesanan

Gunakan tab filter (Review, Verifikasi bayar, Quality check, dan seterusnya) dan kotak pencarian (kode, judul, atau
nama pelanggan).

![Daftar pesanan](img/21-admin-daftar-pesanan.png)

### B3. Meninjau pesanan baru (status: Menunggu Review Admin)

1. Buka pesanan dan unduh dokumen pelanggan untuk dicek.
2. Pastikan permintaan sesuai komitmen integritas akademik.
3. Isi/ubah **Harga final** bila perlu dan tulis catatan untuk pelanggan.
4. Klik **Setujui & Minta Pembayaran**, atau **Tolak Pesanan** dengan alasan yang jelas.

Kontak pelanggan (email dan HP) tersedia di panel kanan bila perlu menghubungi lewat WhatsApp.

![Review pesanan](img/22-admin-review.png)

### B4. Memverifikasi pembayaran (status: Verifikasi Pembayaran)

1. Unduh **Bukti pembayaran** di bagian File, lalu cocokkan nominal dengan mutasi rekening/e-wallet.
2. Pilih **editor** yang akan mengerjakan.
3. Klik **Verifikasi & Mulai Kerjakan**. Jika bukti tidak valid, isi alasan lalu klik **Tolak Bukti**
   (pelanggan akan diminta mengunggah ulang).

![Verifikasi pembayaran](img/23-admin-verifikasi-pembayaran.png)

### B5. Quality check (status: Quality Check)

1. Unduh file **Hasil pekerjaan** terbaru dari editor dan periksa kualitasnya.
2. Jika sudah baik: tulis catatan untuk pelanggan (opsional), lalu klik **Lolos QC & Kirim ke Pelanggan**. File hasil baru
   terlihat oleh pelanggan setelah langkah ini.
3. Jika belum: tulis catatan perbaikan, lalu klik **Kembalikan ke Editor**. Catatan ini bersifat internal dan tidak
   terlihat pelanggan.

Editor yang menangani bisa diganti kapan saja selama pesanan masih dikerjakan lewat **Ganti Editor**.

![Quality check](img/24-admin-quality-check.png)

### B6. Menu Kelola

**Layanan & Harga**: ubah harga dasar, jumlah halaman/slide yang sudah termasuk, harga tambahan per unit, lama
pengerjaan, dan status aktif, lalu klik **Simpan**. Perubahan langsung berlaku di website dan untuk pesanan baru.

![Kelola layanan](img/25-admin-kelola-layanan.png)

**Tim & Pengguna**: lihat semua akun, buat akun staf baru (admin/editor), dan aktifkan/nonaktifkan akun.

![Kelola tim](img/26-admin-tim.png)

**Pesan Kontak**: pesan dari formulir Kontak di website. Balas langsung lewat tombol WhatsApp/Email, lalu tandai
sudah dibaca.

![Pesan kontak](img/27-admin-pesan-kontak.png)

---

## C. Panduan Editor

Login dengan akun editor. Menu kiri berisi **Dashboard** dan **Tugas Saya**. Editor hanya melihat pesanan yang
ditugaskan kepadanya.

### C1. Dashboard editor

Kartu **Perlu dikerjakan / revisi** menunjukkan tugas yang harus segera diselesaikan. Perhatikan kolom deadline:
teks merah berarti deadline tinggal ≤ 1 hari.

![Dashboard editor](img/30-editor-dashboard.png)

### C2. Mengerjakan dan mengunggah hasil

1. Buka tugas, lalu baca **Catatan pelanggan** dan **Riwayat & diskusi** (untuk revisi, alasan revisi tertulis di sana).
2. Unduh **Dokumen pelanggan** dan kerjakan. Disarankan memakai *track changes* agar pelanggan bisa melihat perubahan.
3. Pada panel **Tindakan**, pilih file hasil (boleh lebih dari satu) dan tulis ringkasan perubahan.
4. Klik **Kirim ke Quality Check**. Admin akan memeriksa sebelum hasil dikirim ke pelanggan.
5. Jika admin mengembalikan hasil, tugas muncul lagi di **Perlu dikerjakan** beserta catatannya di riwayat.

Centang **Catatan internal** saat menulis pesan yang hanya untuk admin.

![Unggah hasil](img/31-editor-unggah-hasil.png)

---

## Pertanyaan umum & kendala

| Kendala | Solusi |
|---|---|
| Halaman tidak terbuka / "This site can't be reached" | Pastikan `run.bat` sedang berjalan (jendela hitam masih terbuka), lalu buka http://127.0.0.1:5000 |
| Lupa kata sandi | Belum ada fitur reset otomatis. Hubungi admin untuk dibuatkan akun baru |
| File gagal diunggah | Periksa format file dan pastikan ukurannya ≤ 20 MB |
| Tombol tindakan tidak muncul | Tindakan hanya muncul untuk peran dan status yang sesuai. Lihat kotak kuning "langkah berikutnya" untuk mengetahui pesanan sedang menunggu siapa |
| Hasil belum terlihat pelanggan | Hasil baru terlihat setelah admin menekan **Lolos QC & Kirim ke Pelanggan** |
| Tidak bisa minta revisi lagi | Kuota revisi gratis (2x) sudah habis. Hubungi admin lewat diskusi pesanan |
| Ingin mengulang data dari awal | Jalankan `python run.py --reset --demo` (menghapus semua pesanan dan file) |

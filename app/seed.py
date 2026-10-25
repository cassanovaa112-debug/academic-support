"""Data awal: layanan (sesuai LKM P1) dan akun tim."""
from .extensions import db
from .models import Service, User

SERVICES = [
    dict(slug="editing-formatting", name="Paket Editing & Formatting", icon="star", featured=True, sort=1,
         short="Layanan utama: perbaikan bahasa sekaligus merapikan format tugas sesuai pedoman.",
         description="Paket paling lengkap untuk tugas, makalah, dan laporan. Kami memeriksa ejaan, tata bahasa, "
                     "struktur kalimat, lalu merapikan format dokumen (margin, heading, daftar isi, penomoran, "
                     "sitasi & daftar pustaka) sesuai pedoman yang Anda berikan.",
         features="Proofreading ejaan & tata bahasa (PUEBI/KBBI)\nPerbaikan struktur kalimat & koherensi\n"
                  "Formatting sesuai pedoman kampus\nRapikan sitasi & daftar pustaka\nCatatan perubahan (track changes)",
         base_price=25000, included_units=10, unit_label="halaman", extra_unit_price=2000, turnaround_days=3),
    dict(slug="proofreading", name="Editing & Proofreading", icon="pen", sort=2,
         short="Periksa ejaan, tata bahasa, dan kejelasan kalimat tanpa mengubah isi gagasan Anda.",
         description="Fokus pada kualitas bahasa. Editor memberikan koreksi langsung dengan track changes dan "
                     "komentar, sehingga Anda tetap memegang kendali atas isi tulisan.",
         features="Koreksi ejaan & tanda baca\nPerbaikan tata bahasa\nSaran pilihan kata akademik\nTrack changes & komentar",
         base_price=20000, included_units=10, unit_label="halaman", extra_unit_price=1500, turnaround_days=2),
    dict(slug="formatting", name="Formatting Dokumen", icon="layout", sort=3,
         short="Rapikan tampilan dokumen: margin, heading, daftar isi, tabel, gambar, dan penomoran.",
         description="Cocok untuk tugas yang isinya sudah final namun formatnya belum sesuai pedoman. "
                     "Kami merapikan layout tanpa mengubah isi.",
         features="Margin, spasi & font sesuai pedoman\nHeading & daftar isi otomatis\nPenomoran tabel/gambar\n"
                  "Daftar pustaka rapi",
         base_price=15000, included_units=20, unit_label="halaman", extra_unit_price=1000, turnaround_days=2),
    dict(slug="presentation", name="Presentation Support", icon="slides", sort=4,
         short="Bantu menyusun & memperbaiki slide presentasi berdasarkan materi Anda.",
         description="Materi tetap dari Anda — kami bantu merapikan alur, desain slide yang bersih, dan "
                     "memberi catatan latihan presentasi.",
         features="Penyusunan alur slide dari materi Anda\nDesain slide konsisten & bersih\n"
                  "Visualisasi data sederhana\nTips latihan presentasi",
         base_price=30000, included_units=15, unit_label="slide", extra_unit_price=2000, turnaround_days=3),
    dict(slug="tutoring", name="Tutoring & Academic Mentoring", icon="users", sort=5,
         short="Pendampingan belajar satu-satu atau kelompok untuk memahami materi kuliah.",
         description="Sesi belajar 60 menit (online via Google Meet atau tatap muka) untuk memahami materi. "
                     "Kami mendampingi proses belajar — bukan mengerjakan tugas Anda.",
         features="Sesi 60 menit per pertemuan\nOnline (Google Meet) atau tatap muka\nRingkasan materi setelah sesi\n"
                  "Latihan soal terarah",
         base_price=35000, included_units=1, unit_label="sesi", extra_unit_price=35000, turnaround_days=2),
]

STAFF = [
    dict(name="Felycia Padri", email="admin@academicsupport.id", role="admin",
         title="Admin & Customer Service", phone="081200000001", password="admin123"),
    dict(name="Bintang Pratama S", email="editor@academicsupport.id", role="editor",
         title="Academic Editor & Tutor", phone="081200000002", password="editor123"),
    dict(name="Inayah Azzahra", email="marketing@academicsupport.id", role="admin",
         title="Marketing & Web Manager", phone="081200000003", password="marketing123"),
    dict(name="Mahasiswa Demo", email="mahasiswa@demo.id", role="customer",
         title=None, phone="081200000009", password="mahasiswa123"),
]


def seed_if_empty():
    if Service.query.first() is None:
        for data in SERVICES:
            db.session.add(Service(**data))
    if User.query.first() is None:
        for data in STAFF:
            data = dict(data)
            password = data.pop("password")
            user = User(**data)
            user.set_password(password)
            db.session.add(user)
    db.session.commit()

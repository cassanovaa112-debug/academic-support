"""Data demo: beberapa pesanan di berbagai status agar semua fitur langsung terlihat.

Dibuat lewat API (test client) sehingga setiap pesanan melewati alur kerja yang sama
dengan penggunaan sungguhan, lengkap dengan riwayat dan file contoh.
Jalankan:  python run.py --demo
"""
import io
from datetime import date, timedelta

from .extensions import db
from .models import ContactMessage, Order, Service, User

STAFF = {"admin": ("admin@academicsupport.id", "admin123"),
         "editor": ("editor@academicsupport.id", "editor123")}

CUSTOMERS = [
    ("Mahasiswa Demo", "mahasiswa@demo.id", "mahasiswa123", "081200000009"),
    ("Dinda Maharani", "dinda@demo.id", "demo123", "081277700001"),
    ("Rizky Ananda", "rizky@demo.id", "demo123", "081277700002"),
]

# (email pelanggan, slug layanan, judul, jumlah, hari ke deadline, status akhir, ulasan)
ORDERS = [
    ("dinda@demo.id", "editing-formatting", "Laporan Praktikum Akuntansi Biaya", 12, 5, "SELESAI",
     (5, "Hasilnya rapi banget, daftar pustaka jadi sesuai APA. Recommended!")),
    ("rizky@demo.id", "presentation", "Presentasi Seminar Proposal: E-commerce UMKM", 18, 4, "SELESAI",
     (5, "Slide jadi jauh lebih bersih dan alurnya enak dipresentasikan.")),
    ("mahasiswa@demo.id", "proofreading", "Makalah Etika Bisnis Digital", 8, 6, "SELESAI",
     (4, "Koreksinya jelas dengan track changes, jadi saya bisa belajar dari kesalahan.")),
    ("mahasiswa@demo.id", "editing-formatting", "Makalah Ekonomi Digital: Peran UMKM", 14, 5, "DIKIRIM", None),
    ("mahasiswa@demo.id", "formatting", "Laporan Kerja Praktik", 35, 7, "QUALITY_CHECK", None),
    ("dinda@demo.id", "editing-formatting", "Artikel Ilmiah Pemasaran Digital", 10, 6, "REVISI", None),
    ("rizky@demo.id", "proofreading", "Esai Beasiswa (Bahasa Indonesia)", 3, 3, "DIKERJAKAN", None),
    ("mahasiswa@demo.id", "presentation", "Slide Tugas Kelompok Manajemen Operasional", 12, 4, "VERIFIKASI_PEMBAYARAN", None),
    ("dinda@demo.id", "formatting", "Proposal Penelitian Bab 1–3", 30, 8, "MENUNGGU_PEMBAYARAN", None),
    ("mahasiswa@demo.id", "tutoring", "Statistika Bisnis — uji hipotesis", 2, 3, "MENUNGGU_REVIEW", None),
]

# urutan langkah untuk mencapai tiap status
PATH = ["MENUNGGU_REVIEW", "MENUNGGU_PEMBAYARAN", "VERIFIKASI_PEMBAYARAN", "DIKERJAKAN",
        "QUALITY_CHECK", "DIKIRIM", "SELESAI"]


def _file(name, content=b"Contoh dokumen demo Academic Support Service"):
    return (io.BytesIO(content), name)


def seed_demo(app):
    with app.app_context():
        if Order.query.first() is not None:
            print("Data pesanan sudah ada — demo dilewati. Hapus folder instance/ untuk mengulang.")
            return
        for name, email, password, phone in CUSTOMERS:
            if not User.query.filter_by(email=email).first():
                user = User(name=name, email=email, phone=phone, role="customer")
                user.set_password(password)
                db.session.add(user)
        db.session.commit()
        services = {s.slug: s.id for s in Service.query.all()}
        editor_id = User.query.filter_by(role="editor").first().id

    passwords = {email: pw for _, email, pw, _ in CUSTOMERS}
    admin = _login(app, *STAFF["admin"])
    editor = _login(app, *STAFF["editor"])

    for email, slug, title, qty, days, target, review in ORDERS:
        cust = _login(app, email, passwords[email])
        r = cust.post("/api/orders", content_type="multipart/form-data", data={
            "service_id": services[slug], "title": title, "quantity": str(qty),
            "deadline": (date.today() + timedelta(days=days)).isoformat(),
            "citation_style": "APA 7th", "integrity_agreed": "true",
            "notes": "Mohon ikuti pedoman penulisan fakultas.",
            "files": _file(title.split(":")[0].replace(" ", "_")[:40] + ".docx"),
        })
        oid = r.get_json()["order"]["id"]

        def act(client, action, **data):
            files = {k: v for k, v in data.items() if isinstance(v, tuple)}
            resp = client.post(f"/api/orders/{oid}/action", content_type="multipart/form-data",
                               data={"action": action, **data, **files})
            assert resp.status_code == 200, resp.get_json()

        stop = PATH.index("DIKIRIM") if target == "REVISI" else PATH.index(target)
        for step in PATH[1:stop + 1]:
            if step == "MENUNGGU_PEMBAYARAN":
                act(admin, "approve", message="Dokumen sudah kami cek, harga sesuai estimasi.")
            elif step == "VERIFIKASI_PEMBAYARAN":
                act(cust, "upload_payment", payment_method="DANA", file=_file("bukti_transfer.png"))
            elif step == "DIKERJAKAN":
                act(admin, "verify_payment", editor_id=str(editor_id))
            elif step == "QUALITY_CHECK":
                act(editor, "submit_result", message="Perbaikan ejaan, tata bahasa, dan format selesai.",
                    files=_file("hasil_" + slug + ".docx"))
            elif step == "DIKIRIM":
                act(admin, "qc_approve", message="Silakan cek bagian yang diberi komentar.")
            elif step == "SELESAI":
                act(cust, "accept", rating=str(review[0]), review=review[1], show_testimonial="true")
        if target == "REVISI":
            act(cust, "request_revision", message="Mohon rapikan lagi tabel di halaman 6 dan judul Bab 3.")

    with app.app_context():
        db.session.add(ContactMessage(name="Putri Lestari", phone="081299988877", subject="Tanya harga skripsi",
                                      message="Halo kak, kalau formatting skripsi 80 halaman kira-kira berapa dan berapa lama?"))
        db.session.commit()
    print(f"Data demo dibuat: {len(ORDERS)} pesanan, {len(CUSTOMERS)} pelanggan, 1 pesan kontak.")


def _login(app, email, password):
    client = app.test_client()
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.get_json()
    return client

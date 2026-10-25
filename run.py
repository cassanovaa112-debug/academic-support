"""Menjalankan Academic Support Service.

  python run.py            jalankan server di http://127.0.0.1:5000
  python run.py --demo     isi data demo (jika database masih kosong), lalu jalankan server
  python run.py --reset    hapus database & file unggahan, lalu mulai dari awal
"""
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))

if "--reset" in sys.argv:
    shutil.rmtree(os.path.join(ROOT, "instance"), ignore_errors=True)
    print("Database dan file unggahan dihapus.")

from app import create_app  # noqa: E402

app = create_app()

if __name__ == "__main__":
    if "--demo" in sys.argv:
        from app.demo import seed_demo
        seed_demo(app)
    port = int(os.environ.get("PORT", 5000))
    print(f"\n  Academic Support Service berjalan di  http://127.0.0.1:{port}\n  Tekan CTRL+C untuk berhenti.\n")
    app.run(debug=os.environ.get("FLASK_DEBUG", "1") == "1", port=port, use_reloader=False)

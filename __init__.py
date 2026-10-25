import mimetypes
import os

# Pakai implementasi pure-Python SQLAlchemy: di Windows dengan Application Control,
# ekstensi C (.pyd) di dalam venv bisa diblokir dan membuat aplikasi gagal start.
os.environ.setdefault("DISABLE_SQLALCHEMY_CEXT_RUNTIME", "1")

from flask import Flask, jsonify, request, send_from_directory
from werkzeug.exceptions import HTTPException

from .extensions import db

# Windows kadang memetakan .js ke text/plain lewat registry; ES module butuh MIME JavaScript.
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev-ganti-kunci-ini-di-produksi"),
        SQLALCHEMY_DATABASE_URI=os.environ.get(
            "DATABASE_URL", "sqlite:///" + os.path.join(app.instance_path, "academic_support.db")),
        UPLOAD_FOLDER=os.path.join(app.instance_path, "uploads"),
        MAX_CONTENT_LENGTH=20 * 1024 * 1024,  # 20 MB per request
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        # Ekonomi unit (LKM P1 Bagian C) — dipakai di dashboard admin
        VARIABLE_COST_PER_ORDER=1000,
        FIXED_COST_MONTHLY=55000,
        PROMO_BUDGET_MONTHLY=30000,
        CAC_PER_ORDER=3000,
    )
    if test_config:
        app.config.update(test_config)

    os.makedirs(app.instance_path, exist_ok=True)
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    db.init_app(app)

    from .routes import admin, auth, orders, public
    for module in (auth, public, orders, admin):
        app.register_blueprint(module.bp)

    @app.errorhandler(HTTPException)
    def http_error(exc):
        if request.path.startswith("/api/"):
            message = "Ukuran file melebihi batas 20 MB." if exc.code == 413 else exc.description
            return jsonify(error=message), exc.code
        return exc

    # Semua URL non-API dilayani oleh SPA Vue (history mode)
    @app.get("/", defaults={"path": ""})
    @app.get("/<path:path>")
    def spa(path):
        if path.startswith("api/"):
            return jsonify(error="Endpoint tidak ditemukan."), 404
        return send_from_directory(app.static_folder, "index.html")

    with app.app_context():
        from . import models  # noqa: F401  (registrasi tabel)
        from .seed import seed_if_empty
        db.create_all()
        seed_if_empty()

    return app

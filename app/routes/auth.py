import re

from flask import Blueprint, jsonify, request, session

from ..extensions import db
from ..models import User
from ..utils import current_user, error

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip()
    password = data.get("password") or ""

    if len(name) < 3:
        return error("Nama minimal 3 karakter.")
    if not EMAIL_RE.match(email):
        return error("Format email tidak valid.")
    if len(password) < 6:
        return error("Kata sandi minimal 6 karakter.")
    if User.query.filter_by(email=email).first():
        return error("Email sudah terdaftar. Silakan masuk.")

    user = User(name=name, email=email, phone=phone, role="customer")
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    session.clear()
    session["uid"] = user.id
    return jsonify(user=user.to_dict()), 201


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(data.get("password") or ""):
        return error("Email atau kata sandi salah.", 401)
    if not user.active:
        return error("Akun dinonaktifkan. Hubungi admin.", 403)
    session.clear()
    session["uid"] = user.id
    return jsonify(user=user.to_dict())


@bp.post("/logout")
def logout():
    session.clear()
    return jsonify(ok=True)


@bp.get("/me")
def me():
    user = current_user()
    return jsonify(user=user.to_dict() if user else None)

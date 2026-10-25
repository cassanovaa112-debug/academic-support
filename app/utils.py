import os
import uuid
from functools import wraps

from flask import current_app, g, jsonify, session
from werkzeug.utils import secure_filename

from .extensions import db
from .models import OrderFile, User

DOC_EXTENSIONS = {"doc", "docx", "pdf", "ppt", "pptx", "odt", "txt", "rtf", "xls", "xlsx", "zip"}
IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "pdf"}


def error(message, code=400):
    return jsonify(error=message), code


def current_user():
    uid = session.get("uid")
    if not uid:
        return None
    user = db.session.get(User, uid)
    return user if user and user.active else None


def login_required(*roles):
    """Wajib login; jika roles diisi, user harus memiliki salah satu role tersebut."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = current_user()
            if not user:
                return error("Silakan masuk terlebih dahulu.", 401)
            if roles and user.role not in roles:
                return error("Anda tidak memiliki akses ke fitur ini.", 403)
            g.user = user
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def extension_of(filename):
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def save_upload(storage, order, kind, user, allowed=DOC_EXTENSIONS):
    """Simpan file unggahan ke folder uploads dan kembalikan OrderFile (belum di-commit).

    Mengembalikan (OrderFile, None) atau (None, pesan_error).
    """
    if not storage or not storage.filename:
        return None, "File wajib diunggah."
    ext = extension_of(storage.filename)
    if ext not in allowed:
        return None, f"Format file .{ext or '?'} tidak didukung. Gunakan: {', '.join(sorted(allowed))}."
    stored = f"{uuid.uuid4().hex}.{ext}"
    path = os.path.join(current_app.config["UPLOAD_FOLDER"], stored)
    storage.save(path)
    record = OrderFile(order=order, kind=kind, original_name=secure_filename(storage.filename) or stored,
                       stored_name=stored, size=os.path.getsize(path), uploaded_by=user)
    db.session.add(record)
    return record, None


def can_see_file(user, order, file):
    if user.role == "admin":
        return True
    if user.role == "customer" and order.customer_id == user.id:
        return file.kind in ("source", "payment", "attachment") or (file.kind == "result" and file.released)
    if user.role == "editor" and order.editor_id == user.id:
        return file.kind != "payment"
    return False


def can_see_order(user, order):
    return (user.role == "admin"
            or (user.role == "customer" and order.customer_id == user.id)
            or (user.role == "editor" and order.editor_id == user.id))

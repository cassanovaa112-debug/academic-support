import math
from datetime import date

from flask import Blueprint, current_app, g, jsonify, request
from sqlalchemy import func

from ..extensions import db
from ..models import ContactMessage, Order, Service, User
from ..utils import error, login_required
from .. import workflow as wf
from .auth import EMAIL_RE

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@bp.get("/summary")
@login_required("admin", "editor")
def summary():
    if g.user.role == "editor":
        mine = Order.query.filter_by(editor_id=g.user.id)
        return jsonify(editor={
            "todo": mine.filter(Order.status.in_([wf.DIKERJAKAN, wf.REVISI])).count(),
            "in_qc": mine.filter_by(status=wf.QUALITY_CHECK).count(),
            "delivered": mine.filter_by(status=wf.DIKIRIM).count(),
            "done": mine.filter_by(status=wf.SELESAI).count(),
        })

    counts = dict(db.session.query(Order.status, func.count()).group_by(Order.status).all())
    month_start = date.today().replace(day=1)
    paid = (Order.query.filter(Order.paid_at >= month_start)
            .filter(Order.status.in_(wf.PAID_STATUSES)).all())

    # Ekonomi unit sesuai LKM P1 Bagian C
    cfg = current_app.config
    revenue = sum(o.price for o in paid)
    variable = len(paid) * cfg["VARIABLE_COST_PER_ORDER"]
    contribution = revenue - variable
    net = contribution - cfg["FIXED_COST_MONTHLY"] - cfg["PROMO_BUDGET_MONTHLY"]
    # Titik impas = biaya tetap ÷ (harga rata-rata − biaya variabel − CAC), dibulatkan ke atas
    avg_price = revenue // len(paid) if paid else 25000
    net_margin = avg_price - cfg["VARIABLE_COST_PER_ORDER"] - cfg["CAC_PER_ORDER"]
    bep_orders = math.ceil(cfg["FIXED_COST_MONTHLY"] / net_margin) if net_margin > 0 else None

    workload = []
    for editor in User.query.filter_by(role="editor", active=True).all():
        workload.append({
            "id": editor.id,
            "name": editor.name,
            "active": Order.query.filter_by(editor_id=editor.id)
                           .filter(Order.status.in_([wf.DIKERJAKAN, wf.REVISI, wf.QUALITY_CHECK])).count(),
            "done": Order.query.filter_by(editor_id=editor.id, status=wf.SELESAI).count(),
        })

    ratings = [r for (r,) in db.session.query(Order.rating).filter(Order.rating.isnot(None)).all()]
    return jsonify(
        counts={s: counts.get(s, 0) for s in wf.STATUS_LABELS},
        needs_action={
            "review": counts.get(wf.MENUNGGU_REVIEW, 0),
            "payment": counts.get(wf.VERIFIKASI_PEMBAYARAN, 0),
            "qc": counts.get(wf.QUALITY_CHECK, 0),
        },
        month={
            "orders_paid": len(paid),
            "revenue": revenue,
            "variable_cost": variable,
            "contribution": contribution,
            "fixed_cost": cfg["FIXED_COST_MONTHLY"],
            "promo_cost": cfg["PROMO_BUDGET_MONTHLY"],
            "net_profit": net,
            "profit_share": net // 3 if net > 0 else 0,
            "bep_orders": bep_orders,
        },
        avg_rating=round(sum(ratings) / len(ratings), 1) if ratings else None,
        unread_messages=ContactMessage.query.filter_by(is_read=False).count(),
        workload=workload,
    )


@bp.get("/editors")
@login_required("admin")
def editors():
    items = User.query.filter_by(role="editor", active=True).order_by(User.name).all()
    return jsonify(editors=[u.to_dict() for u in items])


@bp.get("/users")
@login_required("admin")
def users():
    role = request.args.get("role")
    query = User.query
    if role:
        query = query.filter_by(role=role)
    return jsonify(users=[u.to_dict() for u in query.order_by(User.role, User.name).all()])


@bp.post("/users")
@login_required("admin")
def create_staff():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    role = data.get("role")
    password = data.get("password") or ""
    if role not in ("admin", "editor"):
        return error("Role staf harus admin atau editor.")
    if len(name) < 3 or not EMAIL_RE.match(email) or len(password) < 6:
        return error("Lengkapi nama, email valid, dan kata sandi minimal 6 karakter.")
    if User.query.filter_by(email=email).first():
        return error("Email sudah terdaftar.")
    user = User(name=name, email=email, role=role, phone=data.get("phone"), title=data.get("title"))
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify(user=user.to_dict()), 201


@bp.patch("/users/<int:user_id>")
@login_required("admin")
def toggle_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return error("User tidak ditemukan.", 404)
    if user.id == g.user.id:
        return error("Tidak dapat menonaktifkan akun sendiri.")
    user.active = bool((request.get_json(silent=True) or {}).get("active"))
    db.session.commit()
    return jsonify(user=user.to_dict())


@bp.get("/services")
@login_required("admin")
def all_services():
    return jsonify(services=[s.to_dict() for s in Service.query.order_by(Service.sort).all()])


@bp.put("/services/<int:service_id>")
@login_required("admin")
def update_service(service_id):
    service = db.session.get(Service, service_id)
    if not service:
        return error("Layanan tidak ditemukan.", 404)
    data = request.get_json(silent=True) or {}
    for field in ("base_price", "included_units", "extra_unit_price", "turnaround_days"):
        if field in data:
            try:
                value = int(data[field])
            except (TypeError, ValueError):
                return error(f"Nilai {field} tidak valid.")
            if value < 0:
                return error(f"Nilai {field} tidak boleh negatif.")
            setattr(service, field, value)
    for field in ("name", "short", "description"):
        if data.get(field):
            setattr(service, field, data[field].strip())
    if "features" in data and isinstance(data["features"], list):
        service.features = "\n".join(f.strip() for f in data["features"] if f.strip())
    if "active" in data:
        service.active = bool(data["active"])
    db.session.commit()
    return jsonify(service=service.to_dict())


@bp.get("/messages")
@login_required("admin")
def messages():
    items = ContactMessage.query.order_by(ContactMessage.created_at.desc()).limit(200).all()
    return jsonify(messages=[m.to_dict() for m in items])


@bp.patch("/messages/<int:msg_id>")
@login_required("admin")
def mark_message(msg_id):
    msg = db.session.get(ContactMessage, msg_id)
    if not msg:
        return error("Pesan tidak ditemukan.", 404)
    msg.is_read = bool((request.get_json(silent=True) or {}).get("is_read", True))
    db.session.commit()
    return jsonify(message=msg.to_dict())

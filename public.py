from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import ContactMessage, Order, Service, User
from ..workflow import CITATION_STYLES, PAYMENT_METHODS, SELESAI, STATUS_LABELS, calc_price
from ..utils import error

bp = Blueprint("public", __name__, url_prefix="/api")


@bp.get("/services")
def services():
    items = Service.query.filter_by(active=True).order_by(Service.sort).all()
    return jsonify(services=[s.to_dict() for s in items])


@bp.get("/meta")
def meta():
    return jsonify(status_labels=STATUS_LABELS, payment_methods=PAYMENT_METHODS,
                   citation_styles=CITATION_STYLES)


@bp.get("/quote")
def quote():
    service = db.session.get(Service, request.args.get("service_id", type=int) or 0)
    if not service:
        return error("Layanan tidak ditemukan.", 404)
    qty = max(1, request.args.get("quantity", 1, type=int))
    express = request.args.get("express") in ("1", "true")
    return jsonify(price=calc_price(service, qty, express))


@bp.get("/testimonials")
def testimonials():
    rows = (Order.query.filter_by(status=SELESAI, show_testimonial=True)
            .filter(Order.review.isnot(None)).order_by(Order.completed_at.desc()).limit(6).all())
    items = [{
        # tampilkan nama depan + inisial saja demi privasi pelanggan
        "name": _short_name(o.customer.name),
        "service": o.service.name,
        "rating": o.rating,
        "review": o.review,
    } for o in rows]
    stats = {
        "completed": Order.query.filter_by(status=SELESAI).count(),
        "customers": User.query.filter_by(role="customer").count(),
    }
    rated = [o.rating for o in Order.query.filter(Order.rating.isnot(None)).all()]
    stats["avg_rating"] = round(sum(rated) / len(rated), 1) if rated else None
    return jsonify(testimonials=items, stats=stats)


def _short_name(name):
    parts = name.split()
    return parts[0] + (f" {parts[1][0]}." if len(parts) > 1 else "")


@bp.post("/contact")
def contact():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    message = (data.get("message") or "").strip()
    if not name or not message:
        return error("Nama dan pesan wajib diisi.")
    if not (data.get("email") or data.get("phone")):
        return error("Isi email atau nomor WhatsApp agar kami bisa membalas.")
    db.session.add(ContactMessage(name=name[:120], email=(data.get("email") or "")[:120],
                                  phone=(data.get("phone") or "")[:30],
                                  subject=(data.get("subject") or "")[:200], message=message))
    db.session.commit()
    return jsonify(ok=True), 201

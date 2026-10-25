from datetime import date, datetime

from flask import Blueprint, current_app, g, jsonify, request, send_from_directory
from sqlalchemy import or_

from ..extensions import db
from ..models import Order, OrderFile, Service, User, iso, now
from ..utils import (DOC_EXTENSIONS, IMAGE_EXTENSIONS, can_see_file, can_see_order, error,
                     login_required, save_upload)
from .. import workflow as wf

bp = Blueprint("orders", __name__, url_prefix="/api")


def rupiah(value):
    return "Rp" + f"{value:,}".replace(",", ".")


def order_dict(order, user, detail=False):
    data = {
        "id": order.id,
        "code": order.code,
        "title": order.title,
        "course": order.course,
        "quantity": order.quantity,
        "citation_style": order.citation_style,
        "language": order.language,
        "deadline": iso(order.deadline),
        "express": order.express,
        "notes": order.notes,
        "price": order.price,
        "status": order.status,
        "status_label": wf.STATUS_LABELS[order.status],
        "revision_count": order.revision_count,
        "max_revisions": order.max_revisions,
        "admin_note": order.admin_note,
        "payment_method": order.payment_method,
        "paid_at": iso(order.paid_at),
        "delivered_at": iso(order.delivered_at),
        "completed_at": iso(order.completed_at),
        "rating": order.rating,
        "review": order.review,
        "created_at": iso(order.created_at),
        "updated_at": iso(order.updated_at),
        "service": {"id": order.service.id, "name": order.service.name, "unit_label": order.service.unit_label},
        "customer": {"id": order.customer.id, "name": order.customer.name},
        "editor": {"id": order.editor.id, "name": order.editor.name} if order.editor else None,
    }
    if user.role == "admin":
        data["customer"].update(email=order.customer.email, phone=order.customer.phone)
    if detail:
        data["files"] = [f.to_dict() for f in order.files if can_see_file(user, order, f)]
        data["logs"] = [log.to_dict() for log in order.logs if user.role != "customer" or not log.internal]
        data["actions"] = wf.allowed_actions(order, user)
    return data


def get_visible_order(order_id):
    order = db.session.get(Order, order_id)
    if not order or not can_see_order(g.user, order):
        return None
    return order


# ---------------------------------------------------------------- daftar & buat pesanan

@bp.get("/orders")
@login_required()
def list_orders():
    query = Order.query
    if g.user.role == "customer":
        query = query.filter_by(customer_id=g.user.id)
    elif g.user.role == "editor":
        query = query.filter_by(editor_id=g.user.id)

    status = request.args.get("status")
    if status == "active":
        query = query.filter(Order.status.in_(wf.ACTIVE_STATUSES))
    elif status:
        query = query.filter(Order.status.in_(status.split(",")))
    q = (request.args.get("q") or "").strip()
    if q:
        like = f"%{q}%"
        query = query.join(User, Order.customer_id == User.id).filter(
            or_(Order.code.ilike(like), Order.title.ilike(like), User.name.ilike(like)))

    orders = query.order_by(Order.updated_at.desc()).limit(200).all()
    return jsonify(orders=[order_dict(o, g.user) for o in orders])


@bp.post("/orders")
@login_required("customer")
def create_order():
    form = request.form
    service = db.session.get(Service, form.get("service_id", type=int) or 0)
    if not service or not service.active:
        return error("Pilih layanan yang tersedia.")

    title = (form.get("title") or "").strip()
    if len(title) < 3:
        return error("Judul tugas/dokumen minimal 3 karakter.")
    quantity = form.get("quantity", type=int) or 0
    if quantity < 1 or quantity > 500:
        return error(f"Jumlah {service.unit_label} harus antara 1 dan 500.")
    try:
        deadline = datetime.strptime(form.get("deadline") or "", "%Y-%m-%d").date()
    except ValueError:
        return error("Tanggal deadline tidak valid.")
    if deadline < date.today():
        return error("Deadline tidak boleh di masa lalu.")
    if form.get("integrity_agreed") != "true":
        return error("Anda perlu menyetujui pernyataan integritas akademik.")

    # deadline lebih cepat dari waktu pengerjaan normal otomatis menjadi layanan ekspres
    days_left = (deadline - date.today()).days
    express = form.get("express") == "true" or days_left < service.turnaround_days

    order = Order(customer=g.user, service=service, title=title[:200],
                  course=(form.get("course") or "").strip()[:120] or None,
                  quantity=quantity, citation_style=form.get("citation_style") or None,
                  language=form.get("language") or "Bahasa Indonesia",
                  deadline=deadline, express=express, notes=(form.get("notes") or "").strip() or None,
                  price=wf.calc_price(service, quantity, express), status=wf.MENUNGGU_REVIEW)
    db.session.add(order)

    uploaded = request.files.getlist("files")
    if service.slug != "tutoring" and not any(f.filename for f in uploaded):
        db.session.rollback()
        return error("Unggah dokumen yang akan dikerjakan.")
    for storage in uploaded:
        if not storage.filename:
            continue
        _, err = save_upload(storage, order, "source", g.user, DOC_EXTENSIONS)
        if err:
            db.session.rollback()
            return error(err)

    db.session.flush()
    order.code = f"ASS-{order.created_at:%y%m%d}-{order.id:04d}"
    wf.add_log(order, g.user, f"Pesanan dibuat. Estimasi biaya {rupiah(order.price)}"
                              + (" (termasuk biaya ekspres)." if express else "."))
    db.session.commit()
    return jsonify(order=order_dict(order, g.user, detail=True)), 201


@bp.get("/orders/<int:order_id>")
@login_required()
def get_order(order_id):
    order = get_visible_order(order_id)
    if not order:
        return error("Pesanan tidak ditemukan.", 404)
    return jsonify(order=order_dict(order, g.user, detail=True))


# ---------------------------------------------------------------- aksi alur kerja

def _payload():
    if request.mimetype == "multipart/form-data":
        return request.form
    return request.get_json(silent=True) or {}


def _active_editor(editor_id):
    try:
        editor_id = int(editor_id)
    except (TypeError, ValueError):
        return None
    editor = db.session.get(User, editor_id)
    return editor if editor and editor.role == "editor" and editor.active else None


def act_cancel(order, user, data):
    reason = (data.get("message") or "").strip()
    wf.set_status(order, user, wf.DIBATALKAN, "Pesanan dibatalkan oleh pelanggan." + (f" Alasan: {reason}" if reason else ""))


def act_approve(order, user, data):
    price = data.get("price")
    if price not in (None, ""):
        try:
            price = int(price)
        except (TypeError, ValueError):
            return "Harga tidak valid."
        if price <= 0:
            return "Harga harus lebih dari 0."
        order.price = price
    order.admin_note = (data.get("message") or "").strip() or None
    msg = f"Pesanan disetujui. Silakan lakukan pembayaran sebesar {rupiah(order.price)}."
    if order.admin_note:
        msg += f" Catatan admin: {order.admin_note}"
    wf.set_status(order, user, wf.MENUNGGU_PEMBAYARAN, msg)


def act_reject(order, user, data):
    reason = (data.get("message") or "").strip()
    if not reason:
        return "Tuliskan alasan penolakan."
    order.admin_note = reason
    wf.set_status(order, user, wf.DITOLAK, f"Pesanan ditolak. Alasan: {reason}")


def act_upload_payment(order, user, data):
    method = data.get("payment_method")
    if method not in wf.PAYMENT_METHODS:
        return "Pilih metode pembayaran."
    _, err = save_upload(request.files.get("file"), order, "payment", user, IMAGE_EXTENSIONS)
    if err:
        return err
    order.payment_method = method
    wf.set_status(order, user, wf.VERIFIKASI_PEMBAYARAN,
                  f"Bukti pembayaran via {method} diunggah. Menunggu verifikasi admin.")


def act_verify_payment(order, user, data):
    editor = _active_editor(data.get("editor_id"))
    if not editor:
        return "Pilih editor yang akan mengerjakan pesanan."
    order.paid_at = now()
    order.editor = editor
    wf.set_status(order, user, wf.DIKERJAKAN,
                  f"Pembayaran terverifikasi. Pesanan mulai dikerjakan oleh {editor.name}.")


def act_reject_payment(order, user, data):
    reason = (data.get("message") or "").strip()
    if not reason:
        return "Tuliskan alasan bukti pembayaran ditolak."
    wf.set_status(order, user, wf.MENUNGGU_PEMBAYARAN,
                  f"Bukti pembayaran belum valid: {reason}. Silakan unggah ulang.")


def act_submit_result(order, user, data):
    files = [f for f in request.files.getlist("files") if f.filename]
    if not files:
        return "Unggah file hasil pekerjaan."
    for storage in files:
        _, err = save_upload(storage, order, "result", user, DOC_EXTENSIONS)
        if err:
            return err
    note = (data.get("message") or "").strip()
    label = "Hasil revisi" if order.status == wf.REVISI else "Hasil pekerjaan"
    wf.set_status(order, user, wf.QUALITY_CHECK,
                  f"{label} diunggah editor, menunggu quality check." + (f" Catatan: {note}" if note else ""),
                  internal=True)


def act_qc_approve(order, user, data):
    for f in order.files:
        if f.kind == "result":
            f.released = True
    order.delivered_at = now()
    note = (data.get("message") or "").strip()
    wf.set_status(order, user, wf.DIKIRIM,
                  "Hasil pekerjaan telah lolos quality check dan dikirim. Silakan unduh dan periksa."
                  + (f" Catatan: {note}" if note else ""))


def act_qc_return(order, user, data):
    reason = (data.get("message") or "").strip()
    if not reason:
        return "Tuliskan catatan perbaikan untuk editor."
    # file hasil yang belum dirilis dianggap draf yang ditolak QC
    for f in list(order.files):
        if f.kind == "result" and not f.released:
            f.kind = "rejected"
    back_to = wf.REVISI if order.revision_count > 0 else wf.DIKERJAKAN
    wf.set_status(order, user, back_to, f"Dikembalikan ke editor dari quality check: {reason}", internal=True)


def act_request_revision(order, user, data):
    reason = (data.get("message") or "").strip()
    if not reason:
        return "Jelaskan bagian yang perlu direvisi."
    attachment = request.files.get("file")
    if attachment and attachment.filename:
        _, err = save_upload(attachment, order, "attachment", user, DOC_EXTENSIONS | IMAGE_EXTENSIONS)
        if err:
            return err
    order.revision_count += 1
    wf.set_status(order, user, wf.REVISI,
                  f"Pelanggan meminta revisi ({order.revision_count}/{order.max_revisions}): {reason}")


def act_accept(order, user, data):
    try:
        rating = int(data.get("rating"))
    except (TypeError, ValueError):
        rating = 0
    if not 1 <= rating <= 5:
        return "Berikan rating 1–5."
    order.rating = rating
    order.review = (data.get("review") or "").strip() or None
    order.show_testimonial = str(data.get("show_testimonial")).lower() == "true"
    order.completed_at = now()
    wf.set_status(order, user, wf.SELESAI, f"Pesanan diterima dan selesai. Rating: {rating}/5. Terima kasih!")


def act_assign_editor(order, user, data):
    editor = _active_editor(data.get("editor_id"))
    if not editor:
        return "Pilih editor yang valid."
    order.editor = editor
    wf.add_log(order, user, f"Editor diganti menjadi {editor.name}.", internal=True)


ACTIONS = {
    "cancel": act_cancel,
    "approve": act_approve,
    "reject": act_reject,
    "upload_payment": act_upload_payment,
    "verify_payment": act_verify_payment,
    "reject_payment": act_reject_payment,
    "submit_result": act_submit_result,
    "qc_approve": act_qc_approve,
    "qc_return": act_qc_return,
    "request_revision": act_request_revision,
    "accept": act_accept,
    "assign_editor": act_assign_editor,
}


@bp.post("/orders/<int:order_id>/action")
@login_required()
def order_action(order_id):
    order = get_visible_order(order_id)
    if not order:
        return error("Pesanan tidak ditemukan.", 404)
    data = _payload()
    action = data.get("action")
    if action not in ACTIONS:
        return error("Aksi tidak dikenal.")
    if action not in wf.allowed_actions(order, g.user):
        return error("Aksi ini tidak tersedia untuk status pesanan saat ini.", 409)

    err = ACTIONS[action](order, g.user, data)
    if err:
        db.session.rollback()
        return error(err)
    order.updated_at = now()
    db.session.commit()
    return jsonify(order=order_dict(order, g.user, detail=True))


@bp.post("/orders/<int:order_id>/comments")
@login_required()
def add_comment(order_id):
    order = get_visible_order(order_id)
    if not order:
        return error("Pesanan tidak ditemukan.", 404)
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return error("Pesan tidak boleh kosong.")
    internal = bool(data.get("internal")) and g.user.role != "customer"
    wf.add_log(order, g.user, message[:2000], kind="comment", internal=internal)
    order.updated_at = now()
    db.session.commit()
    return jsonify(order=order_dict(order, g.user, detail=True)), 201


@bp.get("/files/<int:file_id>")
@login_required()
def download_file(file_id):
    record = db.session.get(OrderFile, file_id)
    if not record or not can_see_order(g.user, record.order) or not can_see_file(g.user, record.order, record):
        return error("File tidak ditemukan.", 404)
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], record.stored_name,
                               as_attachment=True, download_name=record.original_name)

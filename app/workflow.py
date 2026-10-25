"""Alur proses bisnis pesanan Academic Support Service.

  MENUNGGU_REVIEW ──admin approve──> MENUNGGU_PEMBAYARAN ──pelanggan upload bukti──> VERIFIKASI_PEMBAYARAN
        │ admin reject                    │ pelanggan batal                          │ admin tolak bukti → MENUNGGU_PEMBAYARAN
        ▼                                 ▼                                          ▼ admin verifikasi + tunjuk editor
     DITOLAK                          DIBATALKAN                                  DIKERJAKAN
                                                                                     │ editor upload hasil
                                                                                     ▼
                           REVISI <──pelanggan minta revisi── DIKIRIM <──admin lolos QC── QUALITY_CHECK
                             │ editor upload hasil revisi        │ pelanggan terima         │ admin kembalikan → DIKERJAKAN
                             └──────────> QUALITY_CHECK          ▼
                                                              SELESAI (rating & ulasan)
"""
from .extensions import db
from .models import OrderLog

MENUNGGU_REVIEW = "MENUNGGU_REVIEW"
MENUNGGU_PEMBAYARAN = "MENUNGGU_PEMBAYARAN"
VERIFIKASI_PEMBAYARAN = "VERIFIKASI_PEMBAYARAN"
DIKERJAKAN = "DIKERJAKAN"
QUALITY_CHECK = "QUALITY_CHECK"
DIKIRIM = "DIKIRIM"
REVISI = "REVISI"
SELESAI = "SELESAI"
DIBATALKAN = "DIBATALKAN"
DITOLAK = "DITOLAK"

STATUS_LABELS = {
    MENUNGGU_REVIEW: "Menunggu Review Admin",
    MENUNGGU_PEMBAYARAN: "Menunggu Pembayaran",
    VERIFIKASI_PEMBAYARAN: "Verifikasi Pembayaran",
    DIKERJAKAN: "Sedang Dikerjakan",
    QUALITY_CHECK: "Quality Check",
    DIKIRIM: "Hasil Dikirim",
    REVISI: "Proses Revisi",
    SELESAI: "Selesai",
    DIBATALKAN: "Dibatalkan",
    DITOLAK: "Ditolak",
}

ACTIVE_STATUSES = [MENUNGGU_REVIEW, MENUNGGU_PEMBAYARAN, VERIFIKASI_PEMBAYARAN,
                   DIKERJAKAN, QUALITY_CHECK, DIKIRIM, REVISI]
PAID_STATUSES = [DIKERJAKAN, QUALITY_CHECK, DIKIRIM, REVISI, SELESAI]

PAYMENT_METHODS = ["Transfer Bank", "DANA", "OVO", "GoPay", "ShopeePay", "QRIS"]
CITATION_STYLES = ["APA 7th", "IEEE", "Harvard", "Chicago", "MLA", "Pedoman Kampus", "Tidak ada"]


def calc_price(service, quantity, express=False):
    quantity = max(1, int(quantity))
    extra = max(0, quantity - service.included_units)
    total = service.base_price + extra * service.extra_unit_price
    if express:
        total = total * 3 // 2  # biaya ekspres +50%
    return total


def add_log(order, actor, message, status=None, kind="status", internal=False):
    log = OrderLog(order=order, actor=actor, kind=kind, status=status or order.status,
                   message=message, internal=internal)
    db.session.add(log)
    return log


def set_status(order, actor, status, message, internal=False):
    order.status = status
    add_log(order, actor, message, status=status, internal=internal)


def allowed_actions(order, user):
    """Aksi yang tersedia untuk user pada status pesanan saat ini (dipakai frontend)."""
    s = order.status
    actions = []
    if user.role == "customer" and order.customer_id == user.id:
        if s in (MENUNGGU_REVIEW, MENUNGGU_PEMBAYARAN):
            actions.append("cancel")
        if s == MENUNGGU_PEMBAYARAN:
            actions.append("upload_payment")
        if s == DIKIRIM:
            actions.append("accept")
            if order.revision_count < order.max_revisions:
                actions.append("request_revision")
    elif user.role == "admin":
        if s == MENUNGGU_REVIEW:
            actions += ["approve", "reject"]
        if s == VERIFIKASI_PEMBAYARAN:
            actions += ["verify_payment", "reject_payment"]
        if s == QUALITY_CHECK:
            actions += ["qc_approve", "qc_return"]
        if s in (DIKERJAKAN, REVISI, QUALITY_CHECK):
            actions.append("assign_editor")
    elif user.role == "editor" and order.editor_id == user.id:
        if s in (DIKERJAKAN, REVISI):
            actions.append("submit_result")
    return actions

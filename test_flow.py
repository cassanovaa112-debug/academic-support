"""Test alur bisnis utama: pesan → review → bayar → dikerjakan → QC → revisi → selesai."""
import io
from datetime import date, timedelta

import pytest

from app import create_app


@pytest.fixture
def app(tmp_path):
    return create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite://",
                       "UPLOAD_FOLDER": str(tmp_path)})


def login(app, email, password):
    client = app.test_client()
    assert client.post("/api/auth/login", json={"email": email, "password": password}).status_code == 200
    return client


@pytest.fixture
def actors(app):
    return {
        "customer": login(app, "mahasiswa@demo.id", "mahasiswa123"),
        "admin": login(app, "admin@academicsupport.id", "admin123"),
        "editor": login(app, "editor@academicsupport.id", "editor123"),
    }


def create_order(client, **overrides):
    service_id = client.get("/api/services").get_json()["services"][0]["id"]
    data = {"service_id": service_id, "title": "Makalah Uji", "quantity": "12",
            "deadline": (date.today() + timedelta(days=5)).isoformat(),
            "integrity_agreed": "true", "files": (io.BytesIO(b"doc"), "makalah.docx")}
    data.update(overrides)
    return client.post("/api/orders", data=data, content_type="multipart/form-data")


def act(client, order_id, action, **data):
    return client.post(f"/api/orders/{order_id}/action", data={"action": action, **data},
                       content_type="multipart/form-data")


def test_full_flow_with_qc_return_and_revision(actors):
    c, a, e = actors["customer"], actors["admin"], actors["editor"]
    r = create_order(c)
    assert r.status_code == 201
    order = r.get_json()["order"]
    oid = order["id"]
    assert order["status"] == "MENUNGGU_REVIEW"
    assert order["price"] == 25000 + 2 * 2000  # 10 halaman termasuk, +2 halaman

    assert act(a, oid, "approve").get_json()["order"]["status"] == "MENUNGGU_PEMBAYARAN"
    r = act(c, oid, "upload_payment", payment_method="DANA", file=(io.BytesIO(b"x"), "bukti.png"))
    assert r.get_json()["order"]["status"] == "VERIFIKASI_PEMBAYARAN"
    editor_id = a.get("/api/admin/editors").get_json()["editors"][0]["id"]
    assert act(a, oid, "verify_payment", editor_id=editor_id).get_json()["order"]["status"] == "DIKERJAKAN"

    act(e, oid, "submit_result", files=(io.BytesIO(b"v1"), "v1.docx"))
    # pelanggan belum boleh melihat hasil sebelum lolos QC
    names = [f["name"] for f in c.get(f"/api/orders/{oid}").get_json()["order"]["files"]]
    assert "v1.docx" not in names

    assert act(a, oid, "qc_return", message="rapikan").get_json()["order"]["status"] == "DIKERJAKAN"
    act(e, oid, "submit_result", files=(io.BytesIO(b"v2"), "v2.docx"))
    assert act(a, oid, "qc_approve").get_json()["order"]["status"] == "DIKIRIM"

    detail = c.get(f"/api/orders/{oid}").get_json()["order"]
    names = [f["name"] for f in detail["files"]]
    assert "v2.docx" in names and "v1.docx" not in names
    assert all(not log["internal"] for log in detail["logs"])

    assert act(c, oid, "request_revision", message="bab 2").get_json()["order"]["status"] == "REVISI"
    act(e, oid, "submit_result", files=(io.BytesIO(b"v3"), "v3.docx"))
    act(a, oid, "qc_approve")
    r = act(c, oid, "accept", rating="5", review="Mantap", show_testimonial="true")
    assert r.get_json()["order"]["status"] == "SELESAI"
    assert c.get("/api/testimonials").get_json()["testimonials"][0]["review"] == "Mantap"


def test_action_not_allowed_for_wrong_role_or_status(actors):
    c, a = actors["customer"], actors["admin"]
    oid = create_order(c).get_json()["order"]["id"]
    assert act(c, oid, "approve").status_code == 409          # pelanggan tidak bisa menyetujui
    assert act(a, oid, "qc_approve").status_code == 409       # belum waktunya QC
    assert act(a, oid, "reject").status_code == 400           # alasan wajib diisi


def test_editor_cannot_see_payment_proof(actors):
    c, a, e = actors["customer"], actors["admin"], actors["editor"]
    oid = create_order(c).get_json()["order"]["id"]
    act(a, oid, "approve")
    act(c, oid, "upload_payment", payment_method="QRIS", file=(io.BytesIO(b"x"), "bukti.png"))
    editor_id = a.get("/api/admin/editors").get_json()["editors"][0]["id"]
    act(a, oid, "verify_payment", editor_id=editor_id)
    kinds = [f["kind"] for f in e.get(f"/api/orders/{oid}").get_json()["order"]["files"]]
    assert "payment" not in kinds


def test_short_deadline_becomes_express(actors):
    r = create_order(actors["customer"], deadline=date.today().isoformat())
    order = r.get_json()["order"]
    assert order["express"] is True and order["price"] == (25000 + 2 * 2000) * 3 // 2


def test_order_requires_integrity_and_login(app, actors):
    assert create_order(actors["customer"], integrity_agreed="false").status_code == 400
    assert app.test_client().get("/api/orders").status_code == 401

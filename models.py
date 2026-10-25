from datetime import datetime

from werkzeug.security import check_password_hash, generate_password_hash

from .extensions import db


def now():
    return datetime.now().replace(microsecond=0)


def iso(value):
    return value.isoformat() if value else None


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(30))
    role = db.Column(db.String(20), nullable=False, default="customer")  # customer | admin | editor
    title = db.Column(db.String(120))  # jabatan untuk staf
    password_hash = db.Column(db.String(255), nullable=False)
    active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=now, nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "title": self.title,
            "active": self.active,
            "created_at": iso(self.created_at),
        }


class Service(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(60), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    short = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    features = db.Column(db.Text, default="")  # satu fitur per baris
    base_price = db.Column(db.Integer, nullable=False)
    included_units = db.Column(db.Integer, nullable=False, default=1)
    unit_label = db.Column(db.String(30), nullable=False, default="halaman")
    extra_unit_price = db.Column(db.Integer, nullable=False, default=0)
    turnaround_days = db.Column(db.Integer, nullable=False, default=3)
    icon = db.Column(db.String(30), default="doc")
    sort = db.Column(db.Integer, default=0)
    featured = db.Column(db.Boolean, default=False)
    active = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "slug": self.slug,
            "name": self.name,
            "short": self.short,
            "description": self.description,
            "features": [f for f in (self.features or "").splitlines() if f.strip()],
            "base_price": self.base_price,
            "included_units": self.included_units,
            "unit_label": self.unit_label,
            "extra_unit_price": self.extra_unit_price,
            "turnaround_days": self.turnaround_days,
            "icon": self.icon,
            "featured": self.featured,
            "active": self.active,
        }


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(30), unique=True, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey("service.id"), nullable=False)
    editor_id = db.Column(db.Integer, db.ForeignKey("user.id"))

    title = db.Column(db.String(200), nullable=False)
    course = db.Column(db.String(120))
    quantity = db.Column(db.Integer, nullable=False, default=1)
    citation_style = db.Column(db.String(40))
    language = db.Column(db.String(40), default="Bahasa Indonesia")
    deadline = db.Column(db.Date, nullable=False)
    express = db.Column(db.Boolean, default=False, nullable=False)
    notes = db.Column(db.Text)

    price = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(30), nullable=False, index=True)
    revision_count = db.Column(db.Integer, default=0, nullable=False)
    max_revisions = db.Column(db.Integer, default=2, nullable=False)
    admin_note = db.Column(db.Text)

    payment_method = db.Column(db.String(40))
    paid_at = db.Column(db.DateTime)
    delivered_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)

    rating = db.Column(db.Integer)
    review = db.Column(db.Text)
    show_testimonial = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=now, nullable=False)
    updated_at = db.Column(db.DateTime, default=now, onupdate=now, nullable=False)

    customer = db.relationship("User", foreign_keys=[customer_id])
    editor = db.relationship("User", foreign_keys=[editor_id])
    service = db.relationship("Service")
    files = db.relationship("OrderFile", backref="order", order_by="OrderFile.created_at",
                            cascade="all, delete-orphan")
    logs = db.relationship("OrderLog", backref="order", order_by="OrderLog.id",
                           cascade="all, delete-orphan")


class OrderFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False)
    kind = db.Column(db.String(20), nullable=False)  # source | payment | result | attachment
    original_name = db.Column(db.String(255), nullable=False)
    stored_name = db.Column(db.String(255), nullable=False, unique=True)
    size = db.Column(db.Integer, default=0)
    released = db.Column(db.Boolean, default=False)  # hasil kerja sudah lolos QC & dikirim ke pelanggan
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    created_at = db.Column(db.DateTime, default=now, nullable=False)

    uploaded_by = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "kind": self.kind,
            "name": self.original_name,
            "size": self.size,
            "released": self.released,
            "uploaded_by": self.uploaded_by.name if self.uploaded_by else None,
            "created_at": iso(self.created_at),
            "url": f"/api/files/{self.id}",
        }


class OrderLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False)
    actor_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    kind = db.Column(db.String(20), nullable=False, default="status")  # status | comment
    status = db.Column(db.String(30))
    message = db.Column(db.Text)
    internal = db.Column(db.Boolean, default=False)  # hanya terlihat oleh admin & editor
    created_at = db.Column(db.DateTime, default=now, nullable=False)

    actor = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "kind": self.kind,
            "status": self.status,
            "message": self.message,
            "internal": self.internal,
            "actor": {"name": self.actor.name, "role": self.actor.role} if self.actor else None,
            "created_at": iso(self.created_at),
        }


class ContactMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120))
    phone = db.Column(db.String(30))
    subject = db.Column(db.String(200))
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "subject": self.subject,
            "message": self.message,
            "is_read": self.is_read,
            "created_at": iso(self.created_at),
        }

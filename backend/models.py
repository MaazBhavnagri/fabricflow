from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Tailor(db.Model):
    __tablename__ = 'tailors'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'notes': self.notes,
            'active': self.active
        }

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.String(50), unique=True, nullable=False)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_phone = db.Column(db.String(20), nullable=False, server_default='0000000000')
    cloth_type = db.Column(db.String(50), nullable=False)
    image_url = db.Column(db.String(255), nullable=True)
    measurement_image_url = db.Column(db.String(255), nullable=True)
    measurement_text = db.Column(db.Text, nullable=True)
    instructions_text = db.Column(db.Text, nullable=True)
    tailor_id = db.Column(db.Integer, db.ForeignKey('tailors.id'), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='CREATED')
    # CREATED, GIVEN, STITCHING, BUTTONS, PRESS, DELIVERED
    current_holder = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'customer_name': self.customer_name,
            'customer_phone': self.customer_phone,
            'cloth_type': self.cloth_type,
            'image_url': self.image_url,
            'measurement_image_url': self.measurement_image_url,
            'measurement_text': self.measurement_text,
            'instructions_text': self.instructions_text,
            'tailor_id': self.tailor_id,
            'status': self.status,
            'current_holder': self.current_holder,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updated_at': self.updated_at.isoformat() + 'Z' if self.updated_at else None
        }

class Log(db.Model):
    __tablename__ = 'logs'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.String(50), nullable=False)
    action = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'action': self.action,
            'timestamp': self.timestamp.isoformat() + 'Z' if self.timestamp else None
        }

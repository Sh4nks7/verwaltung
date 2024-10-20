from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Auftrag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    kunde = db.Column(db.String(100), nullable=False)
    adresse = db.Column(db.String(200))
    mieter = db.Column(db.String(100))
    telefon = db.Column(db.String(20))
    email = db.Column(db.String(100))
    problem = db.Column(db.Text, nullable=False)
    wichtigkeit = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), nullable=False)
    erstellungsdatum = db.Column(db.DateTime, default=datetime.utcnow)
    anhaenge = db.relationship('Anhang', backref='auftrag', lazy=True)
    kommentare = db.relationship('Kommentar', backref='auftrag', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'kunde': self.kunde,
            'adresse': self.adresse,
            'mieter': self.mieter,
            'telefon': self.telefon,
            'email': self.email,
            'problem': self.problem,
            'wichtigkeit': self.wichtigkeit,
            'status': self.status,
            'erstellungsdatum': self.erstellungsdatum.isoformat(),
            'kommentare': [kommentar.to_dict() for kommentar in self.kommentare],
            'anhaenge': [anhang.to_dict() for anhang in self.anhaenge]
        }

class Anhang(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    pfad = db.Column(db.String(255), nullable=False)
    auftrag_id = db.Column(db.Integer, db.ForeignKey('auftrag.id'), nullable=False)
    erstellungsdatum = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'pfad': self.pfad,
            'erstellungsdatum': self.erstellungsdatum.isoformat()
        }

class Kommentar(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    auftrag_id = db.Column(db.Integer, db.ForeignKey('auftrag.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    text = db.Column(db.Text, nullable=False)
    erstellungsdatum = db.Column(db.DateTime, default=datetime.utcnow)
    termin = db.Column(db.DateTime(timezone=True), nullable=True)
   
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'text': self.text,
            'erstellungsdatum': self.erstellungsdatum.isoformat(),
            'termin': self.termin.isoformat() if self.termin else None
        }

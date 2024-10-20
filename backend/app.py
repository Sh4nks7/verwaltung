from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_migrate import Migrate
from models import db, Auftrag, Anhang, Kommentar
from werkzeug.utils import secure_filename
from datetime import datetime, timezone
import os

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///auftraege.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
migrate = Migrate(app, db)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/auftraege', methods=['GET', 'POST'])
def handle_auftraege():
    if request.method == 'POST':
        data = request.form.to_dict()
        if 'status' not in data or not data['status']:
            data['status'] = 'Offen'
        neuer_auftrag = Auftrag(**data)
        db.session.add(neuer_auftrag)
        db.session.commit()
        
        if 'anhang' in request.files:
            files = request.files.getlist('anhang')
            for file in files:
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                    neuer_anhang = Anhang(name=filename, pfad=os.path.join(app.config['UPLOAD_FOLDER'], filename), auftrag_id=neuer_auftrag.id)
                    db.session.add(neuer_anhang)
            db.session.commit()
        
        return jsonify(neuer_auftrag.to_dict()), 201
    else:
        auftraege = Auftrag.query.all()
        return jsonify([auftrag.to_dict() for auftrag in auftraege])

@app.route('/auftraege/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def handle_auftrag(id):
    auftrag = Auftrag.query.get_or_404(id)
    
    if request.method == 'GET':
        return jsonify(auftrag.to_dict())
    
    elif request.method == 'PUT':
        data = request.json
        print(f"Empfangene Daten: {data}")
        for key, value in data.items():
            if key == 'status' and value:  # Nur aktualisieren, wenn ein Wert vorhanden ist
                setattr(auftrag, key, value)
            elif key != 'status':
                setattr(auftrag, key, value)
        db.session.commit()
        return jsonify(auftrag.to_dict()), 200
    
    elif request.method == 'DELETE':
        db.session.delete(auftrag)
        db.session.commit()
        return '', 204

@app.route('/auftraege/<int:id>/kommentare', methods=['POST'])
def add_kommentar(id):
    auftrag = Auftrag.query.get_or_404(id)
    data = request.json
    termin = None
    if data.get('termin'):
        termin_str = data['termin'].rstrip('Z')
        termin = datetime.fromisoformat(termin_str).replace(tzinfo=timezone.utc)
    neuer_kommentar = Kommentar(
        auftrag_id=id,
        name=data['name'],
        text=data['text'],
        termin=termin
    )
    db.session.add(neuer_kommentar)
    db.session.commit()
    return jsonify(neuer_kommentar.to_dict()), 201

@app.route('/anhaenge/<int:anhang_id>')
def get_anhang(anhang_id):
    anhang = Anhang.query.get_or_404(anhang_id)
    return send_file(anhang.pfad, as_attachment=True)

@app.route('/auftraege/<int:id>', methods=['PUT'])
def update_auftrag(id):
    try:
        print(f"PUT-Anfrage für Auftrag {id} erhalten")
        auftrag = Auftrag.query.get_or_404(id)
        data = request.json
        print(f"Empfangene Daten: {data}")
        for key, value in data.items():
            if key == 'status' and value:  # Nur aktualisieren, wenn ein Wert vorhanden ist
                setattr(auftrag, key, value)
            elif key != 'status':
                setattr(auftrag, key, value)
        db.session.commit()
        return jsonify(auftrag.to_dict()), 200
    except Exception as e:
        print(f"Fehler beim Aktualisieren des Auftrags: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)

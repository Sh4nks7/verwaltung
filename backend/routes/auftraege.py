from flask import Blueprint, request, jsonify
from models import db, Auftrag

auftraege = Blueprint('auftraege', __name__)

@auftraege.route('/auftraege', methods=['GET', 'POST'])
def handle_auftraege():
    if request.method == 'POST':
        data = request.json
        neuer_auftrag = Auftrag(**data)
        db.session.add(neuer_auftrag)
        db.session.commit()
        return jsonify(neuer_auftrag.to_dict()), 201
    else:
        auftraege = Auftrag.query.all()
        return jsonify([auftrag.to_dict() for auftrag in auftraege])

@auftraege.route('/auftraege/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def handle_auftrag(id):
    auftrag = Auftrag.query.get_or_404(id)
    
    if request.method == 'GET':
        return jsonify(auftrag.to_dict())
    
    elif request.method == 'PUT':
        data = request.json
        for key, value in data.items():
            setattr(auftrag, key, value)
        db.session.commit()
        return jsonify(auftrag.to_dict())
    
    elif request.method == 'DELETE':
        db.session.delete(auftrag)
        db.session.commit()
        return '', 204


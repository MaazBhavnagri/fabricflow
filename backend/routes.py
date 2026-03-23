from flask import Blueprint, request, jsonify, current_app, send_from_directory
from models import db, Tailor, Order, Log
import os
import uuid
import base64

api_blueprint = Blueprint('api', __name__)

def save_base64_image(b64_string, upload_folder):
    if not b64_string or not b64_string.startswith('data:image'): 
        return b64_string # Maybe it's already a URL
    try:
        header, encoded = b64_string.split(",", 1)
        ext = header.split(";")[0].split("/")[1]
        file_name = f"{uuid.uuid4().hex}.{ext}"
        file_path = os.path.join(upload_folder, file_name)
        with open(file_path, "wb") as f:
            f.write(base64.b64decode(encoded))
        return f"/api/uploads/{file_name}"
    except Exception as e:
        print("Image save error:", e)
        return None

@api_blueprint.route('/tailors', methods=['GET'])
def get_tailors():
    return jsonify([t.to_dict() for t in Tailor.query.all()]), 200

@api_blueprint.route('/tailors', methods=['POST'])
def add_tailor():
    data = request.json
    tailor = Tailor(name=data.get('name'), phone=data.get('phone'), notes=data.get('notes'))
    db.session.add(tailor)
    db.session.commit()
    return jsonify(tailor.to_dict()), 201

@api_blueprint.route('/tailors/<int:id>', methods=['PUT', 'DELETE'])
def tailor_crud(id):
    tailor = Tailor.query.get_or_404(id)
    if request.method == 'DELETE':
        Order.query.filter_by(tailor_id=id).update({'tailor_id': None})
        db.session.delete(tailor)
        db.session.commit()
        return jsonify({"success": True}), 200
    data = request.json
    if 'name' in data: tailor.name = data['name']
    if 'phone' in data: tailor.phone = data['phone']
    db.session.commit()
    return jsonify(tailor.to_dict()), 200

@api_blueprint.route('/orders', methods=['GET'])
def get_orders():
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders]), 200

@api_blueprint.route('/orders/<string:order_id>', methods=['PUT', 'DELETE'])
def order_crud(order_id):
    order = Order.query.filter_by(order_id=order_id).first_or_404()
    if request.method == 'DELETE':
        Log.query.filter_by(order_id=order_id).delete()
        db.session.delete(order)
        db.session.commit()
        return jsonify({"success": True}), 200
    
    data = request.json
    if 'customer_name' in data: order.customer_name = data['customer_name']
    if 'customer_phone' in data: order.customer_phone = data['customer_phone']
    if 'cloth_type' in data: order.cloth_type = data['cloth_type']
    if 'tailor_id' in data: order.tailor_id = data['tailor_id']
    if 'instructions_text' in data: order.instructions_text = data['instructions_text']
    
    upload_fld = current_app.config['UPLOAD_FOLDER']
    if 'image_url' in data and str(data['image_url']).startswith('data:'):
        order.image_url = save_base64_image(data['image_url'], upload_fld)
    if 'measurement_image_url' in data and str(data['measurement_image_url']).startswith('data:'):
        order.measurement_image_url = save_base64_image(data['measurement_image_url'], upload_fld)
        
    db.session.commit()
    return jsonify(order.to_dict()), 200

@api_blueprint.route('/sync', methods=['POST'])
def offline_sync():
    data = request.json
    results = []
    upload_fld = current_app.config['UPLOAD_FOLDER']
    
    for action in data:
        action_type = action.get('type')
        payload = action.get('payload', {})
        try:
            if action_type == 'CREATE_ORDER':
                count = Order.query.count() + 1
                new_order_id = f"ORD-{count:04d}"
                
                img_url = save_base64_image(payload.get('image_url'), upload_fld)
                meas_url = save_base64_image(payload.get('measurement_image_url'), upload_fld)
                
                order = Order(
                    order_id=new_order_id,
                    customer_name=payload.get('customer_name'),
                    customer_phone=payload.get('customer_phone', '0000000000'),
                    cloth_type=payload.get('cloth_type'),
                    instructions_text=payload.get('instructions_text'),
                    tailor_id=payload.get('tailor_id'),
                    image_url=img_url,
                    measurement_image_url=meas_url,
                    measurement_text=payload.get('measurement_text'),
                    status=payload.get('status', 'CREATED'),
                    current_holder='Admin'
                )
                db.session.add(order)
                log = Log(order_id=new_order_id, action="Order Created Offline")
                db.session.add(log)
                db.session.commit()
                results.append({"offline_id": payload.get('offline_id'), "server_id": order.id, "order_id": new_order_id, "status": "success"})
                
            elif action_type == 'UPDATE_STATUS':
                order = Order.query.filter_by(order_id=payload.get('order_id')).first()
                if order:
                    order.status = payload.get('status')
                    if order.status == 'GIVEN' or order.status == 'STITCHING':
                        t = Tailor.query.get(order.tailor_id) if order.tailor_id else None
                        order.current_holder = t.name if t else 'Tailor'
                    elif order.status in ['CREATED', 'RETURNED']: order.current_holder = 'Admin'
                    elif order.status == 'BUTTONS': order.current_holder = 'Button Master'
                    elif order.status == 'PRESS': order.current_holder = 'Press Master'
                    elif order.status == 'DELIVERED': order.current_holder = 'Customer'
                        
                    db.session.commit()
                    db.session.add(Log(order_id=order.order_id, action=f"Status to {order.status}"))
                    db.session.commit()
                results.append({"action": "UPDATE_STATUS", "status": "success"})
            
            elif action_type == 'ADD_TAILOR':
                tailor = Tailor(name=payload.get('name'), phone=payload.get('phone'))
                db.session.add(tailor)
                db.session.commit()
                results.append({"offline_id": payload.get('offline_id'), "server_id": tailor.id, "status": "success"})
                
            elif action_type == 'UPDATE_TAILOR':
                tailor = Tailor.query.get(payload.get('server_id'))
                if tailor:
                    if 'name' in payload: tailor.name = payload['name']
                    if 'phone' in payload: tailor.phone = payload['phone']
                    db.session.commit()
                
            elif action_type == 'DELETE_TAILOR':
                tailor = Tailor.query.get(payload.get('server_id'))
                if tailor:
                    Order.query.filter_by(tailor_id=tailor.id).update({'tailor_id': None})
                    db.session.delete(tailor)
                    db.session.commit()
                
            elif action_type == 'UPDATE_ORDER':
                order = Order.query.filter_by(order_id=payload.get('order_id')).first()
                if order:
                    if 'customer_name' in payload: order.customer_name = payload['customer_name']
                    if 'customer_phone' in payload: order.customer_phone = payload['customer_phone']
                    if 'cloth_type' in payload: order.cloth_type = payload['cloth_type']
                    if 'instructions_text' in payload: order.instructions_text = payload['instructions_text']
                    if 'tailor_id' in payload: order.tailor_id = payload['tailor_id']
                    
                    if payload.get('image_url') and str(payload['image_url']).startswith('data:'):
                        order.image_url = save_base64_image(payload['image_url'], upload_fld)
                    if payload.get('measurement_image_url') and str(payload['measurement_image_url']).startswith('data:'):
                        order.measurement_image_url = save_base64_image(payload['measurement_image_url'], upload_fld)
                    db.session.commit()
                results.append({"action": "UPDATE_ORDER", "order_id": order.order_id if order else None, "status": "success"})
                
            elif action_type == 'DELETE_ORDER':
                order = Order.query.filter_by(order_id=payload.get('order_id')).first()
                if order:
                    db.session.delete(order)
                    db.session.commit()

        except Exception as e:
            db.session.rollback()
            results.append({"action": action_type, "status": "error", "message": str(e)})

    return jsonify({"processed": len(data), "results": results}), 200

@api_blueprint.route('/uploads/<name>')
def download_file(name):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], name)

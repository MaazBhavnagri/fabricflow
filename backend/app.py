import os
import json
import uuid
import base64
from datetime import datetime, timezone
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.abspath(os.path.dirname(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, "instance")
UPLOAD_DIR   = os.path.join(BASE_DIR, "uploads")
DATA_FILE    = os.path.join(INSTANCE_DIR, "data.json")

# ─── Ensure directories exist ─────────────────────────────────────────────────
os.makedirs(INSTANCE_DIR, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "fabric"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "measurement"), exist_ok=True)

# ─── Initialise data.json if missing ─────────────────────────────────────────
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w") as f:
        json.dump({"orders": [], "tailors": []}, f, indent=2)

# ─── Safe read / write ────────────────────────────────────────────────────────
def read_data():
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def write_data(data):
    tmp = DATA_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(data, f, indent=2)
    os.replace(tmp, DATA_FILE)          # atomic swap – never corrupt

# ─── Image helpers ────────────────────────────────────────────────────────────
def save_base64_image(b64_string, folder):
    """Decode a data-URI and write to uploads/<folder>/. Returns the /api/... URL."""
    if not b64_string or not str(b64_string).startswith("data:image"):
        return b64_string              # already a saved path or None
    try:
        header, encoded = b64_string.split(",", 1)
        ext = header.split(";")[0].split("/")[1]
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, folder, filename)
        with open(filepath, "wb") as f:
            f.write(base64.b64decode(encoded))
        return f"/api/uploads/{folder}/{filename}"
    except Exception as e:
        print(f"[image-save error] folder={folder}: {e}")
        return None

def now_iso():
    return datetime.now(timezone.utc).isoformat()

# ─── Flask app ────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ════════════════════════════════════════════════════════════════════════════════
#  TAILORS
# ════════════════════════════════════════════════════════════════════════════════

@app.route("/api/tailors", methods=["GET"])
def get_tailors():
    return jsonify(read_data()["tailors"]), 200


@app.route("/api/tailors", methods=["POST"])
def add_tailor():
    data = read_data()
    body = request.json or {}
    tailor = {
        "id": str(uuid.uuid4()),
        "name": body.get("name", "").strip(),
        "phone": body.get("phone", "").strip(),
        "notes": body.get("notes", ""),
        "created_at": now_iso()
    }
    data["tailors"].append(tailor)
    write_data(data)
    return jsonify(tailor), 201


@app.route("/api/tailors/<tailor_id>", methods=["PUT", "DELETE"])
def tailor_crud(tailor_id):
    data = read_data()
    idx = next((i for i, t in enumerate(data["tailors"]) if str(t["id"]) == tailor_id), None)
    if idx is None:
        return jsonify({"error": "Tailor not found"}), 404

    if request.method == "DELETE":
        # clear references from orders
        for o in data["orders"]:
            if str(o.get("tailor_id")) == tailor_id:
                o["tailor_id"] = None
        data["tailors"].pop(idx)
        write_data(data)
        return jsonify({"success": True}), 200

    body = request.json or {}
    t = data["tailors"][idx]
    if "name" in body: t["name"] = body["name"]
    if "phone" in body: t["phone"] = body["phone"]
    if "notes" in body: t["notes"] = body["notes"]
    write_data(data)
    return jsonify(t), 200

# ════════════════════════════════════════════════════════════════════════════════
#  ORDERS
# ════════════════════════════════════════════════════════════════════════════════

@app.route("/api/orders", methods=["GET"])
def get_orders():
    orders = sorted(read_data()["orders"], key=lambda o: o.get("created_at", ""), reverse=True)
    return jsonify(orders), 200


@app.route("/api/orders/<order_id>", methods=["PUT", "DELETE"])
def order_crud(order_id):
    data = read_data()
    idx = next((i for i, o in enumerate(data["orders"]) if o["order_id"] == order_id), None)
    if idx is None:
        return jsonify({"error": "Order not found"}), 404

    if request.method == "DELETE":
        data["orders"].pop(idx)
        write_data(data)
        return jsonify({"success": True}), 200

    body = request.json or {}
    o = data["orders"][idx]
    for field in ("customer_name", "customer_phone", "cloth_type", "tailor_id",
                  "instructions_text", "status", "measurement_text"):
        if field in body:
            o[field] = body[field]

    if body.get("image_url", "").startswith("data:"):
        o["image_url"] = save_base64_image(body["image_url"], "fabric")
    if body.get("measurement_image_url", "").startswith("data:"):
        o["measurement_image_url"] = save_base64_image(body["measurement_image_url"], "measurement")

    o["updated_at"] = now_iso()
    write_data(data)
    return jsonify(o), 200

# ════════════════════════════════════════════════════════════════════════════════
#  OFFLINE SYNC
# ════════════════════════════════════════════════════════════════════════════════

@app.route("/api/sync", methods=["POST"])
def offline_sync():
    actions = request.json or []
    results = []
    data = read_data()

    for action in actions:
        action_type = action.get("type")
        payload     = action.get("payload", {})

        try:
            # ── CREATE ORDER ────────────────────────────────────────────────
            if action_type == "CREATE_ORDER":
                count = len(data["orders"]) + 1
                new_id = f"ORD-{count:04d}"
                # avoid duplicate IDs if retried
                taken = {o["order_id"] for o in data["orders"]}
                while new_id in taken:
                    count += 1
                    new_id = f"ORD-{count:04d}"

                order = {
                    "order_id":               new_id,
                    "customer_name":          payload.get("customer_name", ""),
                    "customer_phone":         payload.get("customer_phone", ""),
                    "cloth_type":             payload.get("cloth_type", ""),
                    "instructions_text":      payload.get("instructions_text", ""),
                    "tailor_id":              payload.get("tailor_id"),
                    "image_url":              save_base64_image(payload.get("image_url"), "fabric"),
                    "measurement_image_url":  save_base64_image(payload.get("measurement_image_url"), "measurement"),
                    "measurement_text":       payload.get("measurement_text", ""),
                    "status":                 payload.get("status", "CREATED"),
                    "created_at":             now_iso(),
                    "updated_at":             now_iso()
                }
                data["orders"].insert(0, order)
                results.append({"offline_id": payload.get("offline_id"), "order_id": new_id, "status": "success"})

            # ── UPDATE STATUS ────────────────────────────────────────────────
            elif action_type == "UPDATE_STATUS":
                target = next((o for o in data["orders"] if o["order_id"] == payload.get("order_id")), None)
                if target:
                    target["status"] = payload.get("status", target["status"])
                    target["updated_at"] = now_iso()
                results.append({"action": "UPDATE_STATUS", "status": "success"})

            # ── UPDATE ORDER ─────────────────────────────────────────────────
            elif action_type == "UPDATE_ORDER":
                target = next((o for o in data["orders"] if o["order_id"] == payload.get("order_id")), None)
                if target:
                    for field in ("customer_name", "customer_phone", "cloth_type",
                                  "tailor_id", "instructions_text", "measurement_text"):
                        if field in payload:
                            target[field] = payload[field]
                    if payload.get("image_url", "").startswith("data:"):
                        target["image_url"] = save_base64_image(payload["image_url"], "fabric")
                    if payload.get("measurement_image_url", "").startswith("data:"):
                        target["measurement_image_url"] = save_base64_image(payload["measurement_image_url"], "measurement")
                    target["updated_at"] = now_iso()
                results.append({"action": "UPDATE_ORDER", "status": "success"})

            # ── DELETE ORDER ─────────────────────────────────────────────────
            elif action_type == "DELETE_ORDER":
                data["orders"] = [o for o in data["orders"] if o["order_id"] != payload.get("order_id")]
                results.append({"action": "DELETE_ORDER", "status": "success"})

            # ── ADD TAILOR ───────────────────────────────────────────────────
            elif action_type == "ADD_TAILOR":
                tailor = {
                    "id":         str(uuid.uuid4()),
                    "name":       payload.get("name", "").strip(),
                    "phone":      payload.get("phone", "").strip(),
                    "notes":      payload.get("notes", ""),
                    "created_at": now_iso()
                }
                data["tailors"].append(tailor)
                results.append({"offline_id": payload.get("offline_id"), "server_id": tailor["id"], "status": "success"})

            # ── UPDATE TAILOR ────────────────────────────────────────────────
            elif action_type == "UPDATE_TAILOR":
                target = next((t for t in data["tailors"] if str(t["id"]) == str(payload.get("server_id"))), None)
                if target:
                    if "name" in payload: target["name"] = payload["name"]
                    if "phone" in payload: target["phone"] = payload["phone"]
                results.append({"action": "UPDATE_TAILOR", "status": "success"})

            # ── DELETE TAILOR ────────────────────────────────────────────────
            elif action_type == "DELETE_TAILOR":
                tid = str(payload.get("server_id"))
                data["tailors"] = [t for t in data["tailors"] if str(t["id"]) != tid]
                for o in data["orders"]:
                    if str(o.get("tailor_id")) == tid:
                        o["tailor_id"] = None
                results.append({"action": "DELETE_TAILOR", "status": "success"})

            else:
                results.append({"action": action_type, "status": "skipped"})

        except Exception as e:
            results.append({"action": action_type, "status": "error", "message": str(e)})

    write_data(data)          # single atomic write after processing all actions
    return jsonify({"processed": len(actions), "results": results}), 200

# ════════════════════════════════════════════════════════════════════════════════
#  IMAGE SERVING
# ════════════════════════════════════════════════════════════════════════════════

@app.route("/api/uploads/<folder>/<filename>")
def serve_image(folder, filename):
    """Serve images from /uploads/fabric/ or /uploads/measurement/"""
    safe_dir = os.path.join(UPLOAD_DIR, folder)
    return send_from_directory(safe_dir, filename)

# Legacy flat-folder compatibility (old orders stored /api/uploads/<file>)
@app.route("/api/uploads/<filename>")
def serve_image_legacy(filename):
    return send_from_directory(UPLOAD_DIR, filename)

# ════════════════════════════════════════════════════════════════════════════════
#  HEALTH
# ════════════════════════════════════════════════════════════════════════════════

@app.route("/health")
def health():
    data = read_data()
    return jsonify({
        "status": "healthy",
        "orders": len(data["orders"]),
        "tailors": len(data["tailors"])
    }), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

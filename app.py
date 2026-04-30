from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import uuid
import traceback
import io
import os

BUILD_DIR = r"C:\Users\Administrator\Desktop\SLI\SLI\SLI\login-app\react-app\build"
app = Flask(__name__, static_folder=BUILD_DIR, static_url_path='')
CORS(app, resources={
    r"/*": {
        "origins": ["http://www.sli.uatcloud.co.za","http://154.66.196.144:3000", "http://154.66.196.144:5000", "http://localhost:3000", "http://localhost:5000"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Database configuration - Windows Authentication
DATABASE_URI = 'mssql+pyodbc://sa:Codexx4b0s3@XBSVM01\\SQLEXPRESS/SLI?driver=ODBC+Driver+17+for+SQL+Server'

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'connect_args': {
        'timeout': 20,
    },
    'pool_pre_ping': True,
    'pool_recycle': 3600,
}

app.config["MAX_CONTENT_LENGTH"] = int(os.environ.get("MAX_UPLOAD_BYTES", str(25 * 1024 * 1024)))

db = SQLAlchemy(app)

# ==================== STATUS MAP ====================
STATUS_MAP = {
    0: "Created",
    1: "Approver 1",
    2: "Final Approval",
    3: "PO Created",
    4: "Declined",
    5: "Cancelled",
}

REVERSE_STATUS_MAP = {v: k for k, v in STATUS_MAP.items()}

# ==================== HELPERS ====================

def safe_float(val, fallback=0.0):
    try:
        if val is None or val == '':
            return fallback
        return float(val)
    except (ValueError, TypeError):
        return fallback

def safe_int(val, fallback=0):
    try:
        if val is None or val == '':
            return fallback
        return int(float(val))
    except (ValueError, TypeError):
        return fallback

def safe_date(val, fallback=None):
    if not val or str(val).strip() == '':
        return fallback
    try:
        return datetime.strptime(str(val).strip(), '%Y-%m-%d').date()
    except ValueError:
        return fallback

def safe_datetime(val, fallback=None):
    if not val or str(val).strip() == '':
        return fallback
    try:
        return datetime.strptime(str(val).strip(), '%Y-%m-%d')
    except ValueError:
        return fallback

def fmt_date(val):
    if val and hasattr(val, 'strftime'):
        return val.strftime('%Y-%m-%d')
    if val:
        return str(val)[:10]
    return ""

def get_req_number(req_id):
    if req_id and '-L' in req_id:
        return req_id[:req_id.index('-L')]
    return req_id or ""

def status_int_to_label(val):
    if val is None:
        return "Created"
    try:
        return STATUS_MAP.get(int(val), f"Status: {val}")
    except (ValueError, TypeError):
        return str(val)

def status_label_to_int(label):
    if label is None or label == '':
        return 0
    return REVERSE_STATUS_MAP.get(label, 0)

# ==================== MODELS ====================

class User(db.Model):
    __tablename__ = 'Users'
    Username  = db.Column(db.String, primary_key=True)
    Password  = db.Column(db.String, nullable=False)
    FirstName = db.Column(db.String)
    LastName  = db.Column(db.String)
    Email     = db.Column(db.String)
    Roles     = db.Column(db.String)
    Mobile    = db.Column(db.String)
    Active    = db.Column(db.String(1))

class ReqMaster(db.Model):
    __tablename__ = 'ReqMaster'
    Requisition      = db.Column(db.BigInteger, primary_key=True, autoincrement=False)
    JobNo            = db.Column(db.String)
    Originator       = db.Column(db.String)
    ReqnRaisedDate   = db.Column(db.DateTime)
    ReqnStatus       = db.Column(db.Integer)
    ReqnValue        = db.Column(db.Numeric)
    Supplier         = db.Column(db.String)
    ReqnReadyDate    = db.Column(db.DateTime)
    Note             = db.Column(db.String)

class ReqDetail(db.Model):
    __tablename__ = 'ReqDetail'
    Requisition      = db.Column(db.BigInteger, primary_key=True, autoincrement=False)
    Line             = db.Column(db.Integer, primary_key=True, autoincrement=False)
    Originator       = db.Column(db.String)
    Supplier         = db.Column(db.String)
    SupplierName     = db.Column(db.String)
    Type             = db.Column(db.String)
    Description      = db.Column(db.String)
    StockCode        = db.Column(db.String)
    OrderUom         = db.Column(db.String)
    Qty              = db.Column(db.Numeric)
    UnitPrice        = db.Column(db.Numeric)
    TotalPrice       = db.Column(db.Numeric)
    ReqnReason       = db.Column(db.String)
    Approved         = db.Column(db.Boolean)
    ApprovedBy       = db.Column(db.String)
    ApprovedDate     = db.Column(db.DateTime)
    RouteTo          = db.Column(db.String)
    Buyer            = db.Column(db.String)
    ReqnStatus       = db.Column(db.Integer)
    Notes            = db.Column(db.String)
    PurchaseOrder    = db.Column(db.String)
    PurchaseOrderLine = db.Column(db.Integer)
    ReqnDate         = db.Column(db.DateTime)
    DueDate          = db.Column(db.Date)
    Authorised       = db.Column(db.Boolean)
    AuthorisedBy     = db.Column(db.String)
    AuthorisedDate   = db.Column(db.DateTime)
    Approved2        = db.Column(db.Boolean)
    Approved2By      = db.Column(db.String)
    Approved2DateTime = db.Column(db.DateTime)
    ReceivedDate     = db.Column(db.DateTime)
    ExpectedDeliveryDate = db.Column(db.DateTime)
    Company          = db.Column(db.String)
    Taxable          = db.Column(db.Boolean)

class ReqAttachment(db.Model):
    __tablename__ = "ReqAttachments"
    Id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Requisition = db.Column(db.BigInteger, nullable=False)
    FileName = db.Column(db.String(255), nullable=False)
    ContentType = db.Column(db.String(120), nullable=True)
    Data = db.Column(db.LargeBinary, nullable=False)
    UploadedBy = db.Column(db.String(100), nullable=True)
    UploadedAt = db.Column(db.DateTime, default=datetime.utcnow)

class Inventory(db.Model):
    __tablename__ = 'Inventory'
    ItemCode    = db.Column(db.String, primary_key=True)
    Description = db.Column(db.String)
    UnitSize    = db.Column(db.String)
    Category    = db.Column(db.String)

class SupplierMaster(db.Model):
    __tablename__ = 'SupplierMaster'
    SupplCode = db.Column(db.String, primary_key=True)
    SupplDesc = db.Column(db.String)

# ==================== HOME (serves React app) ====================

@app.route('/', methods=['GET'])
def home():
    return send_from_directory(app.static_folder, 'index.html')

# ==================== AUTH ====================

@app.route('/login', methods=['POST'])
def login():
    data     = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    if not username or not password:
        return jsonify({'error': 'Username and password are required!'}), 400
    try:
        user = User.query.filter_by(Username=username).first()
        if not user or user.Active != 'Y' or user.Password != password:
            return jsonify({'error': 'Invalid username or password.'}), 401
        return jsonify({
            'username':   user.Username,
            'first_name': user.FirstName,
            'last_name':  user.LastName,
            'email':      user.Email,
            'roles':      user.Roles,
            'mobile':     user.Mobile,
        }), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Database connection error: {str(e)}'}), 500

# ==================== USERS ====================

@app.route('/users', methods=['GET'])
def get_users():
    try:
        return jsonify([{
            "username": u.Username, "first_name": u.FirstName,
            "last_name": u.LastName, "roles": u.Roles,
            "email": u.Email, "mobile": u.Mobile, "active": u.Active
        } for u in User.query.all()]), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/users', methods=['POST'])
def create_user():
    data = request.json
    try:
        if User.query.filter_by(Username=data.get('username')).first():
            return jsonify({"error": "Username already exists"}), 409
        db.session.add(User(
            Username=data.get('username'), Password=data.get('password'),
            FirstName=data.get('first_name'), LastName=data.get('last_name'),
            Email=data.get('email'), Roles=data.get('roles'),
            Mobile=data.get('mobile'), Active=data.get('active', 'Y')
        ))
        db.session.commit()
        return jsonify({"message": "User created!"}), 201
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/users/<path:username>', methods=['PUT'])
def update_user(username):
    data = request.json
    try:
        user = User.query.filter_by(Username=username.strip()).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        user.FirstName = data.get('first_name', user.FirstName)
        user.LastName  = data.get('last_name',  user.LastName)
        user.Email     = data.get('email',       user.Email)
        user.Roles     = data.get('roles',       user.Roles)
        user.Mobile    = data.get('mobile',      user.Mobile)
        user.Active    = data.get('active',      user.Active)
        if data.get('password'):
            user.Password = data['password']
        db.session.commit()
        return jsonify({"message": "User updated!"}), 200
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/users/<path:username>', methods=['DELETE'])
def delete_user(username):
    try:
        user = User.query.filter_by(Username=username.strip()).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "User deleted!"}), 200
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ==================== ATTACHMENTS ====================

@app.route("/api/requisitions/<path:req_number>/attachments", methods=["GET"])
def list_attachments(req_number):
    try:
        rows = ReqAttachment.query.filter_by(Requisition=req_number).order_by(ReqAttachment.UploadedAt.desc()).all()
        return jsonify([{
            "id": a.Id,
            "req_number": str(a.Requisition),
            "file_name": a.FileName,
            "content_type": a.ContentType or "",
            "uploaded_by": a.UploadedBy or "",
            "uploaded_at": fmt_date(a.UploadedAt),
            "download_url": f"/api/attachments/{a.Id}/download",
        } for a in rows]), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/requisitions/<path:req_number>/attachments", methods=["POST"])
def upload_attachment(req_number):
    try:
        uploaded_by = (request.form.get("uploaded_by") or "").strip()

        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        f = request.files["file"]
        if not f or f.filename.strip() == "":
            return jsonify({"error": "No file selected"}), 400

        data = f.read()
        if not data:
            return jsonify({"error": "Empty file"}), 400

        att = ReqAttachment(
            Requisition=req_number,
            FileName=f.filename,
            ContentType=f.mimetype,
            Data=data,
            UploadedBy=uploaded_by,
            UploadedAt=datetime.utcnow(),
        )
        db.session.add(att)
        db.session.commit()
        return jsonify({"message": "Uploaded", "id": att.Id}), 201
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/attachments/<int:att_id>/download", methods=["GET"])
def download_attachment(att_id):
    try:
        a = ReqAttachment.query.filter_by(Id=att_id).first()
        if not a:
            return jsonify({"error": "Attachment not found"}), 404

        return send_file(
            io.BytesIO(a.Data),
            mimetype=a.ContentType or "application/octet-stream",
            as_attachment=True,
            download_name=a.FileName,
        )
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ==================== REQUISITIONS ====================

def build_requisition_row(d):
    return {
        "req_id":        f"{d[0]}-L{d[1]}",
        "req_number":    str(d[0]),
        "line":          str(d[1]),
        "type":          d[2] or "",
        "description":   d[3] or "",
        "stk":           d[4] or "",
        "stock_code":    d[4] or "",
        "order_unit":    d[5] or "",
        "quantity":      int(d[6]) if d[6] else 0,
        "unit_price":    float(d[7]) if d[7] else 0,
        "total_price":   float(d[8]) if d[8] else 0,
        "expected_date": fmt_date(d[16] or d[9]),
        "received_date": fmt_date(d[10]),
        "reqn_reason":   d[11] or "",
        "notes":         d[12] or "",
        "company":       (d[13] or "").strip(),
        "order_status":  d[14] or "",
        "po_number":     d[15] or "",
        "reqn_date":     fmt_date(d[17]),
        "status":        status_int_to_label(d[18]),
        "supplier":      (d[19] or "").strip() if len(d) > 19 else "",
        "supplier_name": (d[20] or "").strip() if len(d) > 20 else "",
    }

@app.route('/api/requisitions', methods=['GET'])
def get_requisitions():
    try:
        details = db.session.execute(db.text("""
            SELECT d.Requisition, d.Line, d.Type, d.Description, d.StockCode,
                   d.OrderUom, d.Qty, d.UnitPrice, d.TotalPrice, d.DueDate,
                   d.ReceivedDate, d.ReqnReason, d.Notes, d.Company, d.Buyer,
                   d.PurchaseOrder, d.ExpectedDeliveryDate,
                   m.ReqnRaisedDate, m.ReqnStatus,
                   d.Supplier, d.SupplierName
            FROM ReqDetail d
            LEFT JOIN ReqMaster m ON d.Requisition = m.Requisition WHERE ISNULL(d.Archive, 0) = 0
            ORDER BY
                CASE WHEN m.ReqnRaisedDate IS NULL THEN 0 ELSE 1 END ASC,
                m.ReqnRaisedDate DESC,
                d.Requisition DESC,
                d.Line ASC
        """)).fetchall()

        return jsonify([build_requisition_row(d) for d in details]), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
        
@app.route('/api/requisitions/archive/<path:req_number>', methods=['PUT'])
def archive_requisition(req_number):
    try:
        data = request.json or {}
        user = (data.get("username") or "").strip()

        # check exists
        exists = db.session.execute(db.text("""
            SELECT 1 FROM ReqDetail WHERE Requisition = :req
        """), {'req': req_number}).fetchone()

        if not exists:
            return jsonify({"error": "Requisition not found"}), 404

        # 🔥 update archive + audit fields
        db.session.execute(db.text("""
            UPDATE ReqDetail
            SET 
                Archive = 1,
                ArchivedBy = :user,
                ArchivedTime = GETDATE()
            WHERE Requisition = :req
        """), {
            'req': req_number,
            'user': user
        })

        db.session.commit()

        return jsonify({"message": "Archived successfully"}), 200

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/requisitions', methods=['POST'])
def create_requisition():
    data = request.json
    print("=== INCOMING DATA ===", data)
    try:
        qty_value  = safe_float(data.get('qty') or data.get('quantity') or 0)
        uom_value  = (data.get('order_unit') or data.get('uom') or '').strip()
        orig_value = (data.get('originator') or '').strip()
        job_value  = (data.get('job_no') or '').strip()

        if not orig_value:
            return jsonify({"error": "Originator is required. Please log in again."}), 400

        req_number = data.get('req_number') or f"REQ-{str(uuid.uuid4())[:8].upper()}"
        line = safe_int(data.get('line', 1))

        existing = db.session.execute(db.text(
            "SELECT Requisition FROM ReqDetail WHERE Requisition = :req AND Line = :line"
        ), {'req': req_number, 'line': line}).fetchone()

        if existing:
            db.session.execute(db.text("""
                UPDATE ReqDetail
                SET Type = :type, Description = :desc, StockCode = :stk, OrderUom = :uom,
                    Qty = :qty, UnitPrice = :price, TotalPrice = :total, DueDate = :due,
                    ReqnReason = :reason, Notes = :notes, Company = :comp, Originator = :orig
                WHERE Requisition = :req AND Line = :line
            """), {
                'req':    req_number,
                'line':   line,
                'type':   data.get('type', '') or '',
                'desc':   data.get('description', '') or '',
                'stk':    data.get('stk', '') or '',
                'uom':    uom_value,
                'qty':    qty_value,
                'price':  safe_float(data.get('unit_price'), 0),
                'total':  safe_float(data.get('total_price'), 0),
                'due':    safe_date(data.get('due_date') or data.get('expected_date')),
                'reason': data.get('reqn_reason_notes', '') or '',
                'notes':  data.get('line_notes', '') or '',
                'comp':   data.get('company', '') or '',
                'orig':   orig_value,
            })
        else:
            existing_master = db.session.execute(db.text(
                "SELECT Requisition FROM ReqMaster WHERE Requisition = :req"
            ), {'req': req_number}).fetchone()

            if not existing_master:
                db.session.execute(db.text("""
                    INSERT INTO ReqMaster (Requisition, JobNo, Originator, ReqnRaisedDate, ReqnStatus, Supplier, Note)
                    VALUES (:req, :job, :orig, :date, :status, :supp, :note)
                """), {
                    'req':    req_number,
                    'job':    job_value,
                    'orig':   orig_value,
                    'date':   safe_datetime(data.get('reqn_date')) or datetime.now(),
                    'status': 0,
                    'supp':   (data.get('supplier') or '').strip(),
                    'note':   (data.get('note') or '').strip(),
                })
            else:
                db.session.execute(db.text("""
                    UPDATE ReqMaster
                    SET Originator = CASE WHEN Originator IS NULL OR LTRIM(RTRIM(Originator)) = '' THEN :orig ELSE Originator END,
                        JobNo = CASE WHEN JobNo IS NULL OR LTRIM(RTRIM(JobNo)) = '' THEN :job ELSE JobNo END
                    WHERE Requisition = :req
                """), {'orig': orig_value, 'job': job_value, 'req': req_number})

            db.session.execute(db.text("""
                INSERT INTO ReqDetail (Requisition, Line, Type, Description, StockCode, OrderUom,
                                       Qty, UnitPrice, TotalPrice, DueDate, ReqnReason, Notes,
                                       Company, Originator, Approved, Authorised, Approved2, Taxable,
                                       Routed, Decline, Archive, Canceled)
                VALUES (:req, :line, :type, :desc, :stk, :uom, :qty, :price, :total, :due,
                        :reason, :notes, :comp, :orig, :app, :auth, :app2, :tax, :route, :decline, :arch, :cancel)
            """), {
                'req':     req_number,
                'line':    line,
                'type':    data.get('type', '') or '',
                'desc':    data.get('description', '') or '',
                'stk':     data.get('stk', '') or '',
                'uom':     uom_value,
                'qty':     qty_value,
                'price':   safe_float(data.get('unit_price'), 0),
                'total':   safe_float(data.get('total_price'), 0),
                'due':     safe_date(data.get('due_date') or data.get('expected_date')),
                'reason':  data.get('reqn_reason_notes', '') or '',
                'notes':   data.get('line_notes', '') or '',
                'comp':    data.get('company', '') or '',
                'orig':    orig_value,
                'app':     False,
                'auth':    False,
                'app2':    False,
                'tax':     False,
                'route':   False,
                'decline': False,
                'arch':    False,
                'cancel':  False,
            })

        db.session.commit()
        return jsonify({"message": "Created/Updated!", "req_number": req_number}), 201

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/requisitions/my/<path:username>', methods=['GET'])
def get_my_requisitions(username):
    try:
        uname = username.strip()
        user = User.query.filter_by(Username=uname).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        role = (user.Roles or "").strip()

        if role == 'Admin':
            where_clause = "1=1"
            params = {}
        elif role == 'Originator':
            where_clause = "UPPER(LTRIM(RTRIM(m.Originator))) = UPPER(:uname)"
            params = {"uname": uname}
        elif role == 'Buyer':
            where_clause = "UPPER(LTRIM(RTRIM(d.Buyer))) = UPPER(:uname)"
            params = {"uname": uname}
        elif role == 'Approvar1':
            where_clause = "UPPER(LTRIM(RTRIM(d.RouteTo))) = UPPER(:uname)"
            params = {"uname": uname}
        elif role == 'Approvar2':
            where_clause = "UPPER(LTRIM(RTRIM(d.ApprovedBy))) = UPPER(:uname)"
            params = {"uname": uname}
        else:
            where_clause = "1=1"
            params = {}
            

        details = db.session.execute(db.text(f"""
            SELECT d.Requisition, d.Line, d.Type, d.Description, d.StockCode,
                   d.OrderUom, d.Qty, d.UnitPrice, d.TotalPrice, d.DueDate,
                   d.ReceivedDate, d.ReqnReason, d.Notes, d.Company, d.Buyer,
                   d.PurchaseOrder, d.ExpectedDeliveryDate,
                   m.ReqnRaisedDate, m.ReqnStatus,
                   d.Supplier, d.SupplierName
            FROM ReqDetail d
            LEFT JOIN ReqMaster m ON d.Requisition = m.Requisition
            WHERE {where_clause} AND ISNULL(d.Archive, 0) = 0
            ORDER BY
                CASE WHEN m.ReqnRaisedDate IS NULL THEN 0 ELSE 1 END ASC,
                m.ReqnRaisedDate DESC,
                d.Requisition DESC,
                d.Line ASC
        """), params).fetchall()

        return jsonify([build_requisition_row(d) for d in details]), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/requisitions/archive', methods=['GET'])
def get_archived_requisitions():
    try:
        details = db.session.execute(db.text("""
            SELECT d.Requisition, d.Line, d.Type, d.Description, d.StockCode,
                   d.OrderUom, d.Qty, d.UnitPrice, d.TotalPrice, d.DueDate,
                   d.ReceivedDate, d.ReqnReason, d.Notes, d.Company, d.Buyer,
                   d.PurchaseOrder, d.ExpectedDeliveryDate,
                   m.ReqnRaisedDate, m.ReqnStatus,
                   d.Supplier, d.SupplierName
            FROM ReqDetail d
            LEFT JOIN ReqMaster m ON d.Requisition = m.Requisition
            WHERE ISNULL(d.Archive, 0) = 1   -- 🔥 ONLY archived
            ORDER BY d.Requisition DESC, d.Line ASC
        """)).fetchall()

        return jsonify([build_requisition_row(d) for d in details]), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/requisitions/update-supplier', methods=['PUT'])
def update_requisition_supplier():
    data          = request.json
    req_number    = (data.get('req_number') or '').strip()
    supplier      = (data.get('supplier')      or '').strip()
    supplier_name = (data.get('supplier_name') or '').strip()
    try:
        master = ReqMaster.query.filter_by(Requisition=req_number).first()
        if not master:
            return jsonify({"error": f"No requisition found for '{req_number}'"}), 404
        master.Supplier = supplier
        db.session.execute(db.text("""
            UPDATE ReqDetail SET Supplier = :supp, SupplierName = :name
            WHERE Requisition = :req
        """), {'supp': supplier, 'name': supplier_name, 'req': req_number})
        db.session.commit()
        return jsonify({"message": "Supplier updated!"}), 200
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/requisitions/update-group/<path:req_number>', methods=['PUT'])
def update_requisition_group(req_number):
    data = request.json
    try:
        master = ReqMaster.query.filter_by(Requisition=req_number).first()
        if not master:
            return jsonify({"error": f"No rows found for '{req_number}'"}), 404

        if data.get('supplier') not in (None, ''):
            master.Supplier = data['supplier'].strip()

        new_status_label = data.get('status')
        if new_status_label is not None:
            status_int = status_label_to_int(new_status_label)
            master.ReqnStatus = status_int
            db.session.execute(db.text(
                "UPDATE ReqDetail SET ReqnStatus = :s WHERE Requisition = :req"
            ), {'s': status_int, 'req': req_number})

        routed_to_user = (data.get('order_status') or '').strip()

        if routed_to_user:
            db.session.execute(db.text(
                "UPDATE ReqDetail SET Buyer = :u WHERE Requisition = :req"
            ), {'u': routed_to_user, 'req': req_number})

            if new_status_label == 'Approver 1':
                db.session.execute(db.text(
                    "UPDATE ReqDetail SET RouteTo = :u WHERE Requisition = :req"
                ), {'u': routed_to_user, 'req': req_number})

            elif new_status_label == 'Final Approval':
                db.session.execute(db.text("""
                    UPDATE ReqDetail 
                    SET ApprovedBy = :u, Approved = 1, ApprovedDate = GETDATE()
                    WHERE Requisition = :req
                """), {'u': routed_to_user, 'req': req_number})

            elif new_status_label == 'PO Created':
                db.session.execute(db.text("""
                    UPDATE ReqDetail 
                    SET Approved2By = :u, Approved2 = 1, Approved2DateTime = GETDATE(),
                        Authorised = 1, AuthorisedBy = :u, AuthorisedDate = GETDATE()
                    WHERE Requisition = :req
                """), {'u': routed_to_user, 'req': req_number})

            elif new_status_label == 'Declined':
                db.session.execute(db.text(
                    "UPDATE ReqDetail SET Decline = 1 WHERE Requisition = :req"
                ), {'req': req_number})

            elif new_status_label == 'Cancelled':
                db.session.execute(db.text(
                    "UPDATE ReqDetail SET Canceled = 1 WHERE Requisition = :req"
                ), {'req': req_number})

        db.session.commit()
        return jsonify({"message": "Updated!"}), 200
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/requisitions/<path:req_id>', methods=['PUT'])
def update_requisition(req_id):
    data = request.json
    try:
        req_number = get_req_number(req_id)
        req = ReqDetail.query.filter_by(Requisition=req_number).first()
        if not req:
            return jsonify({"error": f"'{req_id}' not found"}), 404
        req.DueDate     = safe_date(data.get('expected_date'), req.DueDate)
        req.Type        = data.get('type', req.Type)
        req.StockCode   = data.get('stk', req.StockCode)
        req.Description = data.get('description', req.Description)
        req.UnitPrice   = safe_float(data.get('unit_price'), req.UnitPrice or 0)
        req.Qty         = safe_float(data.get('quantity') or data.get('qty'), req.Qty or 0)
        req.TotalPrice  = req.UnitPrice * req.Qty
        db.session.commit()
        return jsonify({"message": "Updated!"}), 200
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/requisitions/<path:req_id>', methods=['DELETE'])
def delete_requisition(req_id):
    try:
        req_number = get_req_number(req_id)
        req = ReqDetail.query.filter_by(Requisition=req_number).first()
        if not req:
            return jsonify({"error": "Not found"}), 404
        db.session.delete(req)
        db.session.commit()
        return jsonify({"message": "Deleted!"}), 200
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ==================== APPROVER / ROLE LOOKUPS ====================

@app.route('/api/managers', methods=['GET'])
def get_managers():
    try:
        m = User.query.filter(User.Roles == 'Approvar1', User.Active == 'Y').all()
        return jsonify([{"username": u.Username, "first_name": u.FirstName, "last_name": u.LastName, "email": u.Email} for u in m]), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/managers2', methods=['GET'])
def get_managers2():
    try:
        m = User.query.filter(User.Roles == 'Approvar2', User.Active == 'Y').all()
        return jsonify([{"username": u.Username, "first_name": u.FirstName, "last_name": u.LastName, "email": u.Email} for u in m]), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/buyers', methods=['GET'])
def get_buyers():
    try:
        b = User.query.filter(User.Roles == 'Buyer', User.Active == 'Y').all()
        return jsonify([{"username": u.Username, "first_name": u.FirstName, "last_name": u.LastName, "email": u.Email} for u in b]), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admins', methods=['GET'])
def get_admins():
    try:
        a = User.query.filter(User.Roles == 'Admin', User.Active == 'Y').all()
        return jsonify([{"username": u.Username, "first_name": u.FirstName, "last_name": u.LastName, "email": u.Email} for u in a]), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ==================== LOOKUP ROUTES ====================

@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    try:
        result = Inventory.query.all()
        return jsonify([{"item_code": (r.ItemCode or "").strip(), "description": (r.Description or "").strip(),
                         "unit_size": (r.UnitSize or "").strip(), "category": (r.Category or "").strip()} for r in result]), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/suppliers', methods=['GET'])
def get_suppliers():
    try:
        rows = SupplierMaster.query.all()
        return jsonify([{"code": (r.SupplCode or "").strip(), "name": (r.SupplDesc or "").strip()} for r in rows]), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/companies', methods=['GET'])
def get_companies():
    try:
        r = db.session.execute(db.text(
            "SELECT DISTINCT LTRIM(RTRIM(Company)) FROM ReqDetail "
            "WHERE Company IS NOT NULL AND LTRIM(RTRIM(Company)) != '' ORDER BY 1"
        )).fetchall()
        return jsonify([{"company": row[0]} for row in r]), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/linetypes', methods=['GET'])
def get_line_types():
    try:
        r = db.session.execute(db.text(
            "SELECT DISTINCT LTRIM(RTRIM(Type)) FROM ReqDetail "
            "WHERE Type IS NOT NULL AND LTRIM(RTRIM(Type)) != '' ORDER BY 1"
        )).fetchall()
        return jsonify([{"type": row[0]} for row in r]), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/uom', methods=['GET'])
def get_uom():
    try:
        r = db.session.execute(db.text(
            "SELECT DISTINCT LTRIM(RTRIM(UnitSize)) FROM Inventory "
            "WHERE UnitSize IS NOT NULL AND LTRIM(RTRIM(UnitSize)) != '' ORDER BY 1"
        )).fetchall()
        return jsonify([{"uom": row[0]} for row in r]), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/next-req-number', methods=['GET'])
def get_next_req_number():
    try:
        r1 = db.session.execute(db.text(
            "SELECT MAX(CAST(Requisition AS BIGINT)) FROM ReqMaster WHERE Requisition NOT LIKE 'REQ-%'"
        )).fetchone()
        num1 = int(r1[0]) if r1 and r1[0] else 0
        return jsonify({"next_req_number": num1 + 1}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/job-numbers', methods=['GET'])
def get_job_numbers():
    try:
        r = db.session.execute(db.text(
            "SELECT DISTINCT LTRIM(RTRIM(JobNo)) FROM ReqMaster "
            "WHERE JobNo IS NOT NULL AND LTRIM(RTRIM(JobNo)) != '' ORDER BY 1"
        )).fetchall()
        return jsonify([{"job_no": row[0]} for row in r]), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/requisition-by-job/<path:job_no>', methods=['GET'])
def get_requisition_by_job(job_no):
    try:
        results = db.session.execute(db.text("""
            SELECT d.Requisition, d.Line,
                LTRIM(RTRIM(ISNULL(d.Company,    ''))) AS company,
                LTRIM(RTRIM(ISNULL(d.Type,       ''))) AS line_type,
                LTRIM(RTRIM(ISNULL(d.StockCode,  ''))) AS stock_code,
                LTRIM(RTRIM(ISNULL(d.Description,''))) AS description,
                LTRIM(RTRIM(ISNULL(d.OrderUom,   ''))) AS order_unit,
                ISNULL(d.Qty,       0)                  AS qty,
                ISNULL(d.UnitPrice, 0)                  AS unit_price,
                ISNULL(d.TotalPrice,0)                  AS total_price,
                LTRIM(RTRIM(ISNULL(CONVERT(VARCHAR,d.DueDate,23),''))) AS due_date,
                LTRIM(RTRIM(ISNULL(d.ReqnReason, ''))) AS reqn_reason_notes,
                LTRIM(RTRIM(ISNULL(d.Notes,      ''))) AS line_notes,
                LTRIM(RTRIM(ISNULL(m.Originator, ''))) AS originator,
                LTRIM(RTRIM(ISNULL(m.JobNo,      ''))) AS job_no,
                LTRIM(RTRIM(ISNULL(CONVERT(VARCHAR,m.ReqnRaisedDate,23),''))) AS reqn_date
            FROM ReqDetail d
            INNER JOIN ReqMaster m ON m.Requisition = d.Requisition
            WHERE LTRIM(RTRIM(m.JobNo)) = :job_no
            ORDER BY d.Requisition, d.Line
        """), {"job_no": job_no.strip()}).fetchall()
        return jsonify([{
            "requisition": r[0], "line": str(r[1]),
            "company": r[2], "line_type": r[3], "stock_code": r[4],
            "description": r[5], "order_unit": r[6],
            "qty": str(r[7]), "unit_price": str(r[8]), "total_price": str(r[9]),
            "due_date": r[10], "reqn_reason_notes": r[11], "line_notes": r[12],
            "originator": r[13], "job_no": r[14], "reqn_date": r[15],
        } for r in results]), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ==================== TEST ====================

@app.route('/test-db', methods=['GET'])
def test_db():
    try:
        users = User.query.limit(1).all()
        return jsonify({"status": "OK", "users_count": len(users)}), 200
    except Exception as e:
        return jsonify({"status": "FAIL", "error": str(e)}), 500

# ==================== SPA CATCH-ALL (must be LAST) ====================
# Any route that doesn't match an API endpoint serves index.html
# so React Router handles /login, /dashboard, /requisitions, /users

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

# ==================== RUN ====================

if __name__ == '__main__':
    print("")
    print("  =========================================")
    print("   SLI Requisition — API + Frontend")
    print("  =========================================")
    print(f"  Build folder: {app.static_folder}")
    print(f"  http://154.66.196.144:5000")
    print("")
    app.run(host='0.0.0.0', port=5000, debug=True)
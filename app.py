import os
import datetime
import jwt
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from contextlib import contextmanager, closing
from decimal import Decimal
import re
from dotenv import load_dotenv

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(env_path, override=True)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQL_PATH = os.path.join(BASE_DIR, "IMS.sql")
DIST_PATH = os.path.join(BASE_DIR, "dist")

# --- DB Config ---
DB_HOST = os.getenv("IMS_DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("IMS_DB_PORT", "3306"))
DB_USER = os.getenv("IMS_DB_USER", "ims_app")
DB_PASSWORD = os.getenv("IMS_DB_PASSWORD", "ims123")
DB_NAME = os.getenv("IMS_DB_NAME", "ims")
DB_TIMEOUT = int(os.getenv("IMS_DB_TIMEOUT", "5"))

# --- Admin Config ---
ADMIN_INVITE_CODE = os.getenv("ADMIN_INVITE_CODE", "ADMIN123")

SECRET_KEY = os.getenv("JWT_SECRET", "ims-super-secret-key-at-least-32-bytes-long-2024")

app = Flask(__name__, static_folder=DIST_PATH, static_url_path='')
CORS(app, supports_credentials=True)

# --- Helpers ---
def send_email(to_email, subject, body):
    # Fetch fresh from env in case they changed
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")
    email_from = os.getenv("EMAIL_FROM", smtp_user)

    if not smtp_user or not smtp_pass:
        print(f"--- EMAIL CONFIG MISSING ---")
        print(f"SMTP_USER: '{smtp_user}', SMTP_PASS: '{'SET' if smtp_pass else 'NOT SET'}'")
        print(f"To: {to_email}\nSubject: {subject}")
        print(f"-----------------------------")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = email_from
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        print(f"Attempting to send email to {to_email} via {smtp_server}:{smtp_port}...")
        
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_server, smtp_port)
        else:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        print(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to send email to {to_email}: {type(e).__name__}: {e}")
        return False

def decimal_to_float(value):
    if isinstance(value, Decimal):
        return float(value)
    return value

def format_row(row):
    if not row: return row
    new_row = {}
    for k, v in row.items():
        if isinstance(v, Decimal):
            new_row[k] = float(v)
        elif isinstance(v, (datetime.datetime, datetime.date)):
            new_row[k] = v.isoformat()
        else:
            new_row[k] = v
    return new_row

def normalize_admin_role(role):
    role_map = {
        "Super Admin": "SUPER_ADMIN",
        "Inventory Manager": "ADMIN",
        "Order Manager": "ORDER_MANAGER",
        "SUPER_ADMIN": "SUPER_ADMIN",
        "ADMIN": "ADMIN",
        "ORDER_MANAGER": "ORDER_MANAGER",
    }
    return role_map.get(role, role)

def display_admin_role(role):
    role_map = {
        "SUPER_ADMIN": "Super Admin",
        "ADMIN": "Inventory Manager",
        "ORDER_MANAGER": "Order Manager",
    }
    return role_map.get(role, role)

def map_admin_for_frontend(row):
    a = format_row(row)
    return {
        **a,
        "adminId": str(a["admin_id"]) if a.get("admin_id") is not None else "",
        "firstName": a.get("first_name", ""),
        "lastName": a.get("last_name", ""),
        "createdAt": a.get("created_at"),
        "isActive": bool(a.get("is_active", 0)),
        "role": display_admin_role(a.get("role")),
    }

import sqlite3

# --- DB Configuration ---
USE_SQLITE = os.getenv("USE_SQLITE", "false").lower() == "true"
SQLITE_PATH = os.path.join(BASE_DIR, "ims.db")

def get_db_type():
    if USE_SQLITE:
        return "sqlite"
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            connection_timeout=DB_TIMEOUT
        )
        conn.close()
        return "mysql"
    except:
        print("MySQL connection failed, falling back to SQLite.")
        return "sqlite"

DB_TYPE = get_db_type()

@contextmanager
def db_connection():
    if DB_TYPE == "sqlite":
        conn = sqlite3.connect(SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
    else:
        conn = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            connection_timeout=DB_TIMEOUT,
        )
        try:
            yield conn
        finally:
            conn.close()

def generate_token(user_id, role, username):
    # Map roles to match frontend's AppRole ('admin' | 'customer') for routing
    # The frontend uses this field in ProtectedRoute to allow/deny access.
    app_role = 'admin' if role in ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'Super Admin', 'Inventory Manager', 'Order Manager'] else 'customer'
    
    # Map for potential descriptive use (if needed in future)
    role_map = {
        'SUPER_ADMIN': 'Super Admin',
        'ADMIN': 'Super Admin',
        'CUSTOMER': 'customer'
    }
    db_role = role_map.get(role, role)
    
    print(f"DEBUG TOKEN: input_role='{role}', mapped_role='{app_role}'")

    payload = {
        "sub": str(user_id),
        "username": username,
        "role": app_role,
        "db_role": db_role,
        "exp": datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def execute_query(cursor, query, args=None):
    if DB_TYPE == "sqlite":
        # Convert %s to ? for SQLite
        query = query.replace("%s", "?")
    cursor.execute(query, args or [])

def fetch_one(cursor):
    row = cursor.fetchone()
    if not row: return None
    if DB_TYPE == "sqlite":
        return dict(row)
    return row

def fetch_all(cursor):
    rows = cursor.fetchall()
    if DB_TYPE == "sqlite":
        return [dict(r) for r in rows]
    return rows

# Update helpers to use normalized functions
def paginate(query, params, query_args=None):
    page = int(params.get('page', 1))
    limit = int(params.get('limit', 10))
    offset = (page - 1) * limit
    
    with db_connection() as conn:
        cursor = conn.cursor()
        if DB_TYPE == "mysql":
            cursor = conn.cursor(dictionary=True)
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM ({query}) as t"
        execute_query(cursor, count_query, query_args)
        res = fetch_one(cursor)
        total = res['total'] if res else 0
        
        # Get paginated data
        paginated_query = f"{query} LIMIT %s OFFSET %s"
        args = list(query_args or []) + [limit, offset]
        execute_query(cursor, paginated_query, args)
        rows = fetch_all(cursor)
        
        return {
            "data": [format_row(r) for r in rows],
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit if limit > 0 else 1
        }

# --- Auth Routes ---
@app.post("/api/auth/login")
def api_login():
    data = request.get_json(silent=True) or {}
    role = data.get("role") # 'admin' or 'customer'
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if role not in {"admin", "customer"}:
        return jsonify({"error": "Invalid role"}), 400
    
    table = "admin_accounts" if role == "admin" else "customer_accounts"
    id_col = "admin_id" if role == "admin" else "customer_id"

    with db_connection() as conn:
        cursor = conn.cursor()
        if DB_TYPE == "mysql": cursor = conn.cursor(dictionary=True)
        
        # First check if user exists
        query_exists = f"SELECT 1 FROM {table} WHERE username = %s"
        execute_query(cursor, query_exists, (username,))
        if not fetch_one(cursor):
            return jsonify({"error": "Username not found"}), 404

        query = f"SELECT * FROM {table} WHERE username = %s AND password = %s AND is_active = 1"
        execute_query(cursor, query, (username, password))
        user = fetch_one(cursor)
        
        if not user:
            return jsonify({"error": "Invalid password"}), 401
        
        user_id = user[id_col]
        user_role = user.get('role', 'CUSTOMER') if role == 'admin' else 'CUSTOMER'
        
        print(f"DEBUG LOGIN: user_id={user_id}, role={role}, db_role={user_role}, username={username}")
        
        token = generate_token(user_id, user_role, username)
        
        return jsonify({
            "token": token,
            "refreshToken": "dummy-refresh-token",
            "role": role,
            "user": {
                "id": str(user_id),
                "firstName": user['first_name'],
                "lastName": user['last_name'],
                "email": user['email'],
                "username": user['username']
            }
        })

@app.post("/api/auth/register")
def api_register():
    data = request.get_json(silent=True) or {}
    role = data.get("role", "customer") # 'admin' or 'customer'
    first_name = data.get("firstName")
    last_name = data.get("lastName")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")
    address = data.get("address") # Only for customers
    
    if not all([first_name, last_name, email, password]):
        return jsonify({"error": "Missing fields"}), 400

    if role == "admin":
        invite_code = data.get("inviteCode")
        if invite_code != ADMIN_INVITE_CODE:
            return jsonify({"error": "Invalid admin invite code"}), 403

    # Auto-generate username: firstname + day (DD)
    day_str = datetime.datetime.now().strftime("%d")
    base_username = f"{first_name.lower()}{day_str}"
    username = base_username

    table = "admin_accounts" if role == "admin" else "customer_accounts"
    id_col = "admin_id" if role == "admin" else "customer_id"

    with db_connection() as conn:
        cursor = conn.cursor()
        
        # Check if email exists
        execute_query(cursor, f"SELECT 1 FROM {table} WHERE email = %s", (email,))
        if fetch_one(cursor):
            return jsonify({"error": "Email already exists"}), 400
        
        # Ensure unique username by appending a suffix if needed
        suffix = 1
        while True:
            execute_query(cursor, f"SELECT 1 FROM {table} WHERE username = %s", (username,))
            if not fetch_one(cursor):
                break
            username = f"{base_username}{suffix}"
            suffix += 1
        
        # Determine user role for the token
        user_role = 'ADMIN' if role == 'admin' else 'CUSTOMER'
        
        if role == "admin":
            execute_query(cursor, 
                "INSERT INTO admin_accounts (username, password, first_name, last_name, email, phone, role) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (username, password, first_name, last_name, email, phone, user_role)
            )
        else:
            execute_query(cursor, 
                "INSERT INTO customer_accounts (username, password, first_name, last_name, email, phone, address) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (username, password, first_name, last_name, email, phone, address)
            )
        
        conn.commit()
        user_id = cursor.lastrowid
        
        # Fetch the email and first name from the database to be absolutely sure we have the correct target
        if DB_TYPE == "mysql": cursor = conn.cursor(dictionary=True)
        execute_query(cursor, f"SELECT * FROM {table} WHERE {id_col} = %s", (user_id,))
        db_user = fetch_one(cursor)
        
        if db_user:
            target_email = db_user['email']
            target_first_name = db_user['first_name']
            target_role = db_user.get('role', user_role)
            
            # Send real email with username
            subject = "Your IIMS Username"
            body = f"Hello {target_first_name},\n\nYour account has been created successfully.\nYour unique username for logging in is: {username}\n\nWelcome aboard!\nIIMS Team"
            send_email(target_email, subject, body)
        
        token = generate_token(user_id, target_role, username)
        
        return jsonify({
            "token": token,
            "refreshToken": "dummy-refresh-token",
            "role": role,
            "user": {
                "id": str(user_id),
                "firstName": first_name,
                "lastName": last_name,
                "email": email,
                "username": username
            }
        })

@app.post("/api/auth/logout")
def api_logout():
    return jsonify({"ok": True})

# --- Product Routes ---
@app.get("/api/products")
def get_products():
    query = "SELECT p.*, c.name as categoryName FROM products p LEFT JOIN categories c ON p.category_id = c.category_id WHERE 1=1"
    args = []
    
    search = request.args.get('search')
    if search:
        query += " AND (p.name LIKE %s OR c.name LIKE %s)"
        args.extend([f"%{search}%", f"%{search}%"])
        
    category_id = request.args.get('categoryId')
    if category_id:
        query += " AND p.category_id = %s"
        args.append(category_id)

    # Normalize fields for frontend (productId, stockQty)
    res = paginate(query, request.args, args)
    for p in res['data']:
        p['productId'] = str(p['product_id'])
        p['stockQty'] = p['stock']
        if p['categoryName']:
            p['category'] = {
                "categoryId": str(p['category_id']),
                "categoryName": p['categoryName'],
                "description": ""
            }
    return jsonify(res)

@app.get("/api/products/<id>")
def get_product(id):
    with db_connection() as conn:
        cursor = conn.cursor()
        if DB_TYPE == "mysql": cursor = conn.cursor(dictionary=True)
        query = "SELECT p.*, c.name as categoryName FROM products p LEFT JOIN categories c ON p.category_id = c.category_id WHERE p.product_id = %s"
        execute_query(cursor, query, (id,))
        p = fetch_one(cursor)
        if not p: return jsonify({"error": "Not found"}), 404
        p = format_row(p)
        p['productId'] = str(p['product_id'])
        p['stockQty'] = p['stock']
        return jsonify(p)

@app.post("/api/products")
def create_product():
    data = request.get_json()
    with db_connection() as conn:
        cursor = conn.cursor()
        query = "INSERT INTO products (name, price, stock, category_id) VALUES (%s, %s, %s, %s)"
        execute_query(cursor, query, (data['name'], data['price'], data['stockQty'], data.get('categoryId')))
        conn.commit()
        return jsonify({"ok": True, "id": cursor.lastrowid})

@app.put("/api/products/<id>")
def update_product(id):
    data = request.get_json()
    with db_connection() as conn:
        cursor = conn.cursor()
        query = "UPDATE products SET name=%s, price=%s, stock=%s, category_id=%s WHERE product_id=%s"
        execute_query(cursor, query, (data['name'], data['price'], data['stockQty'], data.get('categoryId'), id))
        conn.commit()
        return jsonify({"ok": True})

@app.delete("/api/products/<id>")
def delete_product(id):
    with db_connection() as conn:
        cursor = conn.cursor()
        query = "DELETE FROM products WHERE product_id = %s"
        execute_query(cursor, query, (id,))
        conn.commit()
        return jsonify({"ok": True})

# --- Category Routes ---
@app.get("/api/categories")
def get_categories():
    query = "SELECT category_id as categoryId, name as categoryName, description FROM categories"
    return jsonify(paginate(query, request.args))

# --- Order Routes ---
@app.get("/api/orders")
def get_orders():
    customer_id = request.args.get('customerId')
    query = "SELECT * FROM orders WHERE 1=1"
    args = []
    
    if customer_id:
        query += " AND customer_name = %s"
        args.append(customer_id)
        
    status = request.args.get('status')
    if status:
        query += " AND status = %s"
        args.append(status)

    query += " ORDER BY datetime DESC"
    res = paginate(query, request.args, args)
    for o in res['data']:
        o['orderId'] = str(o['order_id'])
        o['customerId'] = o['customer_name'] # Simplified mapping
    return jsonify(res)

@app.post("/api/orders")
def create_order():
    data = request.get_json()
    customer_id = data.get('customerId')
    items = data.get('items', [])
    
    with db_connection() as conn:
        cursor = conn.cursor()
        # Create order
        query_order = "INSERT INTO orders (customer_name, status) VALUES (%s, 'pending')"
        execute_query(cursor, query_order, (customer_id,))
        order_id = cursor.lastrowid
        
        # Add items
        for item in items:
            query_item = "INSERT INTO order_items (order_id, product_id, qty) VALUES (%s, %s, %s)"
            execute_query(cursor, query_item, (order_id, item['productId'], item['quantity']))
            
            # Update stock
            query_stock = "UPDATE products SET stock = stock - %s WHERE product_id = %s"
            execute_query(cursor, query_stock, (item['quantity'], item['productId']))
            
        conn.commit()
        return jsonify({"ok": True, "orderId": str(order_id)})

# --- Admin/Customer Management ---
@app.get("/api/customers")
def get_customers():
    query = "SELECT * FROM customer_accounts"
    res = paginate(query, request.args)
    for c in res['data']:
        c['customerId'] = str(c['customer_id'])
    return jsonify(res)

@app.get("/api/admins")
def get_admins():
    query = "SELECT * FROM admin_accounts"
    res = paginate(query, request.args)
    res['data'] = [map_admin_for_frontend(a) for a in res['data']]
    return jsonify(res)

# --- Audit Log ---
@app.get("/api/admin-products/audit")
def get_audit_log():
    query = """
        SELECT ap.*, a.first_name || ' ' || a.last_name as adminName, p.name as productName 
        FROM admin_products ap
        LEFT JOIN admin_accounts a ON ap.admin_username = a.username
        LEFT JOIN products p ON ap.product_id = p.product_id
        WHERE 1=1
    """
    if DB_TYPE == "mysql":
        query = """
            SELECT ap.*, CONCAT(a.first_name, ' ', a.last_name) as adminName, p.name as productName 
            FROM admin_products ap
            LEFT JOIN admin_accounts a ON ap.admin_username = a.username
            LEFT JOIN products p ON ap.product_id = p.product_id
            WHERE 1=1
        """
    
    args = []
    search = request.args.get('search')
    if search:
        query += " AND (a.first_name LIKE %s OR a.last_name LIKE %s OR p.name LIKE %s)"
        args.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
    
    action = request.args.get('action')
    if action:
        query += " AND ap.action = %s"
        args.append(action)
        
    res = paginate(query, request.args, args)
    # Map fields for frontend (actionDatetime)
    for r in res['data']:
        r['actionDatetime'] = r['action_datetime']
        r['adminId'] = r['admin_username']
        r['productId'] = str(r['product_id'])
    return jsonify(res)

# --- Analytics ---
@app.get("/api/analytics/sales")
def get_sales_analytics():
    # Return some realistic-looking data based on orders if possible
    with db_connection() as conn:
        cursor = conn.cursor()
        if DB_TYPE == "mysql": cursor = conn.cursor(dictionary=True)
        query = "SELECT DATE(datetime) as date, SUM(total_price) as revenue, COUNT(*) as orders FROM orders GROUP BY DATE(datetime) ORDER BY date DESC LIMIT 30"
        if DB_TYPE == "sqlite":
            query = "SELECT date(datetime) as date, SUM(total_price) as revenue, COUNT(*) as orders FROM orders GROUP BY date(datetime) ORDER BY date DESC LIMIT 30"
        execute_query(cursor, query)
        rows = fetch_all(cursor)
        return jsonify([format_row(r) for r in rows] if rows else [
            {"date": "2024-01-01", "revenue": 1000, "orders": 5},
            {"date": "2024-01-02", "revenue": 1500, "orders": 8}
        ])

@app.get("/api/analytics/top-products")
def get_top_products():
    with db_connection() as conn:
        cursor = conn.cursor()
        if DB_TYPE == "mysql": cursor = conn.cursor(dictionary=True)
        query = """
            SELECT p.product_id as productId, p.name, SUM(oi.qty) as quantity, SUM(oi.total_price) as revenue 
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            GROUP BY p.product_id, p.name
            ORDER BY revenue DESC
            LIMIT 5
        """
        execute_query(cursor, query)
        rows = fetch_all(cursor)
        return jsonify([format_row(r) for r in rows] if rows else [
            {"name": "Keyboard", "value": 150},
            {"name": "Mouse", "value": 120}
        ])

@app.get("/api/analytics/category-performance")
def get_category_performance():
    with db_connection() as conn:
        cursor = conn.cursor()
        if DB_TYPE == "mysql": cursor = conn.cursor(dictionary=True)
        query = """
            SELECT c.category_id as categoryId, c.name as categoryName, SUM(oi.total_price) as revenue, SUM(oi.qty) as units 
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            JOIN categories c ON p.category_id = c.category_id
            GROUP BY c.category_id, c.name
        """
        execute_query(cursor, query)
        rows = fetch_all(cursor)
        return jsonify([format_row(r) for r in rows] if rows else [
            {"category": "Electronics", "sales": 4500, "orders": 25}
        ])

@app.get("/api/analytics/low-stock")
def get_low_stock():
    with db_connection() as conn:
        cursor = conn.cursor()
        if DB_TYPE == "mysql": cursor = conn.cursor(dictionary=True)
        query = "SELECT product_id FROM products WHERE stock < 10"
        execute_query(cursor, query)
        rows = fetch_all(cursor)
        return jsonify([str(r['product_id']) for r in rows])

@app.get("/api/analytics/demand-forecast")
def get_demand_forecast():
    # Dummy points
    points = []
    import datetime
    base = 10
    for i in range(30):
        date = (datetime.date.today() + datetime.timedelta(days=i)).isoformat()
        demand = base + (i % 7) * 2
        points.append({
            "date": date,
            "demand": demand,
            "lower": demand * 0.8,
            "upper": demand * 1.2
        })
    return jsonify(points)

@app.get("/api/analytics/recommendations")
def get_recommendations_v1():
    # Dummy pairs
    return jsonify([
        {"productAId": "1", "productAName": "Keyboard", "productBId": "2", "productBName": "Mouse", "supportPct": 5.5, "confidencePct": 40.2}
    ])

@app.get("/api/analytics/recommendations-ids")
def get_recommendations_ids():
    with db_connection() as conn:
        cursor = conn.cursor()
        execute_query(cursor, "SELECT product_id FROM products LIMIT 5")
        rows = fetch_all(cursor)
        ids = [str(r['product_id']) for r in rows]
        return jsonify({"productIds": ids})

@app.get("/api/analytics/low-stock-forecast")
def get_low_stock_forecast():
    with db_connection() as conn:
        cursor = conn.cursor()
        if DB_TYPE == "mysql": cursor = conn.cursor(dictionary=True)
        query = "SELECT product_id as productId, name, stock as stockQty FROM products WHERE stock < 20"
        execute_query(cursor, query)
        rows = fetch_all(cursor)
        data = []
        for r in rows:
            r['avgDailySales'] = 2.5
            r['daysRemaining'] = r['stockQty'] / 2.5
            data.append(format_row(r))
        return jsonify(data)

# --- Admin/Customer/Category Management ---
@app.post("/api/categories")
def create_category():
    data = request.get_json()
    with db_connection() as conn:
        cursor = conn.cursor()
        query = "INSERT INTO categories (name, description) VALUES (%s, %s)"
        execute_query(cursor, query, (data['categoryName'], data['description']))
        conn.commit()
        return jsonify({"ok": True, "id": cursor.lastrowid})

@app.put("/api/categories/<id>")
def update_category(id):
    data = request.get_json()
    with db_connection() as conn:
        cursor = conn.cursor()
        query = "UPDATE categories SET name=%s, description=%s WHERE category_id=%s"
        execute_query(cursor, query, (data['categoryName'], data['description'], id))
        conn.commit()
        return jsonify({"ok": True})

@app.delete("/api/categories/<id>")
def delete_category(id):
    with db_connection() as conn:
        cursor = conn.cursor()
        execute_query(cursor, "DELETE FROM categories WHERE category_id = %s", (id,))
        conn.commit()
        return jsonify({"ok": True})

@app.get("/api/admins/<id>")
def get_admin_detail(id):
    with db_connection() as conn:
        cursor = conn.cursor()
        if DB_TYPE == "mysql": cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM admin_accounts WHERE admin_id = %s OR username = %s"
        execute_query(cursor, query, (id, id))
        a = fetch_one(cursor)
        if not a: return jsonify({"error": "Not found"}), 404
        return jsonify(map_admin_for_frontend(a))

@app.post("/api/admins")
def create_admin():
    data = request.get_json() or {}
    with db_connection() as conn:
        cursor = conn.cursor()
        query = "INSERT INTO admin_accounts (username, password, first_name, last_name, email, phone, role) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        execute_query(
            cursor,
            query,
            (
                data['username'],
                data['password'],
                data['firstName'],
                data['lastName'],
                data['email'],
                data.get('phone'),
                normalize_admin_role(data['role'])
            )
        )
        conn.commit()
        admin_id = cursor.lastrowid
        if DB_TYPE == "mysql": cursor = conn.cursor(dictionary=True)
        execute_query(cursor, "SELECT * FROM admin_accounts WHERE admin_id = %s", (admin_id,))
        created = fetch_one(cursor)
        return jsonify(map_admin_for_frontend(created))

@app.put("/api/admins/<id>")
def update_admin(id):
    data = request.get_json() or {}
    field_map = {
        "firstName": "first_name",
        "lastName": "last_name",
        "email": "email",
        "role": "role",
        "isActive": "is_active",
        "phone": "phone",
    }

    updates = []
    values = []
    for key, column in field_map.items():
        if key not in data:
            continue
        value = data[key]
        if key == "role":
            value = normalize_admin_role(value)
        if key == "isActive":
            value = 1 if value else 0
        updates.append(f"{column}=%s")
        values.append(value)

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    with db_connection() as conn:
        cursor = conn.cursor()
        query = f"UPDATE admin_accounts SET {', '.join(updates)} WHERE admin_id=%s"
        execute_query(cursor, query, (*values, id))
        conn.commit()
        if DB_TYPE == "mysql": cursor = conn.cursor(dictionary=True)
        execute_query(cursor, "SELECT * FROM admin_accounts WHERE admin_id = %s", (id,))
        updated = fetch_one(cursor)
        return jsonify(map_admin_for_frontend(updated))

@app.get("/api/customers/<id>")
def get_customer_detail(id):
    with db_connection() as conn:
        cursor = conn.cursor()
        if DB_TYPE == "mysql": cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM customer_accounts WHERE customer_id = %s OR username = %s"
        execute_query(cursor, query, (id, id))
        c = fetch_one(cursor)
        if not c: return jsonify({"error": "Not found"}), 404
        c = format_row(c)
        c['customerId'] = str(c['customer_id'])
        return jsonify(c)

@app.put("/api/customers/<id>")
def update_customer(id):
    data = request.get_json()
    with db_connection() as conn:
        cursor = conn.cursor()
        query = "UPDATE customer_accounts SET first_name=%s, last_name=%s, email=%s WHERE customer_id=%s"
        execute_query(cursor, query, (data['firstName'], data['lastName'], data['email'], id))
        conn.commit()
        return jsonify({"ok": True})

@app.patch("/api/customers/<id>/status")
def patch_customer_status(id):
    data = request.get_json()
    with db_connection() as conn:
        cursor = conn.cursor()
        query = "UPDATE customer_accounts SET is_active=%s WHERE customer_id=%s"
        execute_query(cursor, query, (1 if data['isActive'] else 0, id))
        conn.commit()
        return jsonify({"ok": True})

@app.get("/api/orders/<id>")
def get_order_detail(id):
    with db_connection() as conn:
        cursor = conn.cursor()
        if DB_TYPE == "mysql": cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM orders WHERE order_id = %s"
        execute_query(cursor, query, (id,))
        o = fetch_one(cursor)
        if not o: return jsonify({"error": "Not found"}), 404
        o = format_row(o)
        o['orderId'] = str(o['order_id'])
        o['customerId'] = o['customer_name']
        return jsonify(o)

@app.put("/api/orders/<id>")
def update_order(id):
    data = request.get_json()
    with db_connection() as conn:
        cursor = conn.cursor()
        query = "UPDATE orders SET status=%s, address=%s WHERE order_id=%s"
        execute_query(cursor, query, (data['status'], data['address'], id))
        conn.commit()
        return jsonify({"ok": True})

@app.patch("/api/orders/<id>/status")
def patch_order_status(id):
    data = request.get_json()
    with db_connection() as conn:
        cursor = conn.cursor()
        query = "UPDATE orders SET status=%s WHERE order_id=%s"
        execute_query(cursor, query, (data['status'], id))
        conn.commit()
        return jsonify({"ok": True})

@app.get("/api/orders/<id>/items")
def get_order_items(id):
    with db_connection() as conn:
        cursor = conn.cursor()
        if DB_TYPE == "mysql": cursor = conn.cursor(dictionary=True)
        query = """
            SELECT oi.*, p.name as productName, p.price as unitPrice 
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = %s
        """
        execute_query(cursor, query, (id,))
        rows = fetch_all(cursor)
        data = [format_row(r) for r in rows]
        for r in data:
            r['productId'] = str(r['product_id'])
            r['quantity'] = r['qty']
        return jsonify(data)

# --- Static Files & SPA Routing ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def handle_404(e):
    if request.path.startswith('/api/'):
        return jsonify({"error": "Not found"}), 404
    return send_from_directory(app.static_folder, 'index.html')

# --- DB Init ---
def parse_sql_script(script_text):
    statements = []
    delimiter = ";"
    buffer = []
    for raw_line in script_text.splitlines():
        stripped = raw_line.strip()
        if not stripped or stripped.startswith("--"): continue
        if stripped.upper().startswith("DELIMITER"):
            parts = stripped.split(None, 1)
            delimiter = parts[1] if len(parts) > 1 else ";"
            continue
        buffer.append(raw_line)
        if raw_line.rstrip().endswith(delimiter):
            statement = "\n".join(buffer)
            statement = statement[: statement.rfind(delimiter)].strip()
            if statement: statements.append(statement)
            buffer = []
    return statements

def init_db():
    try:
        if DB_TYPE == "mysql":
            try:
                # Try to create database using a generic connection first
                conn = mysql.connector.connect(
                    host=DB_HOST,
                    port=DB_PORT,
                    user=DB_USER,
                    password=DB_PASSWORD,
                    connection_timeout=DB_TIMEOUT
                )
                cursor = conn.cursor()
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}`")
                conn.commit()
                conn.close()
            except Exception as e:
                print(f"Warning: Could not create database via MySQL: {e}")

        if os.path.exists(SQL_PATH):
            with open(SQL_PATH, "r", encoding="utf-8") as f:
                statements = parse_sql_script(f.read())
            
            with db_connection() as conn:
                cursor = conn.cursor()
                for s in statements:
                    try:
                        # Skip MySQL specific administrative commands
                        s_upper = s.upper().strip()
                        if any(x in s_upper for x in ["CREATE USER", "GRANT ALL", "FLUSH PRIVILEGES", "USE ", "DELIMITER"]):
                            continue
                        
                        # Handle SQLite specific adjustments
                        if DB_TYPE == "sqlite":
                            # Skip database creation
                            if "CREATE DATABASE" in s_upper: continue
                            
                            # SQLite requires INTEGER PRIMARY KEY AUTOINCREMENT for auto-inc
                            s = s.replace("INT AUTO_INCREMENT PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
                            s = s.replace("INT AUTO_INCREMENT", "INTEGER PRIMARY KEY AUTOINCREMENT")
                            s = s.replace("INTEGER AUTO_INCREMENT PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
                            s = s.replace("AUTO_INCREMENT", "AUTOINCREMENT")
                            
                            s = s.replace("INT ", "INTEGER ")
                            s = s.replace("TINYINT(1)", "INTEGER")
                            s = s.replace("DECIMAL(10, 2)", "REAL")
                            s = s.replace("DATETIME DEFAULT CURRENT_TIMESTAMP", "DATETIME DEFAULT (datetime('now','localtime'))")
                            s = s.replace(" UNSIGNED", "")
                            s = s.replace("INSERT IGNORE", "INSERT OR IGNORE")
                            
                            # SQLite doesn't like some MySQL syntax in CREATE TABLE
                            if "ENGINE=" in s.upper():
                                s = s[:s.upper().find("ENGINE=")]
                            
                            # SQLite doesn't like ALTER TABLE AUTOINCREMENT
                            if "ALTER TABLE" in s.upper() and ("AUTOINCREMENT" in s.upper() or "AUTO_INCREMENT" in s.upper()):
                                continue
                        
                        # Fix for MySQL connector and triggers
                        if "CREATE TRIGGER" in s_upper: continue
                        
                        cursor.execute(s)
                    except Exception as e:
                        if "already exists" not in str(e).lower():
                            print(f"Error executing statement: {e}")
                conn.commit()
                
                # Seed default admin if missing or has no username (especially for SQLite where triggers are skipped)
                cursor = conn.cursor()
                execute_query(cursor, "SELECT COUNT(*) as count FROM admin_accounts WHERE username IS NOT NULL")
                res = fetch_one(cursor)
                if not res or res['count'] == 0:
                    print("Seeding default admin account...")
                    # First clear any broken entries
                    execute_query(cursor, "DELETE FROM admin_accounts WHERE username IS NULL")
                    execute_query(cursor, 
                        "INSERT INTO admin_accounts (username, password, first_name, last_name, email, role) VALUES (%s, %s, %s, %s, %s, %s)",
                        ('admin', 'admin123', 'System', 'Administrator', 'admin@example.com', 'SUPER_ADMIN')
                    )
                    conn.commit()

        print(f"Database ({DB_TYPE}) initialized successfully.")
    except Exception as e:
        print(f"Database initialization failed: {e}")

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)

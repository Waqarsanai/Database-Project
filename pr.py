import os
from contextlib import contextmanager, closing
from datetime import datetime
from decimal import Decimal
import re

import mysql.connector
from mysql.connector import Error

# ─── DB Config ───────────────────────────���────────────────────────────────────
DB_HOST = os.getenv("IMS_DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("IMS_DB_PORT", "3306"))
DB_USER = os.getenv("IMS_DB_USER", "ims_app")
DB_PASSWORD = os.getenv("IMS_DB_PASSWORD", "ims123")
DB_NAME = os.getenv("IMS_DB_NAME", "ims")
DB_TIMEOUT = int(os.getenv("IMS_DB_TIMEOUT", "5"))

DEFAULT_ADMIN = {
    "username": "admin",
    "password": "admin123",
    "first_name": "Super",
    "last_name": "Admin",
    "email": "superadmin@ims.com",
    "role": "SUPER_ADMIN",
}

# ─── Simple timestamp counter (kept for compatibility display if needed) ─────
_timestamp_counter = [1]


def simple_date_time():
    val = f"T{_timestamp_counter[0]}"
    _timestamp_counter[0] += 1
    return val


# ─── Data classes ─────────────────────────────────────────────────────────────
class Product:
    def __init__(self, pid=0, name="", price=0.0, stock=0):
        self.id = pid
        self.name = name
        self.price = float(price)
        self.stock = int(stock)


class Account:
    def __init__(self, username="", password=""):
        self.username = username
        self.password = password


class Transaction:
    def __init__(self, product_id=0, qty=0, total=0.0, dt=""):
        self.product_id = product_id
        self.qty = qty
        self.total = float(total)
        self.datetime = dt


class OrderItem:
    def __init__(self, product_id=0, name="", qty=0, unit_price=0.0):
        self.product_id = product_id
        self.name = name
        self.qty = int(qty)
        self.unit_price = float(unit_price)


class Order:
    def __init__(self):
        self.order_id = 0
        self.customer_name = ""
        self.items = []
        self.total_amount = 0.0
        self.datetime = ""
        self.status = "PENDING"
        self.processed_by = None


# ─── Helpers ──────────────────────────────────────────────────────────────────
def decimal_to_float(value):
    if isinstance(value, Decimal):
        return float(value)
    return value


def print_header(title: str):
    print("\n========================================")
    print(f" {title}")
    print("========================================")


def parse_positive_int_text(text):
    raw = str(text).strip()
    if not re.fullmatch(r"[0-9]+", raw):
        return False, None
    value = int(raw)
    return value > 0, value


def parse_non_negative_int_text(text):
    raw = str(text).strip()
    if not re.fullmatch(r"[0-9]+", raw):
        return False, None
    return True, int(raw)


def parse_non_negative_float_text(text):
    raw = str(text).strip()
    if not re.fullmatch(r"[0-9]+(?:\.[0-9]+)?", raw):
        return False, None
    return True, float(raw)


def server_connection():
    return mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        connection_timeout=DB_TIMEOUT,
    )


@contextmanager
def db_connection():
    with closing(
        mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            connection_timeout=DB_TIMEOUT,
        )
    ) as conn:
        yield conn


def column_exists(table_name, column_name):
    with db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = %s AND table_name = %s AND column_name = %s
            """,
            (DB_NAME, table_name, column_name),
        )
        return cursor.fetchone()[0] > 0


def table_exists(table_name):
    with db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = %s AND table_name = %s
            """,
            (DB_NAME, table_name),
        )
        return cursor.fetchone()[0] > 0


def ensure_schema():
    # Creates DB if missing; assumes tables already created via IMS.sql.
    with server_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}`")
        conn.commit()

    required_tables = [
        "admin_accounts",
        "customer_accounts",
        "products",
        "orders",
        "order_items",
    ]
    missing = [t for t in required_tables if not table_exists(t)]
    if missing:
        print("ERROR: Required tables are missing:", ", ".join(missing))
        print("Please run IMS.sql (or start app.py once) before running pr.py.")
        raise SystemExit(1)

    apply_compatibility_migrations()
    ensure_default_admin()


def apply_compatibility_migrations():
    with db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DROP TRIGGER IF EXISTS generate_admin_username")
        cursor.execute("DROP TRIGGER IF EXISTS generate_customer_username")

        if not column_exists("orders", "total_amount"):
            cursor.execute(
                "ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER datetime"
            )

        if not column_exists("order_items", "unit_price"):
            cursor.execute(
                "ALTER TABLE order_items ADD COLUMN unit_price DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER qty"
            )

        if not column_exists("order_items", "product_name"):
            cursor.execute(
                "ALTER TABLE order_items ADD COLUMN product_name VARCHAR(100) NOT NULL DEFAULT '' AFTER unit_price"
            )

        conn.commit()


def ensure_default_admin():
    with db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT admin_id FROM admin_accounts WHERE email = %s LIMIT 1",
            (DEFAULT_ADMIN["email"],),
        )
        row = cursor.fetchone()
        if row:
            cursor.execute(
                """
                UPDATE admin_accounts
                SET username=%s, password=%s, first_name=%s, last_name=%s, role=%s, is_active=1
                WHERE admin_id=%s
                """,
                (
                    DEFAULT_ADMIN["username"],
                    DEFAULT_ADMIN["password"],
                    DEFAULT_ADMIN["first_name"],
                    DEFAULT_ADMIN["last_name"],
                    DEFAULT_ADMIN["role"],
                    row["admin_id"],
                ),
            )
        else:
            cursor.execute(
                """
                INSERT INTO admin_accounts (username, password, first_name, last_name, email, role, is_active)
                VALUES (%s,%s,%s,%s,%s,%s,1)
                """,
                (
                    DEFAULT_ADMIN["username"],
                    DEFAULT_ADMIN["password"],
                    DEFAULT_ADMIN["first_name"],
                    DEFAULT_ADMIN["last_name"],
                    DEFAULT_ADMIN["email"],
                    DEFAULT_ADMIN["role"],
                ),
            )
        conn.commit()


# ─── In-memory state only for undo/recent viewed ─────────────────────────────
undo_stack = []           # same idea as before, but DB actions
recent_viewed_stack = []  # list of product IDs


# ─── Product queries ──────────────────────────────────────────────────────────
def fetch_all_products():
    with db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT product_id, name, price, stock FROM products ORDER BY product_id ASC"
        )
        rows = cursor.fetchall()
    return [
        Product(
            pid=row["product_id"],
            name=row["name"],
            price=decimal_to_float(row["price"]),
            stock=row["stock"],
        )
        for row in rows
    ]


def find_product_by_id(pid: int):
    with db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT product_id, name, price, stock FROM products WHERE product_id=%s LIMIT 1",
            (pid,),
        )
        row = cursor.fetchone()
    if not row:
        return None
    return Product(
        pid=row["product_id"],
        name=row["name"],
        price=decimal_to_float(row["price"]),
        stock=row["stock"],
    )


def show_all_products():
    products = fetch_all_products()
    print_header("Product List")
    if not products:
        print("No products.")
        return
    print("ID\tName\tPrice\tStock")
    for p in products:
        print(f"{p.id}\t{p.name}\t{p.price}\t{p.stock}")


# ─── Auth ─────────────────────────────────────────────────────────────────────
def admin_register() -> bool:
    user = input("Enter admin username: ").strip()
    pass_ = input("Enter admin password: ").strip()
    if not user or not pass_:
        print("Username/password required.")
        return False

    with db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM admin_accounts WHERE username=%s LIMIT 1", (user,))
        if cursor.fetchone():
            print("Username exists.")
            return False

        email = f"{user.lower()}@ims.local"
        suffix = 0
        while True:
            probe = email if suffix == 0 else f"{user.lower()}{suffix}@ims.local"
            cursor.execute("SELECT 1 FROM admin_accounts WHERE email=%s LIMIT 1", (probe,))
            if cursor.fetchone() is None:
                email = probe
                break
            suffix += 1

        cursor.execute(
            """
            INSERT INTO admin_accounts (username, password, first_name, last_name, email, role, is_active)
            VALUES (%s,%s,%s,%s,%s,'ADMIN',1)
            """,
            (user, pass_, user, "Admin", email),
        )
        conn.commit()

    print("Admin registered.")
    return True


def admin_login():
    user = input("Admin username: ").strip()
    pass_ = input("Admin password: ").strip()
    with db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT username FROM admin_accounts
            WHERE username=%s AND password=%s AND is_active=1
            LIMIT 1
            """,
            (user, pass_),
        )
        row = cursor.fetchone()
    if row:
        print("Admin logged in.")
        return row["username"]
    print("Invalid admin credentials.")
    return None


def customer_register() -> bool:
    user = input("Enter customer username: ").strip()
    pass_ = input("Enter customer password: ").strip()
    if not user or not pass_:
        print("Username/password required.")
        return False

    with db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM customer_accounts WHERE username=%s LIMIT 1", (user,))
        if cursor.fetchone():
            print("Username exists.")
            return False

        email = f"{user.lower()}@ims.local"
        suffix = 0
        while True:
            probe = email if suffix == 0 else f"{user.lower()}{suffix}@ims.local"
            cursor.execute("SELECT 1 FROM customer_accounts WHERE email=%s LIMIT 1", (probe,))
            if cursor.fetchone() is None:
                email = probe
                break
            suffix += 1

        cursor.execute(
            """
            INSERT INTO customer_accounts (username, password, first_name, last_name, email, is_active)
            VALUES (%s,%s,%s,%s,%s,1)
            """,
            (user, pass_, user, "Customer", email),
        )
        conn.commit()

    print("Customer registered.")
    return True


def customer_login():
    user = input("Customer username: ").strip()
    pass_ = input("Customer password: ").strip()
    with db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT username FROM customer_accounts
            WHERE username=%s AND password=%s AND is_active=1
            LIMIT 1
            """,
            (user, pass_),
        )
        row = cursor.fetchone()
    if row:
        print("Customer logged in.")
        return row["username"]
    print("Invalid customer credentials.")
    return None


# ─── Admin product actions ────────────────────────────────────────────────────
def admin_add_product():
    ok_pid, pid = parse_positive_int_text(input("Enter product id: "))
    name = input("Enter name: ").strip()
    ok_price, price = parse_non_negative_float_text(input("Enter price: "))
    ok_stock, stock = parse_non_negative_int_text(input("Enter stock: "))
    if not ok_pid or not ok_price or not ok_stock:
        print("Invalid input.")
        return

    if pid <= 0 or not name or price < 0 or stock < 0:
        print("Invalid values.")
        return

    with db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM products WHERE product_id=%s LIMIT 1", (pid,))
        if cursor.fetchone():
            print("ID exists.")
            return
        cursor.execute(
            """
            INSERT INTO products (product_id, name, price, stock, category_id)
            VALUES (%s,%s,%s,%s,NULL)
            """,
            (pid, name, price, stock),
        )
        conn.commit()
        undo_stack.append(f"DELETE,{pid}")
        print("Product added.")


def admin_delete_product():
    ok_pid, pid = parse_positive_int_text(input("Enter id to delete: "))
    if not ok_pid:
        print("Invalid input.")
        return

    p = find_product_by_id(pid)
    if not p:
        print("Not found.")
        return

    with db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM order_items WHERE product_id=%s LIMIT 1", (pid,))
        if cursor.fetchone():
            print("Cannot delete product linked to orders.")
            return
        cursor.execute("DELETE FROM products WHERE product_id=%s", (pid,))
        if cursor.rowcount == 0:
            print("Not found.")
            return
        conn.commit()
        undo_stack.append(f"ADD,{p.id},{p.name},{p.price},{p.stock}")
        print("Deleted product.")


def admin_update_product():
    ok_pid, pid = parse_positive_int_text(input("Enter id to update: "))
    if not ok_pid:
        print("Invalid input.")
        return

    old = find_product_by_id(pid)
    if not old:
        print("Not found.")
        return

    new_name = input("Enter new name: ").strip()
    ok_price, new_price = parse_non_negative_float_text(input("Enter new price: "))
    ok_stock, new_stock = parse_non_negative_int_text(input("Enter new stock: "))
    if not ok_price or not ok_stock:
        print("Invalid input.")
        return

    if not new_name or new_price < 0 or new_stock < 0:
        print("Invalid values.")
        return

    with db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE products
            SET name=%s, price=%s, stock=%s
            WHERE product_id=%s
            """,
            (new_name, new_price, new_stock, pid),
        )
        if cursor.rowcount == 0:
            print("Not found.")
            return
        conn.commit()
        undo_stack.append(f"UPDATE,{old.id},{old.name},{old.price},{old.stock}")
        print("Updated product.")


def search_product_and_push_recent():
    ok_pid, pid = parse_positive_int_text(input("Enter id to search: "))
    if not ok_pid:
        print("Invalid input.")
        return

    p = find_product_by_id(pid)
    if not p:
        print("Not found.")
        return

    print(f"Found: {p.id} {p.name} price {p.price} stock {p.stock}")
    recent_viewed_stack.append(p.id)


def perform_undo():
    if not undo_stack:
        print("Nothing to undo.")
        return

    action = undo_stack.pop()
    parts = action.split(",")
    if not parts:
        return

    with db_connection() as conn:
        cursor = conn.cursor()
        if parts[0] == "DELETE":
            ok_pid, pid = parse_positive_int_text(parts[1] if len(parts) > 1 else "")
            if not ok_pid:
                print("Unknown undo action.")
                return
            cursor.execute("DELETE FROM products WHERE product_id=%s", (pid,))
            conn.commit()
            print(f"Undo: deleted product id {pid}")

        elif parts[0] == "ADD" and len(parts) >= 5:
            ok_pid, pid = parse_positive_int_text(parts[1])
            ok_price, price = parse_non_negative_float_text(parts[3])
            ok_stock, stock = parse_non_negative_int_text(parts[4])
            if not ok_pid or not ok_price or not ok_stock:
                print("Unknown undo action.")
                return
            p = Product(pid, parts[2], price, stock)
            cursor.execute(
                """
                INSERT INTO products (product_id, name, price, stock, category_id)
                VALUES (%s,%s,%s,%s,NULL)
                """,
                (p.id, p.name, p.price, p.stock),
            )
            conn.commit()
            print(f"Undo: added back id {p.id}")

        elif parts[0] == "UPDATE" and len(parts) >= 5:
            ok_pid, pid = parse_positive_int_text(parts[1])
            ok_price, price = parse_non_negative_float_text(parts[3])
            ok_stock, stock = parse_non_negative_int_text(parts[4])
            if not ok_pid or not ok_price or not ok_stock:
                print("Unknown undo action.")
                return
            cursor.execute(
                """
                UPDATE products
                SET name=%s, price=%s, stock=%s
                WHERE product_id=%s
                """,
                (parts[2], price, stock, pid),
            )
            conn.commit()
            print(f"Undo: restored id {pid}")
        else:
            print("Unknown undo action.")


def sort_products_by_id(ascending: bool):
    # DB rows are naturally unordered; just display sorted query result
    direction = "ASC" if ascending else "DESC"
    with db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            f"SELECT product_id, name, price, stock FROM products ORDER BY product_id {direction}"
        )
        rows = cursor.fetchall()

    print_header(f"Products sorted by id {'ascending' if ascending else 'descending'}")
    if not rows:
        print("No products.")
        return
    print("ID\tName\tPrice\tStock")
    for r in rows:
        print(f"{r['product_id']}\t{r['name']}\t{decimal_to_float(r['price'])}\t{r['stock']}")


# ─── Orders ───────────────────────────────────────────────────────────────────
def fetch_order_items(order_id):
    with db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT product_id, qty, unit_price, product_name
            FROM order_items
            WHERE order_id=%s
            ORDER BY product_id ASC
            """,
            (order_id,),
        )
        rows = cursor.fetchall()
    return [
        OrderItem(
            product_id=r["product_id"],
            name=r["product_name"],
            qty=r["qty"],
            unit_price=decimal_to_float(r["unit_price"]),
        )
        for r in rows
    ]


def admin_view_orders():
    with db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT order_id, customer_name, total_amount, status,
                   DATE_FORMAT(datetime,'%%Y-%%m-%%d %%H:%%i:%%s') AS dt
            FROM orders
            WHERE status='PENDING'
            ORDER BY order_id ASC
            """
        )
        rows = cursor.fetchall()

    if not rows:
        print("No pending orders in queue.")
        return

    print_header("Pending Orders")
    for r in rows:
        print(
            f"Order ID: {r['order_id']} Customer: {r['customer_name']} "
            f"Total: {decimal_to_float(r['total_amount'])} "
            f"Status: {r['status']} Time: {r['dt']}"
        )
        items = fetch_order_items(r["order_id"])
        for it in items:
            print(f"  Item: {it.product_id} {it.name} x{it.qty} @ {it.unit_price}")


def admin_process_next_order(admin_user: str):
    with db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT order_id
            FROM orders
            WHERE status='PENDING'
            ORDER BY order_id ASC
            LIMIT 1
            """
        )
        row = cursor.fetchone()
        if not row:
            print("No pending orders.")
            return

        order_id = row["order_id"]
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE orders
            SET status='PROCESSED', processed_by=%s
            WHERE order_id=%s
            """,
            (admin_user, order_id),
        )
        conn.commit()
        print(f"Processed Order ID: {order_id}")


def generate_reports():
    with db_connection() as conn:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT product_id, name, price, stock FROM products ORDER BY product_id")
        products = cursor.fetchall()

        cursor.execute(
            """
            SELECT oi.product_id, oi.qty, (oi.qty * oi.unit_price) AS total,
                   DATE_FORMAT(o.datetime,'%%Y-%%m-%%d %%H:%%i:%%s') AS dt
            FROM order_items oi
            JOIN orders o ON o.order_id = oi.order_id
            ORDER BY o.order_id DESC, oi.product_id ASC
            """
        )
        txns = cursor.fetchall()

        cursor.execute(
            """
            SELECT COALESCE(SUM(total_amount), 0) AS revenue
            FROM orders
            WHERE status IN ('PENDING','PROCESSED')
            """
        )
        revenue = decimal_to_float(cursor.fetchone()["revenue"])

    print_header("REPORTS")
    print("Products:")
    for p in products:
        print(f"{p['product_id']},{p['name']},{decimal_to_float(p['price'])},{p['stock']}")
    print("\nTransactions:")
    for t in txns:
        print(f"{t['product_id']},{t['qty']},{decimal_to_float(t['total'])},{t['dt']}")
    print(f"\nTotal Revenue: {revenue}")
    print("\nLow Stock Products (stock <= 5):")
    found = False
    for p in products:
        if p["stock"] <= 5:
            found = True
            print(f"{p['product_id']},{p['name']},{p['stock']}")
    if not found:
        print("None")


# ─── Receipt ──────────────────────────────────────────────────────────────────
def print_receipt(order_id: int):
    with db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT order_id, customer_name, total_amount,
                   DATE_FORMAT(datetime,'%%Y-%%m-%%d %%H:%%i:%%s') AS dt
            FROM orders
            WHERE order_id=%s
            """,
            (order_id,),
        )
        o = cursor.fetchone()
        if not o:
            print("Order not found for receipt.")
            return

        cursor.execute(
            """
            SELECT product_id, product_name, qty, unit_price
            FROM order_items
            WHERE order_id=%s
            ORDER BY product_id ASC
            """,
            (order_id,),
        )
        items = cursor.fetchall()

    subtotal = decimal_to_float(o["total_amount"])
    tax = subtotal * 0.05
    now = datetime.now()

    print("\n  _                     _")
    print(" | |                   (_)")
    print(" | |     __ _ _ __ _ __ _  __ _  __ _ _ __")
    print(" | |    / _` | '__| '__| |/ _` |/ _` | '_ \\")
    print(" | |___| (_| | |  | |  | | (_| | (_| | | | |")
    print(" |______\\__,_|_|  |_|  |_|\\__, |\\__,_|_| |_|")
    print("                           __/ |")
    print("                          |___/")
    print("----------------------------------------------")
    print(f"Date: {now.strftime('%d-%m-%Y')}    Time: {now.strftime('%H:%M')}")
    print(f"Order ID: #{o['order_id']}  Customer: {o['customer_name']}")
    print("")
    print(f"{'ID':<5}{'Item':<15}{'Qty':<6}{'Price':<10}{'Total':<10}")
    print("---------------------------------------------")
    for it in items:
        line_total = it["qty"] * decimal_to_float(it["unit_price"])
        print(
            f"{it['product_id']:<5}{it['product_name']:<15}{it['qty']:<6}"
            f"{decimal_to_float(it['unit_price']):<10.2f}{line_total:<10.2f}"
        )
    print("-------------------------------------------")
    print(f"{'Subtotal:':<33}{subtotal:.2f}")
    print(f"{'Tax (5%):':<33}{tax:.2f}")
    print(f"{'Grand Total:':<33}{(subtotal + tax):.2f}")
    print("\nThank you for shopping!\n")


# ─── Customer shopping session ────────────────────────────────────────────────
def customer_shopping_session(customer_name: str):
    # verify customer exists/active
    with db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT customer_id
            FROM customer_accounts
            WHERE username=%s AND is_active=1
            LIMIT 1
            """,
            (customer_name,),
        )
        if cursor.fetchone() is None:
            print("Customer account not found or inactive.")
            return

    cart = []  # list of dict: {productId,name,qty,unitPrice}
    while True:
        ok_pid, pid = parse_positive_int_text(input("Enter product id to add to cart: "))
        if not ok_pid:
            print("Invalid id.")
            if input("Add more? (y/n): ").strip().lower() != "y":
                break
            continue

        p = find_product_by_id(pid)
        if not p:
            print("Product not found.")
            if input("Add more? (y/n): ").strip().lower() != "y":
                break
            continue

        print(f"Available stock: {p.stock}")
        ok_qty, qty = parse_positive_int_text(input("Enter quantity: "))
        if not ok_qty:
            print("Invalid qty.")
            if input("Add more? (y/n): ").strip().lower() != "y":
                break
            continue

        if qty <= 0:
            print("Invalid qty.")
            if input("Add more? (y/n): ").strip().lower() != "y":
                break
            continue
        if qty > p.stock:
            print("Not enough stock.")
            if input("Add more? (y/n): ").strip().lower() != "y":
                break
            continue

        existing = next((c for c in cart if c["productId"] == pid), None)
        if existing:
            if existing["qty"] + qty > p.stock:
                print("Not enough stock.")
                if input("Add more? (y/n): ").strip().lower() != "y":
                    break
                continue
            existing["qty"] += qty
        else:
            cart.append(
                {
                    "productId": p.id,
                    "name": p.name,
                    "qty": qty,
                    "unitPrice": p.price,
                }
            )

        print("Added to cart.")
        if input("Add more? (y/n): ").strip().lower() != "y":
            break

    if not cart:
        print("No items in order.")
        return

    with db_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        subtotal = 0.0

        # validate + lock stock
        for c in cart:
            cursor.execute(
                """
                SELECT product_id, name, price, stock
                FROM products
                WHERE product_id=%s
                FOR UPDATE
                """,
                (c["productId"],),
            )
            row = cursor.fetchone()
            if not row:
                conn.rollback()
                print(f"Product #{c['productId']} not found during checkout.")
                return
            if c["qty"] > row["stock"]:
                conn.rollback()
                print(f"Not enough stock for {row['name']}.")
                return
            c["name"] = row["name"]
            c["unitPrice"] = decimal_to_float(row["price"])
            subtotal += c["qty"] * c["unitPrice"]

        # create order
        c2 = conn.cursor()
        c2.execute(
            """
            INSERT INTO orders (customer_name, total_amount, status)
            VALUES (%s,%s,'PENDING')
            """,
            (customer_name, subtotal),
        )
        order_id = c2.lastrowid

        # items + stock update
        for c in cart:
            c2.execute(
                """
                INSERT INTO order_items (order_id, product_id, qty, unit_price, product_name)
                VALUES (%s,%s,%s,%s,%s)
                """,
                (order_id, c["productId"], c["qty"], c["unitPrice"], c["name"]),
            )
            c2.execute(
                "UPDATE products SET stock = stock - %s WHERE product_id = %s",
                (c["qty"], c["productId"]),
            )

        conn.commit()

    print(f"Order placed successfully. Order ID: {order_id}")
    print_receipt(order_id)


# ─── Recently viewed ──────────────────────────────────────────────────────────
def show_recent_viewed():
    if not recent_viewed_stack:
        print("No recently viewed items.")
        return
    print_header("Recently Viewed")
    for pid in reversed(recent_viewed_stack):
        print(f"Product ID: {pid}")


# ─── Menus ────────────────────────────────────────────────────────────────────
def print_main_menu():
    print_header("IMS MAIN MENU")
    print("1. Admin Login\n2. Admin Register\n3. Customer Login\n"
          "4. Customer Register\n5. Exit")


def admin_menu(admin_user: str):
    while True:
        print_header("ADMIN MENU")
        print(f"Welcome admin: {admin_user}")
        print("1. Add Product\n2. Update Product\n3. Delete Product\n"
              "4. Search Product\n5. List Products\n6. Sort Products by ID Asc\n"
              "7. Sort Products by ID Desc\n8. View Pending Orders\n"
              "9. Process Next Order\n10. Generate Reports\n"
              "11. Undo Last Action\n0. Logout")
        ok_choice, choice = parse_non_negative_int_text(input("Choice: "))
        if not ok_choice:
            print("Invalid choice.")
            continue

        if choice == 1:
            admin_add_product()
        elif choice == 2:
            admin_update_product()
        elif choice == 3:
            admin_delete_product()
        elif choice == 4:
            search_product_and_push_recent()
        elif choice == 5:
            show_all_products()
        elif choice == 6:
            sort_products_by_id(True)
        elif choice == 7:
            sort_products_by_id(False)
        elif choice == 8:
            admin_view_orders()
        elif choice == 9:
            admin_process_next_order(admin_user)
        elif choice == 10:
            generate_reports()
        elif choice == 11:
            perform_undo()
        elif choice == 0:
            print("Logging out admin.")
            break
        else:
            print("Invalid choice.")


def customer_menu(customer_user: str):
    while True:
        print_header("CUSTOMER MENU")
        print(f"Welcome customer: {customer_user}")
        print("1. View Products\n2. Search Product\n3. Shop (create order)\n"
              "4. View Recently Viewed\n5. View My Orders (history)\n0. Logout")
        ok_choice, choice = parse_non_negative_int_text(input("Choice: "))
        if not ok_choice:
            print("Invalid choice.")
            continue

        if choice == 1:
            show_all_products()
        elif choice == 2:
            search_product_and_push_recent()
        elif choice == 3:
            customer_shopping_session(customer_user)
        elif choice == 4:
            show_recent_viewed()
        elif choice == 5:
            print_header("MY ORDERS")
            with db_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(
                    """
                    SELECT order_id, total_amount, status,
                           DATE_FORMAT(datetime,'%%Y-%%m-%%d %%H:%%i:%%s') AS dt
                    FROM orders
                    WHERE customer_name=%s
                    ORDER BY order_id DESC
                    """,
                    (customer_user,),
                )
                orders = cursor.fetchall()

                if not orders:
                    print("No orders found for you.")
                else:
                    for o in orders:
                        print(
                            f"OrderID: {o['order_id']}  Total: {decimal_to_float(o['total_amount'])}  "
                            f"Status: {o['status']}  Time: {o['dt']}"
                        )
                        cursor.execute(
                            """
                            SELECT product_id, product_name, qty
                            FROM order_items
                            WHERE order_id=%s
                            ORDER BY product_id
                            """,
                            (o["order_id"],),
                        )
                        items = cursor.fetchall()
                        for it in items:
                            print(f"  Item: {it['product_id']} {it['product_name']} x{it['qty']}")
        elif choice == 0:
            print("Logging out customer.")
            break
        else:
            print("Invalid choice.")


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    ensure_schema()

    while True:
        print_main_menu()
        ok_choice, choice = parse_non_negative_int_text(input("Enter choice: "))
        if not ok_choice:
            print("Invalid selection.")
            continue

        if choice == 1:
            user = admin_login()
            if user:
                admin_menu(user)
        elif choice == 2:
            admin_register()
        elif choice == 3:
            user = customer_login()
            if user:
                customer_menu(user)
        elif choice == 4:
            customer_register()
        elif choice == 5:
            print("Exiting...")
            break
        else:
            print("Invalid selection.")

    print("Goodbye.")


if __name__ == "__main__":
    main()

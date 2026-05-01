
import mysql.connector
from mysql.connector import Error

def test_connection(user, password):
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user=user,
            password=password
        )
        if conn.is_connected():
            print(f"Successfully connected with {user}:{password}")
            conn.close()
            return True
    except Error as e:
        print(f"Failed to connect with {user}:{password} - {e}")
    return False

passwords = ["", "root", "password", "123456", "admin", "ims123"]
for pwd in passwords:
    if test_connection("root", pwd):
        break

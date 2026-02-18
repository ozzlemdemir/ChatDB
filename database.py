import psycopg2

def get_connection():
    conn = psycopg2.connect(
        host="localhost",
        database="ChatDB",
        user="postgres",
        password="samsun55"
    )
    return conn

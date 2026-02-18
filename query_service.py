from database import get_connection

def run_query(sql: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(sql)

    try:
        result = cursor.fetchall()
    except:
        result = "Query executed."

    conn.commit()
    cursor.close()
    conn.close()

    return result

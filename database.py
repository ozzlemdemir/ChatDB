import psycopg2
import os
from dotenv import load_dotenv

# .env dosyasındaki bilgileri yükle
load_dotenv()

def get_connection(host, port, dbname, user, password):
    """
    Kullanıcının girdiği bilgilerle PostgreSQL'e bağlanır.
    Bağlantı başarılıysa connection objesi döner, hata varsa exception fırlatır.
    """
    conn = psycopg2.connect(
        host=host,
        port=port,
        dbname=dbname,
        user=user,
        password=password
    )
    return conn


def get_schema(conn):
    """
    Bağlı olunan veritabanındaki tüm tabloların yapısını otomatik çeker.
    information_schema PostgreSQL'in kendi iç tablosu, tüm tablo/kolon bilgilerini tutar.
    Her tablo için CREATE TABLE ifadesi oluşturur ve modele gönderilecek şemayı hazırlar.
    """
    cursor = conn.cursor()

    # Tüm tablo ve kolon bilgilerini çek
    cursor.execute("""
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
    """)

    rows = cursor.fetchall()
    cursor.close()

    # Gelen satırları tablo bazında grupla
    tables = {}
    for table_name, column_name, data_type in rows:
        if table_name not in tables:
            tables[table_name] = []
        tables[table_name].append(f"{column_name.lower()} {data_type.upper()}")

    # Her tablo için CREATE TABLE ifadesi oluştur
    schema_parts = []
    for table_name, columns in tables.items():
        cols = ", ".join(columns)
        schema_parts.append(f"CREATE TABLE {table_name} ({cols});")

    # Tüm tabloları birleştir
    schema = "\n".join(schema_parts)
    return schema


def run_query(conn, sql):
    """
    Modelin ürettiği SQL sorgusunu veritabanında çalıştırır.
    SELECT sorguları için sonuçları döner.
    Hata olursa hata mesajını döner.
    """
    try:
        cursor = conn.cursor()
        cursor.execute(sql)

        # SELECT sorgusu ise sonuçları al
        if sql.strip().upper().startswith("SELECT"):
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return {"columns": columns, "rows": rows}
        else:
            conn.commit()
            cursor.close()
            return {"message": "Sorgu başarıyla çalıştırıldı."}

    except Exception as e:
        return {"error": str(e)}
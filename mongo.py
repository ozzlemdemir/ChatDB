from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB bağlantısı
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "chatdb")

# Global client ve db nesneleri
client = None
db = None

async def connect_mongo():
    """
    Uygulama başladığında MongoDB'ye bağlanır.
    Motor async çalıştığı için async fonksiyon.
    """
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[MONGO_DB]
    print(f"MongoDB bağlandı: {MONGO_DB}")

async def close_mongo():
    """
    Uygulama kapanırken bağlantıyı kapatır.
    """
    global client
    if client:
        client.close()
        print("MongoDB bağlantısı kapatıldı.")

def get_users_collection():
    """Kullanıcılar koleksiyonu"""
    return db["users"]

def get_conversations_collection():
    """Sohbet geçmişleri koleksiyonu"""
    return db["conversations"]

def get_connections_collection():
    """Kullanıcıların kaydettiği DB bağlantıları"""
    return db["db_connections"]
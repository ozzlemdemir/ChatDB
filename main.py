from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
from datetime import datetime
from bson import ObjectId
import os

from database import get_connection, get_schema, run_query
from model import load_model, generate_sql
from mongo import connect_mongo, close_mongo, get_conversations_collection, get_connections_collection
from auth import router as auth_router, get_current_user

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_mongo()
    print("Model yükleniyor...")
    load_model()
    yield
    await close_mongo()

app = FastAPI(title="ChatDB API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/ui")
def ui():
    return FileResponse("static/index.html")

class DBConnection(BaseModel):
    host: str
    port: int = 5432
    dbname: str
    user: str
    password: str

class QueryRequest(BaseModel):
    question: str
    host: str
    port: int = 5432
    dbname: str
    user: str
    password: str
    conversation_id: str = None

class SaveConnectionRequest(BaseModel):
    name: str
    host: str
    port: int = 5432
    dbname: str
    user: str
    password: str

@app.get("/")
def root():
    return {"message": "ChatDB API v2 çalışıyor!"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/test-connection")
def test_connection(db: DBConnection):
    try:
        conn = get_connection(db.host, db.port, db.dbname, db.user, db.password)
        conn.close()
        return {"success": True, "message": "Bağlantı başarılı!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Bağlantı hatası: {str(e)}")

@app.post("/query")
async def query(request: QueryRequest, current_user = Depends(get_current_user)):
    try:
        conn = get_connection(request.host, request.port, request.dbname, request.user, request.password)
        schema = get_schema(conn)
        sql = generate_sql(schema, request.question)
        result = run_query(conn, sql)
        conn.close()

        conversations = get_conversations_collection()
        user_id = str(current_user["_id"])

        message = {
            "question": request.question,
            "sql": sql,
            "result": result,
            "timestamp": datetime.utcnow()
        }

        conv_id = request.conversation_id
        if conv_id:
            await conversations.update_one(
                {"_id": ObjectId(conv_id), "user_id": user_id},
                {"$push": {"messages": message}}
            )
        else:
            new_conv = {
                "user_id": user_id,
                "title": request.question[:50],
                "db_name": request.dbname,
                "created_at": datetime.utcnow(),
                "messages": [message]
            }
            ins = await conversations.insert_one(new_conv)
            conv_id = str(ins.inserted_id)

        return {"question": request.question, "sql": sql, "result": result, "conversation_id": conv_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations")
async def get_conversations(current_user = Depends(get_current_user)):
    conversations = get_conversations_collection()
    user_id = str(current_user["_id"])
    cursor = conversations.find({"user_id": user_id}, {"title": 1, "db_name": 1, "created_at": 1}).sort("created_at", -1)
    result = []
    async for conv in cursor:
        result.append({"id": str(conv["_id"]), "title": conv["title"], "db_name": conv.get("db_name", ""), "created_at": conv["created_at"]})
    return result

@app.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, current_user = Depends(get_current_user)):
    conversations = get_conversations_collection()
    user_id = str(current_user["_id"])
    conv = await conversations.find_one({"_id": ObjectId(conversation_id), "user_id": user_id})
    if not conv:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadı")
    conv["id"] = str(conv["_id"])
    del conv["_id"]
    for msg in conv.get("messages", []):
        if "timestamp" in msg:
            msg["timestamp"] = msg["timestamp"].isoformat()
    return conv

@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, current_user = Depends(get_current_user)):
    conversations = get_conversations_collection()
    user_id = str(current_user["_id"])
    result = await conversations.delete_one({"_id": ObjectId(conversation_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadı")
    return {"message": "Sohbet silindi"}

@app.post("/connections/save")
async def save_connection(request: SaveConnectionRequest, current_user = Depends(get_current_user)):
    connections = get_connections_collection()
    user_id = str(current_user["_id"])
    connection = {"user_id": user_id, "name": request.name, "host": request.host, "port": request.port, "dbname": request.dbname, "user": request.user, "password": request.password, "created_at": datetime.utcnow()}
    result = await connections.insert_one(connection)
    return {"id": str(result.inserted_id), "message": "Bağlantı kaydedildi"}

@app.get("/connections")
async def get_connections(current_user = Depends(get_current_user)):
    connections = get_connections_collection()
    user_id = str(current_user["_id"])
    cursor = connections.find({"user_id": user_id}, {"password": 0})
    result = []
    async for conn in cursor:
        conn["id"] = str(conn["_id"])
        del conn["_id"]
        result.append(conn)
    return result
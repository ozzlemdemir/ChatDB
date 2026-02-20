from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
from database import get_connection, get_schema, run_query
from model import load_model, generate_sql
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
  
    print("Uygulama başlatılıyor, model yükleniyor...")
    load_model()
    yield
    print("Uygulama kapanıyor...")


app = FastAPI(
    title="ChatDB API",
    description="Doğal dil sorularını SQL'e çeviren API",
    version="1.0.0",
    lifespan=lifespan
)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/ui")
def ui():
    return FileResponse("static/index.html")
# ── CORS AYARI ──────────────────────────────────────
# React frontend'in bu API'ye istek atabilmesi için gerekli
# Geliştirme aşamasında tüm kaynaklara izin veriyoruz
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



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



@app.get("/")
def root():
    #API'nin çalıştığını kontrol etme endpoint
    return {"message": "ChatDB API çalışıyor!"}


@app.post("/test-connection")
def test_connection(db: DBConnection):
    
    #Kullanıcının girdiği bağlantı bilgilerini test eder.
    try:
        conn = get_connection(db.host, db.port, db.dbname, db.user, db.password)
        conn.close()
        return {"success": True, "message": "Bağlantı başarılı!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Bağlantı hatası: {str(e)}")



@app.post("/query")
def query(request: QueryRequest):

    try:
        conn = get_connection(
            request.host,
            request.port,
            request.dbname,
            request.user,
            request.password
        )

        schema = get_schema(conn)
        sql = generate_sql(schema, request.question)
        result = run_query(conn, sql)
        conn.close()

        return {
            "question": request.question,
            "sql": sql,
            "result": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    """Sistem sağlık kontrolü"""
    return {"status": "ok"}
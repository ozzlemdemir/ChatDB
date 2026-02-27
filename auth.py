from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from bson import ObjectId
import os
from dotenv import load_dotenv
from mongo import get_users_collection

load_dotenv()

# ── AYARLAR ──────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "gizli_anahtar")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 saat

# ── ŞİFRE HASHLEME ───────────────────────────────────
# bcrypt algoritmasıyla şifreleri hashler
# Düz metin şifre asla veritabanına kaydedilmez


# ── JWT TOKEN ─────────────────────────────────────────
# Authorization header'dan token alır
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ── VERİ MODELLERİ ───────────────────────────────────
class RegisterRequest(BaseModel):
    """Kayıt isteği için gerekli alanlar"""
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    """Giriş isteği için gerekli alanlar"""
    email: str
    password: str

class UserResponse(BaseModel):
    """Kullanıcıya döndürülecek bilgiler"""
    id: str
    username: str
    email: str

# ── YARDIMCI FONKSİYONLAR ────────────────────────────
def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )

def create_access_token(data: dict) -> str:
    """
    JWT token üretir.
    Token içinde kullanıcı ID'si ve son kullanma tarihi bulunur.
    SECRET_KEY ile imzalanır, değiştirilirse geçersiz olur.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Her korumalı endpoint'te çalışır.
    Token'ı doğrular, kullanıcıyı döndürür.
    Token geçersizse 401 hatası fırlatır.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Geçersiz token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token")

    users = get_users_collection()
    user = await users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
    return user

# ── ROUTER ───────────────────────────────────────────
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
async def register(request: RegisterRequest):
    """
    Yeni kullanıcı kaydı.
    1. Email daha önce kullanılmış mı kontrol et
    2. Şifreyi hashle
    3. MongoDB'ye kaydet
    4. Token döndür
    """
    users = get_users_collection()

    # Email kontrolü
    existing = await users.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")

    # Kullanıcıyı oluştur
    user = {
        "username": request.username,
        "email": request.email,
        "password": hash_password(request.password),  # Şifreyi hashle
        "created_at": datetime.utcnow()
    }

    # MongoDB'ye kaydet
    result = await users.insert_one(user)
    user_id = str(result.inserted_id)

    # Token üret ve döndür
    token = create_access_token({"sub": user_id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "username": request.username,
            "email": request.email
        }
    }

@router.post("/login")
async def login(request: LoginRequest):
    """
    Kullanıcı girişi.
    1. Email ile kullanıcıyı bul
    2. Şifreyi doğrula
    3. Token döndür
    """
    users = get_users_collection()

    # Kullanıcıyı bul
    user = await users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=401, detail="Email veya şifre hatalı")

    # Şifreyi doğrula
    if not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email veya şifre hatalı")

    # Token üret
    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "username": user["username"],
            "email": user["email"]
        }
    }

@router.get("/me")
async def get_me(current_user = Depends(get_current_user)):
    """
    Giriş yapmış kullanıcının bilgilerini döndürür.
    Token gerektirir.
    """
    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user["email"]
    }
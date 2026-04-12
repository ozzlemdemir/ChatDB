# 🚀 ChatDB — Doğal Dil ile Veritabanı Sorgulama

SQL bilmeden veritabanınızla konuşun.
ChatDB, kullanıcıların doğal dilde soru sorarak SQL sorguları oluşturmasını ve çalıştırmasını sağlayan bir yapay zeka destekli sistemdir.

---

## 🧠 Proje Amacı

Bu projenin hedefi:

* SQL bilmeyen kullanıcıların veri sorgulamasını kolaylaştırmak
* Doğal dil → SQL dönüşümünü otomatik hale getirmek
* Modern bir arayüz ile kullanıcı deneyimini artırmak

---

## 🗂️ Veri Seti

* HuggingFace: `djagatiya/synthetic_text_to_sql_d14`
* 6.713 İngilizce örnek
* +63 adet Türkçe özel veri (etkinlik yönetim sistemi)

**Toplam:** 6.776 örnek

---

## 🤖 Model Eğitimi

* **Base Model:** `defog/sqlcoder-7b-2`
* **Yöntem:** QLoRA (4-bit quantization)
* **Platform:** Google Colab (T4 GPU)

📉 Eğitim sonucu:

* Loss: **0.88 → 0.31**

📦 Eğitilen model:

* LoRA adaptör boyutu: **~8MB**

---

## ⚙️ Sistem Mimarisi

```
React (Frontend)
        ↓
FastAPI (Backend)
        ↓
MongoDB + PostgreSQL
        ↓
LLM Model (SQL üretimi)
```

## 📸 Uygulama Görselleri

### 🔹 Ana Sohbet Ekranı

![Chat Screen](C:\Users\Lenovo\Desktop\ChatDB\chatdb-frontend\photos\chat.png)

### 🔹 Veritabanı Bağlantı Paneli

![DB Connection](C:\Users\Lenovo\Desktop\ChatDB\chatdb-frontend\photos\Dashboard.png)

### 🔹 Profil Ayarları

![Profile](C:\Users\Lenovo\Desktop\ChatDB\chatdb-frontend\photos\profile.png)

---

## ✅ Mevcut Özellikler

* ✔ Kullanıcı kayıt & giriş
* ✔ JWT Authentication
* ✔ Doğal dil → SQL dönüşümü
* ✔ PostgreSQL sorgu çalıştırma
* ✔ MongoDB sohbet kaydı
* ✔ React arayüz



## 🛠️ Kurulum

### 1. Backend

```bash
cd ChatDB
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Frontend

```bash
cd chatdb-frontend
npm install
npm start
```

---

## 🔐 Teknolojiler

* FastAPI
* React
* PostgreSQL
* MongoDB
* HuggingFace Transformers
* LoRA / QLoRA


## 👩‍💻 Geliştirici

**Özlem Demir**

---

⭐ Beğendiyseniz repo'ya star vermeyi unutmayın!

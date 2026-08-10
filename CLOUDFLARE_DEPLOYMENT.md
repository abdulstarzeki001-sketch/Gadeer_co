# 🚀 دليل نشر Cloudflare Pages

## نظرة عامة
تطبيقك **جاهز للنشر** على Cloudflare Pages مع نشر تلقائي من GitHub!

---

## 📋 خطوات الإعداد السريعة

### 1️⃣ إنشاء حساب Cloudflare
- اذهب إلى [cloudflare.com](https://www.cloudflare.com)
- اضغط "Sign Up"

### 2️⃣ الحصول على API Token
1. في Cloudflare Dashboard → **My Profile** → **API Tokens**
2. اضغط **Create Token** → **Create Custom Token**
3. أضف الصلاحيات:
   - ✅ `Account.Pages - Edit`
   - ✅ `Account.Workers - Edit`
4. انسخ الـ Token

### 3️⃣ الحصول على Account ID
- في Cloudflare Dashboard الصفحة الرئيسية
- انسخ **Account ID** من الأسفل

### 4️⃣ إضافة GitHub Secrets
اذهب إلى: `https://github.com/abdulstarzeki001-sketch/Gadeer_co/settings/secrets/actions`

أضف:
```
CLOUDFLARE_API_TOKEN = [Token من Cloudflare]
CLOUDFLARE_ACCOUNT_ID = [Account ID من Cloudflare]
VITE_SUPABASE_URL = [من مشروعك]
VITE_SUPABASE_ANON_KEY = [من مشروعك]
VITE_API_URL = https://your-api.example.com
```

### 5️⃣ إنشاء مشروع Cloudflare Pages
1. في Cloudflare Dashboard → **Pages**
2. اضغط **Create a project**
3. اختر **Connect to Git**
4. اختر `Gadeer_co`
5. البناء والنشر:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
6. اضغط **Deploy**

---

## 🚀 النشر التلقائي

بعد الإعداد، سيتم النشر تلقائياً عند:
- ✅ Push إلى `main`
- ✅ فتح PR

### رابطك الدائمي:
```
https://gadeer-co.pages.dev
```

---

## 📝 الأوامر

```bash
npm run dev          # تطوير محلي
npm run build        # بناء
npm run preview      # معاينة
npm run deploy       # نشر يدوي
```

---

## ✅ تم!

تطبيقك الآن **منشور على Cloudflare** مع نشر تلقائي! 🎉

الرابط الدائمي: **`https://gadeer-co.pages.dev`**
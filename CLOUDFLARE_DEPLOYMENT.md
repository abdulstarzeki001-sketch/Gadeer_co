# 🚀 دليل النشر على gadee.pages.dev

## نظرة عامة
التطبيق مبني بـ TanStack Start وNitro ويُنشر إلى مشروع Cloudflare Pages باسم `gadee` مع Pages Functions لدعم SSR.

---

## 📋 خطوات الإعداد السريعة

### 1️⃣ إنشاء حساب Cloudflare
- اذهب إلى [cloudflare.com](https://www.cloudflare.com)
- اضغط "Sign Up"

### 2️⃣ الحصول على API Token
1. في Cloudflare Dashboard → **My Profile** → **API Tokens**
2. اضغط **Create Token** → **Create Custom Token**
3. أضف الصلاحيات:
   - ✅ `Account.Cloudflare Pages - Edit`
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

### 5️⃣ النشر
شغّل GitHub Actions يدوياً من workflow المسمى **Deploy to gadee.pages.dev**، أو ادفع التغييرات إلى فرع `main`. يستخدم البناء `cloudflare-pages` وينشر مجلد `dist` إلى مشروع `gadee`.

---

## 🚀 النشر التلقائي

بعد الإعداد، سيتم النشر تلقائياً عند:
- ✅ Push إلى `main`

### رابطك الدائمي:
```
https://gadee.pages.dev
```

---

## 📝 الأوامر

```bash
npm run dev          # تطوير محلي
npm run build        # بناء
npm run preview      # معاينة
npm run deploy       # نشر يدوي
npm run deploy:pages # نشر مباشر إلى gadee.pages.dev
```

---

## ✅ تم!

تطبيقك الآن **منشور على Cloudflare** مع نشر تلقائي! 🎉

يعرض Wrangler رابط النشر بعد نجاح العملية، ويكون الرابط الرئيسي `https://gadee.pages.dev`.

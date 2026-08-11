# 🚀 دليل النشر على Cloudflare Workers

## نظرة عامة
التطبيق مبني بـ TanStack Start وNitro ويُنشر كـ **Cloudflare Worker** مع أصول ثابتة، وليس كمشروع Pages ثابت.

---

## 📋 خطوات الإعداد السريعة

### 1️⃣ إنشاء حساب Cloudflare
- اذهب إلى [cloudflare.com](https://www.cloudflare.com)
- اضغط "Sign Up"

### 2️⃣ الحصول على API Token
1. في Cloudflare Dashboard → **My Profile** → **API Tokens**
2. اضغط **Create Token** → **Create Custom Token**
3. أضف الصلاحيات:
   - ✅ `Account.Workers Scripts - Edit`
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
شغّل GitHub Actions يدوياً من workflow المسمى **Deploy to Cloudflare Workers**، أو ادفع التغييرات إلى فرع `main`. يقوم Nitro بإنشاء إعداد Worker الصحيح في `.output/server/wrangler.json` ثم ينشره Wrangler.

---

## 🚀 النشر التلقائي

بعد الإعداد، سيتم النشر تلقائياً عند:
- ✅ Push إلى `main`

### رابطك الدائمي:
```
https://gadeer-co.<cloudflare-subdomain>.workers.dev
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

يعرض Wrangler رابط `workers.dev` الفعلي بعد نجاح النشر. يمكن بعد ذلك إضافة نطاق مخصص من إعدادات Worker في Cloudflare Dashboard.

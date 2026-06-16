
# خطة المشروع: منصة المنتج المحلي - الهيئة العامة للكمارك

## المرحلة 1: تفعيل Lovable Cloud وإعداد قاعدة البيانات

تفعيل Cloud وإنشاء الجداول الأساسية (migration واحد):
- `companies` — الشركات (companyName, licenseNumber, specialization, governorate, address, phone, email)
- `documents` — الوثائق (جميع حقول schema المرفق + documentNumber فريد + qrCodeData)
- `document_items` — مواد كل وثيقة
- `transactions` — حركات حسابية للشركات
- `user_roles` + enum `app_role` + `has_role()` — للحماية

RLS: قراءة وكتابة للـ authenticated، قراءة عامة لـ documents/items فقط عند التحقق برقم الوثيقة (للـ QR).

استيراد أولي: تشغيل seed migration يقرأ شركات من ملف JSON المرفوع ويدخل أول 200 شركة بشكل آلي (الباقي يبقى ك-JSON مستورد في الواجهة).

## المرحلة 2: المصادقة

- صفحة `/auth` (تسجيل دخول/اشتراك بالبريد + كلمة سر، Google).
- جميع الصفحات الإدارية تحت `_authenticated/`.
- المسارات العامة فقط: `/verify/:documentNumber` و `/qrpubliclink`.

## المرحلة 3: نظام التصميم (RTL عربي)

- `dir="rtl"` و `lang="ar"` في `__root.tsx`.
- خط Cairo من Google Fonts (موجود في قالب Word).
- ألوان مستوحاة من الشعار الكمركي: ذهبي/كحلي + أبيض. tokens في `styles.css` (oklch).
- Sidebar عربي بـ shadcn.

## المرحلة 4: الصفحات (تحت `_authenticated/`)

```
/                      → Dashboard (إحصائيات: عدد وثائق، شركات، قيمة)
/companies             → قائمة + إضافة/تعديل/حذف
/documents             → قائمة الوثائق + بحث
/documents/new         → فورم إنشاء وثيقة (نفس الحقول الموجودة في create-document.tsx المرفق)
/documents/$id         → عرض الوثيقة بالتصميم المطابق لقالب Word + زر طباعة/PDF
/accounting            → جدول حسابات الشركات
/accounting/$companyId → كشف حساب
```

عامة:
```
/auth                  → تسجيل/دخول
/verify                → إدخال رقم الوثيقة يدوياً
/verify/$docNumber     → عرض نتيجة التحقق (يستدعي server fn عامة)
```

## المرحلة 5: تصميم الوثيقة المطابق لـ Word

تحليل `document.xml` المرفق لاستخراج:
- ترويسة (شعار + اسم الجهة بالعربي/الإنجليزي/الكردي).
- الجداول والتخطيط بنفس الترتيب والحقول.
- الخط Cairo، النصوص RTL.

تنفيذ صفحة `document-view.tsx` كـ HTML/CSS بنفس قالب Word (A4، margins، خطوط، جداول)، مع وضع QR code في نفس الموضع. زر "طباعة" يستخدم `window.print()` مع CSS `@media print`.

## المرحلة 6: Server Functions (لا Express)

`src/lib/*.functions.ts`:
- `companies.functions.ts` — list/get/create/update/delete (authenticated)
- `documents.functions.ts` — list/get/create (مع توليد documentNumber + QR data URL)
- `verify.functions.ts` — public (بدون auth) — للتحقق من وثيقة
- `transactions.functions.ts` — list/create + كشف حساب

توليد QR: مكتبة `qrcode` (متوافقة Worker).
توليد رقم وثيقة: `YYYY-NNNNNN` تسلسلي عبر RPC أو count + 1.

## المرحلة 7: استيراد الشركات من JSON

زر "استيراد الشركات من ملف" في صفحة Companies — يقرأ JSON المرفق ويدرج الشركات المفقودة دفعة واحدة.

## التفاصيل التقنية

- TanStack Start + TanStack Query (pattern: `ensureQueryData` في loader + `useSuspenseQuery`).
- shadcn/ui للنماذج والجداول.
- لا Express، لا wouter، لا drizzle — كل شيء عبر Supabase client + server functions.
- التخزين: Lovable Cloud (Supabase).

## ما لن أنفذه إلا بطلب

- تصدير PDF من الخادم (pdfkit لا يعمل في Workers) — بدلاً عنه: طباعة المتصفح بـ `@media print`.
- لقطات شاشة من ملف customs (هذا مشروع منفصل غير مرتبط).

## ترتيب التنفيذ

1. تفعيل Cloud + migration للجداول والـ RLS.
2. Auth + layout + sidebar + design system.
3. صفحات الشركات + استيراد JSON.
4. صفحة إنشاء الوثيقة + server fn.
5. عرض الوثيقة بقالب Word + QR + طباعة.
6. التحقق العام `/verify`.
7. المحاسبة وكشف الحساب.
8. Dashboard.

هل تريد البدء؟

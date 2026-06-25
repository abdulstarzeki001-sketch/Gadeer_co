# تبسيط المشروع — وثيقة PDF فقط

الملف المرفوع (`pike.replit.dev.zip`) موقع ثابت كامل لشركة الغدير (تسجيل دخول، صفحات عميل، كشف حساب، إنشاء وصل PDF). فهمت من طلبك: **خذ فقط الجزء الخاص بإنشاء الوثيقة (`wasl.html` + `wasl.js` + `wasl-assets.js`) وطبّقه على مشروعنا الحالي، واحذف باقي الميزات.**

## ما يبقى
- `/` → نموذج إنشاء الوثيقة (نفس حقول `wasl.html`: رقم/تاريخ/توقيت الوثيقة، البحث عن شركة من `companies.json`، نقطة السيطرة، السائق، العجلة، الحمولة، الإجازة، رفع QR، زر **إنشاء الوثيقة PDF**).
- مولّد PDF بنفس قالب `wasl.js` (A4 RTL، شعار، جدول معلومات، QR، تذييل).
- ملفات الخطوط/الشعارات من `wasl-assets.js` (سننقلها كأصول).

## ما يُحذف
- كل صفحات `_authenticated/` ما عدا الجديدة: `accounting.*`, `companies.tsx`, `traders.*`, `reports.tsx`, `documents.index.tsx`, `documents.$id.tsx`, `documents.preview.tsx`.
- `auth.tsx` + بوابة `_authenticated/route.tsx` → الصفحة عامة بدون تسجيل دخول.
- `app-sidebar`, `pdf-preview-dialog`, `document-template`, جداول Supabase المرتبطة بالحسابات.
- حقلَي `waslClient`/`waslType`/`waslValue` (يحتاجان قاعدة بيانات عملاء — غير موجودة بعد التبسيط).
- workflow كلاودفلير يبقى كما هو.

## البنية الجديدة
```
src/routes/
  __root.tsx           (يبقى، يُنظَّف من روابط السايدبار)
  index.tsx            (نموذج إنشاء الوثيقة — يحلّ محل documents.new)
src/lib/
  wasl-pdf.ts          (دالة generateDocumentPdf — مأخوذة من wasl.js)
  wasl-assets.ts       (ثوابت BASE64 للشعار والخط)
src/data/
  companies.json       (يبقى — مصدر بحث الشركات)
```

## ملاحظات تقنية
- نستخدم نفس `html2canvas` + `jspdf` (كلاهما npm، نضيفهما بـ `bun add`).
- نموذج عام بدون auth → لا حاجة لـ Lovable Cloud في هذه الصفحة، لكن إعدادات Supabase تبقى في المشروع (لا نلمس `integrations/supabase/*`).
- بعد التطبيق، `routeTree.gen.ts` يُعاد توليده تلقائياً.

## تأكيد
هل توافق على حذف كل صفحات المحاسبة/التجار/التقارير/الشركات/تسجيل الدخول وإبقاء صفحة واحدة فقط لإنشاء الوثيقة؟ أو تريد إبقاء بعضها؟

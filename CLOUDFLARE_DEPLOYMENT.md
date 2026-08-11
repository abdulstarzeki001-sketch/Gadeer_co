# نشر Cloudflare Worker

هدف الإنتاج الوحيد لهذا المستودع هو Cloudflare Worker باسم `gadeer-co`:

```text
https://gadeer-co.abdulstarzeki001.workers.dev
```

## GitHub Actions secrets

أضف القيم التالية في إعدادات GitHub Actions:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

يحتاج Cloudflare API token إلى صلاحية `Workers Scripts: Edit`. يجب أيضاً إضافة
`SUPABASE_URL` و`SUPABASE_PUBLISHABLE_KEY` كمتغيرات Worker runtime من لوحة Cloudflare.
لا تستخدم service-role أو secret key في الواجهة أو إعدادات `VITE_*`.

## البناء والنشر

ينشئ Nitro ملف Worker النهائي في `.output/server/wrangler.json`، ثم ينشر workflow
هذا الملف بالأمر التالي:

```bash
npm ci
npm run build
npx wrangler deploy --config .output/server/wrangler.json
```

لا ينشر هذا المستودع إلى Cloudflare Pages، ولا يعتمد أي مشروع Pages باسم `gadee` أو
`gadeer-com` أو `gadeer-co`.

## تفعيل المستخدم المعتمد

بعد تطبيق migrations، أضف UUID غير القابل للتغيير للمستخدم المعتمد من Supabase SQL
Editor أو باستخدام service role في بيئة إدارية موثوقة:

```sql
INSERT INTO private.approved_users (user_id)
VALUES ('<approved-auth-user-uuid>')
ON CONFLICT (user_id) DO NOTHING;
```

لا تضف UUID أو كلمة مرور أو مفاتيح حقيقية إلى المستودع.

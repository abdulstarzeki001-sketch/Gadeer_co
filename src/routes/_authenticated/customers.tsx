import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowRight, Briefcase, Building2, FileText, Globe2, Info, Mail, MapPin, MapPinned, Phone, Plus, ShieldCheck, User, UserPlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({ meta: [{ title: "العملاء | لوحة التحكم" }, { name: "description", content: "صفحة إدارة العملاء وإضافة بياناتهم." }] }),
  component: CustomersPage,
});

function CustomersPage() {
  return <>
    <style>{`
      .customer-page{--bg:#f4f1ea;--surface:#fff;--surface2:#f8fafc;--text:#17233f;--muted:#667085;--line:#d9dfeb;--accent:#c9a14a;--accentText:#17233f;--shadow:0 16px 38px rgba(15,23,42,.1);width:min(100%,900px);margin:0 auto;padding:18px 14px 115px;color:var(--text)!important}
      html[data-ghadeer-theme="dark"] .customer-page{--bg:#03112b;--surface:#071a3b;--surface2:#08224a;--text:#fff;--muted:rgba(255,255,255,.7);--line:rgba(31,139,240,.42);--accent:#f0c55f;--accentText:#07142f;--shadow:0 18px 44px rgba(0,0,0,.24)}
      .customer-topbar{display:grid;grid-template-columns:46px 1fr 46px;align-items:center;min-height:68px;margin:-18px -14px 24px;padding:8px 18px;border-bottom:1px solid var(--line);background:var(--surface)!important}.customer-topbar h1{margin:0;text-align:center;font-size:clamp(1.25rem,4.8vw,1.75rem);font-weight:900;color:var(--text)!important}.customer-back{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;color:var(--accent)!important;text-decoration:none}
      .customer-hero{display:grid;grid-template-columns:108px 1fr;align-items:center;gap:18px;margin-bottom:30px;padding:26px 28px;border:1px solid var(--line);border-radius:22px;background:var(--surface)!important;box-shadow:var(--shadow)}html[data-ghadeer-theme="dark"] .customer-hero{background:radial-gradient(circle at 14% 50%,rgba(0,145,255,.22),transparent 31%),linear-gradient(135deg,#071f47,#03152f)!important}.customer-hero-icon{width:92px;height:92px;display:grid;place-items:center;border-radius:50%;color:var(--accent);border:1px solid var(--line);background:var(--surface2)!important}.customer-hero h2{margin:0 0 8px;color:var(--accent)!important;font-size:clamp(1.2rem,4.5vw,1.7rem);font-weight:900}.customer-hero p{margin:0;color:var(--muted)!important;line-height:1.9}
      .customer-section{margin-top:28px}.customer-section-title{display:flex;align-items:center;gap:12px;margin:0 0 14px;color:var(--text)!important;font-size:1.15rem;font-weight:900}.customer-section-title span{width:42px;height:42px;display:grid;place-items:center;border-radius:14px;color:var(--accent);border:1px solid var(--line);background:var(--surface2)!important}.customer-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.customer-field.full{grid-column:1/-1}.customer-field{position:relative;min-width:0;min-height:104px;padding:15px 54px 13px 16px;border:1px solid var(--line);border-radius:18px;background:var(--surface)!important;box-shadow:var(--shadow)}.customer-field-icon{position:absolute;top:50%;right:17px;transform:translateY(-50%);color:var(--muted)}.customer-field label{display:block;margin-bottom:4px;color:var(--text)!important;font-size:.91rem;font-weight:800}.required{color:#ef4444!important}.customer-field input,.customer-field select,.customer-field textarea{width:100%;min-height:40px;margin:0!important;padding:4px 0!important;border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;background:transparent!important;color:var(--text)!important;font:inherit;font-size:.98rem!important}.customer-field textarea{min-height:64px;resize:vertical}.customer-field input::placeholder,.customer-field textarea::placeholder{color:var(--muted)!important;opacity:.72}.customer-field select option{color:#111827;background:#fff}html[data-ghadeer-theme="dark"] .customer-field select option{color:#fff;background:#071a3b}.status-active{color:#16a34a!important;font-weight:900}
      .customer-actions{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(145px,.8fr);gap:14px;margin-top:28px}.customer-save,.customer-cancel{min-height:60px;display:inline-flex;align-items:center;justify-content:center;gap:10px;border-radius:16px!important;font:inherit;font-weight:900;font-size:1.05rem;cursor:pointer}.customer-save{color:var(--accentText)!important;border:1px solid var(--accent)!important;background:linear-gradient(100deg,#d9a936,#ffe082 48%,#f4c455)!important;box-shadow:0 12px 30px rgba(201,161,74,.22)!important}.customer-cancel{color:var(--text)!important;border:1px solid var(--line)!important;background:var(--surface)!important;text-decoration:none}
      @media(max-width:640px){.customer-page{padding-inline:12px}.customer-topbar{margin-inline:-12px}.customer-hero{grid-template-columns:82px 1fr;padding:22px 18px}.customer-hero-icon{width:74px;height:74px}.customer-grid{grid-template-columns:1fr 1fr;gap:12px}.customer-field{min-height:96px;padding-right:48px}.customer-actions{grid-template-columns:minmax(0,1.6fr) minmax(110px,.8fr)}}@media(max-width:390px){.customer-hero{grid-template-columns:1fr;text-align:center}.customer-hero-icon{margin:0 auto}.customer-grid,.customer-actions{grid-template-columns:1fr}.customer-field{grid-column:1/-1}}
    `}</style>
    <div className="customer-page">
      <header className="customer-topbar"><Link to="/" className="customer-back"><ArrowRight size={28}/></Link><h1>إضافة عميل جديد</h1><span/></header>
      <section className="customer-hero"><div className="customer-hero-icon"><UserPlus size={48}/></div><div><h2>عميل جديد.. شراكة أقوى</h2><p>أضف عميلك الآن وابدأ بتنظيم معاملاته بشكل احترافي وسهل.</p></div></section>
      <form onSubmit={(e)=>e.preventDefault()}>
        <section className="customer-section"><h2 className="customer-section-title"><span><User size={22}/></span>بيانات العميل</h2><div className="customer-grid">
          <Field icon={<Building2 size={25}/>} label="اسم العميل / الشركة" required full><input placeholder="أدخل اسم العميل أو اسم الشركة" required/></Field>
          <Field icon={<Briefcase size={25}/>} label="نوع العميل" required full><select defaultValue="" required><option value="" disabled>اختر نوع العميل</option><option>فرد</option><option>شركة</option><option>تاجر</option></select></Field>
          <Field icon={<Phone size={25}/>} label="رقم الهاتف" required><input type="tel" placeholder="07xxxxxxxxx" required/></Field><Field icon={<Mail size={25}/>} label="البريد الإلكتروني"><input type="email" placeholder="example@email.com"/></Field>
          <Field icon={<MapPin size={25}/>} label="العنوان" full><input placeholder="أدخل عنوان العميل"/></Field><Field icon={<FileText size={25}/>} label="ملاحظات (اختياري)" full><textarea placeholder="أي ملاحظات إضافية حول العميل"/></Field>
        </div></section>
        <section className="customer-section"><h2 className="customer-section-title"><span><Info size={22}/></span>معلومات إضافية</h2><div className="customer-grid">
          <Field icon={<MapPinned size={25}/>} label="المدينة"><select defaultValue=""><option value="" disabled>اختر المدينة</option><option>زاخو</option><option>دهوك</option><option>أربيل</option><option>بغداد</option></select></Field>
          <Field icon={<Globe2 size={25}/>} label="الدولة"><select defaultValue=""><option value="" disabled>اختر الدولة</option><option>العراق</option><option>تركيا</option></select></Field>
          <Field icon={<ShieldCheck size={25}/>} label="حالة العميل" full><select defaultValue="نشط" className="status-active"><option>نشط</option><option>غير نشط</option></select></Field>
        </div></section>
        <div className="customer-actions"><button type="submit" className="customer-save"><Plus size={25}/>حفظ العميل</button><Link to="/" className="customer-cancel">إلغاء</Link></div>
      </form>
    </div>
  </>;
}

function Field({icon,label,required,full,children}:{icon:ReactNode;label:string;required?:boolean;full?:boolean;children:ReactNode}){return <div className={`customer-field${full?" full":""}`}><span className="customer-field-icon">{icon}</span><label>{label} {required?<b className="required">*</b>:null}</label>{children}</div>}

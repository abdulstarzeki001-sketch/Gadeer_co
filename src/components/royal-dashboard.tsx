import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Users, FileText, Wallet, ArrowDownToLine, Package, BarChart3, ChevronLeft, CalendarDays, Search, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { activeCustomers, activeTransactions } from "@/lib/customer-trash";
import { isDebtIncrease, ledgerAmount } from "@/lib/customer-ledger";
import { collectionDescription, readDetails, detailText } from "@/lib/customer-statement";

type Movement = { id: string; trader_id: string | null; type: string; amount: number; created_at: string; document_number: string | null; description: string | null; cargo_typedetails: string | null };
type Customer = { id: string; name: string };
const money = (value: number) => new Intl.NumberFormat("en-US", {minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
const day = (value: string) => new Intl.DateTimeFormat("ar-IQ-u-nu-latn",{timeZone:"Asia/Baghdad",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));
const actions = [
  {to:"/customers",title:"العملاء",note:"إدارة بيانات العملاء",icon:Users},
  {to:"/wasl-select",title:"الوصولات",note:"إنشاء وصل قبض أو دخل",icon:FileText},
  {to:"/accounts",title:"كشف الحساب",note:"متابعة المعاملات والأرصدة",icon:Wallet},
  {to:"/reports",title:"التقارير",note:"كشوف حسابات العملاء",icon:BarChart3},
] as const;

export function RoyalDashboard() {
  const [customers,setCustomers]=useState<Customer[]>([]);
  const [movements,setMovements]=useState<Movement[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [query,setQuery]=useState("");
  const [refresh,setRefresh]=useState(0);
  const [signedIn,setSignedIn]=useState(true);
  useEffect(()=>{
    let cancelled=false;
    async function load(){
      setLoading(true);setError("");
      try {
        const auth=await supabase.auth.getUser();
        if(!auth.data.user){if(!cancelled){setSignedIn(false);setCustomers([]);setMovements([]);}return;}
        if(!cancelled)setSignedIn(true);
        const people:Customer[]=[];
        for(let offset=0;;offset+=500){
          const result=await activeCustomers(supabase).order("id").range(offset,offset+499);
          if(result.error)throw result.error;
          people.push(...(result.data??[]) as Customer[]);
          if((result.data??[]).length<500)break;
          if(cancelled)return;
        }
        const rows:Movement[]=[];
        for(let offset=0;;offset+=500){
          const result=await activeTransactions(supabase).order("created_at",{ascending:false}).order("id").range(offset,offset+499);
          if(result.error)throw result.error;
          rows.push(...(result.data??[]) as Movement[]);
          if((result.data??[]).length<500)break;
          if(cancelled)return;
        }
        if(!cancelled){setCustomers(people);setMovements(rows);}
      } catch {if(!cancelled){setError("تعذر تحميل المؤشرات. حاول التحديث مجدداً.");setCustomers([]);setMovements([]);}}
      finally{if(!cancelled)setLoading(false);}
    }
    void load();
    return()=>{cancelled=true;};
  },[refresh]);
  const names=useMemo(()=>new Map(customers.map(c=>[c.id,c.name])),[customers]);
  const totals=useMemo(()=>{
    let due=0,received=0;
    for(const item of movements){
      const cents=Math.round(ledgerAmount(item.amount)*100);
      if(isDebtIncrease(item.type))due+=cents;else received+=cents;
    }
    return {due:due/100,received:received/100,balance:(due-received)/100};
  },[movements]);
  const recent=useMemo(()=>{
    const q=query.trim().toLowerCase();
    return movements.filter(item=>!q||[names.get(item.trader_id??""),item.document_number,item.description,item.cargo_typedetails].some(value=>value?.toLowerCase().includes(q))).slice(0,8);
  },[movements,names,query]);
  const months=useMemo(()=>{
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Baghdad",year:"numeric",month:"numeric"}).formatToParts(new Date());
    const current=new Date(Number(parts.find(p=>p.type==="year")!.value),Number(parts.find(p=>p.type==="month")!.value)-1,1);
    const buckets=Array.from({length:6},(_,index)=>{
      const month=new Date(current.getFullYear(),current.getMonth()-5+index,1);
      return {key:month.getFullYear()+"-"+String(month.getMonth()+1).padStart(2,"0"),label:new Intl.DateTimeFormat("ar-IQ",{month:"short"}).format(month),due:0,received:0};
    });
    for(const item of movements){
      const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Baghdad",year:"numeric",month:"2-digit"}).formatToParts(new Date(item.created_at));
      const key=parts.find(p=>p.type==="year")!.value+"-"+parts.find(p=>p.type==="month")!.value;
      const bucket=buckets.find(b=>b.key===key);
      if(bucket){if(isDebtIncrease(item.type))bucket.due+=ledgerAmount(item.amount);else bucket.received+=ledgerAmount(item.amount);}
    }
    return buckets;
  },[movements]);
  const max=Math.max(1,...months.flatMap(month=>[month.due,month.received]));
  const unavailable=loading||Boolean(error)||!signedIn;
  const kpis=[
    {title:"الرصيد الإجمالي",value:money(totals.balance),icon:Wallet,note:"المستحقات ناقص القبوض",currency:true},
    {title:"المستحقات",value:money(totals.due),icon:Package,note:"إجمالي الحركات المستحقة",currency:true},
    {title:"التنزيلات",value:money(totals.received),icon:ArrowDownToLine,note:"إجمالي المبالغ المقبوضة",currency:true},
    {title:"عدد العملاء",value:String(customers.length),icon:Users,note:"العملاء النشطون",currency:false},
  ];
  return <div className="royal-dashboard" dir="rtl">
    <div className="royal-toolbar">
      <label className="royal-search"><Search size={20}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="البحث عن عميل، رقم وصل أو حركة..." aria-label="البحث في الحركات الحديثة"/></label>
      <button type="button" className="royal-refresh" onClick={()=>setRefresh(value=>value+1)} disabled={loading}><RefreshCcw size={17}/> تحديث البيانات</button>
    </div>
    <section className="royal-banner">
      <div><span className="royal-eyebrow">GHADEER TRANSPORT</span><h1>مرحباً بعودتك</h1><p>إليك أهم مؤشرات أعمالك</p></div>
      <div className="royal-date"><CalendarDays size={25}/><span>{day(new Date().toISOString())}<small>شركة الغدير للنقل</small></span></div>
    </section>
    {!signedIn&&<div className="royal-notice">سجّل الدخول لعرض حسابات الشركة. <Link to="/auth">تسجيل الدخول</Link></div>}
    {error&&<div className="royal-notice" role="alert">{error}</div>}
    <section className="royal-kpis" aria-label="مؤشرات الحساب" aria-busy={loading}>
      {kpis.map(({title,value,icon:Icon,note,currency})=><article className="royal-card royal-kpi" key={title}><span className="royal-icon"><Icon size={27}/></span><div><span className="royal-label">{title}</span><strong dir="ltr">{unavailable?"—":(currency?"$ ":"")+value}</strong><small>{loading?"جارٍ التحميل...":note}</small></div><div className="royal-kpi-rule"/></article>)}
    </section>
    <nav className="royal-actions" aria-label="الوصول السريع">{actions.map(({to,title,note,icon:Icon})=><Link key={to} to={to} className="royal-card royal-action"><Icon size={32}/><div><strong>{title}</strong><small>{note}</small></div><span className="royal-arrow"><ChevronLeft size={20}/></span></Link>)}</nav>
    <div className="royal-details">
      <section className="royal-card royal-movements"><div className="royal-section-head"><h2>أحدث الحركات</h2><Link to="/reports">عرض الكل <ChevronLeft size={15}/></Link></div>
        <div className="royal-table-wrap"><table><thead><tr><th>التاريخ</th><th>نوع العملية</th><th>العميل</th><th>المبلغ</th></tr></thead><tbody>
          {unavailable?<tr><td colSpan={4}>{loading?"جارٍ تحميل الحركات...":"البيانات غير متاحة حالياً"}</td></tr>:recent.length?recent.map(item=>{
            const details=readDetails(item.description);
            const description=item.cargo_typedetails||detailText(details.service)||detailText(details.cargoType)||collectionDescription(item.description);
            return <tr key={item.id}><td>{day(item.created_at)}</td><td><span className={isDebtIncrease(item.type)?"royal-status due":"royal-status paid"}>{isDebtIncrease(item.type)?"مستحق":"قبض"}</span><small title={description}>{item.document_number||description}</small></td><td>{names.get(item.trader_id??"")||"غير مرتبط بعميل"}</td><td dir="ltr">$ {money(ledgerAmount(item.amount))}</td></tr>;
          }):<tr><td colSpan={4}>{query?"لا توجد حركات تطابق البحث.":"لا توجد حركات مسجّلة بعد."}</td></tr>}
        </tbody></table></div>
      </section>
      <section className="royal-card royal-chart"><div className="royal-section-head"><h2>الحركة المالية الشهرية</h2></div><p className="royal-chart-subtitle">آخر ستة أشهر · الدولار الأمريكي</p>
        <div className="royal-legend"><span><i/>المستحقات</span><span><i/>القبوض</span></div>
        {unavailable?<div className="royal-chart-empty">{loading?"جارٍ التحميل...":"البيانات غير متاحة حالياً"}</div>:<div className="royal-bars" role="img" aria-label={months.map(month=>month.label+": مستحقات "+money(month.due)+"، قبوض "+money(month.received)).join("؛ ")}>
          {months.map(month=><div className="royal-month" key={month.key}><div className="royal-bar-pair"><span title={month.label+" — مستحقات: $ "+money(month.due)} style={{height:(month.due/max*100)+"%"}}/><span title={month.label+" — قبوض: $ "+money(month.received)} style={{height:(month.received/max*100)+"%"}}/></div><small>{month.label}</small></div>)}
        </div>}
        <details className="royal-chart-data"><summary>عرض القيم الشهرية</summary><table><thead><tr><th>الشهر</th><th>المستحقات</th><th>القبوض</th></tr></thead><tbody>{months.map(month=><tr key={month.key}><td>{month.label}</td><td>{unavailable?"—":money(month.due)}</td><td>{unavailable?"—":money(month.received)}</td></tr>)}</tbody></table></details>
      </section>
    </div>
  </div>;
}

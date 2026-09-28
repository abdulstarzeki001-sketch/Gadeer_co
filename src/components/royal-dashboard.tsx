import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
  const topCustomers=useMemo(()=>{
    const totals=new Map<string,number>();
    for(const item of movements){
      if(!item.trader_id)continue;
      const delta=(isDebtIncrease(item.type)?1:-1)*ledgerAmount(item.amount);
      totals.set(item.trader_id,(totals.get(item.trader_id)??0)+delta);
    }
    return [...totals.entries()].filter(([id])=>names.has(id)).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,balance])=>({id,name:names.get(id)!,balance}));
  },[movements,names]);
  const collectionRate=totals.due>0?Math.min(100,Math.max(0,totals.received/totals.due*100)):0;
  const thisMonth=months[months.length-1];
  const monthMovements=movements.filter(item=>(()=>{const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Baghdad",year:"numeric",month:"2-digit"}).formatToParts(new Date(item.created_at));return parts.find(p=>p.type==="year")!.value+"-"+parts.find(p=>p.type==="month")!.value===thisMonth.key;})()).length;
  const unavailable=loading||Boolean(error)||!signedIn;
  return <div className="royal-dashboard royal-reference" dir="rtl">
    <div className="royal-toolbar">
      <label className="royal-search"><Search size={20}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="البحث عن عميل، رقم وصل أو حركة..." aria-label="البحث في الحركات الحديثة"/></label>
      <button type="button" className="royal-refresh" onClick={()=>setRefresh(value=>value+1)} disabled={loading}><RefreshCcw size={17}/> تحديث البيانات</button>
    </div>
    <section className="royal-banner">
      <div><span className="royal-eyebrow">GHADEER · TRANSPORT & LOGISTICS</span><h1>GHADEER</h1><p>شركة الغدير للنقل والتخليص الكمركي</p></div>
      <div className="royal-date"><CalendarDays size={25}/><span>{day(new Date().toISOString())}<small>شركة الغدير للنقل</small></span></div>
    </section>
    {!signedIn&&<div className="royal-notice">سجّل الدخول لعرض حسابات الشركة. <Link to="/auth">تسجيل الدخول</Link></div>}
    {error&&<div className="royal-notice" role="alert">{error}</div>}
    <section className="royal-kpis royal-summary-strip" aria-label="مؤشرات الحساب" aria-busy={loading}>
      {[
        {title:"إجمالي العملاء",value:String(customers.length),icon:Users},
        {title:"إجمالي الوصولات",value:String(movements.filter(item=>isDebtIncrease(item.type)).length),icon:FileText},
        {title:"الحركات لهذا الشهر",value:String(monthMovements),icon:BarChart3},
        {title:"المستحقات",value:"$ "+money(totals.due),icon:Wallet},
      ].map(({title,value,icon:Icon})=><article className="royal-card royal-kpi" key={title}><span className="royal-icon"><Icon size={25}/></span><div><span className="royal-label">{title}</span><strong dir="ltr">{unavailable?"—":value}</strong></div></article>)}
    </section>
    <div className="royal-financial-row">
      <section className="royal-card royal-balance-card">
        <span className="royal-eyebrow">الرصيد الإجمالي</span>
        <strong className="royal-balance-value" dir="ltr">{unavailable?"—":"$ "+money(totals.balance)}</strong>
        <div className="royal-balance-caption"><RefreshCcw size={14}/> آخر تحديث · {day(new Date().toISOString())}</div>
        <div className="royal-balance-bottom">
          <div><ArrowDownToLine size={22}/><span>التنزيلات</span><strong dir="ltr">{unavailable?"—":"$ "+money(totals.received)}</strong></div>
          <div><Wallet size={22}/><span>المستحقات</span><strong dir="ltr">{unavailable?"—":"$ "+money(totals.due)}</strong></div>
          <div><BarChart3 size={22}/><span>عدد الحركات</span><strong>{unavailable?"—":movements.length}</strong></div>
        </div>
      </section>
      <section className="royal-card royal-collection-card">
        <h2>نسبة التحصيل</h2>
        <div className="royal-donut" style={{"--royal-progress":(unavailable?0:collectionRate)+"%"} as CSSProperties}><div><strong>{unavailable?"—":collectionRate.toFixed(0)+"%"}</strong><small>نسبة التحصيل</small></div></div>
        <div className="royal-collection-legend">
          <div><span>المحصل</span><strong dir="ltr">{unavailable?"—":"$ "+money(totals.received)}</strong></div>
          <div><span>المستحقات</span><strong dir="ltr">{unavailable?"—":"$ "+money(totals.due)}</strong></div>
          <div><span>المتبقي</span><strong dir="ltr">{unavailable?"—":"$ "+money(totals.balance)}</strong></div>
        </div>
      </section>
    </div>
    <nav className="royal-actions" aria-label="الوصول السريع">{actions.map(({to,title,note,icon:Icon})=><Link key={to} to={to} className="royal-card royal-action"><Icon size={32}/><div><strong>{title}</strong><small>{note}</small></div><span className="royal-arrow"><ChevronLeft size={20}/></span></Link>)}</nav>
    <section className="royal-card royal-top-customers">
      <div className="royal-section-head"><h2>أهم العملاء حسب الرصيد</h2><Link to="/customers">عرض الكل <ChevronLeft size={15}/></Link></div>
      {unavailable?<p>{loading?"جارٍ التحميل...":"البيانات غير متاحة"}</p>:topCustomers.length?topCustomers.map((customer,index)=><div className="royal-customer-row" key={customer.id}><span className="royal-customer-avatar">{customer.name.slice(0,1)}</span><span>{customer.name}</span><strong dir="ltr">$ {money(customer.balance)}</strong></div>):<p>لا توجد أرصدة للعملاء بعد.</p>}
    </section>
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

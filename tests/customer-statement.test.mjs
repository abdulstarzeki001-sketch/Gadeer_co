import test from "node:test";
import assert from "node:assert/strict";
import { buildCustomerStatement, collectionDescription } from "../src/lib/customer-statement.ts";
const tx = (id, type, amount, extra = {}) => ({ id, type, amount, created_at: "2026-09-28T09:00:00Z", document_id: null, document_number: null, driver_name: null, description: null, ...extra });

test("summary equals both table totals, including initial and later receipts", () => {
  const report = buildCustomerStatement([
    tx("1", "income", 32400.8),
    tx("2", "receipt", 400),
    tx("3", "تحصيل من عميل", 600),
  ]);
  assert.equal(report.dues.length, 1);
  assert.equal(report.receipts.length, 2);
  assert.equal(report.dueTotal, 32400.8);
  assert.equal(report.receiptIqdTotal, 600);
  assert.equal(report.receiptTotal, 400.39);
  assert.equal(report.balance, 32000.41);
});
test("document supplies company, plate, driver and description", () => {
  const report = buildCustomerStatement([tx("1", "income", 800, { document_id: "d", document_number: "IQ-123" })],
    [{id:"d", company_name:"الشركة",company_name_project:"المشروع",driver_name:"أحمد",vehicle_number:"12 أ 345",cargo_typedetails:"وصف الحمولة"}]);
  assert.deepEqual([report.dues[0].company, report.dues[0].vehicle, report.dues[0].driver, report.dues[0].description], ["المشروع","12 أ 345","أحمد","وصف الحمولة"]);
});
test("structured collection stores actual sender and method; legacy does not invent either", () => {
  const description = JSON.stringify({collection_receipt:true,senderName:"علي",paymentMethod:"حوالة",note:"دفعة"});
  const report = buildCustomerStatement([tx("1","تحصيل من عميل",10,{description}),tx("2","تحصيل من عميل",15,{description:"قبض قديم"})]);
  assert.equal(report.receipts[0].sender,"علي");
  assert.equal(report.receipts[0].method,"حوالة");
  assert.equal(report.receipts[1].sender,"—");
  assert.equal(report.receipts[1].method,"—");
  assert.equal(report.receipts[1].note,"قبض قديم");
  assert.equal(collectionDescription(description),"علي — حوالة — دفعة");
});
test("Turkish load receipt is a due; JSON never appears as the description", () => {
  const report = buildCustomerStatement([tx("1","turkish_load_receipt",90,{description:JSON.stringify({cargoType:"حديد"})})]);
  assert.equal(report.dueTotal,90);
  assert.equal(report.receipts.length,0);
  assert.equal(report.dues[0].description,"حديد");
  assert.equal(report.dues[0].vehicle,"—");
});
test("cent arithmetic, credit balance, empty statement and invalid amounts", () => {
  assert.equal(buildCustomerStatement([tx("1","charge",0.3),tx("2","receipt",0.1),tx("3","receipt",0.2)]).balance,0);
  assert.equal(buildCustomerStatement([tx("1","charge",10),tx("2","receipt",20)]).balance,-10);
  assert.deepEqual(buildCustomerStatement([]),{dues:[],receipts:[],dueTotal:0,receiptTotal:0,receiptIqdTotal:0,balance:0});
  assert.throws(()=>buildCustomerStatement([tx("1","charge",Infinity)]));
});
test("large statements include every movement and sort chronologically without mutating input", () => {
  const items = Array.from({length:1205},(_,i)=>tx(String(i),"charge",1));
  items.unshift(tx("later","receipt",205,{created_at:"2026-09-29T00:00:00Z"}));
  const report=buildCustomerStatement(items);
  assert.equal(report.dues.length,1205);
  assert.equal(report.balance,1000);
  assert.equal(items[0].id,"later");
});

test("14 IQD collections convert grand total once at 1530 and deduct from USD dues", () => {
  const values = [1550000,300000,100000,150000,1500000,2000000,1000000,500000,500000,1700000,250000,2000000,300000,500000];
  const report = buildCustomerStatement([tx("due","income",15000),...values.map((amount,index)=>tx(String(index),"تحصيل من عميل",amount))]);
  assert.equal(report.receipts.length,14);
  assert.equal(report.receiptIqdTotal,12350000);
  assert.equal(report.receiptTotal,8071.90);
  assert.equal(report.balance,6928.10);
  assert.equal(report.receipts.reduce((sum,row)=>sum+row.amount,0),report.receiptIqdTotal);
  assert.ok(report.receipts.every(row=>row.currency==="IQD"));
});
test("convert total only once, avoiding per-receipt USD rounding drift",()=>{
  const report=buildCustomerStatement([tx("due","charge",1),...Array.from({length:10},(_,i)=>tx(String(i),"تحصيل من عميل",1))]);
  assert.equal(report.receiptIqdTotal,10);
  assert.equal(report.receiptTotal,0.01);
  assert.equal(report.balance,0.99);
});
